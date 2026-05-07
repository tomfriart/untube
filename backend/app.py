import os, json, uuid, threading, logging, time, sqlite3, subprocess
from collections import deque
from datetime import datetime, date, timezone, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
import yt_dlp
from apscheduler.schedulers.background import BackgroundScheduler

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# ─── yt-dlp log buffer ───────────────────────────────────────────────
_log_buffer = deque(maxlen=500)
_log_counter = 0
_log_lock = threading.Lock()


def _append_log(level, msg):
    global _log_counter
    ts = datetime.now().strftime('%H:%M:%S')
    with _log_lock:
        _log_counter += 1
        _log_buffer.append({'i': _log_counter, 'ts': ts, 'level': level, 'msg': str(msg)})


class _BufHandler(logging.Handler):
    def emit(self, record):
        _append_log(record.levelname, record.getMessage())


_buf_handler = _BufHandler()
logger.addHandler(_buf_handler)


class _YdlLogger:
    def debug(self, msg):
        if msg.startswith('[debug] '):
            return
        _append_log('DEBUG', msg)

    def info(self, msg):
        _append_log('INFO', msg)

    def warning(self, msg):
        _append_log('WARNING', msg)

    def error(self, msg):
        _append_log('ERROR', msg)

app = Flask(__name__)
CORS(app)

DATA_DIR = Path(os.environ.get('DATA_DIR', './data'))
DOWNLOADS_DIR = Path(os.environ.get('DOWNLOADS_DIR', './downloads'))
DB_PATH = DATA_DIR / 'db.sqlite'
THUMB_CACHE_DIR = DATA_DIR / 'thumbcache'
DATA_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

scheduler = BackgroundScheduler()
active_downloads = {}
cancelled_downloads = set()
downloads_lock = threading.Lock()
download_executor = None
executor_lock = threading.Lock()
check_running = threading.Lock()
metadata_refresh_running = threading.Lock()

# ─── SQLite layer ────────────────────────────────────────────────────

_SCHEMA = '''
CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    thumbnail TEXT DEFAULT '',
    subscriber_count INTEGER,
    download_mode TEXT DEFAULT 'all',
    max_days_old INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    quality TEXT DEFAULT NULL,
    notify INTEGER DEFAULT 0,
    auto_delete_days INTEGER DEFAULT NULL
);
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    channel_id TEXT DEFAULT '',
    channel_name TEXT DEFAULT '',
    duration INTEGER DEFAULT 0,
    upload_date TEXT DEFAULT '',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    thumbnail TEXT DEFAULT '',
    file_path TEXT DEFAULT '',
    downloaded_at TEXT DEFAULT '',
    is_short INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    ghost INTEGER DEFAULT 0,
    ghost_at TEXT DEFAULT '',
    subtitle_path TEXT DEFAULT NULL,
    metadata_updates INTEGER DEFAULT 0,
    metadata_updated_at TEXT DEFAULT '',
    sort_date TEXT GENERATED ALWAYS AS (CASE WHEN upload_date != '' THEN upload_date ELSE downloaded_at END) VIRTUAL
);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_sort ON videos(upload_date, downloaded_at);
CREATE INDEX IF NOT EXISTS idx_videos_ghost ON videos(ghost, channel_id);
CREATE TABLE IF NOT EXISTS watch_progress (
    video_id TEXT PRIMARY KEY,
    time REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS deleted_ids (
    video_id TEXT PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS skipped_ids (
    video_id TEXT PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS watch_stats (
    date TEXT NOT NULL,
    seconds_watched INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (date)
);
CREATE TABLE IF NOT EXISTS seen_videos (
    video_id TEXT PRIMARY KEY
);
'''

_DEFAULT_SETTINGS = {
    'quality': '720',
    'skip_shorts': True,
    'check_interval': 180,
    'max_concurrent': 1,
    'max_video_duration': 60,
    'new_badge_days': 2,
    'feed_filter': 'All',
    'feed_sort': 'date',
    'ntfy_url': '',
    'webhook_url': '',
    'auto_delete_days': 0,
}

_local = threading.local()


def _get_conn():
    if not hasattr(_local, 'conn') or _local.conn is None:
        conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=30)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA synchronous=NORMAL')
        conn.execute('PRAGMA foreign_keys=ON')
        _local.conn = conn
    return _local.conn


def _cleanup_seen_videos():
    conn = _get_conn()
    with conn:
        result = conn.execute(
            'DELETE FROM seen_videos WHERE video_id NOT IN (SELECT id FROM videos)'
        )
    if result.rowcount:
        logger.info(f"Cleaned {result.rowcount} stale seen_videos entries")


def _cleanup_thumb_cache():
    THUMB_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cutoff = time.time() - 30 * 86400
    removed = 0
    for f in THUMB_CACHE_DIR.glob('*.jpg'):
        try:
            if f.stat().st_mtime < cutoff:
                f.unlink()
                removed += 1
        except Exception:
            pass
    if removed:
        logger.info(f"Cleaned {removed} stale thumbnails from cache")


def _webhook_payload(webhook_url, data):
    """Return (body_bytes, headers) adjusted for Discord vs generic webhooks."""
    is_discord = 'discord.com/api/webhooks' in webhook_url
    if is_discord:
        embed = {'description': f"**{data['channel']}** — {data['title']}"}
        if data.get('thumbnail'):
            embed['thumbnail'] = {'url': data['thumbnail']}
        body = json.dumps({'embeds': [embed]}).encode('utf-8')
    else:
        body = json.dumps(data).encode('utf-8')
    return body, {'Content-Type': 'application/json', 'User-Agent': 'UnTube/1.0'}


def _send_notifications(video_entry, channel):
    import urllib.request as _ur
    s = get_settings()
    ntfy_url = (s.get('ntfy_url') or '').strip()
    webhook_url = (s.get('webhook_url') or '').strip()
    thumbnail = (video_entry.get('thumbnail') or '').strip()

    if ntfy_url:
        try:
            ntfy_headers = {
                'Title': f"New video from {channel['name']}",
                'User-Agent': 'UnTube/1.0',
            }
            if thumbnail:
                ntfy_headers['Attach'] = thumbnail
            req = _ur.Request(
                ntfy_url,
                data=video_entry['title'].encode('utf-8'),
                headers=ntfy_headers,
            )
            _ur.urlopen(req, timeout=10)
        except Exception as e:
            logger.warning(f"ntfy notification failed: {e}")

    if webhook_url:
        try:
            body, headers = _webhook_payload(webhook_url, {
                'channel': channel['name'],
                'channel_id': channel['id'],
                'title': video_entry['title'],
                'video_id': video_entry['id'],
                'thumbnail': thumbnail,
            })
            req = _ur.Request(webhook_url, data=body, headers=headers)
            _ur.urlopen(req, timeout=10)
        except Exception as e:
            logger.warning(f"Webhook notification failed: {e}")


def init_db():
    conn = _get_conn()
    conn.executescript(_SCHEMA)
    conn.commit()
    # Migrate existing databases that predate metadata refresh columns
    for col, defn in [
        ('metadata_updates', 'INTEGER DEFAULT 0'),
        ('metadata_updated_at', "TEXT DEFAULT ''"),
        ('sort_date', "TEXT GENERATED ALWAYS AS "
                      "(CASE WHEN upload_date != '' THEN upload_date ELSE downloaded_at END) VIRTUAL"),
        ('subtitle_path', 'TEXT DEFAULT NULL'),
    ]:
        try:
            conn.execute(f'ALTER TABLE videos ADD COLUMN {col} {defn}')
            conn.commit()
        except Exception:
            pass
    for col, defn in [
        ('quality', 'TEXT DEFAULT NULL'),
        ('notify', 'INTEGER DEFAULT 0'),
        ('auto_delete_days', 'INTEGER DEFAULT NULL'),
    ]:
        try:
            conn.execute(f'ALTER TABLE channels ADD COLUMN {col} {defn}')
            conn.commit()
        except Exception:
            pass
    try:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_videos_sort_date ON videos(sort_date DESC)')
        conn.commit()
    except Exception:
        pass
    import shutil
    hls_dir = DATA_DIR / 'hls'
    if hls_dir.exists():
        shutil.rmtree(hls_dir, ignore_errors=True)
        logger.info("Cleaned up stale HLS temp files on startup")
    json_file = DATA_DIR / 'db.json'
    if json_file.exists():
        try:
            _import_json(json_file)
            json_file.rename(DATA_DIR / 'db.json.imported')
            logger.info("Migrated db.json -> SQLite, renamed to db.json.imported")
        except Exception as e:
            logger.error(f"Migration from db.json failed: {e}")
    _cleanup_thumb_cache()
    _cleanup_seen_videos()


def _import_json(path):
    with open(path) as f:
        data = json.load(f)
    conn = _get_conn()
    with conn:
        for ch in data.get('channels', []):
            conn.execute(
                'INSERT OR IGNORE INTO channels (id, name, url, thumbnail, subscriber_count, download_mode, max_days_old, enabled) VALUES (?,?,?,?,?,?,?,?)',
                (ch.get('id', str(uuid.uuid4())), ch.get('name', ''), ch.get('url', ''),
                 ch.get('thumbnail', ''), ch.get('subscriber_count'),
                 ch.get('download_mode', 'all'), int(ch.get('max_days_old', 0) or 0),
                 1 if ch.get('enabled', True) else 0))
        for v in data.get('videos', []):
            conn.execute(
                'INSERT OR IGNORE INTO videos (id, title, description, channel_id, channel_name, duration, upload_date, view_count, like_count, thumbnail, file_path, downloaded_at, is_short, height, ghost, ghost_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                (v.get('id', ''), v.get('title', ''), v.get('description', ''),
                 v.get('channel_id', ''), v.get('channel_name', ''),
                 int(v.get('duration', 0) or 0), v.get('upload_date', ''),
                 int(v.get('view_count', 0) or 0), int(v.get('like_count', 0) or 0),
                 v.get('thumbnail', ''), v.get('file_path', ''),
                 v.get('downloaded_at', ''), 1 if v.get('is_short') else 0,
                 int(v.get('height', 0) or 0), 1 if v.get('ghost') else 0,
                 v.get('ghost_at', '')))
        for vid, t in data.get('watch_progress', {}).items():
            conn.execute('INSERT OR IGNORE INTO watch_progress (video_id, time) VALUES (?,?)',
                         (vid, float(t or 0)))
        s = data.get('settings', _DEFAULT_SETTINGS)
        conn.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)',
                     ('settings', json.dumps(s)))
        for vid in data.get('deleted_ids', []):
            conn.execute('INSERT OR IGNORE INTO deleted_ids (video_id) VALUES (?)', (vid,))
        for vid in data.get('skipped_ids', []):
            conn.execute('INSERT OR IGNORE INTO skipped_ids (video_id) VALUES (?)', (vid,))
    logger.info(f"  Imported {len(data.get('channels', []))} channels, {len(data.get('videos', []))} videos")


def _row_to_channel(row):
    keys = row.keys()
    return {
        'id': row['id'], 'name': row['name'], 'url': row['url'],
        'thumbnail': row['thumbnail'], 'subscriber_count': row['subscriber_count'],
        'download_mode': row['download_mode'], 'max_days_old': row['max_days_old'],
        'enabled': bool(row['enabled']),
        'quality': row['quality'] if 'quality' in keys else None,
        'notify': bool(row['notify']) if 'notify' in keys else False,
        'auto_delete_days': row['auto_delete_days'] if 'auto_delete_days' in keys else None,
    }


def _row_to_video(row):
    keys = row.keys()
    return {
        'id': row['id'], 'title': row['title'], 'description': row['description'],
        'channel_id': row['channel_id'], 'channel_name': row['channel_name'],
        'duration': row['duration'], 'upload_date': row['upload_date'],
        'view_count': row['view_count'], 'like_count': row['like_count'],
        'thumbnail': row['thumbnail'], 'file_path': row['file_path'],
        'downloaded_at': row['downloaded_at'], 'is_short': bool(row['is_short']),
        'height': row['height'], 'ghost': bool(row['ghost']), 'ghost_at': row['ghost_at'],
        'metadata_updates': row['metadata_updates'] if 'metadata_updates' in keys else 0,
        'metadata_updated_at': row['metadata_updated_at'] if 'metadata_updated_at' in keys else '',
        'subtitle_path': row['subtitle_path'] if 'subtitle_path' in keys else None,
    }


# ── Settings ──

def get_settings():
    row = _get_conn().execute('SELECT value FROM settings WHERE key = ?', ('settings',)).fetchone()
    if row:
        try:
            return {**_DEFAULT_SETTINGS, **json.loads(row['value'])}
        except Exception:
            pass
    return dict(_DEFAULT_SETTINGS)


def save_settings(s):
    conn = _get_conn()
    with conn:
        conn.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)',
                     ('settings', json.dumps(s)))


# ── Channels ──

def get_channels():
    return [_row_to_channel(r) for r in _get_conn().execute('SELECT * FROM channels ORDER BY rowid')]


def get_channel(cid):
    r = _get_conn().execute('SELECT * FROM channels WHERE id = ?', (cid,)).fetchone()
    return _row_to_channel(r) if r else None


def channel_exists(cid):
    return _get_conn().execute('SELECT 1 FROM channels WHERE id = ?', (cid,)).fetchone() is not None


def add_channel(ch):
    conn = _get_conn()
    with conn:
        conn.execute(
            'INSERT INTO channels (id, name, url, thumbnail, subscriber_count, download_mode, max_days_old, enabled) VALUES (?,?,?,?,?,?,?,?)',
            (ch['id'], ch.get('name', ''), ch.get('url', ''), ch.get('thumbnail', ''),
             ch.get('subscriber_count'), ch.get('download_mode', 'all'),
             int(ch.get('max_days_old', 0) or 0), 1 if ch.get('enabled', True) else 0))


def update_channel(cid, updates):
    sets, vals = [], []
    if 'download_mode' in updates:
        sets.append('download_mode = ?'); vals.append(updates['download_mode'])
    if 'max_days_old' in updates:
        sets.append('max_days_old = ?'); vals.append(int(updates['max_days_old']))
    if 'enabled' in updates:
        sets.append('enabled = ?'); vals.append(1 if updates['enabled'] else 0)
    if 'quality' in updates:
        sets.append('quality = ?')
        vals.append(updates['quality'] or None)
    if 'notify' in updates:
        sets.append('notify = ?')
        vals.append(1 if updates['notify'] else 0)
    if 'auto_delete_days' in updates:
        sets.append('auto_delete_days = ?')
        v = updates['auto_delete_days']
        vals.append(None if v is None else int(v))
    if not sets:
        return
    vals.append(cid)
    conn = _get_conn()
    with conn:
        conn.execute(f'UPDATE channels SET {", ".join(sets)} WHERE id = ?', vals)


def delete_channel(cid):
    conn = _get_conn()
    with conn:
        conn.execute('DELETE FROM channels WHERE id = ?', (cid,))
        conn.execute('DELETE FROM videos WHERE channel_id = ?', (cid,))


# ── Videos ──

def get_videos(channel_id=None, include_ghosts=True, page=1, per_page=100):
    conds, vals = [], []
    if channel_id:
        conds.append('channel_id = ?'); vals.append(channel_id)
    if not include_ghosts:
        conds.append('ghost = 0')
    where = (' WHERE ' + ' AND '.join(conds)) if conds else ''
    sort = 'ORDER BY sort_date DESC'
    total = _get_conn().execute(f'SELECT COUNT(*) FROM videos{where}', vals).fetchone()[0]
    rows = _get_conn().execute(
        f'SELECT * FROM videos{where} {sort} LIMIT ? OFFSET ?',
        vals + [per_page, (page - 1) * per_page]).fetchall()
    return [_row_to_video(r) for r in rows], total


def get_video(vid):
    r = _get_conn().execute('SELECT * FROM videos WHERE id = ?', (vid,)).fetchone()
    return _row_to_video(r) if r else None


def add_video(v):
    conn = _get_conn()
    with conn:
        conn.execute(
            'INSERT OR REPLACE INTO videos '
            '(id, title, description, channel_id, channel_name, duration, upload_date, '
            'view_count, like_count, thumbnail, file_path, downloaded_at, is_short, height, '
            'ghost, ghost_at, subtitle_path) '
            'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            (v['id'], v.get('title', ''), v.get('description', ''),
             v.get('channel_id', ''), v.get('channel_name', ''),
             int(v.get('duration', 0) or 0), v.get('upload_date', ''),
             int(v.get('view_count', 0) or 0), int(v.get('like_count', 0) or 0),
             v.get('thumbnail', ''), v.get('file_path', ''),
             v.get('downloaded_at', ''), 1 if v.get('is_short') else 0,
             int(v.get('height', 0) or 0), 1 if v.get('ghost') else 0,
             v.get('ghost_at', ''), v.get('subtitle_path')))


def mark_video_ghost(vid):
    conn = _get_conn()
    with conn:
        conn.execute(
            "UPDATE videos SET ghost = 1, ghost_at = ?, file_path = '' WHERE id = ?",
            (datetime.now(timezone.utc).isoformat(), vid))


def update_video_height(vid, height):
    conn = _get_conn()
    with conn:
        conn.execute('UPDATE videos SET height = ? WHERE id = ?', (height, vid))


def update_video_metadata_fields(vid, view_count, like_count, description):
    conn = _get_conn()
    with conn:
        conn.execute(
            'UPDATE videos SET view_count=?, like_count=?, description=?,'
            ' metadata_updates=COALESCE(metadata_updates,0)+1,'
            ' metadata_updated_at=? WHERE id=?',
            (view_count, like_count, description,
             datetime.now(timezone.utc).isoformat(), vid))


def remove_video(vid):
    conn = _get_conn()
    with conn:
        conn.execute('DELETE FROM videos WHERE id = ?', (vid,))


def get_existing_video_ids():
    return {r[0] for r in _get_conn().execute('SELECT id FROM videos')}


def has_channel_videos(cid):
    return _get_conn().execute(
        'SELECT 1 FROM videos WHERE channel_id = ? AND ghost = 0 LIMIT 1', (cid,)).fetchone() is not None


def get_downloaded_ids_for_channel(cid):
    return {r[0] for r in _get_conn().execute('SELECT id FROM videos WHERE channel_id = ?', (cid,))}


def search_videos(q, limit=30):
    pattern = f'%{q}%'
    rows = _get_conn().execute(
        "SELECT * FROM videos WHERE ghost = 0 AND LOWER(title) LIKE LOWER(?)"
        " ORDER BY sort_date DESC LIMIT ?",
        (pattern, limit)).fetchall()
    return [_row_to_video(r) for r in rows]


def count_channels_and_videos():
    conn = _get_conn()
    ch = conn.execute('SELECT COUNT(*) FROM channels').fetchone()[0]
    vids = conn.execute('SELECT COUNT(*) FROM videos').fetchone()[0]
    return ch, vids


# ── Watch progress ──

def get_watch_progress(vid):
    r = _get_conn().execute('SELECT time FROM watch_progress WHERE video_id = ?', (vid,)).fetchone()
    return r['time'] if r else 0


def get_all_watch_progress():
    rows = _get_conn().execute('SELECT video_id, time FROM watch_progress').fetchall()
    return {r['video_id']: r['time'] for r in rows}


def set_watch_progress(vid, t):
    conn = _get_conn()
    with conn:
        conn.execute('INSERT OR REPLACE INTO watch_progress (video_id, time) VALUES (?,?)', (vid, t))


def delete_watch_progress(vid):
    conn = _get_conn()
    with conn:
        conn.execute('DELETE FROM watch_progress WHERE video_id = ?', (vid,))


def add_watch_seconds(n):
    today = date.today().isoformat()
    conn = _get_conn()
    with conn:
        conn.execute(
            'INSERT INTO watch_stats (date, seconds_watched) VALUES (?, ?) '
            'ON CONFLICT(date) DO UPDATE SET seconds_watched = seconds_watched + excluded.seconds_watched',
            (today, int(n))
        )


def get_watch_stats():
    today = date.today()
    week_start = (today - timedelta(days=today.weekday())).isoformat()
    month_start = today.replace(day=1).isoformat()
    today_str = today.isoformat()
    row = _get_conn().execute(
        'SELECT'
        '  COALESCE(SUM(CASE WHEN date = ? THEN seconds_watched END), 0),'
        '  COALESCE(SUM(CASE WHEN date >= ? THEN seconds_watched END), 0),'
        '  COALESCE(SUM(CASE WHEN date >= ? THEN seconds_watched END), 0),'
        '  COALESCE(SUM(seconds_watched), 0)'
        ' FROM watch_stats',
        (today_str, week_start, month_start)
    ).fetchone()
    return {
        'today':      row[0],
        'this_week':  row[1],
        'this_month': row[2],
        'all_time':   row[3],
    }


# ── Deleted / skipped IDs ──

def get_deleted_ids():
    return {r[0] for r in _get_conn().execute('SELECT video_id FROM deleted_ids')}


def add_deleted_id(vid):
    conn = _get_conn()
    with conn:
        conn.execute('INSERT OR IGNORE INTO deleted_ids (video_id) VALUES (?)', (vid,))


def remove_deleted_id(vid):
    conn = _get_conn()
    with conn:
        conn.execute('DELETE FROM deleted_ids WHERE video_id = ?', (vid,))


def remove_deleted_ids(vids):
    conn = _get_conn()
    with conn:
        conn.executemany('DELETE FROM deleted_ids WHERE video_id = ?', [(v,) for v in vids])


def get_skipped_ids():
    return {r[0] for r in _get_conn().execute('SELECT video_id FROM skipped_ids')}


def add_skipped_id(vid):
    conn = _get_conn()
    with conn:
        conn.execute('INSERT OR IGNORE INTO skipped_ids (video_id) VALUES (?)', (vid,))


# ─── yt-dlp ─────────────────────────────────────────────────────────

_last_request_time = 0
_rate_lock = threading.Lock()


def _rate_limit(min_delay=2.0):
    global _last_request_time
    with _rate_lock:
        now = time.time()
        elapsed = now - _last_request_time
        if elapsed < min_delay:
            wait = min_delay - elapsed
            logger.debug(f"  Rate limit: waiting {wait:.1f}s")
            time.sleep(wait)
        _last_request_time = time.time()


_age_cache = {}
_age_cache_lock = threading.Lock()
_AGE_CACHE_MAX = 500


def get_executor():
    global download_executor
    with executor_lock:
        if download_executor is None:
            download_executor = ThreadPoolExecutor(
                max_workers=get_settings().get('max_concurrent', 1))
        return download_executor


def rebuild_executor(n):
    global download_executor
    with executor_lock:
        if download_executor: download_executor.shutdown(wait=False)
        download_executor = ThreadPoolExecutor(max_workers=n)


def set_dl(v, d):
    with downloads_lock: active_downloads[v] = d


def update_dl(v, p):
    with downloads_lock:
        if v in active_downloads: active_downloads[v].update(p)


def remove_dl(v):
    with downloads_lock: active_downloads.pop(v, None); cancelled_downloads.discard(v)


def is_cancelled(v):
    with downloads_lock: return v in cancelled_downloads


def get_all_dl():
    with downloads_lock: return dict(active_downloads)


def base_opts():
    return {
        'quiet': True, 'no_warnings': True,
        'logger': _YdlLogger(),
        'sleep_interval': 1,
        'max_sleep_interval': 3,
        'sleep_interval_requests': 1,
    }


def get_channel_info(url):
    try:
        with yt_dlp.YoutubeDL({**base_opts(), 'extract_flat': True, 'playlist_items': '1'}) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                'id': info.get('channel_id') or info.get('id', str(uuid.uuid4())),
                'name': info.get('channel') or info.get('uploader') or info.get('title', 'Unknown'),
                'url': url,
                'thumbnail': info.get('thumbnails', [{}])[-1].get('url', '') if info.get('thumbnails') else '',
                'subscriber_count': info.get('channel_follower_count'),
            }
    except Exception as e:
        logger.error(f"Channel info error: {e}"); return None


def fetch_channel_videos(channel_url, max_items=30):
    _rate_limit(2.0)
    videos = []
    try:
        with yt_dlp.YoutubeDL({**base_opts(), 'extract_flat': True,
                                'playlist_items': f'1-{max_items}'}) as ydl:
            info = ydl.extract_info(channel_url + '/videos', download=False)
            for e in (info.get('entries') or []):
                if e and e.get('id'):
                    videos.append({
                        'id': e['id'], 'title': e.get('title', 'Untitled'),
                        'url': e.get('url') or f"https://www.youtube.com/watch?v={e['id']}",
                        'duration': e.get('duration'),
                        'thumbnail': (e.get('thumbnails', [{}])[-1].get('url', '')
                                      if e.get('thumbnails') else ''),
                    })
        logger.info(f"  {len(videos)} stubs from {channel_url}")
    except Exception as e:
        logger.error(f"Fetch error: {e}")
    return videos


def make_progress_hook(video_id):
    def hook(d):
        if is_cancelled(video_id):
            raise yt_dlp.utils.DownloadCancelled("Cancelled")
        if d['status'] == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
            dl_bytes = d.get('downloaded_bytes', 0)
            update_dl(video_id, {
                'progress': round((dl_bytes / total * 100) if total else 0, 1),
                'status': 'downloading', 'speed': d.get('speed') or 0,
                'eta': d.get('eta') or 0, 'downloaded_bytes': dl_bytes, 'total_bytes': total,
            })
        elif d['status'] == 'finished':
            update_dl(video_id, {'progress': 100, 'status': 'processing', 'speed': 0, 'eta': 0})
    return hook


def max_days_to_dateafter(max_days):
    if not max_days or max_days <= 0:
        return None
    cutoff = datetime.now(timezone.utc) - timedelta(days=int(max_days))
    return cutoff.strftime('%Y%m%d')


def _check_video_age(url, max_days_old):
    """Check video age via yt-dlp (no download).
    Returns (allowed: bool, age_days: float, upload_date_str: str, info: dict|None)
    Cache hits return None for info since the full dict wasn't re-fetched.
    """
    if not max_days_old or max_days_old <= 0:
        return True, 0, '', None

    import re
    vid_match = re.search(r'[?&]v=([^&]+)', url) or re.search(r'youtu\.be/([^?&]+)', url)
    vid_id = vid_match.group(1) if vid_match else url

    with _age_cache_lock:
        if vid_id in _age_cache:
            cached_time, cached_age = _age_cache[vid_id]
            if time.time() - cached_time < 3600:
                allowed = cached_age <= max_days_old
                logger.info(f"  Age CACHED for {vid_id}: {cached_age:.0f}d (max {max_days_old}d) -> {'OK' if allowed else 'SKIP'}")
                return allowed, cached_age, '', None

    _rate_limit(1.5)
    try:
        with yt_dlp.YoutubeDL({**base_opts(), 'skip_download': True}) as ydl:
            info = ydl.extract_info(url, download=False)

        upload_date = info.get('upload_date', '') if info else ''  # YYYYMMDD
        if not upload_date or len(upload_date) != 8:
            logger.warning(f"  Could not find upload date for {vid_id}")
            return False, -1, '', None

        dt = datetime.strptime(upload_date, '%Y%m%d').replace(tzinfo=timezone.utc)
        age_days = (datetime.now(timezone.utc) - dt).total_seconds() / 86400
        upload_date_str = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"

        with _age_cache_lock:
            if len(_age_cache) >= _AGE_CACHE_MAX:
                oldest = sorted(_age_cache.keys(), key=lambda k: _age_cache[k][0])
                for k in oldest[:len(_age_cache) - _AGE_CACHE_MAX + 1]:
                    del _age_cache[k]
            _age_cache[vid_id] = (time.time(), age_days)

        if age_days > max_days_old:
            logger.info(f"  TOO OLD: {age_days:.0f} days > max {max_days_old} days — SKIP")
            return False, age_days, upload_date_str, info
        else:
            logger.info(f"  AGE OK: {age_days:.0f} days <= max {max_days_old} days — ALLOW")
            return True, age_days, upload_date_str, info

    except Exception as e:
        logger.error(f"  Age check error for {vid_id}: {e}")
        return False, -1, '', None


def _safe_filename(title):
    import re
    safe = re.sub(r'[^\w\s\-]', '', title, flags=re.UNICODE)
    safe = re.sub(r'\s+', ' ', safe).strip()
    return safe[:80] if safe else 'video'


def _worker(stub, channel, quality, skip_shorts, max_days_old):
    vid = stub['id']
    if is_cancelled(vid): remove_dl(vid); return None
    update_dl(vid, {'status': 'starting'})

    stub_dur = stub.get('duration') or 0
    max_dur_mins = get_settings().get('max_video_duration', 60)
    if max_dur_mins > 0 and stub_dur > max_dur_mins * 60:
        logger.info(f"  SKIP (>{max_dur_mins}min): '{stub.get('title','')}' ({stub_dur//60}min)")
        remove_dl(vid)
        add_skipped_id(vid)
        return None

    logger.info(f"Downloading: '{stub.get('title','')}'")
    _rate_limit(2.0)
    safe_ch = "".join(c for c in channel['name'] if c.isalnum() or c in (' ', '-', '_')).strip()
    month_str = datetime.now(timezone.utc).strftime('%Y-%m')
    cdir = DOWNLOADS_DIR / safe_ch / month_str
    cdir.mkdir(parents=True, exist_ok=True)

    safe_title = _safe_filename(stub.get('title', ''))
    outtmpl = str(cdir / f'{safe_title} [{vid}].%(ext)s')

    if quality != 'best':
        sort = [f'+res:{quality}', 'ext:mp4:m4a', 'vcodec:h265,h264', 'acodec:m4a,aac']
    else:
        sort = ['res', 'ext:mp4:m4a', 'vcodec:h265,h264', 'acodec:m4a,aac']

    opts = {
        **base_opts(),
        'format': 'bestvideo*+bestaudio/best',
        'format_sort': sort,
        'outtmpl': outtmpl,
        'merge_output_format': 'mp4',
        'restrictfilenames': False,
        'progress_hooks': [make_progress_hook(vid)],
        'postprocessors': [{'key': 'FFmpegVideoConvertor', 'preferedformat': 'mp4'}],
        'writeautomaticsub': True,
        'subtitleslangs': ['en'],
        'subtitlesformat': 'vtt',
    }

    mf_parts = []
    if skip_shorts:
        mf_parts.append('duration > 60')
    mf_parts.append('availability !*= "premium"')
    mf_parts.append('availability !*= "subscriber"')
    if mf_parts:
        opts['match_filter'] = yt_dlp.utils.match_filter_func(' & '.join(mf_parts))

    captured = {}

    class Cap(yt_dlp.postprocessor.PostProcessor):
        def run(self, info):
            captured.update(info)
            return [], info

    try:
        update_dl(vid, {'status': 'downloading', 'progress': 0})
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.add_post_processor(Cap(), when='pre_process')
            ydl.download([stub['url']])
    except yt_dlp.utils.DownloadCancelled:
        for root, dirs, files in os.walk(str(DOWNLOADS_DIR / safe_ch)):
            for f in files:
                if vid in f:
                    try: os.unlink(os.path.join(root, f))
                    except: pass
        remove_dl(vid)
        return None
    except Exception as e:
        err_str = str(e).lower()
        if any(kw in err_str for kw in ['premium', 'paid', 'purchase', 'member', 'join this channel']):
            logger.info(f"  SKIP (paid/premium): '{stub.get('title','')}' - {e}")
            remove_dl(vid)
            add_skipped_id(vid)
            return None
        if 'matched filter' in err_str or 'did not pass filter' in err_str:
            logger.info(f"  SKIP (filtered): '{stub.get('title','')}'")
            remove_dl(vid)
            return None
        logger.error(f"Download error {stub['url']}: {e}")
        remove_dl(vid)
        return None

    remove_dl(vid)

    fp = None
    ch_base = DOWNLOADS_DIR / safe_ch
    for root, dirs, files in os.walk(str(ch_base)):
        for f in files:
            if vid in f:
                full = Path(root) / f
                fp = str(full.relative_to(DOWNLOADS_DIR))
                if f.endswith('.mp4'):
                    break
        if fp and fp.endswith('.mp4'):
            break

    if not fp:
        logger.info(f"  No file produced for '{stub.get('title','')}' — likely filtered")
        add_skipped_id(vid)
        return None

    # Scan for subtitle file
    vtt_fp = None
    for root, dirs, files in os.walk(str(ch_base)):
        for f in files:
            if vid in f and f.endswith('.en.vtt'):
                vtt_fp = str((Path(root) / f).relative_to(DOWNLOADS_DIR))
                break
        if vtt_fp:
            break

    meta = captured or {}
    ud = meta.get('upload_date', '')
    if ud and len(ud) >= 6:
        correct_month = f"{ud[:4]}-{ud[4:6]}"
        if correct_month != month_str:
            correct_dir = DOWNLOADS_DIR / safe_ch / correct_month
            correct_dir.mkdir(parents=True, exist_ok=True)
            src = DOWNLOADS_DIR / fp
            dst = correct_dir / src.name
            mp4_moved = False
            try:
                src.rename(dst)
                fp = str(dst.relative_to(DOWNLOADS_DIR))
                logger.info(f"  Moved to {correct_month}/ folder")
                mp4_moved = True
            except Exception as e:
                logger.warning(f"  Could not move to correct month: {e}")
            if vtt_fp and mp4_moved:
                vtt_src = DOWNLOADS_DIR / vtt_fp
                if vtt_src.exists():
                    vtt_dst = correct_dir / vtt_src.name
                    try:
                        vtt_src.rename(vtt_dst)
                        vtt_fp = str(vtt_dst.relative_to(DOWNLOADS_DIR))
                    except Exception as e:
                        logger.warning(f"  Could not move subtitle to correct month: {e}")

    vid_height = 0
    try:
        import subprocess as _sp
        _probe = _sp.run(
            ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
             '-show_entries', 'stream=height', '-of', 'csv=p=0',
             str(DOWNLOADS_DIR / fp)],
            capture_output=True, timeout=10)
        vid_height = int(_probe.stdout.decode().strip() or 0)
    except Exception:
        pass

    entry = {
        'id': meta.get('id', vid),
        'title': meta.get('title', stub.get('title', '')),
        'description': meta.get('description', ''),
        'channel_id': channel['id'], 'channel_name': channel['name'],
        'duration': meta.get('duration', 0),
        'upload_date': ud,
        'view_count': meta.get('view_count', 0),
        'like_count': meta.get('like_count', 0),
        'thumbnail': meta.get('thumbnail', ''),
        'file_path': fp,
        'downloaded_at': datetime.now(timezone.utc).isoformat(),
        'is_short': False,
        'height': vid_height,
        'subtitle_path': vtt_fp,
    }
    add_video(entry)
    if channel.get('notify'):
        threading.Thread(target=_send_notifications, args=(entry, channel), daemon=True).start()
    logger.info(f"Done: {entry['title']} -> {fp}")
    return entry


def _check_stub(stub, max_days_old):
    allowed, age, date_str, info = _check_video_age(stub['url'], max_days_old)
    if info:
        stub = {
            **stub,
            'title': info.get('title') or stub.get('title', ''),
            'duration': info.get('duration') or stub.get('duration', 0),
            'thumbnail': info.get('thumbnail') or stub.get('thumbnail', ''),
        }
    logger.info(f"  Pre-check '{stub.get('title','')}': allowed={allowed} age={age:.0f}d")
    return stub, allowed


def check_for_new_videos():
    if not check_running.acquire(blocking=False): return
    try:
        logger.info("Checking...")
        s = get_settings()
        quality, skip_shorts = s.get('quality', '720'), s.get('skip_shorts', True)
        existing = get_existing_video_ids()
        deleted = get_deleted_ids()
        skipped = get_skipped_ids()
        with downloads_lock: dling = set(active_downloads.keys())

        ex = get_executor()
        channels_to_switch = []

        for ch in get_channels():
            if ch.get('enabled') is False:
                logger.info(f"  {ch['name']}: PAUSED — skipping")
                continue
            mode = ch.get('download_mode', 'all')
            max_days = ch.get('max_days_old', 0)
            has_videos = has_channel_videos(ch['id'])
            logger.info(f"  {ch['name']}: mode={mode} max_days={max_days} has_videos={has_videos}")

            if mode == 'latest' or (mode == 'all' and has_videos and max_days > 0):
                fetch_count = 1
            else:
                fetch_count = 50

            stubs = fetch_channel_videos(ch['url'], fetch_count)

            if mode == 'latest' and stubs:
                if stubs[0]['id'] in existing or stubs[0]['id'] in dling:
                    logger.info(f"  Latest video already downloaded for {ch['name']}")
                    continue

            new_stubs = []
            for vs in stubs:
                if vs['id'] not in existing and vs['id'] not in dling \
                   and vs['id'] not in deleted and vs['id'] not in skipped:
                    new_stubs.append(vs)
                    existing.add(vs['id'])

            if not new_stubs:
                logger.info(f"  No new videos for {ch['name']}")
                if mode == 'all' and max_days > 0 and has_videos:
                    channels_to_switch.append(ch['id'])
                continue

            if max_days and max_days > 0:
                logger.info(f"  Pre-checking {len(new_stubs)} videos for age (max {max_days}d)...")
                check_pool = ThreadPoolExecutor(max_workers=min(2, len(new_stubs)))
                check_futures = {
                    check_pool.submit(_check_stub, vs, max_days): vs
                    for vs in new_stubs
                }
                allowed_stubs = []
                for fut in check_futures:
                    try:
                        stub, allowed = fut.result(timeout=30)
                        if allowed:
                            allowed_stubs.append(stub)
                    except Exception as e:
                        logger.error(f"  Pre-check failed: {e}")
                check_pool.shutdown(wait=False)
                logger.info(f"  {len(allowed_stubs)}/{len(new_stubs)} passed age check")
            else:
                allowed_stubs = new_stubs

            for vs in allowed_stubs:
                dling.add(vs['id'])
                set_dl(vs['id'], {
                    'id': vs['id'], 'title': vs.get('title', ''),
                    'channel_name': ch['name'], 'channel_id': ch['id'],
                    'thumbnail': vs.get('thumbnail', ''),
                    'duration': vs.get('duration', 0),
                    'upload_date': '', 'view_count': 0,
                    'progress': 0, 'status': 'queued',
                    'speed': 0, 'eta': 0, 'downloaded_bytes': 0, 'total_bytes': 0,
                })
                ch_quality = ch.get('quality') or quality
                ex.submit(_worker, vs, ch, ch_quality, skip_shorts, 0)

            if mode == 'all' and max_days > 0:
                channels_to_switch.append(ch['id'])

            time.sleep(3)

        import time as _time
        while True:
            with downloads_lock:
                if len(active_downloads) == 0: break
            _time.sleep(2)

        for cid in set(channels_to_switch):
            ch = get_channel(cid)
            if ch and ch.get('download_mode') == 'all' and ch.get('max_days_old', 0) > 0:
                update_channel(cid, {'download_mode': 'latest'})
                logger.info(f"  Auto-switched '{ch['name']}' to 'latest' mode")

        logger.info("Check done.")
    finally:
        check_running.release()


def fetch_video_metadata(vid):
    """Fetch current view_count, like_count, description from YouTube via yt-dlp (no download)."""
    url = f"https://www.youtube.com/watch?v={vid}"
    _rate_limit(2.0)
    try:
        with yt_dlp.YoutubeDL({**base_opts(), 'skip_download': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            if info:
                return {
                    'view_count': int(info.get('view_count') or 0),
                    'like_count': int(info.get('like_count') or 0),
                    'description': info.get('description') or '',
                }
    except Exception as e:
        logger.error(f"Metadata fetch error for {vid}: {e}")
    return None


def refresh_all_metadata():
    """Weekly job: refresh view_count, like_count, description for videos updated fewer than 4 times."""
    if not metadata_refresh_running.acquire(blocking=False):
        logger.info("Metadata refresh already running — skipping")
        return
    try:
        rows = _get_conn().execute(
            'SELECT id, title FROM videos WHERE ghost = 0'
            ' AND COALESCE(metadata_updates, 0) < 4'
            ' ORDER BY COALESCE(metadata_updated_at, \'\') ASC'
        ).fetchall()

        logger.info(f"Metadata refresh: {len(rows)} videos eligible")
        updated = skipped = 0

        for row in rows:
            vid, title = row['id'], row['title']
            meta = fetch_video_metadata(vid)
            if meta:
                update_video_metadata_fields(vid, meta['view_count'], meta['like_count'], meta['description'])
                logger.info(f"  Metadata updated: '{title}' — {meta['view_count']:,} views")
                updated += 1
            else:
                logger.warning(f"  Metadata fetch failed: '{title}' ({vid})")
                skipped += 1

        logger.info(f"Metadata refresh done: {updated} updated, {skipped} failed")
    finally:
        metadata_refresh_running.release()


# ─── API ─────────────────────────────────────────────────────────────

@app.route('/api/channels', methods=['GET'])
def r_channels(): return jsonify(get_channels())


@app.route('/api/channels', methods=['POST'])
def r_add():
    d = request.json; url = d.get('url', '').strip()
    if not url: return jsonify({'error': 'URL required'}), 400
    if not url.startswith('http'): url = 'https://www.youtube.com/' + url
    from urllib.parse import urlparse as _urlparse
    _host = _urlparse(url).hostname or ''
    _yt_hosts = ('youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com')
    if _host not in _yt_hosts:
        return jsonify({'error': 'Only YouTube URLs are supported'}), 400
    info = get_channel_info(url)
    if not info: return jsonify({'error': 'Could not fetch channel.'}), 400
    info['download_mode'] = d.get('download_mode', 'all')
    info['max_days_old'] = int(d.get('max_days_old', 0))
    info['enabled'] = True
    if channel_exists(info['id']):
        return jsonify({'error': 'Already added'}), 409
    add_channel(info)
    threading.Thread(target=check_for_new_videos, daemon=True).start()
    return jsonify(info), 201


@app.route('/api/channels/<cid>', methods=['PUT'])
def r_upd(cid):
    if not get_channel(cid):
        return jsonify({'error': 'Not found'}), 404
    update_channel(cid, request.json)
    return jsonify(get_channel(cid))


@app.route('/api/channels/<cid>', methods=['DELETE'])
def r_del(cid):
    delete_channel(cid)
    return jsonify({'ok': True})


@app.route('/api/videos', methods=['GET'])
def r_vids():
    cid = request.args.get('channel_id')
    include_ghosts = request.args.get('include_ghosts', 'true') == 'true'
    page = max(1, int(request.args.get('page', 1)))
    per_page = max(1, min(200, int(request.args.get('per_page', 100))))
    vids, total = get_videos(channel_id=cid, include_ghosts=include_ghosts, page=page, per_page=per_page)
    return jsonify({'videos': vids, 'total': total, 'page': page, 'per_page': per_page,
                    'pages': max(1, -(-total // per_page))})


@app.route('/api/videos/<vid>', methods=['GET'])
def r_vid(vid):
    v = get_video(vid)
    if not v: return jsonify({'error': 'Not found'}), 404
    return jsonify(v)


@app.route('/api/videos/<vid>/subtitle')
def r_subtitle(vid):
    v = get_video(vid)
    if not v or not v.get('subtitle_path'):
        return '', 404
    fp = (DOWNLOADS_DIR / v['subtitle_path']).resolve()
    if not fp.is_relative_to(DOWNLOADS_DIR.resolve()):
        return '', 404
    if not fp.exists():
        return '', 404
    return send_from_directory(str(fp.parent), fp.name, mimetype='text/vtt')


@app.route('/api/downloads', methods=['GET'])
def r_dls():
    r = list(get_all_dl().values())
    cid = request.args.get('channel_id')
    if cid: r = [d for d in r if d.get('channel_id') == cid]
    return jsonify(r)


@app.route('/api/downloads/<vid>/cancel', methods=['POST'])
def r_cancel(vid):
    with downloads_lock:
        if vid in active_downloads:
            cancelled_downloads.add(vid); active_downloads[vid]['status'] = 'cancelling'
            return jsonify({'ok': True})
    return jsonify({'error': 'Not found'}), 404


@app.route('/api/downloads/cancel-all', methods=['POST'])
def r_cancel_all():
    with downloads_lock:
        for vid in active_downloads:
            cancelled_downloads.add(vid); active_downloads[vid]['status'] = 'cancelling'
    return jsonify({'ok': True})


@app.route('/api/progress/<vid>', methods=['GET'])
def r_wp(vid): return jsonify({'video_id': vid, 'time': get_watch_progress(vid)})


@app.route('/api/progress/<vid>', methods=['PUT'])
def r_wp_set(vid):
    t = request.json.get('time', 0)
    set_watch_progress(vid, t)
    return jsonify({'ok': True})


@app.route('/api/progress', methods=['GET'])
def r_wp_all(): return jsonify(get_all_watch_progress())


@app.route('/api/seen', methods=['GET'])
def r_seen_get():
    rows = _get_conn().execute('SELECT video_id FROM seen_videos').fetchall()
    return jsonify([r['video_id'] for r in rows])


@app.route('/api/seen', methods=['POST'])
def r_seen_post():
    ids = request.json if isinstance(request.json, list) else [request.json.get('video_id')]
    conn = _get_conn()
    with conn:
        for vid in ids:
            if vid:
                conn.execute('INSERT OR IGNORE INTO seen_videos (video_id) VALUES (?)', (vid,))
    return jsonify({'ok': True})


@app.route('/api/new-counts', methods=['GET'])
def r_new_counts():
    s = get_settings()
    days = int(s.get('new_badge_days', 2))
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    rows = _get_conn().execute(
        'SELECT channel_id, COUNT(*) AS cnt FROM videos '
        'WHERE ghost = 0 AND downloaded_at > ? '
        'AND id NOT IN (SELECT video_id FROM seen_videos) '
        'GROUP BY channel_id',
        (cutoff,)
    ).fetchall()
    return jsonify({r['channel_id']: r['cnt'] for r in rows})


@app.route('/api/settings', methods=['GET'])
def r_settings(): return jsonify(get_settings())


@app.route('/api/settings', methods=['PUT'])
def r_upd_settings():
    d = request.json
    s = get_settings()
    if 'quality' in d: s['quality'] = d['quality']
    if 'skip_shorts' in d: s['skip_shorts'] = bool(d['skip_shorts'])
    if 'check_interval' in d:
        s['check_interval'] = max(1, int(d['check_interval'])); reschedule(s['check_interval'])
    if 'max_concurrent' in d:
        s['max_concurrent'] = max(1, min(10, int(d['max_concurrent']))); rebuild_executor(s['max_concurrent'])
    if 'max_video_duration' in d:
        s['max_video_duration'] = max(0, int(d['max_video_duration']))
    if 'volume' in d:
        s['volume'] = max(0.0, min(1.0, float(d['volume'])))
    if 'autoplay' in d:
        s['autoplay'] = bool(d['autoplay'])
    if 'skip_sponsors' in d:
        s['skip_sponsors'] = bool(d['skip_sponsors'])
    if 'sponsor_categories' in d:
        s['sponsor_categories'] = d['sponsor_categories']
    if 'playback_quality' in d:
        s['playback_quality'] = d['playback_quality']
    if 'player_mode' in d and d['player_mode'] in ('default', 'custom'):
        s['player_mode'] = d['player_mode']
    if 'new_badge_days' in d:
        s['new_badge_days'] = max(0, int(d['new_badge_days']))
    if 'feed_filter' in d and d['feed_filter'] in ('All', 'Today', 'This week', 'Unwatched', 'In progress'):
        s['feed_filter'] = d['feed_filter']
    if 'feed_sort' in d and d['feed_sort'] in ('date', 'views', 'channel'):
        s['feed_sort'] = d['feed_sort']
    if 'ntfy_url' in d:
        s['ntfy_url'] = str(d['ntfy_url']).strip()
    if 'webhook_url' in d:
        s['webhook_url'] = str(d['webhook_url']).strip()
    if 'auto_delete_days' in d:
        s['auto_delete_days'] = max(0, int(d['auto_delete_days']))
    save_settings(s)
    return jsonify(s)


@app.route('/api/notifications/test', methods=['POST'])
def r_test_notifications():
    import urllib.request as _ur
    s = get_settings()
    ntfy_url = (s.get('ntfy_url') or '').strip()
    webhook_url = (s.get('webhook_url') or '').strip()
    results = {}

    if ntfy_url:
        try:
            req = _ur.Request(
                ntfy_url,
                data='UnTube test notification'.encode('utf-8'),
                headers={'Title': 'UnTube test', 'User-Agent': 'UnTube/1.0'},
            )
            _ur.urlopen(req, timeout=10)
            results['ntfy'] = 'ok'
        except Exception as e:
            results['ntfy'] = str(e)

    if webhook_url:
        try:
            body, headers = _webhook_payload(webhook_url, {
                'channel': 'UnTube',
                'title': 'Test notification',
                'type': 'test',
            })
            req = _ur.Request(webhook_url, data=body, headers=headers)
            _ur.urlopen(req, timeout=10)
            results['webhook'] = 'ok'
        except Exception as e:
            results['webhook'] = str(e)

    if not results:
        return jsonify({'error': 'No notification URLs configured'}), 400
    return jsonify(results)


@app.route('/api/watch-stats', methods=['POST'])
def r_add_watch_stats():
    body = request.json or {}
    try:
        n = int(body.get('seconds', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'seconds must be a number'}), 400
    if 0 < n <= 86400:
        add_watch_seconds(n)
    return jsonify({'ok': True})


@app.route('/api/watch-stats', methods=['GET'])
def r_get_watch_stats():
    return jsonify(get_watch_stats())


@app.route('/api/check-now', methods=['POST'])
def r_check():
    threading.Thread(target=check_for_new_videos, daemon=True).start()
    return jsonify({'ok': True})


@app.route('/api/metadata-refresh', methods=['POST'])
def r_metadata_refresh():
    threading.Thread(target=refresh_all_metadata, daemon=True).start()
    return jsonify({'ok': True})


@app.route('/api/status', methods=['GET'])
def r_status():
    ch_count, vid_count = count_channels_and_videos()
    return jsonify({'channels': ch_count, 'videos': vid_count,
                    'active_downloads': len(get_all_dl())})


@app.route('/api/channels/<cid>/health', methods=['GET'])
def r_channel_health(cid):
    ch = get_channel(cid)
    if not ch:
        return jsonify({'error': 'Not found'}), 404
    info = get_channel_info(ch['url'])
    if not info:
        return jsonify({'ok': False, 'error': 'Could not reach channel'})
    return jsonify({'ok': True, 'name': info.get('name'), 'subscriber_count': info.get('subscriber_count')})


@app.route('/api/channels/<cid>/browse', methods=['GET'])
def r_browse(cid):
    ch = get_channel(cid)
    if not ch:
        return jsonify({'error': 'Channel not found'}), 404

    max_items = max(1, min(200, int(request.args.get('max', 50))))
    stubs = fetch_channel_videos(ch['url'], max_items)

    downloaded_ids = get_downloaded_ids_for_channel(cid)
    deleted_ids = get_deleted_ids()
    with downloads_lock:
        downloading_ids = {k for k, v in active_downloads.items() if v.get('channel_id') == cid}

    result = []
    for s in stubs:
        status = 'available'
        if s['id'] in downloaded_ids:
            status = 'downloaded'
        elif s['id'] in deleted_ids:
            status = 'deleted'
        elif s['id'] in downloading_ids:
            status = 'downloading'
        result.append({**s, 'status': status})

    return jsonify(result)


@app.route('/api/videos/<vid>', methods=['DELETE'])
def r_del_video(vid):
    video = get_video(vid)
    if not video:
        return jsonify({'error': 'Not found'}), 404

    if video.get('file_path'):
        fp = DOWNLOADS_DIR / video['file_path']
        if fp.exists():
            try: fp.unlink()
            except Exception as e: logger.error(f"File delete error: {e}")

    mark_video_ghost(vid)
    add_deleted_id(vid)
    delete_watch_progress(vid)

    return jsonify({'ok': True})


@app.route('/api/videos/<vid>/restore', methods=['POST'])
def r_restore_video(vid):
    video = get_video(vid)
    if not video:
        return jsonify({'error': 'Not found'}), 404

    ch = get_channel(video.get('channel_id', ''))

    remove_video(vid)
    remove_deleted_id(vid)

    if not ch:
        return jsonify({'error': 'Channel not found'}), 404

    s = get_settings()
    quality = s.get('quality', '720')
    skip_shorts = s.get('skip_shorts', True)
    stub = {'id': vid, 'title': video.get('title', vid),
            'url': f"https://www.youtube.com/watch?v={vid}",
            'duration': video.get('duration', 0),
            'thumbnail': video.get('thumbnail', '')}

    set_dl(vid, {
        'id': vid, 'title': stub['title'],
        'channel_name': ch['name'], 'channel_id': ch['id'],
        'thumbnail': stub['thumbnail'], 'duration': stub['duration'],
        'upload_date': '', 'view_count': 0,
        'progress': 0, 'status': 'queued',
        'speed': 0, 'eta': 0, 'downloaded_bytes': 0, 'total_bytes': 0,
    })
    ch_quality = ch.get('quality') or quality
    get_executor().submit(_worker, stub, ch, ch_quality, skip_shorts, 0)

    return jsonify({'ok': True})


@app.route('/api/videos/download', methods=['POST'])
def r_manual_download():
    d = request.json
    video_ids = d.get('video_ids', [])
    channel_id = d.get('channel_id', '')

    if not video_ids or not channel_id:
        return jsonify({'error': 'video_ids and channel_id required'}), 400

    ch = get_channel(channel_id)
    if not ch:
        return jsonify({'error': 'Channel not found'}), 404

    remove_deleted_ids(video_ids)

    existing = get_existing_video_ids()
    skipped = get_skipped_ids()
    s = get_settings()
    quality = s.get('quality', '720')
    skip_shorts = s.get('skip_shorts', True)
    ex = get_executor()
    queued = 0

    def _fetch_stub(vid):
        url = f"https://www.youtube.com/watch?v={vid}"
        try:
            with yt_dlp.YoutubeDL({**base_opts(), 'extract_flat': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                if info:
                    return {
                        'id': vid,
                        'title': info.get('title', vid),
                        'url': url,
                        'duration': info.get('duration', 0),
                        'thumbnail': (info.get('thumbnails', [{}])[-1].get('url', '')
                                      if info.get('thumbnails') else ''),
                    }
        except Exception as e:
            logger.warning(f"  Could not fetch stub for {vid}: {e}")
        return {'id': vid, 'title': vid, 'url': url, 'duration': 0, 'thumbnail': ''}

    for vid in video_ids:
        if vid in existing or vid in skipped:
            continue
        with downloads_lock:
            if vid in active_downloads:
                continue

        stub = _fetch_stub(vid)

        set_dl(vid, {
            'id': vid, 'title': stub.get('title', ''),
            'channel_name': ch['name'], 'channel_id': ch['id'],
            'thumbnail': stub.get('thumbnail', ''),
            'duration': stub.get('duration', 0),
            'upload_date': '', 'view_count': 0,
            'progress': 0, 'status': 'queued',
            'speed': 0, 'eta': 0, 'downloaded_bytes': 0, 'total_bytes': 0,
        })
        ch_quality = ch.get('quality') or quality
        ex.submit(_worker, stub, ch, ch_quality, skip_shorts, 0)
        queued += 1

    return jsonify({'ok': True, 'queued': queued})


@app.route('/api/deleted', methods=['GET'])
def r_deleted():
    return jsonify(list(get_deleted_ids()))


@app.route('/api/skipped', methods=['GET'])
def r_skipped():
    return jsonify(list(get_skipped_ids()))


@app.route('/api/videos/search', methods=['GET'])
def r_search():
    q = request.args.get('q', '').lower().strip()
    if not q: return jsonify([])
    return jsonify(search_videos(q))


@app.route('/api/sponsorblock/<vid>', methods=['GET'])
def r_sponsorblock(vid):
    import urllib.request, urllib.error, urllib.parse
    cats = get_settings().get('sponsor_categories',
        ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'music_offtopic'])
    cats_json = json.dumps(cats)
    sb_url = f"https://sponsor.ajay.app/api/skipSegments?videoID={vid}&categories={urllib.parse.quote(cats_json)}"
    try:
        req = urllib.request.Request(sb_url, headers={'User-Agent': 'UnTube/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            return jsonify(data)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return jsonify([])
        return jsonify([])
    except Exception:
        return jsonify([])


@app.route('/api/videos/<vid>/resolution', methods=['GET'])
def r_resolution(vid):
    import subprocess
    video = get_video(vid)
    if not video:
        return jsonify({'height': 0})
    stored = video.get('height', 0)
    if stored and stored > 0:
        return jsonify({'height': stored})
    if not video.get('file_path'):
        return jsonify({'height': 0})
    fp = DOWNLOADS_DIR / video['file_path']
    if not fp.exists():
        return jsonify({'height': 0})
    try:
        cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
               '-show_entries', 'stream=height', '-of', 'csv=p=0', str(fp)]
        result = subprocess.run(cmd, capture_output=True, timeout=10)
        h = int(result.stdout.decode().strip())
        update_video_height(vid, h)
        return jsonify({'height': h})
    except Exception:
        return jsonify({'height': 0})


# ─── Live HLS Transcoding ─────────────────────────────────────────

_hls_procs = {}
_hls_lock = threading.Lock()


def _cleanup_hls():
    import shutil
    with _hls_lock:
        now = time.time()
        dead = [k for k, v in _hls_procs.items() if now - v['started'] > 3600]
        for k in dead:
            try: _hls_procs[k]['proc'].kill()
            except: pass
            try: shutil.rmtree(_hls_procs[k]['dir'], ignore_errors=True)
            except: pass
            del _hls_procs[k]
        stale = [k for k, v in _ondemand_locks.items() if now - v[1] > 120]
        for k in stale:
            _ondemand_locks[k][0].set()
            del _ondemand_locks[k]


@app.route('/api/hls/<vid>/<int:q>/index.m3u8')
def r_hls_playlist(vid, q):
    import subprocess, shutil, math
    _cleanup_hls()

    if q not in (360, 480, 720, 1080):
        abort(400)

    video = get_video(vid)
    if not video or not video.get('file_path'):
        abort(404)
    src = DOWNLOADS_DIR / video['file_path']
    if not src.exists():
        abort(404)

    key = f"{vid}_{q}"
    hls_dir = DATA_DIR / 'hls' / key
    playlist = hls_dir / 'index.m3u8'

    duration = video.get('duration', 0)
    if not duration or duration <= 0:
        try:
            probe = subprocess.run(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                 '-of', 'csv=p=0', str(src)],
                capture_output=True, timeout=10)
            duration = float(probe.stdout.decode().strip())
        except Exception:
            duration = 3600

    seg_duration = 4
    num_segments = math.ceil(duration / seg_duration)

    with _hls_lock:
        if key not in _hls_procs:
            if hls_dir.exists():
                shutil.rmtree(hls_dir)
            hls_dir.mkdir(parents=True, exist_ok=True)

            m3u8 = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:{}\n'.format(seg_duration + 1)
            m3u8 += '#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-PLAYLIST-TYPE:VOD\n'
            for i in range(num_segments):
                seg_len = min(seg_duration, duration - i * seg_duration)
                m3u8 += f'#EXTINF:{seg_len:.3f},\nseg_{i:05d}.ts\n'
            m3u8 += '#EXT-X-ENDLIST\n'
            playlist.write_text(m3u8)

            crf = '23' if q >= 720 else '28'
            cmd = [
                'ffmpeg', '-hide_banner', '-loglevel', 'error',
                '-i', str(src),
                '-vf', f'scale=-2:{q}',
                '-c:v', 'libx264', '-preset', 'ultrafast',
                '-tune', 'zerolatency',
                '-force_key_frames', f'expr:gte(t,n_forced*{seg_duration})',
                '-crf', crf, '-threads', '0',
                '-c:a', 'aac', '-b:a', '96k' if q <= 480 else '128k', '-ac', '2',
                '-f', 'hls',
                '-hls_time', str(seg_duration),
                '-hls_list_size', '0',
                '-hls_flags', 'independent_segments+temp_file',
                '-hls_segment_filename', str(hls_dir / 'seg_%05d.ts'),
                '-start_number', '0',
                str(hls_dir / '_live.m3u8')
            ]
            logger.info(f"HLS transcode: {video.get('title','')} @ {q}p, {duration:.0f}s, {num_segments} segs")
            try:
                proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                _hls_procs[key] = {'proc': proc, 'dir': str(hls_dir), 'started': time.time()}
                def _drain(p, k):
                    for line in p.stderr:
                        msg = line.decode('utf-8', errors='replace').rstrip()
                        if msg:
                            logger.warning(f"HLS [{k}] {msg}")
                threading.Thread(target=_drain, args=(proc, key), daemon=True).start()
            except Exception as e:
                logger.error(f"HLS start failed: {e}")
                abort(500)

    from flask import Response
    m3u8_data = playlist.read_text()
    return Response(m3u8_data, mimetype='application/vnd.apple.mpegurl', headers={
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
    })


def _serve_segment(hls_dir, segment):
    from flask import Response
    seg_path = Path(hls_dir) / segment
    if not seg_path.exists() or seg_path.stat().st_size == 0:
        abort(404)
    data = seg_path.read_bytes()
    return Response(data, mimetype='video/mp2t', headers={
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': str(len(data)),
    })


_ondemand_locks = {}


@app.route('/api/hls/<vid>/<int:q>/<segment>')
def r_hls_segment(vid, q, segment):
    import subprocess
    key = f"{vid}_{q}"
    hls_dir = DATA_DIR / 'hls' / key
    hls_dir.mkdir(parents=True, exist_ok=True)
    seg_path = hls_dir / segment

    if not segment.endswith('.ts'):
        abort(400)

    try:
        seg_num = int(segment.replace('seg_', '').replace('.ts', ''))
    except ValueError:
        abort(400)

    seg_duration = 4

    if seg_path.exists() and seg_path.stat().st_size > 0:
        tmp = seg_path.with_suffix('.ts.tmp')
        if not tmp.exists():
            return _serve_segment(str(hls_dir), segment)

    od_key = f"{key}_{seg_num}"
    with _hls_lock:
        if od_key in _ondemand_locks:
            evt = _ondemand_locks[od_key][0]
        else:
            evt = None

    if evt:
        evt.wait(timeout=30)
        if seg_path.exists() and seg_path.stat().st_size > 0:
            return _serve_segment(str(hls_dir), segment)

    try:
        existing = [f for f in os.listdir(hls_dir) if f.startswith('seg_') and f.endswith('.ts')]
        max_existing = max([int(f.replace('seg_', '').replace('.ts', '')) for f in existing if os.path.getsize(os.path.join(hls_dir, f)) > 0], default=-1)
    except Exception:
        max_existing = -1

    if seg_num <= max_existing + 15:
        for _ in range(200):
            if seg_path.exists() and seg_path.stat().st_size > 0:
                tmp = seg_path.with_suffix('.ts.tmp')
                if not tmp.exists():
                    return _serve_segment(str(hls_dir), segment)
            with _hls_lock:
                pi = _hls_procs.get(key)
            if pi and pi['proc'].poll() is not None:
                if seg_path.exists() and seg_path.stat().st_size > 0:
                    return _serve_segment(str(hls_dir), segment)
                break
            time.sleep(0.1)
        if seg_path.exists() and seg_path.stat().st_size > 0:
            return _serve_segment(str(hls_dir), segment)

    hls_dir.mkdir(parents=True, exist_ok=True)

    video = get_video(vid)
    if not video or not video.get('file_path'):
        abort(404)
    src = DOWNLOADS_DIR / video['file_path']
    if not src.exists():
        abort(404)

    seek_time = seg_num * seg_duration
    crf = '23' if q >= 720 else '28'
    tmp_seg = seg_path.with_suffix('.ondemand.ts')

    evt = threading.Event()
    with _hls_lock:
        _ondemand_locks[od_key] = (evt, time.time())

    logger.info(f"HLS on-demand segment {seg_num} (t={seek_time}s) @ {q}p")
    try:
        # Two-pass seek: fast-seek to 10s before target, then accurate trim.
        # This avoids full decode from t=0 while landing on the exact frame.
        pre_seek = max(0.0, seek_time - 10.0)
        post_seek = seek_time - pre_seek
        cmd = [
            'ffmpeg', '-hide_banner', '-loglevel', 'error',
            '-ss', str(pre_seek),
            '-i', str(src),
            '-ss', str(post_seek),
            '-t', str(seg_duration),
            '-vf', f'scale=-2:{q}',
            '-c:v', 'libx264', '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-crf', crf, '-threads', '0',
            '-c:a', 'aac', '-b:a', '96k' if q <= 480 else '128k', '-ac', '2',
            '-f', 'mpegts',
            '-y', str(tmp_seg)
        ]
        result = subprocess.run(cmd, stdout=subprocess.DEVNULL,
                                stderr=subprocess.PIPE, timeout=30)
        if result.returncode == 0 and tmp_seg.exists() and tmp_seg.stat().st_size > 0:
            tmp_seg.rename(seg_path)
            evt.set()
            with _hls_lock:
                _ondemand_locks.pop(od_key, None)
            return _serve_segment(str(hls_dir), segment)
        else:
            err = result.stderr.decode('utf-8', errors='ignore')[-300:]
            logger.error(f"On-demand segment failed: {err}")
            if tmp_seg.exists(): tmp_seg.unlink()
    except subprocess.TimeoutExpired:
        logger.error(f"On-demand segment timeout for {segment}")
        if tmp_seg.exists(): tmp_seg.unlink()
    except Exception as e:
        logger.error(f"On-demand segment error: {e}")
        if tmp_seg.exists(): tmp_seg.unlink()

    evt.set()
    with _hls_lock:
        _ondemand_locks.pop(od_key, None)
    abort(404)


@app.route('/api/hls/<vid>/<int:q>/stop', methods=['POST'])
def r_hls_stop(vid, q):
    key = f"{vid}_{q}"
    import shutil
    with _hls_lock:
        if key in _hls_procs:
            try: _hls_procs[key]['proc'].kill()
            except: pass
            try: shutil.rmtree(_hls_procs[key]['dir'], ignore_errors=True)
            except: pass
            del _hls_procs[key]
    return jsonify({'ok': True})


@app.route('/api/thumb')
def r_thumb():
    import urllib.request, urllib.error, hashlib
    from urllib.parse import urlparse
    from flask import Response, send_file
    url = request.args.get('url', '').strip()
    if not url or not url.startswith('http'):
        abort(400)
    host = urlparse(url).hostname or ''
    allowed_hosts = ('i.ytimg.com', 'i1.ytimg.com', 'i2.ytimg.com', 'i3.ytimg.com',
                     'img.youtube.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com',
                     'lh3.googleusercontent.com')
    if not any(host == h or host.endswith('.' + h) for h in allowed_hosts):
        abort(403)

    THUMB_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = THUMB_CACHE_DIR / f'{hashlib.md5(url.encode()).hexdigest()}.jpg'
    ttl = 30 * 86400

    try:
        if cache_file.exists() and cache_file.stat().st_size > 0:
            if (time.time() - cache_file.stat().st_mtime) < ttl:
                return send_file(cache_file, mimetype='image/jpeg', max_age=86400)
    except Exception:
        pass

    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; UnTube/1.0)',
            'Referer': 'https://www.youtube.com/',
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = resp.read()
            ct = resp.headers.get('Content-Type', 'image/jpeg')
        try:
            cache_file.write_bytes(data)
        except Exception as e:
            logger.warning(f"Thumb cache write failed: {e}")
        return Response(data, mimetype=ct, headers={
            'Cache-Control': 'public, max-age=86400',
        })
    except urllib.error.HTTPError as e:
        abort(e.code)
    except Exception as e:
        logger.error(f"Thumb proxy error: {e}")
        abort(502)


@app.route('/api/ytdlp/version', methods=['GET'])
def r_ytdlp_version():
    try:
        return jsonify({'version': yt_dlp.version.__version__})
    except Exception:
        return jsonify({'version': 'unknown'})


@app.route('/api/ytdlp/logs', methods=['GET'])
def r_ytdlp_logs():
    since = int(request.args.get('since', 0))
    with _log_lock:
        entries = [e for e in _log_buffer if e['i'] > since]
    return jsonify(entries)


_ytdlp_updating = False
_ytdlp_update_lock = threading.Lock()


@app.route('/api/ytdlp/update', methods=['POST'])
def r_ytdlp_update():
    global _ytdlp_updating
    with _ytdlp_update_lock:
        if _ytdlp_updating:
            return jsonify({'ok': False, 'error': 'Update already in progress'}), 409
        _ytdlp_updating = True

    def do_update():
        global _ytdlp_updating
        try:
            _append_log('INFO', '=== yt-dlp update started ===')
            result = subprocess.run(
                ['pip', 'install', '-U', 'yt-dlp'],
                capture_output=True, text=True, timeout=180
            )
            for line in result.stdout.splitlines():
                if line.strip():
                    _append_log('INFO', line)
            for line in result.stderr.splitlines():
                if line.strip():
                    _append_log('WARNING', line)
            if result.returncode == 0:
                _append_log('INFO', f'=== yt-dlp update complete — version {yt_dlp.version.__version__} ===')
            else:
                _append_log('ERROR', f'=== yt-dlp update failed (exit {result.returncode}) ===')
        except subprocess.TimeoutExpired:
            _append_log('ERROR', '=== yt-dlp update timed out ===')
        except Exception as e:
            _append_log('ERROR', f'=== yt-dlp update error: {e} ===')
        finally:
            with _ytdlp_update_lock:
                _ytdlp_updating = False

    threading.Thread(target=do_update, daemon=True).start()
    return jsonify({'ok': True})


@app.route('/api/ytdlp/update-status', methods=['GET'])
def r_ytdlp_update_status():
    with _ytdlp_update_lock:
        return jsonify({'updating': _ytdlp_updating})


@app.route('/api/storage', methods=['GET'])
def r_storage():
    sizes = {}
    if DOWNLOADS_DIR.exists():
        for ch_dir in DOWNLOADS_DIR.iterdir():
            if ch_dir.is_dir():
                total = sum(f.stat().st_size for f in ch_dir.rglob('*') if f.is_file())
                sizes[ch_dir.name] = total
    return jsonify(sizes)


@app.route('/media/<path:fp>')
def serve(fp):
    p = (DOWNLOADS_DIR / fp).resolve()
    if not p.is_relative_to(DOWNLOADS_DIR.resolve()):
        abort(403)
    if not p.exists():
        abort(404)
    return send_from_directory(str(p.parent), p.name)


import atexit


def _shutdown_hls():
    import shutil
    with _hls_lock:
        for key, info in list(_hls_procs.items()):
            try: info['proc'].kill()
            except: pass
            try: shutil.rmtree(info['dir'], ignore_errors=True)
            except: pass
        _hls_procs.clear()
    logger.info("HLS sessions cleaned up on shutdown.")


atexit.register(_shutdown_hls)


def _auto_delete_old_videos():
    """Daily job: ghost videos whose downloaded_at age exceeds the effective auto_delete_days threshold."""
    s = get_settings()
    global_days = int(s.get('auto_delete_days', 0) or 0)

    rows = _get_conn().execute(
        'SELECT v.id, v.file_path, v.subtitle_path, v.title, v.downloaded_at, v.channel_id,'
        ' c.auto_delete_days AS ch_days'
        ' FROM videos v LEFT JOIN channels c ON v.channel_id = c.id'
        ' WHERE v.ghost = 0 AND v.file_path != \'\''
    ).fetchall()

    now = datetime.now(timezone.utc)
    deleted = 0
    for row in rows:
        ch_days = row['ch_days']
        effective_days = int(ch_days) if ch_days is not None else global_days
        if effective_days <= 0:
            continue

        dl_at_str = row['downloaded_at']
        if not dl_at_str:
            continue
        try:
            dl_at = datetime.fromisoformat(dl_at_str)
            if dl_at.tzinfo is None:
                dl_at = dl_at.replace(tzinfo=timezone.utc)
        except Exception:
            continue

        age_days = (now - dl_at).total_seconds() / 86400
        if age_days < effective_days:
            continue

        fp = row['file_path']
        if fp:
            try:
                full = DOWNLOADS_DIR / fp
                if full.exists():
                    full.unlink()
            except Exception as e:
                logger.warning(f"Auto-delete file error {fp}: {e}")

        sub = row['subtitle_path']
        if sub:
            try:
                full_sub = DOWNLOADS_DIR / sub
                if full_sub.exists():
                    full_sub.unlink()
            except Exception:
                pass

        mark_video_ghost(row['id'])
        add_deleted_id(row['id'])
        delete_watch_progress(row['id'])
        logger.info(f"Auto-deleted '{row['title']}' (age {age_days:.0f}d >= {effective_days}d)")
        deleted += 1

    if deleted:
        logger.info(f"Auto-delete complete: {deleted} video(s) removed")


def _run_analyze():
    _get_conn().execute('ANALYZE')
    logger.info("ANALYZE complete")


def reschedule(mins):
    try: scheduler.remove_job('chk')
    except: pass
    scheduler.add_job(check_for_new_videos, 'interval', minutes=mins, id='chk', replace_existing=True)


if __name__ == '__main__':
    init_db()
    s = get_settings()
    rebuild_executor(s.get('max_concurrent', 2))
    scheduler.start()
    reschedule(s.get('check_interval', 180))
    scheduler.add_job(refresh_all_metadata, 'interval', weeks=1, id='meta_refresh', replace_existing=True)
    scheduler.add_job(_run_analyze, 'interval', weeks=1, id='analyze', replace_existing=True)
    scheduler.add_job(_cleanup_seen_videos, 'interval', days=1, id='seen_cleanup', replace_existing=True)
    scheduler.add_job(_auto_delete_old_videos, 'interval', days=1, id='auto_delete', replace_existing=True)
    app.run(host='0.0.0.0', port=5000, debug=False)
