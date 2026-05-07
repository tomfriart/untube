import { I } from '../icons'
import { daysLabel } from '../utils'

export function AddChannelModal({
  onClose, addUrl, setAddUrl, addMode, setAddMode,
  addMaxDays, setAddMaxDays, addErr, addLoading, onAdd,
}) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-title">
          Add Channel
          <button className="btn-icon" onClick={onClose}><I.X /></button>
        </div>

        <div className="form-group">
          <label className="form-label">Channel URL</label>
          <input
            className="form-input"
            placeholder="https://www.youtube.com/@channelname"
            value={addUrl}
            onChange={e => setAddUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAdd()}
          />
          <div className="form-hint">Paste a YouTube channel URL or @handle</div>
          {addErr && <div style={{ color: 'var(--accent)', fontSize: 13, marginTop: 6 }}>{addErr}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Download Mode</label>
          <select className="form-select" value={addMode} onChange={e => setAddMode(e.target.value)}>
            <option value="latest">Latest video only</option>
            <option value="all">All videos (with optional age limit)</option>
          </select>
        </div>

        {addMode === 'all' && (
          <div className="form-group">
            <label className="form-label">Max video age (days, 0 = no limit)</label>
            <input
              className="form-input"
              type="number" min="0" max="9999"
              placeholder="e.g. 30"
              value={addMaxDays || ''}
              onChange={e => setAddMaxDays(parseInt(e.target.value) || 0)}
            />
            <div className="form-hint">
              Download videos from the last {daysLabel(addMaxDays || 0).toLowerCase()}.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={onAdd} disabled={addLoading}>
            {addLoading ? 'Adding...' : 'Add Channel'}
          </button>
        </div>
      </div>
    </div>
  )
}
