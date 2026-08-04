import { useState, useRef, useEffect, memo } from 'react'
import { thumbUrl, fmtDur, fmtViews, timeAgo, pct as pctFn, isWatched as isWatchedFn } from '../utils'
import { I } from '../icons'

function isNew(v, seenVids, days) {
  if (!days) return false
  if (seenVids && seenVids.has(v.id)) return false
  if (!v.downloaded_at) return false
  return (Date.now() - new Date(v.downloaded_at).getTime()) < days * 86400000
}

export const VideoCard = memo(function VideoCard({ v, wp, seenVids, newBadgeDays = 2, onWatch, onDelete, onRedownload, onMarkWatched, onHide, onAddToPlaylist, onArchive, onRestore, onWatchLater, dearrow, cwSelect, cwClickPlay, cwSelected, onCwToggle }) {
  const p = pctFn(v, wp)
  const watched = isWatchedFn(v, wp)
  const newVideo = !watched && isNew(v, seenVids, newBadgeDays)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  if (v.ghost) return (
    <div className="video-card ghost">
      <div className="video-card-thumb">
        {v.thumbnail && <img src={thumbUrl(v.thumbnail)} alt="" loading="lazy" />}
        <div className="ghost-overlay">
          <button className="ghost-redownload" onClick={e => { e.stopPropagation(); onRedownload(v) }}>
            <I.Download /> Re-download
          </button>
        </div>
      </div>
      <div className="video-card-info">
        <div className="video-card-title" style={{ opacity: 0.5 }}>{v.title}</div>
        <div className="video-card-meta">
          <span className="video-card-channel">{v.channel_name}</span>
          <span className="dot">·</span>
          <span>Deleted</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`video-card${watched ? ' watched-card' : ''}${cwSelected ? ' cw-selected' : ''}`} onClick={() => (cwSelect && !cwClickPlay) ? onCwToggle?.() : onWatch(v)}>
      <div className="video-card-actions">
        {cwSelect ? (
          <button
            className={`video-card-action cw-check${cwSelected ? ' selected' : ''}`}
            title={cwSelected ? 'Deselect' : 'Select'}
            onClick={e => { e.stopPropagation(); onCwToggle?.() }}
          >
            {cwSelected && <I.Check />}
          </button>
        ) : (
          <div className="video-card-menu" ref={menuRef}>
            <button
              className="video-card-action"
              title="More options"
              onClick={e => { e.stopPropagation(); setMenuOpen(m => !m) }}
            >
              <I.MoreVert />
            </button>
            {menuOpen && (
              <div className="video-card-dropdown">
                {onAddToPlaylist && (
                  <button
                    className="video-card-dropdown-item"
                    onClick={e => { e.stopPropagation(); onAddToPlaylist(v); setMenuOpen(false) }}
                  >
                    <I.Playlist /> Add to playlist
                  </button>
                )}
                {onWatchLater && (
                  <button
                    className="video-card-dropdown-item"
                    onClick={e => { e.stopPropagation(); onWatchLater(v); setMenuOpen(false) }}
                  >
                    <I.Clock /> Watch later
                  </button>
                )}
                {onMarkWatched && (
                  <button
                    className="video-card-dropdown-item"
                    onClick={e => { e.stopPropagation(); onMarkWatched(v); setMenuOpen(false) }}
                  >
                    <I.Check /> {watched ? 'Mark as unwatched' : 'Mark as watched'}
                  </button>
                )}
                {onArchive && (
                  <button
                    className="video-card-dropdown-item"
                    onClick={e => { e.stopPropagation(); onArchive(v); setMenuOpen(false) }}
                  >
                    <I.Archive /> Reject
                  </button>
                )}
                {onRestore && (
                  <button
                    className="video-card-dropdown-item"
                    onClick={e => { e.stopPropagation(); onRestore(v); setMenuOpen(false) }}
                  >
                    <I.Restore /> Restore to feed
                  </button>
                )}
                <button
                  className="video-card-dropdown-item danger"
                  onClick={e => { onDelete(e, v.id); setMenuOpen(false) }}
                >
                  <I.Trash /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="video-card-thumb">
        {dearrow?.thumbnail || v.thumbnail ? <img src={thumbUrl(dearrow?.thumbnail || v.thumbnail)} alt="" loading="lazy" /> : null}
        {v.duration > 0 && <div className="video-card-duration">{fmtDur(v.duration)}</div>}
        {newVideo && <div className="new-badge">NEW</div>}
        {watched && <div className="watched-badge">&#10003;</div>}
        {p > 0 && !watched && <div className="watch-progress-bar" style={{ width: `${p}%` }} />}
      </div>
      <div className="video-card-info">
        <div className={`video-card-title${watched ? ' watched' : ''}`}>{dearrow?.title || v.title}</div>
        <div className="video-card-meta">
          <span className="video-card-channel">{v.channel_name}</span>
          <span className="dot">·</span>
          <span>{fmtViews(v.view_count)}</span>
          <span className="dot">·</span>
          <span>{timeAgo(v.upload_date || v.downloaded_at)}</span>
        </div>
      </div>
    </div>
  )
})
