import { useState, useEffect, useRef } from 'react'
import { I } from '../icons'
import { Av } from './Avatar'
import { API, daysLabel, apiFetch } from '../utils'

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

const SETTINGS_TABS = [
  { id: 'downloads', label: 'Downloads', icon: <I.Download /> },
  { id: 'playback',  label: 'Playback',  icon: <I.Play /> },
  { id: 'channels',  label: 'Channels',  icon: <I.Channel /> },
  { id: 'tags',      label: 'Tags',      icon: <I.Tag /> },
  { id: 'rules',     label: 'Rules',     icon: <I.Shield /> },
  { id: 'appearance', label: 'Appearance', icon: <I.Grid /> },
  { id: 'system',    label: 'System',    icon: <I.Settings /> },
]

function SettingsTabBar({ activeTab, onTabChange }) {
  return (
    <div className="settings-tab-bar">
      {SETTINGS_TABS.map(tab => (
        <button
          key={tab.id}
          className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
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
      await apiFetch(`${API}/api/ytdlp/update`, { method: 'POST' })
    } catch {
      setUpdating(false)
    }
  }

  return (
    <div>
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">yt-dlp</div>
          {version && (
            <span className="settings-card-badge">{version}</span>
          )}
        </div>
        <div className="settings-card-body">
          <button className="btn" onClick={doUpdate} disabled={updating} style={{ width: '100%', justifyContent: 'center' }}>
            <I.Refresh />{updating ? 'Updating...' : 'Update yt-dlp'}
          </button>
          <div className="form-hint" style={{ marginTop: 8, textAlign: 'center' }}>
            Runs <code>pip install -U yt-dlp</code> inside the container
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Activity Log</div>
          <button
            onClick={() => { setLogs([]); sinceRef.current = 0 }}
            className="settings-card-action"
          >
            Clear
          </button>
        </div>
        <div className="settings-card-body">
          <div ref={logBoxRef} className="settings-log-box">
            {logs.length === 0
              ? <span style={{ color: 'var(--text-muted)' }}>No activity yet. Logs appear here as yt-dlp runs.</span>
              : logs.map(e => (
                <div key={e.i} className="settings-log-entry">
                  <span className="settings-log-time">{e.ts}</span>
                  <span className="settings-log-msg" style={{ color: LOG_COLORS[e.level] || 'var(--text-secondary)' }}>{e.msg}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

function PageDownloads({ settings, updS, checkNow, checking }) {
  const [notifStatus, setNotifStatus] = useState(null)
  const [notifTesting, setNotifTesting] = useState(false)
  const [oneOffUrl, setOneOffUrl] = useState('')
  const [oneOffStatus, setOneOffStatus] = useState('')
  const [oneOffBusy, setOneOffBusy] = useState(false)

  const submitOneOff = async () => {
    if (!oneOffUrl.trim() || oneOffBusy) return
    setOneOffBusy(true)
    setOneOffStatus('Queuing…')
    try {
      const r = await apiFetch(`${API}/api/downloads/oneoff`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: oneOffUrl }),
      })
      const d = await r.json()
      if (r.ok) {
        setOneOffStatus('Download queued!')
        setOneOffUrl('')
        setTimeout(() => setOneOffStatus(''), 3000)
      } else {
        setOneOffStatus(d.error || 'Error')
      }
    } catch {
      setOneOffStatus('Error')
    } finally {
      setOneOffBusy(false)
    }
  }

  const testNotifications = async () => {
    setNotifTesting(true)
    setNotifStatus(null)
    try {
      const r = await apiFetch(`${API}/api/notifications/test`, { method: 'POST' })
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
    <div className="settings-page">
      <div className="settings-grid-2">
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">Quick Actions</div>
          </div>
          <div className="settings-card-body">
            <button className="btn" onClick={checkNow} disabled={checking} style={{ width: '100%', justifyContent: 'center' }}>
              <I.Refresh />{checking ? 'Checking...' : 'Check Now'}
            </button>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">Download Video by URL</div>
          </div>
          <div className="settings-card-body">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={oneOffUrl}
                onChange={e => setOneOffUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitOneOff()}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-accent"
                onClick={submitOneOff}
                disabled={!oneOffUrl.trim() || oneOffBusy}
                style={{ flexShrink: 0 }}
              >
                <I.Download />{oneOffBusy ? '…' : 'Queue'}
              </button>
            </div>
            {oneOffStatus && (
              <div className="form-hint" style={{ marginTop: 8, color: oneOffStatus === 'Download queued!' ? 'var(--green)' : 'var(--accent)' }}>
                {oneOffStatus}
              </div>
            )}
            <div className="form-hint">Downloads a single video without subscribing to its channel.</div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Download Settings</div>
        </div>
        <div className="settings-card-body">
          <div className="form-group">
            <label className="form-label">Quality</label>
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
              <div className="form-warn">⚠ A low check interval may trigger YouTube's bot detection.</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Videos to Check Per Channel</label>
            <input
              className="form-input"
              type="number" min="1" max="200"
              value={settings.check_fetch_count || 100}
              onChange={e => updS({ check_fetch_count: parseInt(e.target.value) || 100 })}
            />
            <div className="form-hint">How many recent videos to check when scanning a channel. Higher values catch more but take longer.</div>
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
              <div className="form-warn">⚠ More than 3 simultaneous downloads may be detected as bot activity.</div>
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
            <div className="form-hint">Automatically delete downloaded videos after this many days.</div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Smart Retention</div>
        </div>
        <div className="settings-card-body">
          <div className="form-group">
            <label className="form-label">Auto-archive watched videos after (days, 0 = off)</label>
            <input className="form-input" type="number" min="0" max="365" value={settings.smart_retention_days || 0} onChange={e => updS({ smart_retention_days: Math.max(0, parseInt(e.target.value) || 0) })} />
            <div className="form-hint">Automatically move watched videos to rejected after this many days.</div>
          </div>
          {settings.smart_retention_days > 0 && (
            <div className="form-group">
              <div className="toggle-row">
                <span>Protect liked videos</span>
                <button className={`toggle ${settings.smart_retention_protect_liked !== false ? 'on' : ''}`} onClick={() => updS({ smart_retention_protect_liked: settings.smart_retention_protect_liked === false })}>
                  <div className="toggle-knob" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Notifications</div>
        </div>
        <div className="settings-card-body">
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
            <div className="form-hint">Sends a POST with JSON body on each download.</div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={testNotifications}
            disabled={notifTesting || (!settings.ntfy_url && !settings.webhook_url)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {notifTesting ? 'Sending…' : 'Test notification'}
          </button>
          {notifStatus && (
            <div className="form-hint" style={{ marginTop: 8, color: notifStatus.ok ? 'var(--green, #4caf50)' : 'var(--red, #f44336)' }}>
              {notifStatus.error || notifStatus.msg}
            </div>
          )}
        </div>
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
    <div className="settings-page">
      <div className="settings-grid-2">
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">Playback Settings</div>
          </div>
          <div className="settings-card-body">
            <div className="form-group">
              <div className="toggle-row">
                <span>Auto-play videos</span>
                <button className={`toggle ${settings.autoplay !== false ? 'on' : ''}`} onClick={() => updS({ autoplay: settings.autoplay === false })}>
                  <div className="toggle-knob" />
                </button>
              </div>
              <div className="form-hint">Automatically start playing when you open a video.</div>
            </div>

            <div className="form-group">
              <div className="toggle-row">
                <span>SponsorBlock</span>
                <button className={`toggle ${settings.sponsorblock_enabled ? 'on' : ''}`} onClick={() => updS({ sponsorblock_enabled: !settings.sponsorblock_enabled })}>
                  <div className="toggle-knob" />
                </button>
              </div>
              <div className="form-hint">Auto-skip sponsored segments using community data.</div>
              {settings.sponsorblock_enabled && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { id: 'sponsor',        label: 'Sponsor' },
                    { id: 'selfpromo',      label: 'Self-promo' },
                    { id: 'interaction',    label: 'Interaction' },
                    { id: 'intro',          label: 'Intro' },
                    { id: 'outro',          label: 'Outro' },
                    { id: 'music_offtopic', label: 'Non-music' },
                  ].map(cat => {
                    const cats = (settings.sponsorblock_categories || 'sponsor,selfpromo,interaction').split(',')
                    const on = cats.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          const next = on ? cats.filter(c => c !== cat.id) : [...cats, cat.id]
                          updS({ sponsorblock_categories: next.join(',') })
                        }}
                        className={`settings-chip ${on ? 'active' : ''}`}
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
              <div className="form-hint">The custom player adds sponsor markers and chapters to the seek bar.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Playlist Countdown (seconds, 0 = skip)</label>
              <input className="form-input" type="number" min="0" max="30" value={settings.playlist_countdown ?? 5} onChange={e => updS({ playlist_countdown: Math.max(0, Math.min(30, parseInt(e.target.value) || 0)) })} />
              <div className="form-hint">Countdown before the next video auto-plays in a playlist queue.</div>
            </div>

            <div className="form-group">
              <div className="toggle-row">
                <span><I.Shuffle /> DeArrow</span>
                <button className={`toggle ${settings.dearrow_enabled ? 'on' : ''}`} onClick={() => updS({ dearrow_enabled: !settings.dearrow_enabled })}>
                  <div className="toggle-knob" />
                </button>
              </div>
              <div className="form-hint">Replace clickbait titles and thumbnails with community alternatives.</div>
              {settings.dearrow_enabled && (
                <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.dearrow_titles !== false} onChange={e => updS({ dearrow_titles: e.target.checked })} />
                    Titles
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.dearrow_thumbnails === true} onChange={e => updS({ dearrow_thumbnails: e.target.checked })} />
                    Thumbnails
                  </label>
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="toggle-row">
                <span><I.Message /> Comments</span>
                <button className={`toggle ${settings.comments_enabled ? 'on' : ''}`} onClick={() => updS({ comments_enabled: !settings.comments_enabled })}>
                  <div className="toggle-knob" />
                </button>
              </div>
              <div className="form-hint">Show video stats and comments below the player.</div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">Watch Time</div>
          </div>
          <div className="settings-card-body">
            <div className="settings-stats-grid">
              {[
                { label: 'Today',      key: 'today' },
                { label: 'This week',  key: 'this_week' },
                { label: 'This month', key: 'this_month' },
                { label: 'All time',   key: 'all_time' },
              ].map(({ label, key }) => (
                <div key={key} className="settings-stat-card">
                  <div className="settings-stat-label">{label}</div>
                  <div className="settings-stat-value">{fmtWatchTime(watchStats?.[key])}</div>
                </div>
              ))}
            </div>
          </div>
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
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Channels ({channels.length})</div>
          <button className="btn btn-accent btn-sm" onClick={() => setShowAdd(true)}>
            <I.Plus /> Add
          </button>
        </div>
        <div className="settings-card-body settings-channel-list">
          {sortedChannels.map(ch => {
            const folderBytes = storage[safeFolderName(ch.name)]
            return (
              <div
                key={ch.id}
                className="settings-channel-item"
                style={{ opacity: ch.enabled === false ? .55 : 1 }}
              >
                <div
                  className="settings-channel-info"
                  onClick={() => openBrowse(ch)}
                >
                  <Av src={ch.thumbnail} name={ch.name} />
                  <div className="settings-channel-text">
                    <span className="settings-channel-name">{ch.name}</span>
                    <span className="settings-channel-meta">
                      {ch.enabled === false
                        ? 'Paused'
                        : ch.download_mode === 'latest' ? 'Latest only' : ch.max_days_old ? `Last ${daysLabel(ch.max_days_old)}` : 'All videos'
                      }
                      {folderBytes > 0 && ` · ${fmtBytes(folderBytes)}`}
                    </span>
                  </div>
                </div>
                <div className="settings-channel-actions">
                  {health[ch.id] && (
                    <span
                      className={`settings-health-badge ${health[ch.id].status}`}
                      title={health[ch.id].status === 'ok' ? health[ch.id].name : health[ch.id].error}
                    >
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

                {editCh === ch.id && (
                  <div className="settings-channel-edit">
                    <div className="form-group">
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
                    <div className="form-group">
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
                      <div className="form-group">
                        <label className="form-label">Max video age (days, 0 = no limit)</label>
                        <input
                          className="form-input"
                          type="number" min="0" max="9999"
                          value={ch.max_days_old || 0}
                          onChange={e => updCh(ch.id, { max_days_old: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                    <div className="form-group">
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
                    </div>
                    <div className="form-group">
                      <label className="form-label">Playback Speed</label>
                      <select
                        className="form-select"
                        value={ch.playback_speed || 1}
                        onChange={e => updCh(ch.id, { playback_speed: parseFloat(e.target.value) })}
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x (normal)</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={1.75}>1.75x</option>
                        <option value={2}>2x</option>
                      </select>
                      <div className="form-hint">Default playback speed for videos from this channel.</div>
                    </div>
                    <div className="form-group">
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
        </div>
      </div>
    </div>
  )
}

function PageSystem({ onRefresh }) {
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const [opmlImporting, setOpmlImporting] = useState(false)
  const [opmlMsg, setOpmlMsg] = useState('')

  const doImport = async e => {
    const file = e.target.files[0]; if (!file) return
    setImporting(true); setImportMsg('')
    const fd = new FormData(); fd.append('file', file)
    const r = await apiFetch(`${API}/api/import`, { method: 'POST', body: fd }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (r?.ok) {
      setImportMsg(`Imported ${d.imported_channels} channels, ${d.imported_watch_progress} watch entries`)
      onRefresh?.()
    } else {
      setImportMsg(d.error || 'Import failed')
    }
    setImporting(false)
    e.target.value = ''
  }

  const doOpmlImport = async e => {
    const file = e.target.files[0]; if (!file) return
    setOpmlImporting(true); setOpmlMsg('')
    const fd = new FormData(); fd.append('file', file)
    const r = await apiFetch(`${API}/api/import/opml`, { method: 'POST', body: fd }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (r?.ok) {
      setOpmlMsg(`Found ${d.total_found} channels: ${d.imported} imported, ${d.skipped} skipped (already exist)`)
      onRefresh?.()
    } else {
      setOpmlMsg(d.error || 'OPML import failed')
    }
    setOpmlImporting(false)
    e.target.value = ''
  }

  const [takeoutImporting, setTakeoutImporting] = useState(false)
  const [takeoutMsg, setTakeoutMsg] = useState('')

  const doTakeoutImport = async e => {
    const file = e.target.files[0]; if (!file) return
    setTakeoutImporting(true); setTakeoutMsg('')
    const fd = new FormData(); fd.append('file', file)
    const r = await apiFetch(`${API}/api/import/takeout`, { method: 'POST', body: fd }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (r?.ok) {
      setTakeoutMsg(`Found ${d.total_found} channels: ${d.imported} imported, ${d.skipped} skipped`)
      onRefresh?.()
    } else {
      setTakeoutMsg(d.error || 'Takeout import failed')
    }
    setTakeoutImporting(false)
    e.target.value = ''
  }

  return (
    <div className="settings-page">
      <div className="settings-grid-2">
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">Backup & Restore</div>
          </div>
          <div className="settings-card-body">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={`${API}/api/export`} download className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <I.Download /> Export
              </a>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                {importing ? 'Importing…' : <><I.Upload /> Import</>}
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={doImport} />
              </label>
            </div>
            {importMsg && <div className="form-hint" style={{ marginTop: 8, textAlign: 'center' }}>{importMsg}</div>}
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">OPML Import</div>
          </div>
          <div className="settings-card-body">
            <div className="form-hint" style={{ marginBottom: 12 }}>Import YouTube subscriptions from an OPML file (exported from Google Takeout or a subscription manager).</div>
            <label className="btn btn-primary" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
              {opmlImporting ? 'Importing…' : <><I.Upload /> Import OPML</>}
              <input type="file" accept=".opml,.xml" style={{ display: 'none' }} onChange={doOpmlImport} />
            </label>
            {opmlMsg && <div className="form-hint" style={{ marginTop: 8, textAlign: 'center' }}>{opmlMsg}</div>}
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">Google Takeout</div>
          </div>
          <div className="settings-card-body">
            <div className="form-hint" style={{ marginBottom: 12 }}>Import subscriptions from a Google Takeout HTML file (subscriptions.html).</div>
            <label className="btn btn-primary" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
              {takeoutImporting ? 'Importing…' : <><I.Upload /> Import Takeout</>}
              <input type="file" accept=".html,.htm" style={{ display: 'none' }} onChange={doTakeoutImport} />
            </label>
            {takeoutMsg && <div className="form-hint" style={{ marginTop: 8, textAlign: 'center' }}>{takeoutMsg}</div>}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <YtdlpPanel />
      </div>
    </div>
  )
}

function PageTags() {
  const [tags, setTags] = useState([])
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const fetchTags = () => fetch(`${API}/api/tags`).then(r => r.ok ? r.json() : []).then(setTags).catch(() => {})
  useEffect(() => { fetchTags() }, [])

  const createTag = async () => {
    if (!newName.trim()) return
    try {
      await apiFetch(`${API}/api/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, color: newColor }) })
      setNewName(''); fetchTags()
    } catch (e) { console.error('Failed to create tag:', e) }
  }

  const updateTag = async (id) => {
    try {
      await apiFetch(`${API}/api/tags/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName, color: editColor }) })
      setEditing(null); fetchTags()
    } catch (e) { console.error('Failed to update tag:', e) }
  }

  const deleteTag = async (id) => {
    if (!confirm('Delete this tag? Videos will keep their other tags.')) return
    try { await apiFetch(`${API}/api/tags/${id}`, { method: 'DELETE' }); fetchTags() } catch (e) { console.error('Failed to delete tag:', e) }
  }

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Tags</div>
          <div className="settings-card-subtitle">Organize videos and channels with colored tags</div>
        </div>
        <div className="settings-card-body">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input className="form-input" placeholder="Tag name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createTag()} style={{ flex: 1 }} />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: 36, height: 36, padding: 2, cursor: 'pointer' }} />
            <button className="btn btn-accent btn-sm" onClick={createTag}>Add</button>
          </div>
          {tags.length === 0 ? (
            <div className="empty-state"><div className="empty-icon"><I.Tag /></div><div>No tags yet</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tags.map(t => (
                <div key={t.id} className="settings-channel-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {editing === t.id ? (
                    <>
                      <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && updateTag(t.id)} />
                      <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={{ width: 32, height: 32, padding: 2, cursor: 'pointer' }} />
                      <button className="btn btn-sm" onClick={() => updateTag(t.id)}>Save</button>
                      <button className="btn btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{t.name}</span>
                      <span className="form-hint" style={{ margin: 0 }}>{t.video_count} videos</span>
                      <button className="btn-icon" onClick={() => { setEditing(t.id); setEditName(t.name); setEditColor(t.color) }}><I.Settings /></button>
                      <button className="btn-icon btn-danger" onClick={() => deleteTag(t.id)}><I.Trash /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PageRules() {
  const [rules, setRules] = useState([])
  const [tags, setTags] = useState([])
  const [form, setForm] = useState({ name: '', pattern: '', match_type: 'contains', field: 'title', action: 'tag', tag_id: '' })

  const fetchRules = () => fetch(`${API}/api/rules`).then(r => r.ok ? r.json() : []).then(setRules).catch(() => {})
  const fetchTags = () => fetch(`${API}/api/tags`).then(r => r.ok ? r.json() : []).then(setTags).catch(() => {})
  useEffect(() => { fetchRules(); fetchTags() }, [])

  const createRule = async () => {
    if (!form.pattern.trim()) return
    try {
      await apiFetch(`${API}/api/rules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tag_id: form.tag_id || null }) })
      setForm({ name: '', pattern: '', match_type: 'contains', field: 'title', action: 'tag', tag_id: '' }); fetchRules()
    } catch (e) { console.error('Failed to create rule:', e) }
  }

  const toggleRule = async (id, enabled) => {
    try { await apiFetch(`${API}/api/rules/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !enabled }) }); fetchRules() } catch (e) { console.error(e) }
  }

  const deleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return
    try { await apiFetch(`${API}/api/rules/${id}`, { method: 'DELETE' }); fetchRules() } catch (e) { console.error(e) }
  }

  const applyAll = async () => {
    if (!confirm('Apply all rules to your entire library? This may tag or reject videos.')) return
    try {
      const r = await apiFetch(`${API}/api/rules/apply`, { method: 'POST' })
      const d = await r.json()
      alert(`Done. ${d.affected || 0} videos affected.`)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Auto-Rules</div>
          <div className="settings-card-subtitle">Automatically tag, reject, or keep videos matching patterns</div>
        </div>
        <div className="settings-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input className="form-input" placeholder="Rule name (optional)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="form-input" placeholder="Pattern" value={form.pattern} onChange={e => setForm({ ...form, pattern: e.target.value })} />
            <select className="form-select" value={form.match_type} onChange={e => setForm({ ...form, match_type: e.target.value })}>
              <option value="contains">Contains</option>
              <option value="regex">Regex</option>
            </select>
            <select className="form-select" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })}>
              <option value="title">Title</option>
              <option value="description">Description</option>
              <option value="both">Both</option>
            </select>
            <select className="form-select" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
              <option value="tag">Add tag</option>
              <option value="reject">Reject (hide from feed)</option>
              <option value="keep">Keep (mark active)</option>
            </select>
            {form.action === 'tag' && (
              <select className="form-select" value={form.tag_id} onChange={e => setForm({ ...form, tag_id: e.target.value })}>
                <option value="">Select tag…</option>
                {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn btn-accent btn-sm" onClick={createRule}>Add Rule</button>
            <button className="btn btn-secondary btn-sm" onClick={applyAll}>Apply to Library</button>
          </div>
          {rules.length === 0 ? (
            <div className="empty-state"><div className="empty-icon"><I.Shield /></div><div>No rules yet</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rules.map(r => (
                <div key={r.id} className="settings-channel-item" style={{ opacity: r.enabled ? 1 : 0.5 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{r.name || r.pattern}</div>
                    <div className="form-hint" style={{ margin: 0 }}>
                      {r.match_type === 'regex' ? 'regex' : 'contains'} "{r.pattern}" in {r.field} → {r.action}{r.action === 'tag' && r.tag_id ? ` (${tags.find(t => t.id === r.tag_id)?.name || '?'})` : ''}
                    </div>
                  </div>
                  <button className="btn-icon" onClick={() => toggleRule(r.id, r.enabled)} title={r.enabled ? 'Disable' : 'Enable'}>
                    {r.enabled ? <I.Pause /> : <I.Play />}
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => deleteRule(r.id)}><I.Trash /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PageAppearance({ settings, updS }) {
  return (
    <div className="settings-page">
      <div className="settings-grid-2">
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">Display</div>
          </div>
          <div className="settings-card-body">
            <div className="form-group">
              <label className="form-label">Card Density</label>
              <select className="form-select" value={settings.card_density || 'comfortable'} onChange={e => updS({ card_density: e.target.value })}>
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
              <div className="form-hint">Controls the size and spacing of video cards in the feed.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Watched Videos</label>
              <select className="form-select" value={settings.watched_style || 'dim'} onChange={e => updS({ watched_style: e.target.value })}>
                <option value="dim">Dim (reduce opacity)</option>
                <option value="strikethrough">Strikethrough title</option>
                <option value="normal">Normal (no change)</option>
              </select>
              <div className="form-hint">How watched videos appear in the feed.</div>
            </div>
            <div className="form-group">
              <div className="toggle-row">
                <span>Incognito Mode</span>
                <button className={`toggle ${settings.incognito ? 'on' : ''}`} onClick={() => updS({ incognito: !settings.incognito })}>
                  <div className="toggle-knob" />
                </button>
              </div>
              <div className="form-hint">Stop tracking watch history and progress.</div>
            </div>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title">Feed</div>
          </div>
          <div className="settings-card-body">
            <div className="form-group">
              <label className="form-label">New Badge (days)</label>
              <input className="form-input" type="number" min="0" max="30" value={settings.new_badge_days ?? 2} onChange={e => updS({ new_badge_days: Math.max(0, parseInt(e.target.value) || 0) })} />
              <div className="form-hint">Show "NEW" badge on videos uploaded within this many days.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SettingsPanel({
  settings, channels, sortedChannels, updS, updCh, rmCh,
  openBrowse, setShowAdd, editCh, setEditCh, checkNow, checking,
  settingsPage, setSettingsPage, onRefresh,
}) {
  const [storage, setStorage] = useState({})
  useEffect(() => {
    fetch(`${API}/api/storage`).then(r => r.ok ? r.json() : {}).then(setStorage).catch(() => {})
  }, [])

  const renderPage = () => {
    switch (settingsPage) {
      case 'downloads':  return <PageDownloads settings={settings} updS={updS} checkNow={checkNow} checking={checking} />
      case 'playback':   return <PagePlayback  settings={settings} updS={updS} />
      case 'channels':   return <PageChannels  channels={channels} sortedChannels={sortedChannels} storage={storage} updCh={updCh} rmCh={rmCh} openBrowse={openBrowse} setShowAdd={setShowAdd} editCh={editCh} setEditCh={setEditCh} settings={settings} />
      case 'tags':       return <PageTags />
      case 'rules':      return <PageRules />
      case 'appearance': return <PageAppearance settings={settings} updS={updS} />
      case 'system':     return <PageSystem onRefresh={onRefresh} />
      default: return null
    }
  }

  return (
    <div className="settings-container">
      <SettingsTabBar activeTab={settingsPage} onTabChange={setSettingsPage} />
      {renderPage()}
    </div>
  )
}
