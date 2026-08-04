const css = `
/* ═══════════════════════════════════════════
   UnTube — Modern Dark Theme
   ═══════════════════════════════════════════ */

:root {
  --bg-primary: #0c0c10;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a24;
  --bg-card: #14141e;
  --bg-hover: #1e1e2a;
  --bg-active: #262636;
  --border: #2a2a3a;
  --border-subtle: #1e1e2c;
  --text-primary: #eeeef2;
  --text-secondary: #9494a8;
  --text-muted: #5a5a72;
  --accent: #e0354a;
  --accent-hover: #f04055;
  --accent-glow: rgba(224, 53, 74, 0.12);
  --accent-subtle: rgba(224, 53, 74, 0.08);
  --green: #34d399;
  --green-subtle: rgba(52, 211, 153, 0.1);
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Space Mono', ui-monospace, monospace;
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --shadow-card: 0 2px 16px rgba(0, 0, 0, 0.35);
  --shadow-float: 0 12px 40px rgba(0, 0, 0, 0.55);
  --tr: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --sidebar-w: 250px;
}

* { margin: 0; padding: 0; box-sizing: border-box }
html, body, #root { height: 100% }
body {
  font-family: var(--font-body);
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none
}

::-webkit-scrollbar { width: 5px }
::-webkit-scrollbar-track { background: transparent }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted) }

/* ── Layout ─────────────────────────────── */

.app { display: flex; height: 100vh; overflow: hidden }

/* ── Sidebar ────────────────────────────── */

.logo-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: linear-gradient(135deg, var(--accent), #c02d3e);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 10px rgba(224, 53, 74, 0.3)
}

.sidebar {
  width: var(--sidebar-w);
  min-width: var(--sidebar-w);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)
}

/* Logo header */
.sb-header {
  padding: 16px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between
}
.sb-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  margin: -4px -6px;
  transition: var(--tr)
}
.sb-logo:hover { background: var(--bg-hover) }
.sb-logo-icon {
  width: 34px;
  height: 34px;
  min-width: 34px;
  background: linear-gradient(135deg, var(--accent), #c02d3e);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 10px rgba(224, 53, 74, 0.3)
}
.sb-logo-text {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 21px;
  line-height: 1;
  transition: opacity 0.2s
}
.sb-logo-un { color: var(--text-primary) }
.sb-logo-tube {
  color: var(--accent);
  border-bottom: 2.5px solid var(--accent);
  padding-bottom: 1px
}
.sb-collapse-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: var(--tr)
}
.sb-collapse-btn:hover { color: var(--text-primary); background: var(--bg-hover) }

/* Nav */
.sb-nav {
  padding: 4px 10px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden
}
.sb-nav::-webkit-scrollbar { width: 3px }
.sb-nav::-webkit-scrollbar-thumb { background: transparent; border-radius: 2px }
.sb-nav:hover::-webkit-scrollbar-thumb { background: var(--border) }

/* Section title */
.sb-section {
  padding: 18px 14px 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.6px;
  color: var(--text-muted);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between
}

/* Nav items */
.sb-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--tr);
  color: var(--text-secondary);
  font-size: 13.5px;
  font-weight: 500;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden
}
.sb-nav-item:hover { background: var(--bg-hover); color: var(--text-primary) }
.sb-nav-item.active {
  background: var(--accent-subtle);
  color: var(--accent);
  font-weight: 600
}
.sb-nav-label { transition: opacity 0.2s; flex: 1; overflow: hidden; text-overflow: ellipsis }

/* Channel items */
.sb-channel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--tr);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 400;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden
}
.sb-channel:hover { background: var(--bg-hover); color: var(--text-primary) }
.sb-channel.active { color: var(--text-primary); font-weight: 500 }
.sb-channel-avatar { position: relative; flex-shrink: 0 }
.sb-channel-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap
}
.sb-channel-badge {
  margin-left: auto;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
  flex-shrink: 0;
  line-height: 16px
}

/* Footer actions */
.sb-footer {
  padding: 0 10px 14px
}
.sb-footer-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 6px 4px 10px
}
.sb-footer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--tr);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden
}
.sb-footer-item:hover { background: var(--bg-hover); color: var(--text-secondary) }

/* Collapsed sidebar */
.sidebar.collapsed { --sidebar-w: 64px; width: 64px; min-width: 64px }
.sidebar.collapsed .sb-logo-text { opacity: 0; width: 0; overflow: hidden }
.sidebar.collapsed .sb-section { opacity: 0; width: 0; overflow: hidden; height: 0; padding: 0 }
.sidebar.collapsed .sb-nav-label { opacity: 0; width: 0; overflow: hidden; height: 0; padding: 0 }
.sidebar.collapsed .sb-nav-item { justify-content: center; padding: 10px 8px; gap: 0 }
.sidebar.collapsed .sb-nav-item .sb-nav-label { display: none }
.sidebar.collapsed .sb-channel { justify-content: center; padding: 8px }
.sidebar.collapsed .sb-channel .sb-channel-name,
.sidebar.collapsed .sb-channel .sb-channel-badge { display: none }
.sidebar.collapsed .sb-header { flex-direction: column; align-items: center; justify-content: center; padding: 12px 8px; gap: 8px }
.sidebar.collapsed .sb-logo { gap: 0; justify-content: center; padding: 4px; margin: 0 }
.sidebar.collapsed .sb-footer-item .sb-nav-label { opacity: 0; width: 0 }
.sidebar.collapsed .sb-footer-item { justify-content: center; padding: 10px; width: auto }
.sidebar.collapsed .sb-nav { padding: 8px 6px }
.sidebar.collapsed .sb-footer { padding: 0 6px 14px; display: flex; flex-direction: column; align-items: center }
.sidebar.collapsed .sb-footer-divider { margin: 6px 2px 10px }

/* ── Main ───────────────────────────────── */

.main { flex: 1; display: flex; flex-direction: column; overflow: hidden }

.topbar-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden
}
.topbar-title-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }

.topbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap
}

.topbar-settings-select {
  background: transparent;
  border: none;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  -webkit-appearance: auto;
  appearance: auto;
  max-width: 160px
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  overscroll-behavior-y: contain
}

/* ── Buttons ────────────────────────────── */

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--tr);
  font-family: var(--font-body);
  white-space: nowrap
}
.btn:hover { background: var(--bg-hover); border-color: var(--text-muted) }
.btn-accent {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 2px 10px rgba(224, 53, 74, 0.25)
}
.btn-accent:hover { background: var(--accent-hover); box-shadow: 0 4px 16px rgba(224, 53, 74, 0.35) }
.btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff
}
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover) }
.btn-secondary {
  background: var(--bg-secondary);
  border-color: var(--border);
  color: var(--text-primary)
}
.btn-secondary:hover { background: var(--bg-hover); border-color: var(--text-muted) }
.btn-sm { padding: 5px 12px; font-size: 12px }

.btn-icon {
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--tr);
  display: flex;
  align-items: center;
  justify-content: center
}
.btn-icon:hover { background: var(--bg-hover); color: var(--text-primary) }
.btn-danger { color: var(--accent) }
.btn-danger:hover { background: var(--accent-subtle) }
.btn-ghost { border: none; background: none }

/* ── Video Grid ─────────────────────────── */

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 22px
}

/* ── Video Card ─────────────────────────── */

.video-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s, box-shadow 0.25s;
  border: 1px solid var(--border-subtle);
  position: relative
}
.video-card:hover {
  transform: translateY(-3px);
  border-color: var(--border);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4)
}

.video-card-thumb {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: var(--bg-tertiary);
  overflow: hidden;
  border-radius: var(--radius) var(--radius) 0 0
}
.video-card-thumb img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)
}
.video-card:hover .video-card-thumb img { transform: scale(1.06) }

.video-card-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 5px;
  font-family: var(--font-mono);
  backdrop-filter: blur(4px)
}

.video-card-info { padding: 14px 16px 16px }
.video-card-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px
}

.video-card-meta {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap
}
.video-card-channel { font-weight: 500; color: var(--text-muted) }
.video-card-meta .dot { color: var(--text-muted) }

.video-card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: var(--tr)
}
.video-card:hover .video-card-actions { opacity: 1 }

.video-card-action {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: var(--tr)
}
.video-card-action:hover { background: var(--accent) }

.watch-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  z-index: 2;
  border-radius: 0 2px 0 0
}

.video-card.ghost { opacity: 0.4; cursor: default }
.video-card.ghost:hover { transform: none; opacity: 0.55 }
.video-card.ghost .video-card-thumb img { filter: grayscale(1) }

.ghost-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2
}
.ghost-redownload {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--tr)
}
.ghost-redownload:hover { background: var(--accent); border-color: var(--accent) }

.video-card-downloading { cursor: default }
.video-card-downloading:hover { transform: none }

.download-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0 14px 16px;
  gap: 8px
}

.download-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
  overflow: hidden
}
.download-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: 3px;
  transition: width 0.4s;
  box-shadow: 0 0 12px var(--accent-glow)
}

.download-progress-info {
  font-size: 11px;
  font-family: var(--font-mono);
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  font-weight: 600
}

.downloading-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
  font-weight: 600;
  font-size: 11px
}

.dl-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid transparent;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block
}

.btn-cancel-dl {
  margin-left: auto;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 3px 5px;
  display: flex;
  align-items: center;
  transition: var(--tr)
}
.btn-cancel-dl:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-subtle) }

/* ── Watch Page ─────────────────────────── */

.watch-layout { display: flex; gap: 28px }
.watch-main { flex: 1; min-width: 0 }
.watch-sidebar { width: 380px; min-width: 380px }

.player-wrap { margin: 0; background: #000 }
.player-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  background: #000;
  border-radius: var(--radius)
}
.player-container video { width: 100%; display: block; border-radius: var(--radius) }

.watch-info { padding: 18px 0; max-width: 1600px }
.watch-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 12px
}

.watch-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-wrap: wrap
}

.watch-description {
  margin-top: 16px;
  padding: 16px 18px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  white-space: pre-wrap;
  overflow: hidden;
  position: relative
}
.watch-description.collapsed { max-height: 120px }
.watch-description.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: linear-gradient(transparent, var(--bg-tertiary))
}
.desc-toggle {
  display: block;
  margin-top: 4px;
  padding: 6px 0;
  background: none;
  border: none;
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-body)
}
.desc-toggle:hover { text-decoration: underline }

.chapters-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: var(--tr)
}
.chapters-toggle:hover { background: var(--bg-hover); color: var(--text-primary) }

.chapters-list {
  margin-top: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border-subtle)
}
.chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: var(--tr);
  border-bottom: 1px solid var(--border-subtle)
}
.chapter-item:last-child { border-bottom: none }
.chapter-item:hover { background: var(--bg-hover) }
.chapter-item.active { background: var(--accent-subtle); color: var(--accent) }
.chapter-item.active .chapter-time { color: var(--accent) }

.chapter-time {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
  min-width: 50px
}
.chapter-label { font-size: 13px; flex: 1 }

.sponsor-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-secondary)
}
.sponsor-toggle .toggle { transform: scale(0.85) }

.sponsor-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  background: var(--green-subtle);
  color: var(--green)
}

.seg-list { margin-top: 8px; padding: 4px 0 }
.seg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 16px;
  font-size: 12px;
  color: var(--text-muted)
}
.seg-cat {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 4px;
  background: var(--accent-subtle);
  color: var(--accent);
  font-weight: 600;
  text-transform: capitalize
}

/* ── Playlist / Sidebar Items ───────────── */

.playlist-header {
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 14px
}
.watch-sidebar-header {
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 14px
}
.playlist-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: none;
  overflow-y: auto
}
.playlist-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--tr)
}
.playlist-item:hover { background: var(--bg-hover) }
.playlist-item.active { background: var(--accent-subtle) }

.playlist-thumb {
  width: 148px;
  min-width: 148px;
  aspect-ratio: 16/9;
  background: var(--bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
  position: relative
}
.playlist-thumb img { width: 100%; height: 100%; object-fit: cover }

.playlist-thumb-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: var(--font-mono)
}
.playlist-info { flex: 1; min-width: 0 }
.playlist-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px
}
.playlist-meta { font-size: 11px; color: var(--text-muted) }

.section-divider {
  font-size: 14px;
  font-weight: 600;
  padding: 18px 0 12px;
  border-top: 1px solid var(--border-subtle);
  margin-top: 14px
}

/* ── Modal ──────────────────────────────── */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(6px)
}
.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 30px;
  width: 480px;
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-float)
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between
}

/* ── Forms ──────────────────────────────── */

.form-group { margin-bottom: 18px }
.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-secondary);
  margin-bottom: 7px
}
.form-input {
  width: 100%;
  padding: 11px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-body);
  outline: none;
  transition: var(--tr)
}
.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow)
}
.form-select {
  appearance: none;
  width: 100%;
  padding: 11px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-body);
  outline: none;
  cursor: pointer
}
.form-hint { font-size: 11px; color: var(--text-muted); margin-top: 5px }
.form-warn { font-size: 11px; color: #e6a817; margin-top: 5px }

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0
}
.toggle {
  width: 44px;
  height: 24px;
  background: var(--bg-active);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: var(--tr);
  border: none
}
.toggle.on { background: var(--accent) }
.toggle-knob {
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: var(--tr)
}
.toggle.on .toggle-knob { left: 23px }

/* ── Empty State ────────────────────────── */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center
}
.empty-icon {
  width: 88px;
  height: 88px;
  background: var(--bg-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
  color: var(--text-muted)
}
.empty-title { font-size: 18px; font-weight: 600; margin-bottom: 8px }
.empty-text { font-size: 14px; color: var(--text-secondary); max-width: 360px }

/* ── Checking Badge ─────────────────────── */

.checking-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--accent-subtle);
  border: 1px solid rgba(224, 53, 74, 0.2);
  border-radius: 20px;
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap
}
.checking-badge .spinner {
  width: 10px;
  height: 10px;
  border: 2px solid transparent;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite
}

/* ── Browse View ────────────────────────── */

.browse-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  transition: var(--tr)
}
.browse-item:hover { background: var(--bg-hover) }
.browse-thumb {
  width: 128px;
  min-width: 128px;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-tertiary)
}
.browse-thumb img { width: 100%; height: 100%; object-fit: cover }
.browse-info { flex: 1; min-width: 0 }
.browse-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap
}
.browse-meta { font-size: 11px; color: var(--text-muted) }
.browse-check {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--tr);
  flex-shrink: 0;
  background: none;
  color: transparent
}
.browse-check:hover { border-color: var(--accent) }
.browse-check.checked { background: var(--accent); border-color: var(--accent); color: #fff }
.browse-check.downloaded { background: var(--green); border-color: var(--green); color: #fff; cursor: default }
.browse-status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap
}
.browse-status.downloaded { background: var(--green-subtle); color: var(--green) }
.browse-status.deleted { background: rgba(90, 90, 110, 0.15); color: var(--text-muted) }
.browse-status.downloading { background: var(--accent-subtle); color: var(--accent) }

/* ── Search Bar ─────────────────────────── */

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 20px
}
.search-bar input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-body);
  outline: none
}
.search-bar input::placeholder { color: var(--text-muted) }

/* ── Quality Dropdown ───────────────────── */

.quality-dropdown {
  margin-left: auto;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239494a8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 26px
}
.quality-dropdown:hover { border-color: var(--text-muted); color: var(--text-primary) }
.quality-dropdown option { background: var(--bg-secondary); color: var(--text-primary) }

/* ── Badges ─────────────────────────────── */

.new-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
  z-index: 2;
  letter-spacing: 0.6px;
  text-transform: uppercase
}
.watched-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(52, 211, 153, 0.9);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2
}

/* ── Player Buffering ───────────────────── */

.player-buffering-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
  background: rgba(0, 0, 0, 0.25)
}

.pip-btn {
  position: absolute;
  bottom: 54px;
  right: 8px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 5
}
.player-container:hover .pip-btn { opacity: 1 }

/* ── Mobile Header ──────────────────────── */

.mobile-header {
  display: none;
  flex-direction: column;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle)
}
.mobile-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  transition: padding 0.35s cubic-bezier(0.4, 0, 0.2, 1)
}
.mobile-header.compact .mobile-header-top { padding: 6px 16px }
.mobile-header.compact { border-bottom: none }

.mobile-channel-strip {
  display: flex;
  gap: 10px;
  padding: 6px 16px 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  height: 50px;
  opacity: 1
}
.mobile-channel-strip::-webkit-scrollbar { display: none }
.mobile-header.compact .mobile-channel-strip,
.mobile-header.hide-strip .mobile-channel-strip { height: 0; padding: 0 16px; overflow: hidden; opacity: 0 }

/* ── Topbar ─────────────────────────────── */

.topbar {
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  min-height: 50px;
  gap: 10px;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  max-height: 80px;
  opacity: 1
}
.topbar.collapsed { max-height: 0; min-height: 0; padding: 0 24px; opacity: 0; border-bottom: none }

.mobile-header-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 18px
}
.mobile-header-logo .logo-icon { width: 30px; height: 30px; min-width: 30px; margin-right: 8px }

.mobile-header-right { display: flex; align-items: center; gap: 6px }

.mobile-overlay { position: fixed; inset: 0; z-index: 150; display: flex }
.mobile-overlay-bg { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5) }
.mobile-overlay .sidebar { display: flex !important; position: relative; z-index: 1; width: 280px; min-width: 280px; max-width: 80vw }

/* ── Animations ─────────────────────────── */

@keyframes spin { to { transform: rotate(360deg) } }

/* ── Mobile ─────────────────────────────── */

@media (max-width: 768px) {
  .sidebar { display: none !important }
  .mobile-header { display: flex !important }
  .topbar { padding: 8px 16px; min-height: 42px }
  .topbar.watch-mobile { max-height: 0; min-height: 0; padding: 0 24px; opacity: 0; border-bottom: none; pointer-events: none }
  .content { padding: 16px }
  .video-grid { grid-template-columns: 1fr; gap: 16px }
  .watch-layout { flex-direction: column }
  .watch-sidebar { width: 100%; min-width: 0 }
  .watch-title { font-size: 17px }
  .watch-meta { font-size: 12px; gap: 8px }
  .watch-info { background: var(--bg-primary) }
  .player-wrap { margin: 0 -16px; background: #000 }
  .player-container { border-radius: 0 }
  .player-container video { border-radius: 0 }
  .playlist-thumb { width: 115px; min-width: 115px }
  .browse-thumb { width: 85px; min-width: 85px }
  .video-card-actions { opacity: 1 }
  .topbar-actions { gap: 4px }
  .topbar-actions .btn-sm { padding: 4px 8px; font-size: 11px }
  .mobile-watch-player { background: #000; width: 100%; flex-shrink: 0; box-shadow: 0 2px 16px rgba(0, 0, 0, 0.85) }
  .mobile-watch-player video { width: 100%; display: block }
  .main.watch-active { overflow: hidden; display: flex; flex-direction: column }
  .content.watch-active { padding: 0; overflow: hidden; flex: 1; display: flex; flex-direction: column; min-height: 0 }
  .watch-scroll-body { flex: 1; overflow-y: auto; padding: 16px; -webkit-overflow-scrolling: touch; min-height: 0 }
}

@media (min-width: 769px) and (max-width: 1100px) {
  .watch-layout { flex-direction: column }
  .watch-sidebar { width: 100%; min-width: 0 }
  .video-grid { grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)) }
}

/* ═══════════════════════════════════════════
   Custom Player
   ═══════════════════════════════════════════ */

.custom-player {
  position: relative;
  background: #000;
  border-radius: var(--radius);
  width: 100%;
  user-select: none
}
.custom-player video { width: 100%; display: block; border-radius: var(--radius) }

.cp-subtitle-overlay {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  pointer-events: none;
  z-index: 5;
  padding: 0 10%;
  transition: bottom 0.2s
}
.cp-subtitle-overlay.controls-visible { bottom: 72px }
.cp-subtitle-overlay span {
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  padding: 3px 12px;
  border-radius: 4px;
  text-align: center;
  max-width: 100%
}

.custom-player.pseudo-fs {
  position: fixed !important;
  inset: 0 !important;
  width: 100% !important;
  z-index: 9999 !important;
  border-radius: 0 !important;
  max-width: none !important
}
.custom-player.pseudo-fs video { width: 100% !important; height: 100% !important; object-fit: contain !important }

.cp-center-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  z-index: 11;
  pointer-events: none;
  transition: opacity 0.2s
}
.cp-center-overlay.hidden { opacity: 0; pointer-events: none }
.cp-center-btn {
  pointer-events: all;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  transition: background 0.15s, transform 0.1s;
  -webkit-tap-highlight-color: transparent
}
.cp-center-btn:active { background: rgba(0, 0, 0, 0.7); transform: scale(0.92) }
.cp-center-play { background: rgba(0, 0, 0, 0.5) }
.cp-center-play svg { width: 24px; height: 24px }

.cp-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 14px 12px;
  transition: opacity 0.2s;
  z-index: 10
}
.cp-controls.hidden { opacity: 0; pointer-events: none }

.cp-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  pointer-events: none;
  z-index: -1
}

.cp-seek-wrap {
  position: relative;
  height: 22px;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 4px
}
.cp-seek-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.18)
}
.cp-seek-buffered {
  position: absolute;
  left: 0;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.32);
  pointer-events: none
}
.cp-seek-progress {
  position: absolute;
  left: 0;
  height: 4px;
  border-radius: 2px;
  background: var(--accent);
  pointer-events: none
}
.cp-seek-sponsor {
  position: absolute;
  height: 4px;
  border-radius: 1px;
  pointer-events: none;
  z-index: 2
}
.cp-seek-chapter-tick {
  position: absolute;
  width: 2px;
  height: 8px;
  background: rgba(255, 255, 255, 0.7);
  transform: translateX(-1px);
  pointer-events: none;
  top: 50%;
  margin-top: -4px;
  z-index: 3
}
.cp-seek-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  transform: translateX(-50%) scale(0.8);
  opacity: 0;
  transition: opacity 0.15s, transform 0.15s;
  pointer-events: none;
  top: 50%;
  margin-top: -7px;
  z-index: 4
}
.cp-seek-wrap:hover .cp-seek-thumb { opacity: 1; transform: translateX(-50%) scale(1) }

.cp-seek-tooltip {
  position: absolute;
  bottom: 24px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.88);
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  text-align: center;
  z-index: 5
}
.cp-seek-tooltip-chapter { font-size: 11px; color: rgba(255, 255, 255, 0.7); margin-top: 1px }

.cp-btn-row {
  display: flex;
  align-items: center;
  gap: 2px;
  position: relative;
  z-index: 1
}
.cp-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 7px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
  flex-shrink: 0;
  line-height: 0;
  transition: opacity 0.15s, background 0.15s
}
.cp-btn:hover { opacity: 1; background: rgba(255, 255, 255, 0.1) }

.cp-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  padding: 0 8px
}

.cp-vol-wrap { position: relative; display: flex; align-items: center; gap: 2px }
.cp-vol-slider { width: 68px; accent-color: var(--accent); cursor: pointer; vertical-align: middle }

.cp-quality {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  font-family: var(--font-body);
  max-width: 90px
}
.cp-quality option { background: var(--bg-secondary); color: var(--text-primary) }

.cp-menu-wrap { position: relative; display: flex; align-items: center }
.cp-text-btn { font-size: 12px; font-weight: 600; font-family: var(--font-body); padding: 7px 8px; white-space: nowrap }
.cp-btn-active { color: var(--accent) }

.cp-popup-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  min-width: 110px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  z-index: 20;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  padding: 4px 0;
  overflow: hidden
}
.cp-popup-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  transition: var(--tr);
  white-space: nowrap
}
.cp-popup-item:hover { background: var(--bg-hover); color: var(--text-primary) }
.cp-popup-item.active { color: var(--accent); font-weight: 600 }

/* ── Settings Menu ──────────────────────── */

.cp-settings-backdrop {
  position: absolute;
  inset: 0;
  z-index: 49;
  background: transparent
}
.cp-settings-menu {
  position: absolute;
  bottom: 60px;
  right: 14px;
  min-width: 200px;
  max-width: 280px;
  max-height: calc(100% - 80px);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  z-index: 50;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
  padding: 6px 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch
}
.cp-settings-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: var(--tr);
  text-align: left
}
.cp-settings-row:hover { background: var(--bg-hover); color: var(--text-primary) }
.cp-settings-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
  opacity: 0.7
}
.cp-settings-label { flex: 1; white-space: nowrap }
.cp-settings-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap
}
.cp-settings-value.active { color: var(--accent) }
.cp-settings-back { border-bottom: 1px solid var(--border) }
.cp-settings-sub {
  border-top: 1px solid var(--border);
  padding: 4px 0
}

.cp-seek-preview {
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: #000;
  background-repeat: no-repeat;
  margin: 0 auto 5px;
  display: block
}

.cp-tap-feedback {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #fff;
  z-index: 12;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  width: 84px;
  height: 84px;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  animation: cp-tap-fade 0.5s ease-out
}
.cp-tap-feedback.left { left: 8% }
.cp-tap-feedback.right { right: 8% }
@keyframes cp-tap-fade {
  0% { opacity: 0; transform: translateY(-50%) scale(0.8) }
  30% { opacity: 1; transform: translateY(-50%) scale(1) }
  100% { opacity: 0.9 }
}

/* ── Continue Watching Row ──────────────── */

.continue-row-wrap { margin-bottom: 24px }
.continue-row-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px
}
.continue-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin
}
.continue-card { width: 200px; min-width: 200px; flex-shrink: 0 }
.continue-card .video-card { width: 100%; overflow: hidden }
.continue-card .video-card:hover { transform: none; box-shadow: none }
.continue-card .video-card-info { display: none }
.continue-card .video-card.cw-selected { outline: 4px solid var(--accent); outline-offset: -4px }
.cw-check {
  width: 22px; height: 22px; border-radius: 50%; background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px); border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex; align-items: center; justify-content: center;
  color: #fff; cursor: pointer; transition: var(--tr);
  padding: 0; line-height: 0
}
.cw-check svg { width: 12px; height: 12px }
.cw-check:hover { background: rgba(0, 0, 0, 0.7); border-color: #fff }
.cw-check.selected { background: var(--accent); border-color: var(--accent) }

/* ── Continue Watching Selection Mode ───── */
.cw-select-toggle {
  margin-left: auto; font-size: 12px; padding: 4px 12px;
  border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary)
}
.cw-select-toggle:hover { border-color: var(--accent); color: var(--accent) }
.continue-row-title { display: flex; align-items: center; gap: 8px }
.continue-card.select-mode { cursor: default }
.continue-card.select-mode .video-card { pointer-events: none }
.continue-card.select-mode .cw-check { pointer-events: all }
@media (max-width: 768px) {
  .continue-row .video-card-menu { display: none !important }
}
.cw-bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 12px 16px;
  background: var(--bg-secondary); border-top: 1px solid var(--border-subtle);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.2s ease
}
@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }

/* ── Chapters Panel (mobile) ────────────── */

.cp-chapters-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 260px;
  max-height: 240px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  z-index: 20;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5)
}
.cp-chapter-item {
  display: flex;
  gap: 8px;
  padding: 9px 14px;
  cursor: pointer;
  font-size: 13px;
  align-items: baseline;
  transition: var(--tr)
}
.cp-chapter-item:hover { background: var(--bg-active) }
.cp-chapter-item.active { color: var(--accent) }

/* ── Playlist Countdown Overlay ───────────── */
.cp-countdown-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 20;
  animation: fadeIn 0.2s
}
.cp-countdown-box {
  text-align: center;
  padding: 30px 50px;
  border-radius: 16px;
  background: rgba(20, 20, 30, 0.9);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(20px)
}
.cp-countdown-number {
  font-size: 64px;
  font-weight: 800;
  font-family: var(--font-display);
  color: var(--accent);
  line-height: 1
}
.cp-countdown-label {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 8px;
  margin-bottom: 20px
}
.cp-countdown-actions {
  display: flex;
  gap: 12px;
  justify-content: center
}
.cp-countdown-btn {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 10px 28px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--tr)
}
.cp-countdown-btn:hover { opacity: 0.85 }
.cp-countdown-cancel {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle)
}
.cp-countdown-cancel:hover { background: var(--bg-hover) }

/* ── Filter Bar ─────────────────────────── */

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  height: 52px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary)
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none
}
.filter-pills::-webkit-scrollbar { display: none }

.filter-pill {
  padding: 6px 14px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  font-size: 12.5px;
  font-weight: 400;
  white-space: nowrap;
  transition: var(--tr);
  font-family: var(--font-body);
  flex-shrink: 0
}
.filter-pill:hover { background: var(--bg-hover); color: var(--text-secondary) }
.filter-pill.active {
  background: var(--text-primary);
  color: var(--bg-primary);
  font-weight: 600
}

.filter-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0 }

.filter-search-wrap { position: relative; display: flex; align-items: center }
.filter-search-wrap svg {
  position: absolute;
  left: 10px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0
}

.filter-search {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 12.5px;
  padding: 7px 12px 7px 32px;
  outline: none;
  width: 180px;
  font-family: var(--font-body);
  transition: var(--tr)
}
.filter-search::placeholder { color: var(--text-muted) }
.filter-search:focus { border-color: var(--border) }

.filter-search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  line-height: 0
}
.filter-search-clear:hover { color: var(--text-primary) }

.filter-sort {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 12.5px;
  padding: 7px 12px;
  cursor: pointer;
  outline: none;
  font-family: var(--font-body);
  transition: var(--tr)
}
.filter-sort:focus { border-color: var(--border) }

.video-count { font-size: 12px; color: var(--text-muted); white-space: nowrap }

/* ── Confirm Mark All ───────────────────── */

.confirm-mark-all-popup {
  position: fixed;
  top: 57px;
  right: 24px;
  z-index: 200;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 18px;
  min-width: 240px;
  box-shadow: var(--shadow-float)
}
.confirm-mark-all-text { font-size: 13px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.5 }
.confirm-mark-all-btns { display: flex; gap: 8px }

/* ── Pull to Refresh ────────────────────── */

.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 0;
  overflow: hidden;
  transition: height 0.15s;
  pointer-events: none
}
.pull-indicator.visible { height: 44px }
.pull-indicator .spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite
}

/* ── Unread Badges ──────────────────────── */

.unread-badge {
  margin-left: auto;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
  flex-shrink: 0;
  line-height: 16px
}
.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  border: 2px solid var(--bg-secondary)
}

/* ── Video Card Menu ────────────────────── */

.video-card-menu { position: relative }
.video-card-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 100;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 4px 0;
  min-width: 180px;
  box-shadow: var(--shadow-float)
}
.video-card-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 16px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 12.5px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  transition: var(--tr)
}
.video-card-dropdown-item:hover { background: var(--bg-hover); color: var(--text-primary) }
.video-card-dropdown-item.danger { color: var(--accent) }
.video-card-dropdown-item.danger:hover { background: var(--accent-subtle) }

.video-card-title.watched { color: var(--text-muted) }

/* ── Settings Panel ────────────────────── */

.settings-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px
}

.settings-tab-bar {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  margin-bottom: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch
}
.settings-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--tr);
  white-space: nowrap;
  font-family: var(--font-body)
}
.settings-tab:hover { color: var(--text-primary); background: var(--bg-hover) }
.settings-tab.active {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2)
}
.settings-tab svg { flex-shrink: 0 }

.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px
}

.settings-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px
}
.settings-grid-2 > .settings-card { margin: 0 }
.settings-grid-2 > .settings-card:first-child { min-width: 0 }
.settings-grid-2 > .settings-card:last-child { min-width: 0 }

.settings-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  overflow: hidden
}
.settings-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle)
}
.settings-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary)
}
.settings-card-badge {
  font-size: 11px;
  font-family: monospace;
  color: var(--accent);
  background: var(--accent-subtle);
  padding: 2px 8px;
  border-radius: 4px
}
.settings-card-action {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: var(--tr)
}
.settings-card-action:hover { color: var(--text-primary); background: var(--bg-hover) }
.settings-card-body {
  padding: 16px 18px
}

.settings-chip {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  border: 1px solid;
  background: var(--bg-tertiary);
  border-color: var(--border);
  color: var(--text-muted)
}
.settings-chip.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent)
}
.settings-chip:hover { border-color: var(--text-muted) }

.settings-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px
}
.settings-stat-card {
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  padding: 12px 14px
}
.settings-stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: '.05em';
  margin-bottom: 4px
}
.settings-stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary)
}

.settings-log-box {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  height: 280px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5
}
.settings-log-entry {
  display: flex;
  gap: 8px;
  align-items: baseline
}
.settings-log-time {
  color: var(--text-muted);
  flex-shrink: 0;
  font-size: 11px
}
.settings-log-msg { word-break: break-all }

.settings-channel-list {
  padding: 0 !important
}
.settings-channel-item {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-subtle);
  transition: var(--tr)
}
.settings-channel-item:last-child { border-bottom: none }
.settings-channel-item:hover { background: var(--bg-hover) }
.settings-channel-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer
}
.settings-channel-text {
  flex: 1;
  min-width: 0
}
.settings-channel-name {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap
}
.settings-channel-meta {
  display: block;
  font-size: 12px;
  color: var(--text-muted)
}
.settings-channel-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px
}
.settings-health-badge {
  font-size: 11px;
  flex-shrink: 0
}
.settings-health-badge.ok { color: var(--green) }
.settings-health-badge.error { color: #ff6b6b }
.settings-health-badge.checking { color: var(--text-muted) }
.settings-channel-edit {
  margin-top: 12px;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm)
}

/* ── Playlist ──────────────────────────── */

.playlist-view {
  padding: 20px
}
.pv-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px
}
.playlist-edit-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px
}
.playlist-title-area {
  flex: 1
}
.pv-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px
}
.playlist-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px
}
.playlist-count {
  font-size: 13px;
  color: var(--text-muted)
}
.playlist-actions {
  display: flex;
  gap: 8px
}
.playlist-video-item {
  position: relative
}
.playlist-remove-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.7);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10
}
.playlist-video-item:hover .playlist-remove-btn { opacity: 1 }
.playlist-remove-btn:hover { background: var(--accent) }
.playlist-reorder-btns {
  position: absolute;
  bottom: 8px;
  right: 40px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10
}
.playlist-video-item:hover .playlist-reorder-btns { opacity: 1 }
.playlist-reorder-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.7);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px
}
.playlist-reorder-btn:hover { background: rgba(255,255,255,0.2) }

.playlist-modal {
  max-width: 400px
}
.playlist-modal-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin: -8px 0 16px;
  padding: 0 20px
}
.playlist-modal-list {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 16px
}
.playlist-modal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--tr);
  font-family: var(--font-body);
  font-size: 14px
}
.playlist-modal-item:hover { background: var(--bg-hover); color: var(--text-primary) }
.playlist-modal-item:disabled { opacity: 0.5; cursor: not-allowed }
.playlist-modal-name { flex: 1; text-align: left }
.playlist-modal-count {
  font-size: 12px;
  color: var(--text-muted)
}
.playlist-modal-create {
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px
}

/* ── Sidebar extras ────────────────────── */

.sb-section-action {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: var(--tr);
  display: flex;
  align-items: center
}
.sb-section-action:hover { color: var(--text-primary); background: var(--bg-hover) }
.sb-nav-badge {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: 8px;
  flex-shrink: 0
}
.sb-empty {
  padding: 8px 14px;
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic
}

/* ── Mobile Responsive Extras ───────────── */

@media (max-width: 768px) {
  .filter-bar { padding: 0 16px; gap: 8px }
  .filter-right { display: none }
  .feed-topbar { display: none !important }
  .continue-card { width: 160px; min-width: 160px; flex-shrink: 0 }
  .continue-card .video-card { width: 100%; overflow: hidden }
  .continue-card .video-card:hover { transform: none; box-shadow: none }
.continue-card .video-card-info { display: none }
.continue-card .video-card.cw-selected { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent) }
  .cp-btn { padding: 10px }
  .cp-seek-wrap { height: 28px }
  .cp-seek-track, .cp-seek-buffered, .cp-seek-progress, .cp-seek-sponsor { height: 5px }
  .cp-seek-thumb { width: 18px; height: 18px; margin-top: -9px }
  .cp-chapters-panel {
    position: fixed;
    bottom: 80px;
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    width: 90vw;
    max-height: 50vh
  }
  .custom-player { border-radius: 0 }
  .custom-player video { border-radius: 0 }
  .cp-vol-wrap { display: none }
  .cp-chapters-btn-wrap { display: none }
  .cp-settings-menu { right: 8px; bottom: 56px; min-width: 180px }
  .ch-settings-row { flex-wrap: wrap !important }
  .cp-seek-preview { display: none !important }
  .cp-center-overlay { gap: 20px }
  .cp-center-btn { width: 56px; height: 56px }
  .cp-center-play { background: rgba(0, 0, 0, 0.5) }
  .cp-center-play svg { width: 24px; height: 24px }
  .settings-container { padding: 12px }
  .settings-grid-2 { grid-template-columns: 1fr }
  .settings-tab-bar { gap: 2px; padding: 3px }
  .settings-tab { padding: 8px 12px; font-size: 12px; flex: none }
  .settings-tab span { display: none }
  .settings-card-header { padding: 12px 14px }
  .settings-card-body { padding: 12px 14px }
  .settings-stats-grid { grid-template-columns: 1fr 1fr; gap: 8px }
  .settings-stat-card { padding: 10px 12px }
  .settings-stat-value { font-size: 16px }
  .settings-channel-item { padding: 10px 14px }
  .playlist-view { padding: 12px }
  .pv-title { font-size: 20px }
  .playlist-modal { max-width: 90vw }
}

/* Card density */
.density-compact .video-card-thumb { height: 120px }
.density-compact .video-card-info { padding: 6px 8px }
.density-compact .video-card-title { font-size: 12px; line-height: 1.3; -webkit-line-clamp: 1 }
.density-compact .video-card-meta { font-size: 10px; gap: 4px }
.density-compact .video-grid { gap: 8px }
.density-spacious .video-card-thumb { height: 200px }
.density-spacious .video-card-info { padding: 12px 10px }
.density-spacious .video-card-title { font-size: 14px; line-height: 1.45; -webkit-line-clamp: 3 }
.density-spacious .video-grid { gap: 16px }

/* Watched video styles */
.watched-dim .video-card.watched-card .video-card-thumb { opacity: 0.5 }
.watched-dim .video-card.watched-card .video-card-thumb img { opacity: 0.4 }
.watched-dim .video-card.watched-card .video-card-info { opacity: 0.5 }
.watched-strikethrough .video-card-title.watched { text-decoration: line-through; opacity: 0.6 }
.watched-dim .watched-badge,
.watched-strikethrough .watched-badge { display: none }
`
export default css
