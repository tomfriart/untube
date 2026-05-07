import { useState, useEffect, useRef } from 'react'
import { I } from '../icons'
import { Av } from './Avatar'
import { API, daysLabel } from '../utils'

const fmtBytes = b => {
  if (!b) return '0 B'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const safeFolderName = name => name.replace(/[^\w \-]/g, '').trim()

const fmtWatchTime = s => {
  if (s == null) return '—'
  if (s < 60) return '0 min'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h} hr ${m} min` : `${m} min`
}

const LOG_COLORS = {
  ERROR: '#ff6b6b',
  WARNING: '#ffd93d',
  DEBUG: '#6bcb77',
  INFO: 'var(--text-secondary)',
}

function YtdlpPanel() {
  const [version, setVersion] = useState(null)
  const [logs, setLogs] = useState([])
  const [updating, setUpdating] = useState(false)
  const logBoxRef = useRef(null)
  const sinceRef = useRef(0)

  useEffect(() => {
    fetch(`${API}/api/ytdlp/version`).then(r => r.json()).then(d => setVersion(d.version)).catch(() => {})
  }, [])

  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${API}/api/ytdlp/logs?since=${sinceRef.current}`)
        const data = await r.json()
        if (data.length) {
          sinceRef.current = data[data.length - 1].i
          setLogs(prev => [...prev, ...data].slice(-500))
        }
        const s = await fetch(`${API}/api/ytdlp/update-status`)
        const sd = await s.json()
        setUpdating(sd.updating)
      } catch {}
    }
    poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
  }, [logs])

  const doUpdate = async () => {
    setUpdating(true)
    try {
      await fetch(`${API}/api/ytdlp/update`, { method: 'POST' })
    } catch {
      setUpdating(false)
    }
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">yt-dlp</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={doUpdate} disabled={updating} style={{ minWidth: 160 }}>
            <I.Refresh />{updating ? 'Updating...' : 'Update yt-dlp'}
          </button>
          {version && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              current: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{version}</span>
            </span>
          )}
        </div>
        <div className="form-hint" style={{ marginTop: 6 }}>
          Runs <code style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 3 }}>pip install -U yt-dlp</code> inside the container.
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Activity Log
          </span>
          <button
            onClick={() => { setLogs([]); sinceRef.current = 0 }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}
          >
            Clear
          </button>
        </div>
        <div ref={logBoxRef} style={{
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          height: 280, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5,
        }}>
          {logs.length === 0
            ? <span style={{ color: 'var(--text-muted)' }}>No activity yet. Logs appear here as yt-dlp runs.</span>
            : logs.map(e => (
              <div key={e.i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: 11 }}>{e.ts}</span>
                <span style={{ color: LOG_COLORS[e.level] || 'var(--text-secondary)', wordBreak: 'break-all' }}>{e.msg}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

function PageDownloads({ settings, updS, checkNow, checking }) {
  const [notifStatus, setNotifStatus] = useState(null)
  const [notifTesting, setNotifTesting] = useState(false)

  const testNotifications = async () => {
    setNotifTesting(true)
    setNotifStatus(null)
    try {
      const r = await fetch(`${API}/api/notifications/test`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) { setNotifStatus({ error: d.error }); return }
      const parts = []
      if (d.ntfy) parts.push(`ntfy: ${d.ntfy}`)
      if (d.webhook) parts.push(`webhook: ${d.webhook}`)
      const allOk = Object.values(d).every(v => v === 'ok')
      setNotifStatus({ ok: allOk, msg: parts.join('  ·  ') })
    } catch (e) {
      setNotifStatus({ error: 'Request failed' })
    } finally {
      setNotifTesting(false)
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="form-group">
        <button className="btn" onClick={checkNow} disabled={checking} style={{ width: '100%', justifyContent: 'center' }}>
          <I.Refresh />{checking ? 'Checking...' : 'Check Now'}
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Download Quality</label>
        <select className="form-select" value={settings.quality} onChange={e => updS({ quality: e.target.value })}>
          <option value="360">360p</option>
          <option value="480">480p</option>
          <option value="720">720p (Recommended)</option>
          <option value="1080">1080p</option>
          <option value="1440">1440p</option>
          <option value="2160">4K</option>
          <option value="best">Best</option>
        </select>
      </div>

      <div className="form-group">
        <div className="toggle-row">
          <span>Skip YouTube Shorts</span>
          <button className={`toggle ${settings.skip_shorts ? 'on' : ''}`} onClick={() => updS({ skip_shorts: !settings.skip_shorts })}>
            <div className="toggle-knob" />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Check Interval (minutes)</label>
        <input
          className="form-input"
          type="number" min="1" max="1440"
          value={settings.check_interval}
          onChange={e => updS({ check_interval: parseInt(e.target.value) || 60 })}
        />
        {(settings.check_interval || 60) < 30 && (
          <div className="form-warn">⚠ A low check interval may trigger YouTube's bot detection and temporarily block downloads.</div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Max Concurrent Downloads</label>
        <input
          className="form-input"
          type="number" min="1" max="10"
          value={settings.max_concurrent || 1}
          onChange={e => updS({ max_concurrent: parseInt(e.target.value) || 1 })}
        />
        {(settings.max_concurrent || 1) > 3 && (
          <div className="form-warn">⚠ More than 3 simultaneous downloads may be detected as bot activity by YouTube and temporarily block you from downloading.</div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Max Video Duration (minutes, 0 = no limit)</label>
        <input
          className="form-input"
          type="number" min="0" max="1440"
          value={settings.max_video_duration ?? 60}
          onChange={e => updS({ max_video_duration: parseInt(e.target.value) || 0 })}
        />
        <div className="form-hint">Videos longer than this will be skipped during download.</div>
      </div>

      <div className="form-group">
        <label className="form-label">NEW badge duration (days, 0 = disabled)</label>
        <input
          className="form-input"
          type="number" min="0" max="30"
          value={settings.new_badge_days ?? 2}
          onChange={e => updS({ new_badge_days: parseInt(e.target.value) || 0 })}
        />
        <div className="form-hint">How many days after download a video shows the NEW badge.</div>
      </div>

      <div className="form-group">
        <label className="form-label">Auto-delete after (days, 0 = disabled)</label>
        <input
          className="form-input"
          type="number" min="0" max="3650"
          value={settings.auto_delete_days ?? 0}
          onChange={e => updS({ auto_delete_days: parseInt(e.target.value) || 0 })}
        />
        <div className="form-hint">Automatically delete downloaded videos after this many days. 0 = never. Can be overridden per channel.</div>
      </div>

      <div className="nav-section-title" style={{ padding: '16px 0 12px' }}>Notifications</div>

      <div className="form-group">
        <label className="form-label">ntfy URL</label>
        <input
          className="form-input"
          type="url"
          placeholder="https://ntfy.sh/your-topic"
          value={settings.ntfy_url || ''}
          onChange={e => updS({ ntfy_url: e.target.value })}
        />
        <div className="form-hint">Leave empty to disable ntfy notifications.</div>
      </div>

      <div className="form-group">
        <label className="form-label">Webhook URL</label>
        <input
          className="form-input"
          type="url"
          placeholder="https://your-server/webhook"
          value={settings.webhook_url || ''}
          onChange={e => updS({ webhook_url: e.target.value })}
        />
        <div className="form-hint">Sends a POST with JSON body on each download. Leave empty to disable.</div>
      </div>

      <div className="form-group">
        <button
          className="btn btn-secondary"
          onClick={testNotifications}
          disabled={notifTesting || (!settings.ntfy_url && !settings.webhook_url)}
        >
          {notifTesting ? 'Sending…' : 'Test notification'}
        </button>
        {notifStatus && (
          <div className="form-hint" style={{ marginTop: 6, color: notifStatus.ok ? 'var(--green, #4caf50)' : 'var(--red, #f44336)' }}>
            {notifStatus.error || notifStatus.msg}
          </div>
        )}
      </div>
    </div>
  )
}

function PagePlayback({ settings, updS }) {
  const [watchStats, setWatchStats] = useState(null)
  useEffect(() => {
    fetch(`${API}/api/watch-stats`)
      .then(r => r.ok ? r.json() : null)
      .then(setWatchStats)
      .catch(() => {})
  }, [])

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="form-group">
        <div className="toggle-row">
          <span>Auto-play videos</span>
          <button className={`toggle ${settings.autoplay !== false ? 'on' : ''}`} onClick={() => updS({ autoplay: settings.autoplay === false })}>
            <div className="toggle-knob" />
          </button>
        </div>
        <div className="form-hint" style={{ marginTop: 2 }}>Automatically start playing when you open a video.</div>
      </div>

      <div className="form-group">
        <div className="toggle-row">
          <span>Skip sponsor segments</span>
          <button className={`toggle ${settings.skip_sponsors !== false ? 'on' : ''}`} onClick={() => updS({ skip_sponsors: settings.skip_sponsors === false })}>
            <div className="toggle-knob" />
          </button>
        </div>
        <div className="form-hint" style={{ marginTop: 2 }}>Auto-skip segments using SponsorBlock community data.</div>
        {settings.skip_sponsors !== false && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { id: 'sponsor',        label: 'Sponsor' },
              { id: 'selfpromo',      label: 'Self-promo' },
              { id: 'interaction',    label: 'Interaction' },
              { id: 'intro',          label: 'Intro' },
              { id: 'outro',          label: 'Outro' },
              { id: 'music_offtopic', label: 'Non-music' },
            ].map(cat => {
              const cats = settings.sponsor_categories || ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'music_offtopic']
              const on = cats.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    const next = on ? cats.filter(c => c !== cat.id) : [...cats, cat.id]
                    updS({ sponsor_categories: next })
                  }}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all .15s', border: '1px solid',
                    background: on ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                    borderColor: on ? 'var(--accent)' : 'var(--border)',
                    color: on ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Video Player</label>
        <select className="form-select" value={settings.player_mode || 'default'} onChange={e => updS({ player_mode: e.target.value })}>
          <option value="default">Default (browser native controls)</option>
          <option value="custom">Custom (integrated controls)</option>
        </select>
        <div className="form-hint">The custom player adds sponsor markers and chapters to the seek bar, with quality selection built in.</div>
      </div>

      <div className="form-group">
        <label className="form-label">Watch Time</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          {[
            { label: 'Today',      key: 'today' },
            { label: 'This week',  key: 'this_week' },
            { label: 'This month', key: 'this_month' },
            { label: 'All time',   key: 'all_time' },
          ].map(({ label, key }) => (
            <div
              key={key}
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
              }}
            >
              <div style={{
                fontSize: 11, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4,
              }}>
                {label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                {fmtWatchTime(watchStats?.[key])}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PageChannels({ channels, sortedChannels, storage, updCh, rmCh, openBrowse, setShowAdd, editCh, setEditCh, settings }) {
  const [health, setHealth] = useState({})

  const checkHealth = async (ch) => {
    setHealth(h => ({ ...h, [ch.id]: { status: 'checking' } }))
    try {
      const r = await fetch(`${API}/api/channels/${ch.id}/health`)
      const d = await r.json()
      setHealth(h => ({ ...h, [ch.id]: d.ok ? { status: 'ok', name: d.name } : { status: 'error', error: d.error || 'Unreachable' } }))
    } catch {
      setHealth(h => ({ ...h, [ch.id]: { status: 'error', error: 'Network error' } }))
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 16 }}>
        <div className="nav-section-title" style={{ padding: '0 0 12px' }}>Channels ({channels.length})</div>
        {sortedChannels.map(ch => {
          const folderBytes = storage[safeFolderName(ch.name)]
          return (
            <div
              key={ch.id}
              style={{ padding: '14px 0', borderBottom: '1px solid var(--border-subtle)', opacity: ch.enabled === false ? .55 : 1 }}
            >
              <div className="ch-settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div
                  className="ch-settings-info"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}
                  onClick={() => openBrowse(ch)}
                >
                  <Av src={ch.thumbnail} name={ch.name} />
                  <span style={{ fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ch.name}
                  </span>
                  {ch.enabled === false
                    ? <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-active)', padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>Paused</span>
                    : <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>
                      {ch.download_mode === 'latest' ? 'Latest only' : ch.max_days_old ? `Last ${daysLabel(ch.max_days_old)}` : 'All videos'}
                    </span>
                  }
                  {folderBytes > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{fmtBytes(folderBytes)}</span>
                  )}
                </div>
                <div className="ch-settings-btns" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {health[ch.id] && (
                    <span style={{ fontSize: 11, flexShrink: 0, ...(health[ch.id].status === 'ok' ? { color: 'var(--green)' } : health[ch.id].status === 'error' ? { color: '#ff6b6b' } : { color: 'var(--text-muted)' }) }}
                      title={health[ch.id].status === 'ok' ? health[ch.id].name : health[ch.id].error}>
                      {health[ch.id].status === 'checking' ? '…' : health[ch.id].status === 'ok' ? <I.Check /> : <I.Alert />}
                    </span>
                  )}
                  <button
                    className="btn-icon"
                    title="Check channel health"
                    onClick={() => checkHealth(ch)}
                    disabled={health[ch.id]?.status === 'checking'}
                  >
                    <I.Refresh />
                  </button>
                  <button
                    className="btn-icon"
                    title={ch.enabled === false ? 'Resume downloads' : 'Pause downloads'}
                    onClick={() => updCh(ch.id, { enabled: ch.enabled === false })}
                    style={ch.enabled === false ? { color: 'var(--green)' } : {}}
                  >
                    {ch.enabled === false ? <I.Play /> : <I.Pause />}
                  </button>
                  <button className="btn-icon" onClick={() => setEditCh(editCh === ch.id ? null : ch.id)}>
                    <I.Settings />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => rmCh(ch.id)}><I.Trash /></button>
                </div>
              </div>

              {editCh === ch.id && (
                <div style={{ marginTop: 12, marginLeft: 38, padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Download Mode</label>
                    <select
                      className="form-select"
                      value={ch.download_mode || 'all'}
                      onChange={e => updCh(ch.id, { download_mode: e.target.value })}
                    >
                      <option value="latest">Latest video only</option>
                      <option value="all">All videos (with optional age limit)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Quality Override</label>
                    <select
                      className="form-select"
                      value={ch.quality || ''}
                      onChange={e => updCh(ch.id, { quality: e.target.value || null })}
                    >
                      <option value="">Use global setting</option>
                      <option value="360">360p</option>
                      <option value="480">480p</option>
                      <option value="720">720p</option>
                      <option value="1080">1080p</option>
                      <option value="1440">1440p</option>
                      <option value="2160">4K</option>
                      <option value="best">Best</option>
                    </select>
                  </div>
                  {(ch.download_mode || 'all') === 'all' && (
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Max video age (days, 0 = no limit)</label>
                      <input
                        className="form-input"
                        type="number" min="0" max="9999"
                        value={ch.max_days_old || 0}
                        onChange={e => updCh(ch.id, { max_days_old: parseInt(e.target.value) || 0 })}
                      />
                      <div className="form-hint">
                        Download videos from the last {daysLabel(ch.max_days_old || 0).toLowerCase()}.
                      </div>
                    </div>
                  )}
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Auto-delete override (days)</label>
                    <input
                      className="form-input"
                      type="number" min="0" max="3650"
                      placeholder={`Global (${settings?.auto_delete_days || 'disabled'})`}
                      value={ch.auto_delete_days ?? ''}
                      onChange={e => {
                        const val = e.target.value
                        updCh(ch.id, { auto_delete_days: val === '' ? null : parseInt(val) || 0 })
                      }}
                    />
                    <div className="form-hint">Leave empty to use the global setting. Set 0 to never auto-delete for this channel.</div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div className="toggle-row">
                      <span>Notify on new download</span>
                      <button
                        className={`toggle ${ch.notify ? 'on' : ''}`}
                        onClick={() => updCh(ch.id, { notify: !ch.notify })}
                      >
                        <div className="toggle-knob" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <button className="btn" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>
          <I.Plus /> Add Channel
        </button>
      </div>
    </div>
  )
}

function PageSystem() {
  return (
    <div style={{ maxWidth: 520 }}>
      <YtdlpPanel />
    </div>
  )
}

export function SettingsPanel({
  settings, channels, sortedChannels, updS, updCh, rmCh,
  openBrowse, setShowAdd, editCh, setEditCh, checkNow, checking,
  settingsPage,
}) {
  const [storage, setStorage] = useState({})
  useEffect(() => {
    fetch(`${API}/api/storage`).then(r => r.ok ? r.json() : {}).then(setStorage).catch(() => {})
  }, [])

  if (settingsPage === 'downloads') return <PageDownloads settings={settings} updS={updS} checkNow={checkNow} checking={checking} />
  if (settingsPage === 'playback')  return <PagePlayback  settings={settings} updS={updS} />
  if (settingsPage === 'channels')  return <PageChannels  channels={channels} sortedChannels={sortedChannels} storage={storage} updCh={updCh} rmCh={rmCh} openBrowse={openBrowse} setShowAdd={setShowAdd} editCh={editCh} setEditCh={setEditCh} settings={settings} />
  if (settingsPage === 'system')    return <PageSystem />
  return null
}
