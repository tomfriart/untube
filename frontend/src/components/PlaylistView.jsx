import { useState, useEffect, useCallback, useRef } from 'react'
import { I } from '../icons'
import { API, thumbUrl, fmtDur, fmtViews, timeAgo, apiFetch } from '../utils'
import { VideoCard } from './VideoCard'

export function PlaylistView({ playlistId, onWatch, onDelete, wp, seenVids, newBadgeDays, onRedownload, onMarkWatched, onHide, onBack, onAddToPlaylist, onRefresh, onPlayAll }) {
  const [playlist, setPlaylist] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [showAddVideos, setShowAddVideos] = useState(false)

  const fetchPlaylist = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/playlists/${playlistId}/videos`)
      if (r.ok) {
        const d = await r.json()
        setPlaylist(d.playlist)
        setVideos(d.videos)
        setEditName(d.playlist.name)
        setEditDesc(d.playlist.description || '')
      }
    } catch (e) {
      console.error('Failed to fetch playlist:', e)
    } finally {
      setLoading(false)
    }
  }, [playlistId])

  useEffect(() => { fetchPlaylist() }, [fetchPlaylist])

  const saveEdits = async () => {
    if (!editName.trim()) return
    try {
      await apiFetch(`${API}/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      })
      setEditing(false)
      fetchPlaylist()
      onRefresh?.()
    } catch (e) {
      console.error('Failed to update playlist:', e)
    }
  }

  const deletePlaylist = async () => {
    if (!confirm('Delete this playlist?')) return
    try {
      await apiFetch(`${API}/api/playlists/${playlistId}`, { method: 'DELETE' })
      onRefresh?.()
      onBack()
    } catch (e) {
      console.error('Failed to delete playlist:', e)
    }
  }

  const removeFromPlaylist = async (videoId) => {
    if (!confirm('Remove this video from the playlist?')) return
    try {
      await apiFetch(`${API}/api/playlists/${playlistId}/videos/${videoId}`, { method: 'DELETE' })
      setVideos(prev => prev.filter(v => v.id !== videoId))
      onRefresh?.()
    } catch (e) {
      console.error('Failed to remove video:', e)
    }
  }

  const moveVideo = async (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= videos.length) return
    const newVids = [...videos]
    const [moved] = newVids.splice(fromIdx, 1)
    newVids.splice(toIdx, 0, moved)
    setVideos(newVids)
    try {
      await apiFetch(`${API}/api/playlists/${playlistId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newVids.map(v => v.id) }),
      })
    } catch (e) {
      console.error('Failed to reorder:', e)
      fetchPlaylist()
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><I.Alert /></div>
        <div className="empty-title">Playlist not found</div>
        <button className="btn" onClick={onBack}>Go back</button>
      </div>
    )
  }

  return (
    <div className="playlist-view">
      <div className="pv-header">
        <button className="btn-icon" onClick={onBack}><I.Back /></button>
        {editing ? (
          <div className="playlist-edit-form">
            <input
              className="form-input"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Playlist name"
              autoFocus
            />
            <input
              className="form-input"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-accent btn-sm" onClick={saveEdits}>Save</button>
              <button className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="playlist-title-area">
            <h2 className="pv-title">{playlist.name}</h2>
            {playlist.description && <p className="playlist-desc">{playlist.description}</p>}
            <span className="playlist-count">{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {!editing && (
          <div className="playlist-actions">
            {videos.length > 0 && (
              <button className="btn btn-accent btn-sm" onClick={() => onPlayAll(videos)}><I.Play /> Play All</button>
            )}
            <button className="btn btn-sm" onClick={() => setShowAddVideos(true)}><I.Plus /> Add Videos</button>
            <button className="btn-icon" onClick={() => setEditing(true)}><I.Settings /></button>
            <button className="btn-icon btn-danger" onClick={deletePlaylist}><I.Trash /></button>
          </div>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div className="empty-icon"><I.Playlist /></div>
          <div className="empty-title">No videos yet</div>
          <div className="empty-text">Add videos from the feed using the playlist button, or click "Add Videos" above.</div>
          <button className="btn btn-accent" style={{ marginTop: 16 }} onClick={() => setShowAddVideos(true)}><I.Plus /> Add Videos</button>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v, idx) => (
            <div key={v.id} className="playlist-video-item">
              <VideoCard
                v={v}
                wp={wp}
                seenVids={seenVids}
                newBadgeDays={newBadgeDays}
                onWatch={() => onWatch(videos, idx)}
                onDelete={onDelete}
                onRedownload={onRedownload}
                onMarkWatched={onMarkWatched}
                onHide={onHide}
                onAddToPlaylist={onAddToPlaylist}
              />
              <button
                className="playlist-remove-btn"
                onClick={() => removeFromPlaylist(v.id)}
                title="Remove from playlist"
              >
                <I.X />
              </button>
              <div className="playlist-reorder-btns">
                {idx > 0 && <button className="playlist-reorder-btn" onClick={() => moveVideo(idx, idx - 1)} title="Move up">▲</button>}
                {idx < videos.length - 1 && <button className="playlist-reorder-btn" onClick={() => moveVideo(idx, idx + 1)} title="Move down">▼</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddVideos && (
        <AddVideosModal
          playlistId={playlistId}
          existingIds={new Set(videos.map(v => v.id))}
          onClose={() => { setShowAddVideos(false); fetchPlaylist(); onRefresh?.() }}
        />
      )}
    </div>
  )
}

function AddVideosModal({ playlistId, existingIds, onClose }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState({})
  const [searchQ, setSearchQ] = useState('')
  const [added, setAdded] = useState(new Set())
  const searchTimer = useRef(null)

  const doSearch = useCallback((q) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return }
      setLoading(true)
      try {
        const r = await fetch(`${API}/api/videos?page=1&per_page=50&q=${encodeURIComponent(q)}`)
        const d = r.ok ? await r.json() : { videos: [] }
        setResults(d.videos || [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
  }, [])

  const addVideo = async (vid) => {
    setAdding(prev => ({ ...prev, [vid]: true }))
    try {
      await apiFetch(`${API}/api/playlists/${playlistId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_ids: [vid] }),
      })
      setAdded(prev => new Set([...prev, vid]))
    } catch (e) {
      console.error('Failed to add video:', e)
    } finally {
      setAdding(prev => ({ ...prev, [vid]: false }))
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal playlist-modal" style={{ maxWidth: 480 }}>
        <div className="modal-title">
          Add Videos
          <button className="btn-icon" onClick={onClose}><I.X /></button>
        </div>

        <div style={{ padding: '0 20px 12px' }}>
          <input
            className="form-input"
            placeholder="Search videos..."
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); doSearch(e.target.value) }}
            autoFocus
          />
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <div className="playlist-modal-list" style={{ maxHeight: 320 }}>
            {searchQ && results.length === 0 && !loading && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No matches
              </div>
            )}
            {!searchQ && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Type to search your library
              </div>
            )}
            {results.map(v => {
              const inPlaylist = existingIds.has(v.id) || added.has(v.id)
              return (
                <button
                  key={v.id}
                  className="playlist-modal-item"
                  onClick={() => !inPlaylist && addVideo(v.id)}
                  disabled={inPlaylist || adding[v.id]}
                  style={inPlaylist ? { opacity: 0.4 } : {}}
                >
                  <I.Playlist />
                  <span className="playlist-modal-name">{v.title || v.id}</span>
                  {inPlaylist
                    ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>In playlist</span>
                    : adding[v.id] && <div className="spinner" style={{ width: 16, height: 16 }} />
                  }
                </button>
              )
            })}
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
          <button className="btn btn-accent" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

export function PlaylistModal({ videoId, videoTitle, onClose, onCreated }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState({})

  useEffect(() => {
    fetch(`${API}/api/playlists`)
      .then(r => r.ok ? r.json() : [])
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const addToPlaylist = async (plId) => {
    setAdding(prev => ({ ...prev, [plId]: true }))
    try {
      await apiFetch(`${API}/api/playlists/${plId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_ids: [videoId] }),
      })
      onCreated?.()
      onClose()
    } catch (e) {
      console.error('Failed to add to playlist:', e)
    } finally {
      setAdding(prev => ({ ...prev, [plId]: false }))
    }
  }

  const createAndAdd = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const r = await apiFetch(`${API}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      })
      if (r.ok) {
        const pl = await r.json()
        await apiFetch(`${API}/api/playlists/${pl.id}/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_ids: [videoId] }),
        })
        onCreated?.()
        onClose()
      }
    } catch (e) {
      console.error('Failed to create playlist:', e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal playlist-modal">
        <div className="modal-title">
          Add to playlist
          <button className="btn-icon" onClick={onClose}><I.X /></button>
        </div>
        <div className="playlist-modal-subtitle">{videoTitle}</div>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <div className="playlist-modal-list">
            {playlists.map(pl => (
              <button
                key={pl.id}
                className="playlist-modal-item"
                onClick={() => addToPlaylist(pl.id)}
                disabled={adding[pl.id]}
              >
                <I.Playlist />
                <span className="playlist-modal-name">{pl.name}</span>
                <span className="playlist-modal-count">{pl.video_count}</span>
                {adding[pl.id] && <div className="spinner" style={{ width: 16, height: 16 }} />}
              </button>
            ))}
          </div>
        )}

        <div className="playlist-modal-create">
          <input
            className="form-input"
            placeholder="New playlist name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createAndAdd()}
          />
          <input
            className="form-input"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <button
            className="btn btn-accent"
            onClick={createAndAdd}
            disabled={!newName.trim() || creating}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {creating ? 'Creating...' : 'Create & Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
