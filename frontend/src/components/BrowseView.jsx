import { thumbUrl, fmtDur } from '../utils'
import { I } from '../icons'

export function BrowseView({
  browseLoading, browseVids, browseSelected, toggleBrowseSelect,
}) {
  if (browseLoading) return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
      <div className="dl-spinner" style={{ width: 28, height: 28, borderWidth: 3, marginBottom: 14 }} />
      <div style={{ fontSize: 13 }}>Loading channel videos...</div>
    </div>
  )

  if (browseVids.length === 0) return (
    <div className="empty-state" style={{ padding: 60 }}>
      <div className="empty-icon"><I.Channel /></div>
      <div className="empty-title">No videos found</div>
      <div className="empty-text">This channel doesn't have any public videos.</div>
    </div>
  )

  const downloaded = browseVids.filter(v => v.status === 'downloaded').length
  const available = browseVids.filter(v => v.status === 'available').length

  return (
    <div>
      <div style={{ marginBottom: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>{downloaded}</span> downloaded
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span>{available}</span> available
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{browseSelected.size}</span> selected
      </div>
      {browseVids.map(v => (
        <div key={v.id} className="browse-item">
          <button
            className={`browse-check ${v.status === 'downloaded' ? 'downloaded' : browseSelected.has(v.id) ? 'checked' : ''}`}
            onClick={() => toggleBrowseSelect(v.id, v.status)}
          >
            {(v.status === 'downloaded' || browseSelected.has(v.id)) && <I.Check />}
          </button>
          <div className="browse-thumb">
            {v.thumbnail && <img src={thumbUrl(v.thumbnail)} alt="" loading="lazy" />}
          </div>
          <div className="browse-info">
            <div className="browse-title">{v.title}</div>
            <div className="browse-meta">{v.duration ? fmtDur(v.duration) : ''}</div>
          </div>
          {v.status !== 'available' && (
            <span className={`browse-status ${v.status}`}>
              {v.status === 'downloaded' ? 'Downloaded'
                : v.status === 'deleted' ? 'Deleted'
                : v.status === 'downloading' ? 'Downloading' : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
