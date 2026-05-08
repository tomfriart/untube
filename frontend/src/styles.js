const css = `
:root{--bg-primary:#0a0a0c;--bg-secondary:#111115;--bg-tertiary:#18181d;--bg-card:#141418;--bg-hover:#1e1e24;--bg-active:#252530;--border:#2a2a35;--border-subtle:#1f1f28;--text-primary:#eeeef0;--text-secondary:#9898a8;--text-muted:#5a5a6e;--accent:#e23d4c;--accent-hover:#f04858;--accent-glow:rgba(226,61,76,.15);--green:#2ecc71;--font-body:'DM Sans',-apple-system,sans-serif;--font-mono:'Space Mono',monospace;--radius:10px;--radius-sm:6px;--radius-lg:14px;--shadow-card:0 2px 12px rgba(0,0,0,.3);--shadow-float:0 8px 32px rgba(0,0,0,.5);--tr:180ms ease;--sidebar-w:240px}
*{margin:0;padding:0;box-sizing:border-box}html,body,#root{height:100%}body{font-family:var(--font-body);background:var(--bg-primary);color:var(--text-primary);line-height:1.5;-webkit-font-smoothing:antialiased;overscroll-behavior:none}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
.app{display:flex;height:100vh;overflow:hidden}
.sidebar{width:var(--sidebar-w);min-width:var(--sidebar-w);background:var(--bg-secondary);border-right:1px solid var(--border-subtle);display:flex;flex-direction:column;overflow:hidden;transition:width .25s,min-width .25s}
.sidebar-header{padding:20px 18px 16px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:10px;font-family:var(--font-mono);font-weight:700;font-size:22px;white-space:nowrap;overflow:hidden}
.logo-icon{width:36px;height:36px;min-width:36px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff}
.logo-text{transition:opacity .2s;flex-direction:column;gap:0;line-height:1}
.logo-un{color:var(--text-primary)}
.logo-tube{color:var(--accent);border-bottom:2.5px solid var(--accent);padding-bottom:1px}.collapse-btn{background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;display:flex;align-items:center;transition:var(--tr)}.collapse-btn:hover{color:var(--text-primary)}
.sidebar-nav{padding:12px 10px;flex:1;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--radius-sm);cursor:pointer;transition:var(--tr);color:var(--text-secondary);font-size:14px;font-weight:500;border:none;background:none;width:100%;text-align:left;white-space:nowrap;overflow:hidden}
.nav-item:hover{background:var(--bg-hover);color:var(--text-primary)}.nav-item.active{background:var(--bg-active);color:var(--text-primary)}
.nav-section-title{padding:16px 12px 6px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-muted);font-weight:600;white-space:nowrap;overflow:hidden}
.channel-dot{width:28px;height:28px;border-radius:50%;background:var(--bg-active);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--accent);flex-shrink:0;overflow:hidden}.channel-dot img{width:100%;height:100%;object-fit:cover;display:block}
.channel-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.sidebar-footer{padding:12px;border-top:1px solid var(--border-subtle)}.sidebar-footer .btn{overflow:hidden;white-space:nowrap}.sidebar-footer .btn-text{transition:opacity .2s;overflow:hidden}
.sidebar.collapsed{--sidebar-w:64px;width:64px;min-width:64px}.sidebar.collapsed .logo-text,.sidebar.collapsed .nav-section-title,.sidebar.collapsed .channel-name{opacity:0;width:0;min-width:0;overflow:hidden;height:auto;padding:0}.sidebar.collapsed .nav-item{justify-content:center;padding:10px 8px;gap:0}.sidebar.collapsed .nav-item .channel-name{display:none}.sidebar.collapsed .sidebar-header{flex-direction:column;align-items:center;justify-content:center;padding:12px 8px;gap:8px}.sidebar.collapsed .logo{gap:0;justify-content:center}.sidebar.collapsed .sidebar-footer .btn-text{opacity:0;width:0}.sidebar.collapsed .sidebar-footer .btn{justify-content:center;padding:8px}.sidebar.collapsed .sidebar-nav{padding:8px 6px}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar-title{font-size:16px;font-weight:600;display:flex;align-items:center;gap:10px;min-width:0;overflow:hidden}.topbar-title-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.topbar-actions{display:flex;gap:6px;align-items:center;flex-shrink:0;flex-wrap:wrap}
.topbar-settings-select{background:transparent;border:none;font-weight:600;font-size:16px;color:var(--text-primary);cursor:pointer;padding:0;font-family:inherit;-webkit-appearance:auto;appearance:auto;max-width:160px}
.content{flex:1;overflow-y:auto;padding:24px;overscroll-behavior-y:contain}
.btn{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;font-weight:500;cursor:pointer;transition:var(--tr);font-family:var(--font-body);white-space:nowrap}.btn:hover{background:var(--bg-hover);border-color:var(--text-muted)}.btn-accent{background:var(--accent);border-color:var(--accent);color:#fff}.btn-accent:hover{background:var(--accent-hover)}.btn-sm{padding:5px 10px;font-size:12px}
.btn-icon{padding:8px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-secondary);cursor:pointer;transition:var(--tr);display:flex;align-items:center;justify-content:center}.btn-icon:hover{background:var(--bg-hover);color:var(--text-primary)}.btn-danger{color:var(--accent)}.btn-danger:hover{background:rgba(226,61,76,.1)}.btn-ghost{border:none;background:none}
.video-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.video-card{background:var(--bg-card);border-radius:var(--radius);overflow:hidden;cursor:pointer;transition:var(--tr);border:1px solid var(--border-subtle);position:relative}.video-card:hover{transform:translateY(-2px);border-color:var(--border);box-shadow:var(--shadow-card)}
.video-card-thumb{position:relative;width:100%;padding-top:56.25%;background:var(--bg-tertiary);overflow:hidden}.video-card-thumb img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transition:transform .3s}.video-card:hover .video-card-thumb img{transform:scale(1.05)}
.video-card-duration{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.85);color:#fff;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;font-family:var(--font-mono)}
.video-card-info{padding:12px 14px}.video-card-title{font-size:14px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:6px}
.video-card-meta{font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;flex-wrap:wrap}.video-card-channel{font-weight:500}.video-card-meta .dot{color:var(--text-muted)}
.video-card-actions{position:absolute;top:8px;right:8px;z-index:3;display:flex;gap:4px;opacity:0;transition:var(--tr)}.video-card:hover .video-card-actions{opacity:1}
.video-card-action{background:rgba(0,0,0,.7);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;transition:var(--tr)}.video-card-action:hover{background:var(--accent)}
.watch-progress-bar{position:absolute;bottom:0;left:0;height:3px;background:var(--accent);z-index:2}
.video-card.ghost{opacity:.45;cursor:default}.video-card.ghost:hover{transform:none;opacity:.6}.video-card.ghost .video-card-thumb img{filter:grayscale(1)}
.ghost-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2}.ghost-redownload{background:rgba(0,0,0,.65);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 14px;color:var(--text-primary);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:var(--tr)}.ghost-redownload:hover{background:var(--accent);border-color:var(--accent)}
.video-card-downloading{cursor:default}.video-card-downloading:hover{transform:none}
.download-overlay{position:absolute;inset:0;background:rgba(0,0,0,.65);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 12px 14px;gap:6px}
.download-progress-bar{width:100%;height:6px;background:rgba(255,255,255,.15);border-radius:3px;overflow:hidden}.download-progress-fill{height:100%;background:var(--accent);border-radius:3px;transition:width .4s;box-shadow:0 0 8px var(--accent-glow)}
.download-progress-info{font-size:11px;font-family:var(--font-mono);color:rgba(255,255,255,.85);text-align:center;font-weight:600}
.downloading-badge{display:inline-flex;align-items:center;gap:5px;color:var(--accent);font-weight:600;font-size:11px}
.dl-spinner{width:10px;height:10px;border:2px solid transparent;border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;display:inline-block}
.btn-cancel-dl{margin-left:auto;background:none;border:1px solid var(--border);border-radius:4px;color:var(--text-muted);cursor:pointer;padding:2px 4px;display:flex;align-items:center;transition:var(--tr)}.btn-cancel-dl:hover{color:var(--accent);border-color:var(--accent);background:rgba(226,61,76,.1)}
.watch-layout{display:flex;gap:24px}.watch-main{flex:1;min-width:0}.watch-sidebar{width:360px;min-width:360px}
.player-wrap{margin:0;background:#000}
.player-container{width:100%;max-width:1600px;margin:0 auto;background:#000;overflow:hidden;border-radius:var(--radius)}.player-container video{width:100%;display:block}
.watch-info{padding:16px 0;max-width:1600px}.watch-title{font-size:20px;font-weight:700;line-height:1.3;margin-bottom:10px}
.watch-meta{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--text-secondary);flex-wrap:wrap}
.watch-description{margin-top:16px;padding:14px 16px;background:var(--bg-tertiary);border-radius:var(--radius);font-size:13px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;overflow:hidden;position:relative}
.watch-description.collapsed{max-height:120px}
.watch-description.collapsed::after{content:'';position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(transparent,var(--bg-tertiary))}
.desc-toggle{display:block;margin-top:4px;padding:6px 0;background:none;border:none;color:var(--accent);font-size:13px;font-weight:500;cursor:pointer;font-family:var(--font-body)}.desc-toggle:hover{text-decoration:underline}
.chapters-toggle{display:flex;align-items:center;gap:6px;margin-top:12px;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);cursor:pointer;border:1px solid var(--border-subtle);color:var(--text-secondary);font-size:13px;font-weight:500;transition:var(--tr)}.chapters-toggle:hover{background:var(--bg-hover);color:var(--text-primary)}
.chapters-list{margin-top:8px;background:var(--bg-tertiary);border-radius:var(--radius);overflow:hidden;border:1px solid var(--border-subtle)}
.chapter-item{display:flex;align-items:center;gap:10px;padding:8px 14px;cursor:pointer;transition:var(--tr);border-bottom:1px solid var(--border-subtle)}.chapter-item:last-child{border-bottom:none}.chapter-item:hover{background:var(--bg-hover)}.chapter-item.active{background:var(--bg-active);color:var(--accent)}.chapter-item.active .chapter-time{color:var(--accent)}
.chapter-time{font-family:var(--font-mono);font-size:12px;color:var(--accent);font-weight:600;min-width:50px}.chapter-label{font-size:13px;flex:1}
.sponsor-toggle{display:flex;align-items:center;gap:10px;margin-top:10px;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border-subtle);font-size:13px;color:var(--text-secondary)}
.sponsor-toggle .toggle{transform:scale(.85)}
.sponsor-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:rgba(46,204,113,.12);color:var(--green)}
.seg-list{margin-top:6px;padding:4px 0}
.seg-item{display:flex;align-items:center;gap:8px;padding:4px 14px;font-size:12px;color:var(--text-muted)}
.seg-cat{font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(226,61,76,.1);color:var(--accent);font-weight:600;text-transform:capitalize}
.playlist-header{font-size:14px;font-weight:600;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);margin-bottom:12px}
.playlist-list{display:flex;flex-direction:column;gap:8px;max-height:none;overflow-y:auto}
.playlist-item{display:flex;gap:10px;padding:8px;border-radius:var(--radius-sm);cursor:pointer;transition:var(--tr)}.playlist-item:hover{background:var(--bg-hover)}.playlist-item.active{background:var(--bg-active)}
.playlist-thumb{width:140px;min-width:140px;aspect-ratio:16/9;background:var(--bg-tertiary);border-radius:6px;overflow:hidden;position:relative}.playlist-thumb img{width:100%;height:100%;object-fit:cover}
.playlist-thumb-duration{position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,.85);color:#fff;font-size:10px;font-weight:600;padding:1px 5px;border-radius:3px;font-family:var(--font-mono)}
.playlist-info{flex:1;min-width:0}.playlist-title{font-size:13px;font-weight:500;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:4px}.playlist-meta{font-size:11px;color:var(--text-muted)}
.section-divider{font-size:14px;font-weight:600;padding:16px 0 12px;border-top:1px solid var(--border-subtle);margin-top:12px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(4px)}
.modal{background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;width:460px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-float)}
.modal-title{font-size:18px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}
.form-group{margin-bottom:16px}.form-label{display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--text-secondary);margin-bottom:6px}
.form-input{width:100%;padding:10px 14px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:14px;font-family:var(--font-body);outline:none;transition:var(--tr)}.form-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
.form-select{appearance:none;width:100%;padding:10px 14px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:14px;font-family:var(--font-body);outline:none;cursor:pointer}
.form-hint{font-size:11px;color:var(--text-muted);margin-top:4px}.form-warn{font-size:11px;color:#e6a817;margin-top:4px}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0}.toggle{width:44px;height:24px;background:var(--bg-active);border-radius:12px;cursor:pointer;position:relative;transition:var(--tr);border:none}.toggle.on{background:var(--accent)}.toggle-knob{width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:3px;left:3px;transition:var(--tr)}.toggle.on .toggle-knob{left:23px}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center}.empty-icon{width:80px;height:80px;background:var(--bg-tertiary);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:var(--text-muted)}.empty-title{font-size:18px;font-weight:600;margin-bottom:8px}.empty-text{font-size:14px;color:var(--text-secondary);max-width:360px}
.checking-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(226,61,76,.1);border:1px solid rgba(226,61,76,.2);border-radius:20px;font-size:11px;color:var(--accent);font-weight:500;white-space:nowrap}.checking-badge .spinner{width:10px;height:10px;border:2px solid transparent;border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
.browse-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid var(--border-subtle);transition:var(--tr)}.browse-item:hover{background:var(--bg-hover)}.browse-thumb{width:120px;min-width:120px;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:var(--bg-tertiary)}.browse-thumb img{width:100%;height:100%;object-fit:cover}.browse-info{flex:1;min-width:0}.browse-title{font-size:13px;font-weight:500;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.browse-meta{font-size:11px;color:var(--text-muted)}.browse-check{width:22px;height:22px;border:2px solid var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--tr);flex-shrink:0;background:none;color:transparent}.browse-check:hover{border-color:var(--accent)}.browse-check.checked{background:var(--accent);border-color:var(--accent);color:#fff}.browse-check.downloaded{background:var(--green);border-color:var(--green);color:#fff;cursor:default}.browse-status{font-size:10px;padding:2px 6px;border-radius:3px;font-weight:600;white-space:nowrap}.browse-status.downloaded{background:rgba(46,204,113,.15);color:var(--green)}.browse-status.deleted{background:rgba(90,90,110,.15);color:var(--text-muted)}.browse-status.downloading{background:rgba(226,61,76,.15);color:var(--accent)}
.search-bar{display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:16px}.search-bar input{flex:1;background:none;border:none;color:var(--text-primary);font-size:14px;font-family:var(--font-body);outline:none}.search-bar input::placeholder{color:var(--text-muted)}
.quality-dropdown{margin-left:auto;padding:4px 8px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-secondary);font-size:12px;font-weight:600;font-family:var(--font-body);cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239898a8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;padding-right:24px}
.quality-dropdown:hover{border-color:var(--text-muted);color:var(--text-primary)}
.quality-dropdown option{background:var(--bg-secondary);color:var(--text-primary)}
.new-badge{position:absolute;top:8px;left:8px;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;z-index:2;letter-spacing:.5px}
.watched-badge{position:absolute;bottom:8px;left:8px;background:rgba(46,204,113,.9);color:#fff;font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:2}
.player-buffering-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:10;background:rgba(0,0,0,.3)}
.pip-btn{position:absolute;bottom:54px;right:8px;background:rgba(0,0,0,.65);border:none;border-radius:4px;color:#fff;cursor:pointer;padding:5px 7px;display:flex;align-items:center;opacity:0;transition:opacity .2s;z-index:5}
.player-container:hover .pip-btn{opacity:1}
.mobile-header{display:none;flex-direction:column;background:var(--bg-secondary);border-bottom:1px solid var(--border-subtle)}
.mobile-header-top{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;transition:padding .35s cubic-bezier(.4,0,.2,1)}
.mobile-header.compact .mobile-header-top{padding:4px 14px}
.mobile-header.compact{border-bottom:none}
.mobile-channel-strip{display:flex;gap:10px;padding:6px 14px 10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;transition:height .35s cubic-bezier(.4,0,.2,1),padding .35s cubic-bezier(.4,0,.2,1),opacity .25s cubic-bezier(.4,0,.2,1);height:50px;opacity:1}
.mobile-channel-strip::-webkit-scrollbar{display:none}
.mobile-header.compact .mobile-channel-strip,.mobile-header.hide-strip .mobile-channel-strip{height:0;padding:0 14px;overflow:hidden;opacity:0}
.topbar{padding:12px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-subtle);background:var(--bg-secondary);min-height:48px;gap:8px;transition:max-height .35s cubic-bezier(.4,0,.2,1),padding .35s cubic-bezier(.4,0,.2,1),opacity .3s cubic-bezier(.4,0,.2,1),min-height .35s cubic-bezier(.4,0,.2,1),border-color .35s cubic-bezier(.4,0,.2,1);overflow:hidden;max-height:80px;opacity:1}
.topbar.collapsed{max-height:0;min-height:0;padding:0 24px;opacity:0;border-bottom:none}
.mobile-header-logo{display:flex;align-items:center;cursor:pointer;font-family:var(--font-mono);font-weight:700;font-size:18px}.mobile-header-logo .logo-icon{width:30px;height:30px;min-width:30px;margin-right:8px}
.mobile-header-right{display:flex;align-items:center;gap:6px}
.mobile-overlay{position:fixed;inset:0;z-index:150;display:flex}.mobile-overlay-bg{position:absolute;inset:0;background:rgba(0,0,0,.5)}.mobile-overlay .sidebar{position:relative;z-index:1;width:280px;min-width:280px;max-width:80vw}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:768px){
  .sidebar{display:none !important}.mobile-header{display:flex !important}
  .topbar{padding:8px 14px;min-height:40px}
  .topbar.watch-mobile{max-height:0;min-height:0;padding:0 24px;opacity:0;border-bottom:none;pointer-events:none}
  .content{padding:14px}
  .video-grid{grid-template-columns:1fr;gap:14px}
  .watch-layout{flex-direction:column}.watch-sidebar{width:100%;min-width:0}
  .watch-title{font-size:17px}.watch-meta{font-size:12px;gap:8px}
  .watch-info{background:var(--bg-primary)}
  .player-wrap{margin:0 -14px;background:#000}
  .player-container{border-radius:0}
  .playlist-thumb{width:110px;min-width:110px}.browse-thumb{width:80px;min-width:80px}
  .video-card-actions{opacity:1}.topbar-actions{gap:4px}.topbar-actions .btn-sm{padding:4px 8px;font-size:11px}
  .mobile-watch-player{background:#000;width:100%;flex-shrink:0;box-shadow:0 2px 16px rgba(0,0,0,.85)}
  .mobile-watch-player video{width:100%;display:block}
  .main.watch-active{overflow:hidden;display:flex;flex-direction:column}
  .content.watch-active{padding:0;overflow:hidden;flex:1;display:flex;flex-direction:column;min-height:0}
  .watch-scroll-body{flex:1;overflow-y:auto;padding:14px;-webkit-overflow-scrolling:touch;min-height:0}
}
@media(min-width:769px) and (max-width:1100px){.watch-layout{flex-direction:column}.watch-sidebar{width:100%;min-width:0}.video-grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}}
.custom-player{position:relative;background:#000;overflow:hidden;border-radius:var(--radius);width:100%;user-select:none}
.custom-player video{width:100%;display:block}.cp-subtitle-overlay{position:absolute;bottom:16px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;z-index:5;padding:0 10%;transition:bottom .2s}.cp-subtitle-overlay.controls-visible{bottom:72px}.cp-subtitle-overlay span{background:rgba(0,0,0,.78);color:#fff;font-size:15px;font-weight:500;line-height:1.4;padding:3px 10px;border-radius:3px;text-align:center;max-width:100%}
.custom-player.pseudo-fs{position:fixed!important;inset:0!important;width:100%!important;z-index:9999!important;border-radius:0!important;max-width:none!important}
.custom-player.pseudo-fs video{width:100%!important;height:100%!important;object-fit:contain!important}
.cp-center-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:32px;z-index:11;pointer-events:none;transition:opacity .2s}.cp-center-overlay.hidden{opacity:0;pointer-events:none}.cp-center-btn{pointer-events:all;background:rgba(0,0,0,.45);border:none;border-radius:50%;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;width:52px;height:52px;transition:background .15s,transform .1s;-webkit-tap-highlight-color:transparent}.cp-center-btn:active{background:rgba(0,0,0,.7);transform:scale(.9)}.cp-center-play{width:62px;height:62px;background:rgba(0,0,0,.55)}.cp-center-play svg{width:28px;height:28px}
.cp-controls{position:absolute;bottom:0;left:0;right:0;padding:0 12px 10px;transition:opacity .2s;z-index:10}
.cp-controls.hidden{opacity:0;pointer-events:none}
.cp-gradient{position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(transparent,rgba(0,0,0,.75));pointer-events:none;z-index:-1}
.cp-seek-wrap{position:relative;height:20px;display:flex;align-items:center;cursor:pointer;margin-bottom:4px}
.cp-seek-track{position:absolute;left:0;right:0;height:4px;border-radius:2px;background:rgba(255,255,255,.2)}
.cp-seek-buffered{position:absolute;left:0;height:4px;border-radius:2px;background:rgba(255,255,255,.35);pointer-events:none}
.cp-seek-progress{position:absolute;left:0;height:4px;border-radius:2px;background:var(--accent);pointer-events:none}
.cp-seek-sponsor{position:absolute;height:4px;border-radius:1px;pointer-events:none;z-index:2}
.cp-seek-chapter-tick{position:absolute;width:2px;height:8px;background:rgba(255,255,255,.7);transform:translateX(-1px);pointer-events:none;top:50%;margin-top:-4px;z-index:3}
.cp-seek-thumb{position:absolute;width:14px;height:14px;border-radius:50%;background:var(--accent);transform:translateX(-50%) scale(.8);opacity:0;transition:opacity .15s,transform .15s;pointer-events:none;top:50%;margin-top:-7px;z-index:4}
.cp-seek-wrap:hover .cp-seek-thumb{opacity:1;transform:translateX(-50%) scale(1)}
.cp-seek-tooltip{position:absolute;bottom:22px;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;white-space:nowrap;pointer-events:none;text-align:center;z-index:5}
.cp-seek-tooltip-chapter{font-size:11px;color:rgba(255,255,255,.75);margin-top:1px}
.cp-btn-row{display:flex;align-items:center;gap:2px;position:relative;z-index:1}
.cp-btn{background:none;border:none;color:#fff;cursor:pointer;padding:6px;border-radius:4px;display:flex;align-items:center;justify-content:center;opacity:.9;flex-shrink:0;line-height:0}
.cp-btn:hover{opacity:1;background:rgba(255,255,255,.1)}
.cp-time{font-size:12px;color:rgba(255,255,255,.9);white-space:nowrap;font-variant-numeric:tabular-nums;padding:0 6px}
.cp-vol-wrap{position:relative;display:flex;align-items:center;gap:2px}
.cp-vol-slider{width:68px;accent-color:var(--accent);cursor:pointer;vertical-align:middle}
.cp-quality{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:12px;font-weight:600;padding:4px 8px;border-radius:4px;cursor:pointer;outline:none;font-family:var(--font-body);max-width:90px}
.cp-quality option{background:var(--bg-secondary);color:var(--text-primary)}
.cp-chapters-panel{position:absolute;bottom:calc(100% + 8px);right:0;width:260px;max-height:240px;overflow-y:auto;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);z-index:20;box-shadow:0 4px 24px rgba(0,0,0,.5)}
.cp-chapter-item{display:flex;gap:8px;padding:8px 12px;cursor:pointer;font-size:13px;align-items:baseline}
.cp-chapter-item:hover{background:var(--bg-active)}
.cp-chapter-item.active{color:var(--accent)}
@media(max-width:768px){.cp-btn{padding:10px}.cp-seek-wrap{height:28px}.cp-seek-track,.cp-seek-buffered,.cp-seek-progress,.cp-seek-sponsor{height:5px}.cp-seek-thumb{width:18px;height:18px;margin-top:-9px}.cp-chapters-panel{position:fixed;bottom:80px;right:auto;left:50%;transform:translateX(-50%);width:90vw;max-height:50vh}.custom-player{border-radius:0}.ch-settings-row{flex-wrap:wrap!important}.ch-settings-info{flex:1 1 100%!important}.ch-settings-btns{margin-left:38px}.cp-chapters-btn-wrap{display:none}.cp-center-overlay{gap:20px}.cp-center-btn{width:56px;height:56px}.cp-center-play{width:68px;height:68px}.cp-center-play svg{width:32px;height:32px}}
.filter-bar{display:flex;align-items:center;gap:12px;padding:0 24px;height:52px;flex-shrink:0;border-bottom:1px solid var(--border-subtle);background:var(--bg-secondary)}
.filter-pills{display:flex;gap:6px;flex:1;overflow-x:auto;scrollbar-width:none}.filter-pills::-webkit-scrollbar{display:none}
.filter-pill{padding:5px 13px;border-radius:20px;border:none;cursor:pointer;background:var(--bg-tertiary);color:var(--text-muted);font-size:12.5px;font-weight:400;white-space:nowrap;transition:var(--tr);font-family:var(--font-body);flex-shrink:0}.filter-pill:hover{background:var(--bg-hover);color:var(--text-secondary)}.filter-pill.active{background:var(--text-primary);color:var(--bg-primary);font-weight:600}
.filter-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.filter-search-wrap{position:relative;display:flex;align-items:center}.filter-search-wrap svg{position:absolute;left:9px;color:var(--text-muted);pointer-events:none;flex-shrink:0}
.filter-search{background:var(--bg-tertiary);border:1px solid var(--border-subtle);border-radius:8px;color:var(--text-primary);font-size:12.5px;padding:6px 12px 6px 30px;outline:none;width:180px;font-family:var(--font-body)}.filter-search::placeholder{color:var(--text-muted)}.filter-search:focus{border-color:var(--border)}
.filter-search-clear{position:absolute;right:8px;background:none;border:none;color:var(--text-muted);cursor:pointer;padding:2px;display:flex;align-items:center;line-height:0}.filter-search-clear:hover{color:var(--text-primary)}
.filter-sort{background:var(--bg-tertiary);border:1px solid var(--border-subtle);border-radius:8px;color:var(--text-muted);font-size:12.5px;padding:6px 10px;cursor:pointer;outline:none;font-family:var(--font-body)}.filter-sort:focus{border-color:var(--border)}
.video-count{font-size:12px;color:var(--text-muted);white-space:nowrap}
.confirm-mark-all-popup{position:fixed;top:57px;right:24px;z-index:200;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;min-width:220px;box-shadow:var(--shadow-float)}
.confirm-mark-all-text{font-size:13px;color:var(--text-secondary);margin-bottom:12px;line-height:1.4}
.confirm-mark-all-btns{display:flex;gap:8px}
.pull-indicator{display:flex;align-items:center;justify-content:center;height:0;overflow:hidden;transition:height .15s;pointer-events:none}.pull-indicator.visible{height:44px}.pull-indicator .spinner{width:20px;height:20px;border:2.5px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
.unread-badge{margin-left:auto;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;flex-shrink:0;line-height:16px}
.unread-dot{position:absolute;top:0;right:0;width:8px;height:8px;background:var(--accent);border-radius:50%;border:2px solid var(--bg-secondary)}
.video-card-menu{position:relative}
.video-card-dropdown{position:absolute;right:0;top:calc(100% + 4px);z-index:100;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:4px 0;min-width:180px;box-shadow:var(--shadow-float)}
.video-card-dropdown-item{display:flex;align-items:center;gap:10px;width:100%;padding:8px 14px;background:none;border:none;color:var(--text-secondary);font-size:12.5px;cursor:pointer;text-align:left;font-family:var(--font-body);transition:var(--tr)}.video-card-dropdown-item:hover{background:var(--bg-hover);color:var(--text-primary)}.video-card-dropdown-item.danger{color:var(--accent)}.video-card-dropdown-item.danger:hover{background:rgba(226,61,76,.08)}
.video-card-title.watched{color:var(--text-muted)}
@media(max-width:768px){.filter-bar{padding:0 14px;gap:8px}.filter-right{display:none}.feed-topbar{display:none !important}}
`
export default css
