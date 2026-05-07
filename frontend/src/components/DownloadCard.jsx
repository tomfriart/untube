import { thumbUrl, fmtDur } from '../utils'
import { I } from '../icons'

export function DownloadCard({ dl, onCancel }) {
  return (
    <div className="video-card video-card-downloading">
      <div className="video-card-thumb">
        {dl.thumbnail && <img src={thumbUrl(dl.thumbnail)} alt="" loading="lazy" />}
        <div className="download-overlay">
          <div className="download-progress-bar">
            <div className="download-progress-fill" style={{ width: `${dl.progress || 0}%` }} />
          </div>
          <div className="download-progress-info">
            {dl.status === 'queued' && 'Queued...'}
            {dl.status === 'starting' && 'Starting...'}
            {dl.status === 'cancelling' && 'Cancelling...'}
            {dl.status === 'checking' && 'Checking...'}
            {dl.status === 'downloading' && (
              <>{Math.round(dl.progress || 0)}%{dl.speed > 0 && ` · ${(dl.speed / 1024 / 1024).toFixed(1)} MB/s`}</>
            )}
            {dl.status === 'processing' && 'Processing...'}
          </div>
        </div>
        {dl.duration > 0 && <div className="video-card-duration">{fmtDur(dl.duration)}</div>}
      </div>
      <div className="video-card-info">
        <div className="video-card-title">{dl.title}</div>
        <div className="video-card-meta">
          <span className="video-card-channel">{dl.channel_name}</span>
          <span className="dot">·</span>
          <span className="downloading-badge">
            {dl.status === 'cancelling' ? 'Cancelling' : (
              <><span className="dl-spinner" />{dl.status === 'queued' ? 'Queued' : dl.status === 'checking' ? 'Checking' : 'Downloading'}</>
            )}
          </span>
          {dl.status !== 'cancelling' && (
            <button className="btn-cancel-dl" onClick={() => onCancel(dl.id)}><I.X /></button>
          )}
        </div>
      </div>
    </div>
  )
}
