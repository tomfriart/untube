import { thumbUrl, fmtDur } from '../utils'
import { I } from '../icons'

export function BrowseView({
  browseLoading, browseVids, browseSelected, toggleBrowseSelect,
}) {
  if (browseLoading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
      <div className="dl-spinner" style={{ width: 24, height: 24, borderWidth: 3, marginBottom: 12 }} />
      Loading...
    </div>
  )

  if (browseVids.length === 0) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No videos found</div>
  )

  const downloaded = browseVids.filter(v => v.status === 'downloaded').length
  const available = browseVids.filter(v => v.status === 'available').length

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
        {downloaded} downloaded · {available} available · {browseSelected.size} selected
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
