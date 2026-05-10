import { I } from '../icons'
import { Av } from './Avatar'

const SETTINGS_PAGES = [
  { id: 'downloads', label: 'Downloads', icon: <I.Download /> },
  { id: 'playback',  label: 'Playback',  icon: <I.Play /> },
  { id: 'channels',  label: 'Channels',  icon: <I.Channel /> },
  { id: 'system',    label: 'System',    icon: <I.Settings /> },
]

export function SidebarContent({
  view, chFilter, isMobileMenu, sidebarCollapsed, setSidebarCollapsed,
  sortedChannels, newCounts, navTo, setShowAdd, setMobileMenu, navRef,
  settingsPage, setSettingsPage, openOneOff,
}) {
  return (
    <>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon"><I.Play /></div>
          <span className="logo-text">
            <span className="logo-un">Un</span><span className="logo-tube">Tube</span>
          </span>
        </div>
        {!isMobileMenu && (
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <I.Expand /> : <I.Collapse />}
          </button>
        )}
        {isMobileMenu && (
          <button className="collapse-btn" onClick={() => setMobileMenu(false)}><I.X /></button>
        )}
      </div>

      <nav className="sidebar-nav" ref={navRef}>
        {view === 'settings' ? (
          <>
            <button className="nav-item" onClick={() => navTo('feed', null)}>
              <I.Back /><span className="channel-name">Back to Feed</span>
            </button>
            <div className="nav-section-title">Settings</div>
            {SETTINGS_PAGES.map(p => (
              <button
                key={p.id}
                className={`nav-item ${settingsPage === p.id ? 'active' : ''}`}
                onClick={() => setSettingsPage(p.id)}
              >
                {p.icon}<span className="channel-name">{p.label}</span>
              </button>
            ))}
          </>
        ) : (
          <>
            <button
              className={`nav-item ${view === 'feed' && !chFilter ? 'active' : ''}`}
              onClick={() => navTo('feed', null)}
            >
              <I.Home /><span className="channel-name">Feed</span>
            </button>
            <button
              className={`nav-item ${view === 'settings' ? 'active' : ''}`}
              onClick={() => navTo('settings', null)}
            >
              <I.Settings /><span className="channel-name">Settings</span>
            </button>
            <div className="nav-section-title">Channels</div>
            {sortedChannels.filter(c => c.id !== 'uncategorized').map(c => {
              const n = (newCounts && newCounts[c.id]) || 0
              return (
                <button
                  key={c.id}
                  className={`nav-item ${chFilter === c.id ? 'active' : ''}`}
                  onClick={() => navTo('feed', c.id)}
                  title={c.name}
                  style={c.enabled === false ? { opacity: .45 } : {}}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Av src={c.thumbnail} name={c.name} />
                    {n > 0 && sidebarCollapsed && <div className="unread-dot" />}
                  </div>
                  <span className="channel-name">{c.name}</span>
                  {n > 0 && !sidebarCollapsed && <span className="unread-badge">{n}</span>}
                </button>
              )
            })}
            <button className="nav-item" onClick={() => { setShowAdd(true); setMobileMenu(false) }}>
              <I.Plus /><span className="channel-name">Add Channel</span>
            </button>
            {sortedChannels.find(c => c.id === 'uncategorized') && (() => {
              const n = (newCounts && newCounts['uncategorized']) || 0
              return (
                <button
                  className={`nav-item ${chFilter === 'uncategorized' ? 'active' : ''}`}
                  onClick={() => navTo('feed', 'uncategorized')}
                  title="Uncategorized"
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Av src="" name="Uncategorized" />
                    {n > 0 && sidebarCollapsed && <div className="unread-dot" />}
                  </div>
                  <span className="channel-name">Uncategorized</span>
                  {n > 0 && !sidebarCollapsed && <span className="unread-badge">{n}</span>}
                </button>
              )
            })()}
            <button className="nav-item" onClick={openOneOff}>
              <I.Download /><span className="channel-name">Download URL</span>
            </button>
          </>
        )}
      </nav>
    </>
  )
}
