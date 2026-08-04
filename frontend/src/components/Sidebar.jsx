import { I } from '../icons'
import { Av } from './Avatar'
import { API } from '../utils'

function ChannelItem({ c, chFilter, newCounts, sidebarCollapsed, navTo, onClick }) {
  const n = (newCounts && newCounts[c.id]) || 0
  return (
    <button
      className={`sb-channel ${chFilter === c.id ? 'active' : ''}`}
      onClick={() => onClick(c.id)}
      title={c.name}
      style={c.enabled === false ? { opacity: 0.4 } : {}}
    >
      <div className="sb-channel-avatar">
        <Av src={c.thumbnail} name={c.name} size={32} active={chFilter === c.id} />
        {n > 0 && sidebarCollapsed && <div className="unread-dot" />}
      </div>
      {!sidebarCollapsed && (
        <>
          <span className="sb-channel-name">{c.name}</span>
          {n > 0 && <span className="sb-channel-badge">{n}</span>}
        </>
      )}
    </button>
  )
}

export function SidebarContent({
  view, chFilter, isMobileMenu, sidebarCollapsed, setSidebarCollapsed,
  sortedChannels, newCounts, navTo, setShowAdd, setMobileMenu, navRef,
  openOneOff, activePlaylist, playlists, onSelectPlaylist, onCreatePlaylist,
  rejectedCount, watchLaterCount,
}) {
  const isPlaylistView = view === 'playlist'

  return (
    <>
      {/* Logo header */}
      <div className="sb-header">
        <div className="sb-logo" onClick={() => navTo('feed', null)}>
          <div className="sb-logo-icon"><I.Play /></div>
          {!sidebarCollapsed && (
            <span className="sb-logo-text">
              <span className="sb-logo-un">Un</span><span className="sb-logo-tube">Tube</span>
            </span>
          )}
        </div>
        {!isMobileMenu && (
          <button className="sb-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <I.Expand /> : <I.Collapse />}
          </button>
        )}
        {isMobileMenu && (
          <button className="sb-collapse-btn" onClick={() => setMobileMenu(false)}><I.X /></button>
        )}
      </div>

      {/* Nav content */}
      <nav className="sb-nav" ref={navRef}>
        <>
            {/* Primary nav */}
            <div className="sb-section">Menu</div>
            <button
              className={`sb-nav-item ${view === 'feed' && !chFilter && !isPlaylistView ? 'active' : ''}`}
              onClick={() => navTo('feed', null)}
            >
              <I.Home /><span className="sb-nav-label">Feed</span>
            </button>
            <button
              className={`sb-nav-item ${view === 'watch-later' ? 'active' : ''}`}
              onClick={() => navTo('watch-later', null)}
            >
              <I.Clock /><span className="sb-nav-label">Watch Later</span>
              {!sidebarCollapsed && watchLaterCount > 0 && <span className="sb-nav-badge">{watchLaterCount}</span>}
            </button>
            <button
              className={`sb-nav-item ${view === 'rejected' ? 'active' : ''}`}
              onClick={() => navTo('rejected', null)}
            >
              <I.Archive /><span className="sb-nav-label">Rejected</span>
              {!sidebarCollapsed && rejectedCount > 0 && <span className="sb-nav-badge">{rejectedCount}</span>}
            </button>
            <button
              className={`sb-nav-item ${view === 'settings' ? 'active' : ''}`}
              onClick={() => navTo('settings', null)}
            >
              <I.Settings /><span className="sb-nav-label">Settings</span>
            </button>

            {/* Playlists */}
            <div className="sb-section">
              <span>Playlists</span>
              {!sidebarCollapsed && (
                <button
                  className="sb-section-action"
                  onClick={onCreatePlaylist}
                  title="Create playlist"
                >
                  <I.Plus />
                </button>
              )}
            </div>
            {playlists && playlists.map(pl => (
              <button
                key={pl.id}
                className={`sb-nav-item ${activePlaylist === pl.id ? 'active' : ''}`}
                onClick={() => onSelectPlaylist(pl.id)}
              >
                <I.Playlist /><span className="sb-nav-label">{pl.name}</span>
                {!sidebarCollapsed && pl.video_count > 0 && (
                  <span className="sb-nav-badge">{pl.video_count}</span>
                )}
              </button>
            ))}
            {playlists && playlists.length === 0 && !sidebarCollapsed && (
              <div className="sb-empty">No playlists yet</div>
            )}

            {/* Channels */}
            <div className="sb-section">Channels</div>
            {sortedChannels.filter(c => c.id !== 'uncategorized').map(c => (
              <ChannelItem
                key={c.id}
                c={c}
                chFilter={chFilter}
                newCounts={newCounts}
                sidebarCollapsed={sidebarCollapsed}
                navTo={navTo}
                onClick={id => navTo('feed', id)}
              />
            ))}
            {sortedChannels.find(c => c.id === 'uncategorized') && (
              <ChannelItem
                c={sortedChannels.find(c => c.id === 'uncategorized')}
                chFilter={chFilter}
                newCounts={newCounts}
                sidebarCollapsed={sidebarCollapsed}
                navTo={navTo}
                onClick={id => navTo('feed', id)}
              />
            )}
          </>
      </nav>

      {/* Footer actions */}
      <div className="sb-footer">
        <div className="sb-footer-divider" />
        <button className="sb-footer-item" onClick={() => { setShowAdd(true); setMobileMenu(false) }}>
          <I.Plus /><span className="sb-nav-label">Add Channel</span>
        </button>
        <button className="sb-footer-item" onClick={openOneOff}>
          <I.Link /><span className="sb-nav-label">Download URL</span>
        </button>
      </div>
    </>
  )
}
