import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Hls from 'hls.js'
import { API, thumbUrl, fmtDur, fmtViews, fmtDate, timeAgo, jsonEq, parseTimestamps, daysLabel, daysSince, pct as pctFn, isWatched as isWatchedFn, shuffle, apiFetch, authHeaders } from './utils'
import { I } from './icons'
import css from './styles'
import { Av } from './components/Avatar'
import { VideoCard } from './components/VideoCard'
import { DownloadCard } from './components/DownloadCard'
import { SidebarContent } from './components/Sidebar'
import { SettingsPanel } from './components/SettingsPanel'
import { BrowseView } from './components/BrowseView'
import { AddChannelModal } from './components/AddChannelModal'
import { CustomPlayer } from './components/CustomPlayer'
import { FilterBar } from './components/FilterBar'
import { PlaylistView, PlaylistModal } from './components/PlaylistView'

export default function App() {
  const [view, setView] = useState('feed')
  const [channels, setCh] = useState([])
  const [videos, setVids] = useState([])
  const [sortVids, setSortVids] = useState([])
  const [vidMeta, setVidMeta] = useState({ total: 0, pages: 1, page: 1 })
  const [feedPage, setFeedPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [settings, setS] = useState({ quality: '720', skip_shorts: true, check_interval: 60, max_concurrent: 1, max_video_duration: 60 })
  const [cur, setCur] = useState(null)
  const [chFilter, setChF] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addUrl, setAddUrl] = useState('')
  const [addMode, setAddMode] = useState('all')
  const [addMaxDays, setAddMaxDays] = useState(0)
  const [addErr, setAddErr] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [editCh, setEditCh] = useState(null)
  const [dls, setDls] = useState([])
  const [wp, setWp] = useState({})
  const [showGhosts, setShowGhosts] = useState(true)
  const [confirmRedownload, setConfirmRedownload] = useState(null)
  const [browseCh, setBrowseCh] = useState(null)
  const [browseVids, setBrowseVids] = useState([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseSelected, setBrowseSelected] = useState(new Set())
  const [browseDownloading, setBrowseDownloading] = useState(false)
  const [cwSelected, setCwSelected] = useState(new Set())
  const [cwSelectMode, setCwSelectMode] = useState(false)
  const [feedFilter, setFeedFilter] = useState('All')
  const [feedSort, setFeedSort] = useState('date')
  const [feedSearch, setFeedSearch] = useState('')
  const [hiddenVids, setHiddenVids] = useState(new Set())
  const [confirmMarkAll, setConfirmMarkAll] = useState(false)
  const confirmMarkAllRef = useRef(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sb_collapsed') === 'true')
  const toggleSidebar = () => setSidebarCollapsed(p => { localStorage.setItem('sb_collapsed', !p); return !p })
  const [settingsPage, setSettingsPage] = useState('downloads')
  const changeSettingsPage = (tab) => {
    setSettingsPage(tab)
    history.replaceState({ view: 'settings', settingsPage: tab }, '', '#settings/' + tab)
  }
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showChapters, setShowChapters] = useState(false)
  const [activeChapterIdx, setActiveChapterIdx] = useState(-1)
  const activeChapterIdxRef = useRef(-1)
  const [showDesc, setShowDesc] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [sponsorSegs, setSponsorSegs] = useState([])
  const [showSegs, setShowSegs] = useState(false)
  const [scrolledDown, setScrolledDown] = useState(false)
  const [seenVids, setSeenVids] = useState(() => new Set(JSON.parse(localStorage.getItem('seenVids') || '[]')))
  const [showOneOff, setShowOneOff] = useState(false)
  const [oneOffUrl, setOneOffUrl] = useState('')
  const [oneOffStatus, setOneOffStatus] = useState('')
  const [newCounts, setNewCounts] = useState({})
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStartY = useRef(null)
  const [playbackQ, setPlaybackQ] = useState('original')
  const [subtitleSrc, setSubtitleSrc] = useState(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [pipSupported, setPipSupported] = useState(false)
  const [origHeight, setOrigHeight] = useState(0)
  const [storyboard, setStoryboard] = useState(null)
  const [continueVids, setContinueVids] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [activePlaylist, setActivePlaylist] = useState(null)
  const [playlistQueue, setPlaylistQueue] = useState([])
  const [playlistQueueIdx, setPlaylistQueueIdx] = useState(-1)
  const [showPlaylistModal, setShowPlaylistModal] = useState(null)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [rejectedCount, setRejectedCount] = useState(0)
  const [watchLaterCount, setWatchLaterCount] = useState(0)
  const [rejectedVids, setRejectedVids] = useState([])
  const [watchLaterVids, setWatchLaterVids] = useState([])
  const [dearrowCache, setDearrowCache] = useState({})
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [feedQueue, setFeedQueue] = useState([])
  const [feedQueueIdx, setFeedQueueIdx] = useState(-1)
  const useCustomPlayer = settings.player_mode === 'custom'
  const vRef = useRef(null)
  const saveT = useRef(null)
  useEffect(() => { if (vRef.current && settings.volume !== undefined) vRef.current.volume = settings.volume }, [settings.volume])
  const volTimer = useRef(null)
  const contentRef = useRef(null)
  const watchScrollRef = useRef(null)
  const sidebarNavRef = useRef(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)

  // Native player: landscape → fullscreen; exit fullscreen → lock portrait
  useEffect(() => {
    if (useCustomPlayer) return
    const v = vRef.current
    if (!v || !isMobile) return

    const goLandscape = () => {
      const vid = vRef.current
      if (!vid || vid.paused) return
      if (document.fullscreenElement || document.webkitFullscreenElement) return
      if (!window.matchMedia('(orientation: landscape)').matches) return
      if (vid.requestFullscreen) vid.requestFullscreen().catch(() => {})
      else if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen()
    }

    const onOrientation = () => setTimeout(goLandscape, 300)
    const onPlay = () => setTimeout(goLandscape, 300)

    window.addEventListener('orientationchange', onOrientation)
    window.addEventListener('resize', onOrientation)
    v.addEventListener('play', onPlay)
    return () => {
      window.removeEventListener('orientationchange', onOrientation)
      window.removeEventListener('resize', onOrientation)
      v.removeEventListener('play', onPlay)
    }
  }, [useCustomPlayer, isMobile, cur?.id])

  // Native player: exiting fullscreen → lock portrait
  useEffect(() => {
    if (useCustomPlayer) return
    const onChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (screen.orientation?.lock) screen.orientation.lock('portrait').catch(() => {})
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [useCustomPlayer])

  const chFilterRef = useRef(chFilter)
  useEffect(() => { chFilterRef.current = chFilter }, [chFilter])
  const feedPageRef = useRef(feedPage)
  useEffect(() => { feedPageRef.current = feedPage }, [feedPage])
  const wpRef = useRef(wp)
  useEffect(() => { wpRef.current = wp }, [wp])
  const lastWatchTimeRef = useRef(0)
  const pendingWatchSecondsRef = useRef(0)

  const smartSet = setter => d => setter(prev => jsonEq(prev, d) ? prev : d)
  const fCh = useCallback(async () => { try { const r = await fetch(`${API}/api/channels`); if (r.ok) smartSet(setCh)(await r.json()) } catch (e) { console.error('Failed to fetch channels:', e) } }, [])
  const fV = useCallback(async (c, pg = 1, append = false, perPage = 100) => {
    try {
      const params = new URLSearchParams({ per_page: String(perPage), page: String(pg), status: 'active', ...(c ? { channel_id: c } : {}) })
      const r = await fetch(`${API}/api/videos?${params}`)
      if (r.ok) {
        const d = await r.json()
        const vlist = d.videos || []
        const meta = { total: d.total, pages: d.pages, page: d.page }
        if (append) { setVids(prev => [...prev, ...vlist.filter(v => !prev.find(p => p.id === v.id))]) }
        else { smartSet(setVids)(vlist) }
        setVidMeta(meta)
      }
    } catch (e) { console.error('Failed to fetch videos:', e) }
  }, [])
  const fPool = useCallback(async () => { try { const r = await fetch(`${API}/api/videos?per_page=500&page=1`); if (r.ok) { const d = await r.json(); smartSet(setSortVids)(d.videos || []) } } catch (e) { console.error('Failed to fetch video pool:', e) } }, [])
  const fD = useCallback(async c => { try { const r = await fetch(`${API}/api/downloads${c ? `?channel_id=${c}` : ''}`); if (r.ok) smartSet(setDls)(await r.json()) } catch (e) { console.error('Failed to fetch downloads:', e) } }, [])
  const fS = useCallback(async () => { try { const r = await fetch(`${API}/api/settings`); if (r.ok) smartSet(setS)(await r.json()) } catch (e) { console.error('Failed to fetch settings:', e) } }, [])
  const fWp = useCallback(async () => { try { const r = await fetch(`${API}/api/progress`); if (r.ok) smartSet(setWp)(await r.json()) } catch (e) { console.error('Failed to fetch watch progress:', e) } }, [])
  const fNewCounts = useCallback(async () => {
    try { const r = await fetch(`${API}/api/new-counts`); if (r.ok) smartSet(setNewCounts)(await r.json()) } catch (e) { console.error('Failed to fetch new counts:', e) }
  }, [])
  const fSeen = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/seen`)
      if (r.ok) {
        const serverIds = await r.json()
        setSeenVids(prev => {
          const localOnly = [...prev].filter(id => !serverIds.includes(id))
          if (localOnly.length > 0) {
            apiFetch(`${API}/api/seen`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localOnly) }).catch(() => {})
          }
          const merged = new Set([...prev, ...serverIds])
          localStorage.setItem('seenVids', JSON.stringify([...merged]))
          return merged
        })
      }
    } catch (e) { console.error('Failed to fetch seen videos:', e) }
  }, [])
  const fRejected = useCallback(async () => {
    try { const r = await fetch(`${API}/api/videos/rejected?per_page=1`); if (r.ok) { const d = await r.json(); setRejectedCount(d.total || 0) } } catch (e) {}
  }, [])
  const fWatchLater = useCallback(async () => {
    try { const r = await fetch(`${API}/api/watch-later`); if (r.ok) { const d = await r.json(); setWatchLaterCount((d.videos || []).length) } } catch (e) {}
  }, [])

  const fContinue = useCallback(async () => {
    try { const r = await fetch(`${API}/api/continue`); if (r.ok) smartSet(setContinueVids)(await r.json()) } catch (e) { console.error('Failed to fetch continue watching:', e) }
  }, [])

  const fPlaylists = useCallback(async () => {
    try { const r = await fetch(`${API}/api/playlists`); if (r.ok) smartSet(setPlaylists)(await r.json()) } catch (e) { console.error('Failed to fetch playlists:', e) }
  }, [])

  useEffect(() => {
    fCh(); fV(null, 1); fPool(); fD(); fS(); fWp(); fSeen(); fNewCounts(); fContinue(); fPlaylists()
    const s = setInterval(() => { fV(chFilterRef.current, 1, false, feedPageRef.current * 100); fCh(); fWp(); fNewCounts(); fRejected(); fWatchLater() }, 15e3)
    const f = setInterval(() => fD(chFilterRef.current), 2e3)
    return () => { clearInterval(s); clearInterval(f) }
  }, [])
  useEffect(() => { setFeedPage(1); fV(chFilter, 1); fD(chFilter) }, [chFilter])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => { if (settings.playback_quality) setPlaybackQ(settings.playback_quality) }, [settings.playback_quality])
  useEffect(() => { if (settings.feed_filter) setFeedFilter(settings.feed_filter) }, [settings.feed_filter])
  useEffect(() => { if (settings.feed_sort) setFeedSort(settings.feed_sort) }, [settings.feed_sort])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const onScroll = () => { setScrolledDown(el.scrollTop > 30 && view === 'watch') }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [view])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const THRESHOLD = 65
    const onStart = e => {
      if (view !== 'feed' || el.scrollTop > 0) return
      pullStartY.current = e.touches[0].clientY
    }
    const onMove = e => {
      if (pullStartY.current === null) return
      const dy = e.touches[0].clientY - pullStartY.current
      if (dy <= 0) { pullStartY.current = null; setPullY(0); return }
      setPullY(Math.min(dy, THRESHOLD))
    }
    const onEnd = async () => {
      if (pullStartY.current === null) return
      const triggered = pullY >= THRESHOLD
      pullStartY.current = null
      setPullY(0)
      if (!triggered) return
      setRefreshing(true)
      await Promise.all([fV(chFilter), fCh(), fWp(), fSeen()])
      setRefreshing(false)
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [view, pullY, chFilter, fV, fCh, fWp])

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash.startsWith('watch/')) {
      const videoId = hash.slice(6)
      if (videoId) {
        setView('watch')
        fetch(`${API}/api/videos/${videoId}`).then(r => r.ok ? r.json() : null).then(v => { if (v) setCur(v) }).catch(() => {})
        history.replaceState({ view: 'watch', videoId }, '', `#watch/${videoId}`)
      } else {
        history.replaceState({ view: 'feed' }, '', '#feed')
      }
    } else if (hash.startsWith('settings')) {
      const sub = hash.replace('settings', '').replace('/', '')
      const validTabs = ['downloads', 'playback', 'channels', 'tags', 'rules', 'appearance', 'system']
      setSettingsPage(validTabs.includes(sub) ? sub : 'downloads')
      setView('settings'); history.replaceState({ view: 'settings', settingsPage: sub || 'downloads' }, '', '#' + hash)
    } else if (hash.startsWith('browse/')) {
      const cid = hash.slice(7)
      if (cid) {
        setView('browse')
        fetch(`${API}/api/channels/${cid}/browse?max=100`).then(r => r.ok ? r.json() : []).then(d => { setBrowseVids(d); setBrowseCh({ id: cid, name: cid }) }).catch(() => {})
        history.replaceState({ view: 'browse', chId: cid }, '', `#browse/${cid}`)
      }
    } else if (hash.startsWith('playlist/')) {
      const plId = hash.slice(9)
      if (plId) { setView('playlist'); setActivePlaylist(plId); history.replaceState({ view: 'playlist', playlistId: plId }, '', `#playlist/${plId}`) }
    } else if (hash === 'rejected') {
      setView('rejected')
      fetch(`${API}/api/videos/rejected?per_page=100`).then(r => r.ok ? r.json() : { videos: [] }).then(d => setRejectedVids(d.videos || [])).catch(() => {})
      history.replaceState({ view: 'rejected' }, '', '#rejected')
    } else if (hash === 'watch-later') {
      setView('watch-later')
      fetch(`${API}/api/watch-later`).then(r => r.ok ? r.json() : { videos: [] }).then(d => setWatchLaterVids(d.videos || [])).catch(() => {})
      history.replaceState({ view: 'watch-later' }, '', '#watch-later')
    } else if (hash.startsWith('feed/')) {
      const cid = hash.slice(5)
      if (cid) { setView('feed'); setChF(cid) }
      history.replaceState({ view: 'feed', chFilter: cid }, '', `#feed/${cid}`)
    } else {
      history.replaceState({ view: 'feed' }, '', '#feed')
    }
    const onPop = e => {
      const st = e.state
      if (st) {
        setView(st.view || 'feed'); setChF(st.chFilter || null)
        if (st.view === 'settings' && st.settingsPage) {
          setSettingsPage(st.settingsPage)
        }
        if (st.view === 'watch' && st.videoId) {
          fetch(`${API}/api/videos/${st.videoId}`).then(r => r.ok ? r.json() : null).then(v => { if (v) setCur(v) }).catch(() => {})
        }
        if (st.view === 'rejected') {
          fetch(`${API}/api/videos/rejected?per_page=100`).then(r => r.ok ? r.json() : { videos: [] }).then(d => setRejectedVids(d.videos || [])).catch(() => {})
        }
        if (st.view === 'watch-later') {
          fetch(`${API}/api/watch-later`).then(r => r.ok ? r.json() : { videos: [] }).then(d => setWatchLaterVids(d.videos || [])).catch(() => {})
        }
        if (st.view === 'playlist' && st.playlistId) {
          setActivePlaylist(st.playlistId)
        }
        setMobileMenu(false); setSearchMode(false)
      } else {
        setView('feed'); setChF(null); setCur(null); setMobileMenu(false); setSearchMode(false)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const saveProg = useCallback((vid, t) => {
    if (!vid || t === undefined || t === null || t < 0) return
    const url = `${API}/api/progress/${vid}`
    const body = JSON.stringify({ time: t })
    const headers = { 'Content-Type': 'application/json', ...authHeaders() }
    if (document.visibilityState === 'hidden' || !document.hasFocus()) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    } else {
      apiFetch(url, { method: 'PUT', headers, body }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const v = vRef.current
    if (!v || !cur) return
    lastWatchTimeRef.current = v.currentTime
    pendingWatchSecondsRef.current = 0
    const isStandalone = window.navigator.standalone === true
    const standardPip = !!(document.pictureInPictureEnabled && !v.disablePictureInPicture)
    const webkitPip = typeof v.webkitSetPresentationMode === 'function'
    setPipSupported(!isStandalone && (standardPip || webkitPip))

    const flushWatch = () => {
      const secs = Math.round(pendingWatchSecondsRef.current)
      if (secs <= 0) return
      pendingWatchSecondsRef.current = 0
      const url = `${API}/api/watch-stats`
      const body = JSON.stringify({ seconds: secs })
      const headers = { 'Content-Type': 'application/json', ...authHeaders() }
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      } else {
        apiFetch(url, { method: 'POST', headers, body }).catch(() => {})
      }
    }

    const onT = () => {
      const now = v.currentTime
      const chs = chaptersRef.current
      if (chs.length > 0) {
        let idx = -1
        for (let i = chs.length - 1; i >= 0; i--) { if (now >= chs[i].time) { idx = i; break } }
        if (idx !== activeChapterIdxRef.current) { activeChapterIdxRef.current = idx; setActiveChapterIdx(idx) }
      }
      const delta = now - lastWatchTimeRef.current
      lastWatchTimeRef.current = now
      if (delta > 0 && delta <= 3) {
        pendingWatchSecondsRef.current += delta
        if (pendingWatchSecondsRef.current >= 10) flushWatch()
      }
      clearTimeout(saveT.current)
      saveT.current = setTimeout(() => { saveProg(cur.id, v.currentTime); setWp(p => ({ ...p, [cur.id]: v.currentTime })) }, 3e3)
    }
    const onP = () => { saveProg(cur.id, v.currentTime); setWp(p => ({ ...p, [cur.id]: v.currentTime })); flushWatch() }
    const onE = () => {
      const d = cur.duration || v.duration; saveProg(cur.id, d)
      flushWatch()
      setWp(p => {
        const next = { ...p, [cur.id]: d }
        const keys = Object.keys(next)
        if (keys.length > 500) {
          const keep = new Set(keys.slice(keys.length - 250))
          return Object.fromEntries(Object.entries(next).filter(([k]) => keep.has(k)))
        }
        return next
      })
    }
    const onVol = () => { clearTimeout(volTimer.current); volTimer.current = setTimeout(() => updS({ volume: v.volume }), 500) }
    const onWait = () => setIsBuffering(true)
    const onPlay = () => setIsBuffering(false)
    const onCanPlay = () => setIsBuffering(false)
    v.addEventListener('timeupdate', onT); v.addEventListener('pause', onP)
    v.addEventListener('ended', onE); v.addEventListener('volumechange', onVol)
    v.addEventListener('waiting', onWait); v.addEventListener('playing', onPlay)
    v.addEventListener('canplay', onCanPlay)
    return () => {
      v.removeEventListener('timeupdate', onT); v.removeEventListener('pause', onP)
      v.removeEventListener('ended', onE); v.removeEventListener('volumechange', onVol)
      v.removeEventListener('waiting', onWait); v.removeEventListener('playing', onPlay)
      v.removeEventListener('canplay', onCanPlay)
      clearTimeout(saveT.current); clearTimeout(volTimer.current)
      if (v.currentTime > 2) saveProg(cur.id, v.currentTime)
      flushWatch()
    }
  }, [cur, saveProg])

  useEffect(() => {
    const onUnload = () => {
      if (cur && playbackQ && playbackQ !== 'original')
        fetch(`${API}/api/hls/${cur.id}/${playbackQ}/stop`, { method: 'POST', headers: authHeaders() }).catch(() => {})
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [cur, playbackQ])

  const pendingSeekRef = useRef(null)
  const hlsRef = useRef(null)

  const changeQuality = q => {
    const v = vRef.current
    if (v) pendingSeekRef.current = v.currentTime
    setPlaybackQ(q); updS({ playback_quality: q })
  }

  useEffect(() => {
    const v = vRef.current
    if (!v || !cur) return
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; v.pause() }
    if (!playbackQ || playbackQ === 'original') {
      v.src = `/media/${cur.file_path}`; v.load()
    } else {
      const hlsUrl = `${API}/api/hls/${cur.id}/${playbackQ}/index.m3u8`
      if (Hls.isSupported()) {
        const pending = pendingSeekRef.current
        const saved = wpRef.current[cur.id] || 0
        const dur = v.duration || cur.duration || 0
        const seekTarget = (pending && pending > 2) ? pending : (saved > 2 && dur > 0 && saved / dur < 0.95 ? saved : 0)
        const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60, enableWorker: true, startPosition: seekTarget > 0 ? seekTarget : -1, maxBufferHole: 2, maxFragLookUpTolerance: 0.5 })
        hls.loadSource(hlsUrl); hls.startLoad(-1); hls.attachMedia(v)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (seekTarget > 0) {
            const doSeek = () => { v.currentTime = seekTarget; pendingSeekRef.current = null }
            if (v.readyState >= 2) doSeek()
            else v.addEventListener('canplay', doSeek, { once: true })
          }
          if (settings.autoplay !== false) v.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (evt, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break
              case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break
              default: hls.destroy(); break
            }
          }
        })
        hlsRef.current = hls
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = hlsUrl; v.load()
        if (settings.autoplay !== false) v.addEventListener('loadedmetadata', () => v.play().catch(() => {}), { once: true })
      }
    }
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
      if (playbackQ && playbackQ !== 'original' && cur)
        apiFetch(`${API}/api/hls/${cur.id}/${playbackQ}/stop`, { method: 'POST' }).catch(() => {})
    }
  }, [cur?.id, playbackQ])

  const onLoaded = useCallback(() => {
    if (!vRef.current || !cur) return
    const v = vRef.current
    let didSeek = false
    if (!playbackQ || playbackQ === 'original') {
      const p = pendingSeekRef.current
      if (p && p > 2) { v.currentTime = p; pendingSeekRef.current = null; didSeek = true }
      else { const s = wp[cur.id] || 0, d = v.duration || cur.duration || 0; if (s > 2 && d > 0 && s / d < .95) { v.currentTime = s; didSeek = true } }
    }
    const sv = settings.volume; if (sv !== undefined && sv !== null) v.volume = sv
    if (didSeek && settings.autoplay !== false) v.play().catch(() => {})
  }, [cur, wp, settings.volume, settings.autoplay, playbackQ])

  const addChannel = async () => {
    if (!addUrl.trim()) return
    setAddLoading(true); setAddErr('')
    try {
      const r = await apiFetch(`${API}/api/channels`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: addUrl, download_mode: addMode, max_days_old: addMaxDays || 0 }) })
      const d = await r.json()
      if (!r.ok) { setAddErr(d.error || 'Failed'); return }
      setAddUrl(''); setAddMode('all'); setAddMaxDays(0); setShowAdd(false); fCh(); setTimeout(() => fV(chFilter), 3e3)
    } catch (e) { setAddErr('Network error') } finally { setAddLoading(false) }
  }
  const rmCh = async id => { if (!confirm('Remove channel and videos?')) return; try { await apiFetch(`${API}/api/channels/${id}`, { method: 'DELETE' }); fCh(); fV(chFilter) } catch (e) { console.error('Failed to delete channel:', e) } }
  const updCh = async (cid, p) => { try { await apiFetch(`${API}/api/channels/${cid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }); fCh() } catch (e) { console.error('Failed to update channel:', e) } }
  const pendingSettingsRef = useRef(null)
  const saveTimerRef = useRef(null)

  const updS = useCallback(p => {
    setS(prev => {
      const next = { ...prev, ...p }
      pendingSettingsRef.current = next
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const toSave = pendingSettingsRef.current
        pendingSettingsRef.current = null
        if (toSave) {
          apiFetch(`${API}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSave) })
            .catch(e => console.error('Failed to save settings:', e))
        }
      }, 300)
      return next
    })
  }, [])
  const checkNow = async () => { setChecking(true); try { await apiFetch(`${API}/api/check-now`, { method: 'POST' }) } catch (e) { console.error('Failed to trigger check:', e) } setTimeout(() => { fV(chFilter); setChecking(false) }, 5e3) }
  const cancelDl = async vid => { try { await apiFetch(`${API}/api/downloads/${vid}/cancel`, { method: 'POST' }); fD(chFilter) } catch (e) { console.error('Failed to cancel download:', e) } }
  const cancelAll = async () => { try { await apiFetch(`${API}/api/downloads/cancel-all`, { method: 'POST' }); fD(chFilter) } catch (e) { console.error('Failed to cancel all downloads:', e) } }

  const goHome = () => { setView('feed'); setChF(null); setCur(null); setMobileMenu(false); setSearchMode(false); setActivePlaylist(null); history.pushState({ view: 'feed' }, '', '#feed') }
  const navTo = (v, cf) => {
    const savedScroll = sidebarNavRef.current?.scrollTop || 0
    setView(v); setChF(cf); setMobileMenu(false); setSearchMode(false)
    if (v !== 'playlist') setActivePlaylist(null)
    if (v === 'rejected') fetch(`${API}/api/videos/rejected?per_page=100`).then(r => r.ok ? r.json() : { videos: [] }).then(d => setRejectedVids(d.videos || [])).catch(() => {})
    if (v === 'watch-later') fetch(`${API}/api/watch-later`).then(r => r.ok ? r.json() : { videos: [] }).then(d => setWatchLaterVids(d.videos || [])).catch(() => {})
    const hash = v === 'settings' ? `#settings/${settingsPage}` : `#${v}${cf ? '/' + cf : ''}`
    history.pushState({ view: v, chFilter: cf, settingsPage: v === 'settings' ? settingsPage : undefined }, '', hash)
    requestAnimationFrame(() => { if (sidebarNavRef.current) sidebarNavRef.current.scrollTop = savedScroll })
  }
  const playAll = (vids, startIdx = 0) => {
    setPlaylistQueue(vids)
    setPlaylistQueueIdx(startIdx)
    if (vids.length > 0) watch(vids[startIdx], 'queue')
  }
  const playNext = () => {
    if (playlistQueueIdx < playlistQueue.length - 1) {
      const next = playlistQueueIdx + 1
      setPlaylistQueueIdx(next)
      watch(playlistQueue[next], 'queue')
    } else if (feedQueueIdx < feedQueue.length - 1) {
      const next = feedQueueIdx + 1
      setFeedQueueIdx(next)
      watch(feedQueue[next], 'feed-queue')
    }
  }
  const playPrev = () => {
    if (playlistQueueIdx > 0) {
      const prev = playlistQueueIdx - 1
      setPlaylistQueueIdx(prev)
      watch(playlistQueue[prev], 'queue')
    } else if (feedQueueIdx > 0) {
      const prev = feedQueueIdx - 1
      setFeedQueueIdx(prev)
      watch(feedQueue[prev], 'feed-queue')
    }
  }
  const watch = (v, ctx) => {
    if (ctx !== 'queue' && ctx !== 'feed-queue') {
      setPlaylistQueue([])
      setPlaylistQueueIdx(-1)
      setFeedQueue([])
      setFeedQueueIdx(-1)
    }
    setIsBuffering(false)
    setComments([]); setShowComments(false); setCommentsLoading(false)
    if (!v.ghost && !settings.incognito) {
      setSeenVids(prev => {
        if (prev.has(v.id)) return prev
        const next = new Set(prev); next.add(v.id)
        localStorage.setItem('seenVids', JSON.stringify([...next]))
        fetch(`${API}/api/seen`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify([v.id]) })
          .then(() => fNewCounts())
          .catch(() => {})
        return next
      })
      setCur(v); setView('watch'); setMobileMenu(false); setSearchMode(false)
      setShowChapters(false); setShowDesc(false); setShowSegs(false); setScrolledDown(false)
      history.pushState({ view: 'watch', videoId: v.id }, '', '#watch/' + v.id)
      requestAnimationFrame(() => { contentRef.current?.scrollTo(0, 0); watchScrollRef.current?.scrollTo(0, 0) })
      if (settings.dearrow_enabled && !dearrowCache[v.id]) {
        fetch(`${API}/api/dearrow/${v.id}`).then(r => r.ok ? r.json() : {}).then(d => {
          if (d.title || d.thumbnail) setDearrowCache(prev => ({ ...prev, [v.id]: d }))
        }).catch(() => {})
      }
      if (settings.comments_enabled) {
        setCommentsLoading(true)
        fetch(`${API}/api/comments/${v.id}`).then(r => r.ok ? r.json() : {}).then(d => {
          if (d.comments?.length) setComments(d.comments)
          setCommentsLoading(false)
        }).catch(() => { setCommentsLoading(false) })
      }
      const ch = channels.find(c => c.id === v.channel_id)
      if (ch?.playback_speed && ch.playback_speed !== 1 && vRef.current) {
        vRef.current.playbackRate = ch.playback_speed
      }
    }
  }
  const seekTo = t => { if (vRef.current) { vRef.current.currentTime = t; vRef.current.play() } }

  const submitOneOff = async () => {
    if (!oneOffUrl.trim()) return
    setOneOffStatus('Queuing…')
    try {
      const r = await apiFetch(`${API}/api/downloads/oneoff`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: oneOffUrl }),
      })
      const d = await r.json()
      if (r.ok) {
        setOneOffStatus('Download queued!')
        setOneOffUrl('')
        fD(chFilter); fCh()
        setTimeout(() => { setShowOneOff(false); setOneOffStatus('') }, 1500)
      } else {
        setOneOffStatus(d.error || 'Error')
      }
    } catch { setOneOffStatus('Error') }
  }

  const deleteVideo = async (e, vid) => { e.stopPropagation(); if (!confirm('Delete this video?')) return; try { await apiFetch(`${API}/api/videos/${vid}`, { method: 'DELETE' }); fV(chFilter) } catch (e) { console.error('Failed to delete video:', e) } }
  const redownloadVideo = async v => { setConfirmRedownload(null); try { await apiFetch(`${API}/api/videos/${v.id}/restore`, { method: 'POST' }); fV(chFilter); fD(chFilter) } catch (e) { console.error('Failed to restore video:', e) } }

  const openBrowse = async ch => {
    setBrowseCh(ch); setBrowseVids([]); setBrowseSelected(new Set()); setBrowseLoading(true)
    setView('browse'); setMobileMenu(false); history.pushState({ view: 'browse', chId: ch.id }, '', '#browse/' + ch.id)
    try { const r = await fetch(`${API}/api/channels/${ch.id}/browse?max=100`); if (r.ok) setBrowseVids(await r.json()) } catch (e) {}
    setBrowseLoading(false)
  }
  const toggleBrowseSelect = (vid, status) => {
    if (status === 'downloaded' || status === 'downloading') return
    setBrowseSelected(s => { const n = new Set(s); if (n.has(vid)) n.delete(vid); else n.add(vid); return n })
  }
  const downloadSelected = async () => {
    if (browseSelected.size === 0 || !browseCh) return
    const ids = [...browseSelected]
    setBrowseSelected(new Set())
    setBrowseDownloading(true)
    try { await apiFetch(`${API}/api/videos/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video_ids: ids, channel_id: browseCh.id }) }) } catch (e) { console.error('Failed to queue downloads:', e) }
    setBrowseDownloading(false)
    try { const r = await fetch(`${API}/api/channels/${browseCh.id}/browse?max=100`); if (r.ok) setBrowseVids(await r.json()) } catch (e) {}
    fD(chFilter)
  }
  const selectAllAvailable = () => setBrowseSelected(new Set(browseVids.filter(v => v.status === 'available').map(v => v.id)))

  const searchTimerRef = useRef(null)
  const doSearch = useCallback(q => {
    setSearchQ(q)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!q.trim()) { setSearchResults([]); return }
    searchTimerRef.current = setTimeout(async () => {
      try { const r = await fetch(`${API}/api/videos/search?q=${encodeURIComponent(q)}`); if (r.ok) setSearchResults(await r.json()) } catch (e) { console.error('Search failed:', e) }
    }, 300)
  }, [])

  const pct = v => pctFn(v, wp)
  const isWatched = v => isWatchedFn(v, wp)

  const chVids = useMemo(() => {
    if (!cur) return []
    const pool = videos.filter(v => v.channel_id === cur.channel_id && !v.ghost && v.id !== cur.id)
    return shuffle(pool).slice(0, 6)
  }, [cur, videos])
  const recommendations = useMemo(() => {
    if (!cur) return []
    return shuffle(sortVids.filter(v => v.channel_id !== cur.channel_id && !v.ghost)).slice(0, 8)
  }, [cur, sortVids])
  const feedVideos = useMemo(() => [...videos.filter(v => !v.ghost), ...(showGhosts ? videos.filter(v => v.ghost) : [])], [videos, showGhosts])
  const ghostCount = useMemo(() => videos.filter(v => v.ghost).length, [videos])

  useEffect(() => {
    if (!confirmMarkAll) return
    const handler = e => { if (confirmMarkAllRef.current && !confirmMarkAllRef.current.contains(e.target)) setConfirmMarkAll(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [confirmMarkAll])

  const filteredAndSortedFeed = useMemo(() => {
    const currentWp = wpRef.current
    let list = feedVideos.filter(v => !hiddenVids.has(v.id) && v.status !== 'rejected')
    if (feedSearch.trim()) {
      const q = feedSearch.toLowerCase()
      list = list.filter(v => v.title?.toLowerCase().includes(q) || v.channel_name?.toLowerCase().includes(q))
    }
    if (feedFilter === 'New') {
      const days = settings.new_badge_days ?? 2
      list = list.filter(v => !isWatchedFn(v, currentWp) && !seenVids.has(v.id) && v.downloaded_at && (Date.now() - new Date(v.downloaded_at).getTime()) < days * 86400000)
    } else if (feedFilter === 'Today') {
      list = list.filter(v => daysSince(v.upload_date || v.downloaded_at) === 0)
    } else if (feedFilter === 'This week') {
      list = list.filter(v => daysSince(v.upload_date || v.downloaded_at) < 7)
    } else if (feedFilter === 'Unwatched') {
      list = list.filter(v => !isWatchedFn(v, currentWp))
    } else if (feedFilter === 'In progress') {
      list = list.filter(v => { const p = pctFn(v, currentWp); return p > 0 && p < 95 })
    }
    if (feedSort === 'views') {
      list = [...list].sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    } else if (feedSort === 'channel') {
      list = [...list].sort((a, b) => (a.channel_name || '').localeCompare(b.channel_name || ''))
    } else {
      list = [...list].sort((a, b) => (b.downloaded_at || '').localeCompare(a.downloaded_at || ''))
    }
    return list
  }, [feedVideos, feedFilter, feedSort, feedSearch, hiddenVids, seenVids, settings.new_badge_days])

  const visibleContinueVids = useMemo(() => {
    return continueVids.filter(v => {
      const t = wp[v.id]
      const d = v.duration
      return !(t && d && t / d >= 0.95)
    })
  }, [continueVids, wp])

  const watchFromFeed = useCallback((v) => {
    const idx = filteredAndSortedFeed.findIndex(x => x.id === v.id)
    if (idx >= 0) {
      setFeedQueue(filteredAndSortedFeed)
      setFeedQueueIdx(idx)
    }
    watch(v)
  }, [filteredAndSortedFeed])

  const markVideoWatched = useCallback(v => {
    const currentWp = wpRef.current
    const t = currentWp[v.id], d = v.duration
    const watched = !!(t && d && t / d >= 0.95)
    if (watched) {
      setWp(p => ({ ...p, [v.id]: 0 }))
      saveProg(v.id, 0)
    } else if (d > 0) {
      setWp(p => ({ ...p, [v.id]: d }))
      saveProg(v.id, d)
    }
    fContinue()
  }, [saveProg, fContinue])

  const markAllWatched = useCallback(() => {
    setConfirmMarkAll(false)
    const currentWp = wpRef.current
    const newWp = { ...currentWp }
    for (const v of filteredAndSortedFeed) {
      if (!v.ghost && v.duration > 0) {
        const t = currentWp[v.id]
        if (!(t && v.duration && t / v.duration >= 0.95)) {
          newWp[v.id] = v.duration
          saveProg(v.id, v.duration)
        }
      }
    }
    setWp(newWp)
    fContinue()
  }, [filteredAndSortedFeed, saveProg, fContinue])

  const hideVideo = useCallback(id => {
    setHiddenVids(s => { const n = new Set(s); n.add(id); return n })
  }, [])
  const archiveVideo = useCallback(async (v) => {
    try {
      await apiFetch(`${API}/api/videos/${v.id}/archive`, { method: 'POST' })
      setVids(prev => prev.filter(x => x.id !== v.id))
      setRejectedCount(prev => prev + 1)
    } catch (e) { console.error('Failed to archive:', e) }
  }, [])
  const watchLaterVideo = useCallback(async (v) => {
    try {
      await apiFetch(`${API}/api/watch-later`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video_id: v.id, bucket: 'today' }) })
      setWatchLaterCount(prev => prev + 1)
    } catch (e) { console.error('Failed to add to watch later:', e) }
  }, [])
  const loadMore = useCallback(async () => {
    if (loadingMore || feedPage >= vidMeta.pages) return
    const next = feedPage + 1; setLoadingMore(true)
    await fV(chFilter, next, true); setFeedPage(next); setLoadingMore(false)
  }, [loadingMore, feedPage, vidMeta.pages, fV, chFilter])
  const filteredDls = useMemo(() => chFilter ? dls.filter(d => d.channel_id === chFilter) : dls, [dls, chFilter])
  const chapters = useMemo(() => cur ? parseTimestamps(cur.description) : [], [cur])
  const chaptersRef = useRef(chapters)
  useEffect(() => { chaptersRef.current = chapters; activeChapterIdxRef.current = -1; setActiveChapterIdx(-1) }, [chapters])
  const qualityOpts = useMemo(() => {
    const all = [{ v: 'original', l: 'Original' }, { v: '1080', l: '1080p' }, { v: '720', l: '720p' }, { v: '480', l: '480p' }, { v: '360', l: '360p' }]
    if (!origHeight || origHeight <= 0) return all
    return all.filter(o => o.v === 'original' || parseInt(o.v) < origHeight)
  }, [origHeight])
  const sortedChannels = useMemo(() => {
    const latestMap = {}
    for (const v of sortVids) {
      if (v.ghost) continue
      const ud = v.upload_date || v.downloaded_at || ''
      if (!latestMap[v.channel_id] || ud > latestMap[v.channel_id]) latestMap[v.channel_id] = ud
    }
    return [...channels].sort((a, b) => (latestMap[b.id] || '').localeCompare(latestMap[a.id] || ''))
  }, [channels, sortVids])

  useEffect(() => {
    setSponsorSegs([]); setOrigHeight(0)
    if (!cur) return
    fetch(`${API}/api/sponsorblock/${cur.id}`).then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setSponsorSegs(d) }).catch(() => {})
    fetch(`${API}/api/videos/${cur.id}/resolution`).then(r => r.ok ? r.json() : {}).then(d => setOrigHeight(d.height || 0)).catch(() => {})
  }, [cur])

  useEffect(() => {
    setSubtitleSrc(null)
    if (!cur) return
    fetch(`${API}/api/videos/${cur.id}/subtitle`, { method: 'HEAD' })
      .then(r => { if (r.ok) setSubtitleSrc(`${API}/api/videos/${cur.id}/subtitle`) })
      .catch(() => {})
  }, [cur?.id])

  // Seek-preview storyboard: 202 = still generating, poll a few times
  useEffect(() => {
    setStoryboard(null)
    if (!cur) return
    let cancelled = false, tries = 0
    const load = async () => {
      try {
        const r = await fetch(`${API}/api/videos/${cur.id}/storyboard`)
        if (cancelled) return
        if (r.status === 200) {
          const meta = await r.json()
          if (!cancelled && meta.url) setStoryboard(meta)
        } else if (r.status === 202 && tries++ < 10) {
          setTimeout(load, 5000)
        }
      } catch (e) {}
    }
    load()
    return () => { cancelled = true }
  }, [cur?.id])

  // Refresh continue-watching when returning to the feed
  useEffect(() => { if (view === 'feed') fContinue() }, [view, fContinue])

  useEffect(() => {
    const v = vRef.current
    if (!v || !chapters.length) return
    const dur = cur?.duration || 0
    if (!dur) return
    const fmt = t => { const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.000` }
    const vtt = 'WEBVTT\n\n' + chapters.map((c, i) => `${fmt(c.time)} --> ${fmt(chapters[i + 1]?.time ?? dur)}\n${c.label}`).join('\n\n')
    const url = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }))
    const track = Object.assign(document.createElement('track'), { kind: 'chapters', src: url, default: true })
    v.appendChild(track)
    return () => { try { v.removeChild(track) } catch (_) {}; URL.revokeObjectURL(url) }
  }, [chapters, cur?.id, cur?.duration])

  useEffect(() => {
    const v = vRef.current
    if (!v || !cur || settings.skip_sponsors === false || sponsorSegs.length === 0) return
    const cats = settings.sponsor_categories || ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'music_offtopic']
    const activeSegs = sponsorSegs.filter(s => cats.includes(s.category))
    if (activeSegs.length === 0) return
    const skippedRef = { last: -1 }
    const onTime = () => {
      const t = v.currentTime
      for (const seg of activeSegs) {
        const [start, end] = seg.segment || []
        if (start !== undefined && end !== undefined && t >= start && t < end - 0.5 && skippedRef.last !== start) {
          skippedRef.last = start; v.currentTime = end; break
        }
      }
    }
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [cur, sponsorSegs, settings.skip_sponsors, settings.sponsor_categories])

  const sidebarProps = {
    view, chFilter, sidebarCollapsed, setSidebarCollapsed: toggleSidebar,
    sortedChannels, newCounts, checking, navTo, setShowAdd, setMobileMenu, checkNow,
    navRef: sidebarNavRef,
    openOneOff: () => { setShowOneOff(true); setMobileMenu(false) },
    activePlaylist, playlists,
    onSelectPlaylist: (plId) => { setView('playlist'); setActivePlaylist(plId); setMobileMenu(false); history.pushState({ view: 'playlist', playlistId: plId }, '', `#playlist/${plId}`) },
    onCreatePlaylist: () => { setShowCreatePlaylist(true); setMobileMenu(false) },
    rejectedCount, watchLaterCount,
  }

  const watchSidebar = (
    <div className="watch-sidebar">
      {playlistQueue.length > 0 && <>
      <div className="watch-sidebar-header">
        <span>Now Playing</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{playlistQueueIdx + 1} / {playlistQueue.length}</span>
      </div>
      <div className="playlist-list">
        {playlistQueue.map((v, i) => {
          const p = pct(v)
          return (
            <div key={v.id} className={`playlist-item ${v.id === cur?.id ? 'active' : ''}`} onClick={() => { setPlaylistQueueIdx(i); watch(v, 'queue') }}>
              <div className="playlist-thumb">
                {v.thumbnail && <img src={thumbUrl(v.thumbnail)} alt="" loading="lazy" />}
                {v.duration > 0 && <div className="playlist-thumb-duration">{fmtDur(v.duration)}</div>}
                {p > 0 && <div className="watch-progress-bar" style={{ width: `${p}%` }} />}
              </div>
              <div className="playlist-info">
                <div className="playlist-title">{v.title}</div>
                <div className="playlist-meta">{v.channel_name}</div>
              </div>
            </div>
          )
        })}
      </div>
      </>}
      {cur?.channel_id !== 'uncategorized' && chVids.length > 0 && <>
      <div className="watch-sidebar-header">More from {cur?.channel_name}</div>
      <div className="playlist-list">
        {chVids.map(v => {
          const p = pct(v)
          return (
            <div key={v.id} className={`playlist-item ${v.id === cur?.id ? 'active' : ''}`} onClick={() => watch(v)}>
              <div className="playlist-thumb">
                {v.thumbnail && <img src={thumbUrl(v.thumbnail)} alt="" loading="lazy" />}
                {v.duration > 0 && <div className="playlist-thumb-duration">{fmtDur(v.duration)}</div>}
                {p > 0 && <div className="watch-progress-bar" style={{ width: `${p}%` }} />}
              </div>
              <div className="playlist-info">
                <div className="playlist-title">{v.title}</div>
                <div className="playlist-meta">{fmtViews(v.view_count)} · {timeAgo(v.upload_date || v.downloaded_at)}</div>
              </div>
            </div>
          )
        })}
      </div>
      </>}
      {recommendations.length > 0 && <>
        <div className="section-divider">Videos you may like</div>
        <div className="playlist-list">
          {recommendations.map(v => {
            const p = pct(v)
            return (
              <div key={v.id} className="playlist-item" onClick={() => watch(v)}>
                <div className="playlist-thumb">
                  {v.thumbnail && <img src={thumbUrl(v.thumbnail)} alt="" loading="lazy" />}
                  {v.duration > 0 && <div className="playlist-thumb-duration">{fmtDur(v.duration)}</div>}
                  {p > 0 && <div className="watch-progress-bar" style={{ width: `${p}%` }} />}
                </div>
                <div className="playlist-info">
                  <div className="playlist-title">{v.title}</div>
                  <div className="playlist-meta">{v.channel_name} · {fmtViews(v.view_count)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </>}
    </div>
  )

  const watchInfo = (
    <div className="watch-info">
      <div className="watch-title">{dearrowCache[cur?.id]?.title || cur?.title}</div>
      <div className="watch-meta">
        <a href={`https://www.youtube.com/watch?v=${cur?.id}`} target="_blank" rel="noreferrer"
           style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
          <Av src={channels.find(c => c.id === cur?.channel_id)?.thumbnail} name={cur?.channel_name || (cur?.channel_id === 'uncategorized' ? 'Uncategorized' : '?')} size={28} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{cur?.channel_name}</span>
        </a>
        <span style={{ color: 'var(--text-muted)' }}>·</span><span>{fmtViews(cur?.view_count)}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span><span>{fmtDate(cur?.upload_date)}</span>
        {!useCustomPlayer && (
          <select className="quality-dropdown" value={playbackQ} onChange={e => changeQuality(e.target.value)}>
            {qualityOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        )}
      </div>
      {sponsorSegs.length > 0 && (
        <div className="sponsor-toggle" style={{ cursor: 'pointer' }} onClick={() => setShowSegs(s => !s)}>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="sponsor-badge">SB</span> Skip sponsors ({sponsorSegs.length} segments)
          </span>
          <button className={`toggle ${settings.skip_sponsors !== false ? 'on' : ''}`} onClick={e => { e.stopPropagation(); updS({ skip_sponsors: settings.skip_sponsors === false }) }}>
            <div className="toggle-knob" />
          </button>
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>{showSegs ? '▲' : '▼'}</span>
        </div>
      )}
      {sponsorSegs.length > 0 && showSegs && (
        <div className="seg-list">
          {sponsorSegs.map((s, i) => {
            const cats = settings.sponsor_categories || ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'music_offtopic']
            const active = cats.includes(s.category)
            return (
              <div key={i} className="seg-item" style={active ? {} : { opacity: .35 }}>
                <span className="chapter-time">{fmtDur(s.segment?.[0] || 0)}</span>
                <span>→</span>
                <span className="chapter-time">{fmtDur(s.segment?.[1] || 0)}</span>
                <span className="seg-cat">{(s.category || '').replace('_', ' ')}</span>
                {!active && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>off</span>}
              </div>
            )
          })}
        </div>
      )}
      {chapters.length > 0 && <>
        <button className="chapters-toggle" onClick={() => setShowChapters(!showChapters)}>
          <I.List /> {chapters.length} chapters {showChapters ? '▲' : '▼'}
        </button>
        {showChapters && (
          <div className="chapters-list">
            {chapters.map((c, i) => (
              <div key={i} className={`chapter-item${i === activeChapterIdx ? ' active' : ''}`} onClick={() => seekTo(c.time)}>
                <span className="chapter-time">{c.display}</span>
                <span className="chapter-label">{c.label}</span>
              </div>
            ))}
          </div>
        )}
      </>}
      {cur?.description && <>
        <div className={`watch-description ${showDesc ? '' : 'collapsed'}`}>{cur.description}</div>
        {cur.description.length > 200 && (
          <button className="desc-toggle" onClick={() => setShowDesc(!showDesc)}>
            {showDesc ? 'Show less' : 'Show more'}
          </button>
        )}
      </>}
    </div>
  )

  return (
    <><style>{css}</style>
    <div className={`app density-${settings.card_density || 'comfortable'} watched-${settings.watched_style || 'dim'}`}>
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <SidebarContent {...sidebarProps} isMobileMenu={false} />
      </aside>

      {mobileMenu && (
        <div className="mobile-overlay">
          <div className="mobile-overlay-bg" onClick={() => setMobileMenu(false)} />
          <aside className="sidebar" style={{ display: 'flex' }}>
            <SidebarContent {...sidebarProps} isMobileMenu={true} />
          </aside>
        </div>
      )}

      <div className={`main${isMobile && view === 'watch' ? ' watch-active' : ''}`}>
        {/* Mobile header */}
        <div className={`mobile-header ${scrolledDown ? 'compact' : ''}${view === 'watch' ? ' hide-strip' : ''}`}>
          <div className="mobile-header-top">
            <div className="mobile-header-logo" onClick={goHome} spellCheck={false}>
              <div className="logo-icon"><I.Play /></div>
              <span style={{ color: 'var(--text-primary)' }}>Un</span>
              <span style={{ color: 'var(--accent)' }}>Tube</span>
            </div>
            <div className="mobile-header-right">
              {settings.incognito && <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>INCOGNITO</span>}
              {dls.length > 0 && <div className="checking-badge"><div className="spinner" />{dls.length}</div>}
              <button className="btn-icon btn-ghost" onClick={() => { setSearchMode(!searchMode); setSearchQ(''); setSearchResults([]) }}><I.Search /></button>
              <button className="btn-icon btn-ghost" onClick={() => setMobileMenu(true)}><I.Menu /></button>
            </div>
          </div>
          {channels.length > 0 && (
            <div className="mobile-channel-strip">
              <Av name="All" size={34} onClick={() => navTo('feed', null)} active={!chFilter && view === 'feed'} src="" icon={<I.Home />} />
              {sortedChannels.filter(c => c.id !== 'uncategorized').map(c => <Av key={c.id} src={c.thumbnail} name={c.name} size={34} onClick={() => navTo('feed', c.id)} active={chFilter === c.id} />)}
            </div>
          )}
        </div>

        {/* Top bar */}
        <div className={`topbar ${scrolledDown && view === 'watch' ? 'collapsed' : ''}${view === 'watch' ? ' watch-mobile' : ''}${view === 'feed' ? ' feed-topbar' : ''}`}>
          <div className="topbar-title">
            {view === 'browse' && (
              <button className="btn-icon" onClick={() => navTo('settings', null)} style={{ marginRight: 4 }}>
                <I.Back />
              </button>
            )}
            <span className="topbar-title-text">
              {searchMode ? 'Search'
                : view === 'settings' ? ({ downloads: 'Downloads', playback: 'Playback', channels: 'Channels', system: 'System' }[settingsPage] || 'Settings')
                : view === 'watch' ? (cur?.channel_name || 'Watch')
                : view === 'browse' ? `Browse: ${browseCh?.name || ''}`
                : view === 'playlist' ? 'Playlist'
                : chFilter ? channels.find(c => c.id === chFilter)?.name || 'Channel'
                : 'Your Feed'}
            </span>
          </div>
          <div className="topbar-actions">
            {view === 'feed' && !searchMode && (
              <>
                <span className="video-count">{filteredAndSortedFeed.filter(v => !v.ghost).length} videos</span>
                <div style={{ position: 'relative' }}>
                  {cwSelected.size > 0 ? (
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => {
                        for (const id of cwSelected) {
                          const v = visibleContinueVids.find(x => x.id === id)
                          if (v) markVideoWatched(v)
                        }
                        setCwSelected(new Set())
                      }}
                    >
                      Mark {cwSelected.size} as watched
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm"
                      onClick={() => setConfirmMarkAll(true)}
                      disabled={filteredAndSortedFeed.filter(v => !v.ghost && !isWatched(v)).length === 0}
                    >
                      Mark all as watched
                    </button>
                  )}
                  {confirmMarkAll && (
                    <div ref={confirmMarkAllRef} className="confirm-mark-all-popup">
                      <div className="confirm-mark-all-text">
                        Mark <strong>{filteredAndSortedFeed.filter(v => !v.ghost && !isWatched(v)).length} videos</strong> as watched?
                      </div>
                      <div className="confirm-mark-all-btns">
                        <button className="btn btn-sm btn-accent" onClick={markAllWatched}>Confirm</button>
                        <button className="btn btn-sm" onClick={() => setConfirmMarkAll(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {view === 'feed' && ghostCount > 0 && (
              <button className="btn btn-sm" onClick={() => setShowGhosts(!showGhosts)}>
                {showGhosts ? <I.EyeOff /> : <I.Eye />}<span className="btn-text"> {ghostCount}</span>
              </button>
            )}
            {(view === 'browse' && browseCh?.id !== 'uncategorized' && browseSelected.size > 0) || browseDownloading ? (
              <button className="btn btn-accent btn-sm" onClick={downloadSelected} disabled={browseDownloading}>
                {browseDownloading
                  ? <><span className="dl-spinner" style={{ borderTopColor: 'currentColor' }} /> Queuing…</>
                  : <><I.Download /><span className="btn-text"> {browseSelected.size}</span></>}
              </button>
            ) : null}
            {view === 'browse' && browseCh?.id !== 'uncategorized' && <button className="btn btn-sm" onClick={selectAllAvailable}>Select All</button>}
            {dls.length > 0 && <>
              <div className="checking-badge"><div className="spinner" />{dls.length}</div>
              <button className="btn btn-sm" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={cancelAll}><I.X /></button>
            </>}
            {view === 'feed' && chFilter && <button className="btn-icon btn-danger" onClick={() => rmCh(chFilter)}><I.Trash /></button>}
          </div>
        </div>

        {!searchMode && view === 'feed' && (
          <FilterBar
            filter={feedFilter}
            setFilter={f => { setFeedFilter(f); updS({ feed_filter: f }) }}
            sort={feedSort}
            setSort={s => { setFeedSort(s); updS({ feed_sort: s }) }}
            searchQ={feedSearch}
            setSearchQ={setFeedSearch}
          />
        )}

        <div className={`content${isMobile && view === 'watch' ? ' watch-active' : ''}`} ref={contentRef}>
          {/* Search */}
          {searchMode && (
            <div>
              <div className="search-bar">
                <I.Search />
                <input autoFocus placeholder="Search videos..." value={searchQ} onChange={e => doSearch(e.target.value)} />
                {searchQ && <button className="btn-icon btn-ghost" style={{ padding: 4 }} onClick={() => { setSearchQ(''); setSearchResults([]) }}><I.X /></button>}
              </div>
              {searchResults.length > 0
                ? <div className="video-grid">{searchResults.map(v => <VideoCard key={v.id} v={v} wp={wp} seenVids={seenVids} newBadgeDays={settings.new_badge_days ?? 2} onWatch={watch} onDelete={deleteVideo} onRedownload={setConfirmRedownload} onMarkWatched={markVideoWatched} onHide={hideVideo} onAddToPlaylist={setShowPlaylistModal} watchedStyle={settings.watched_style} />)}</div>
                : searchQ ? <div className="empty-state" style={{ padding: 60 }}>
                    <div className="empty-icon"><I.Search /></div>
                    <div className="empty-title">No results found</div>
                    <div className="empty-text">Try a different search term.</div>
                  </div>
                : null}
            </div>
          )}

          {/* Pull-to-refresh indicator */}
          {view === 'feed' && (
            <div className={`pull-indicator${(pullY >= 65 || refreshing) ? ' visible' : ''}`}>
              <div className="spinner" />
            </div>
          )}

          {/* Feed */}
          {!searchMode && view === 'feed' && (
            filteredAndSortedFeed.length === 0 && filteredDls.length === 0
              ? <div className="empty-state">
                  <div className="empty-icon"><I.Channel /></div>
                  <div className="empty-title">{channels.length === 0 ? 'No channels yet' : feedFilter !== 'All' || feedSearch ? 'No videos match' : 'No videos yet'}</div>
                  <div className="empty-text">{channels.length === 0 ? 'Add a YouTube channel to get started.' : feedFilter !== 'All' || feedSearch ? 'Try a different filter or search.' : 'Videos are being downloaded...'}</div>
                  {channels.length === 0 && <button className="btn btn-accent" style={{ marginTop: 24 }} onClick={() => setShowAdd(true)}><I.Plus /> Add Channel</button>}
                </div>
              : <>
                  {!chFilter && feedFilter === 'All' && !feedSearch && visibleContinueVids.length > 0 && (
                    <div className="continue-row-wrap">
                      <div className="continue-row-title">
                        Continue watching
                        {isMobile && (
                          <button className="btn btn-sm cw-select-toggle" onClick={() => {
                            if (cwSelectMode) { setCwSelectMode(false); setCwSelected(new Set()) }
                            else setCwSelectMode(true)
                          }}>{cwSelectMode ? 'Done' : 'Select'}</button>
                        )}
                      </div>
                      <div className="continue-row">
                        {visibleContinueVids.map(v => (
                          <div key={`cw-${v.id}`} className={`continue-card${cwSelectMode && isMobile ? ' select-mode' : ''}`}>
                            <VideoCard
                              v={v} wp={wp} seenVids={seenVids}
                              newBadgeDays={settings.new_badge_days ?? 2}
                              onWatch={watch} onDelete={deleteVideo}
                              onRedownload={setConfirmRedownload}
                              onHide={hideVideo}
                              onAddToPlaylist={setShowPlaylistModal}
                              onMarkWatched={markVideoWatched}
                              watchedStyle={settings.watched_style}
                              cwSelect={isMobile ? cwSelectMode : true}
                              cwClickPlay={!isMobile}
                              cwSelected={cwSelected.has(v.id)}
                              onCwToggle={() => setCwSelected(s => { const n = new Set(s); if (n.has(v.id)) n.delete(v.id); else n.add(v.id); return n })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isMobile && cwSelectMode && cwSelected.size > 0 && (
                    <div className="cw-bottom-bar">
                      <button className="btn btn-sm" onClick={() => { setCwSelectMode(false); setCwSelected(new Set()) }}>Cancel</button>
                      <button className="btn btn-accent btn-sm" onClick={() => {
                        for (const id of cwSelected) {
                          const v = visibleContinueVids.find(x => x.id === id)
                          if (v) markVideoWatched(v)
                        }
                        setCwSelected(new Set())
                        setCwSelectMode(false)
                      }}>Mark {cwSelected.size} as watched</button>
                    </div>
                  )}
                  <div className="video-grid">
                    {filteredDls.map(dl => <DownloadCard key={`dl-${dl.id}`} dl={dl} onCancel={cancelDl} />)}
                    {filteredAndSortedFeed.map(v => (
                      <VideoCard
                        key={v.id}
                        v={v}
                        wp={wp}
                        seenVids={seenVids}
                        newBadgeDays={settings.new_badge_days ?? 2}
                        dearrow={settings.dearrow_enabled ? dearrowCache[v.id] : null}
                        onWatch={watchFromFeed}
                        onDelete={deleteVideo}
                        onRedownload={setConfirmRedownload}
                        onMarkWatched={markVideoWatched}
                        onHide={hideVideo}
                        onAddToPlaylist={setShowPlaylistModal}
                        onArchive={archiveVideo}
                        onWatchLater={watchLaterVideo}
                        watchedStyle={settings.watched_style}
                      />
                    ))}
                  </div>
                  {vidMeta.pages > 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 0' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {feedPage} of {vidMeta.pages} · {vidMeta.total} videos total</div>
                      {feedPage < vidMeta.pages && (
                        <button className="btn" onClick={loadMore} disabled={loadingMore} style={{ minWidth: 160 }}>
                          {loadingMore ? <><span className="dl-spinner" /> Loading...</> : <><I.Download /> Load More</>}
                        </button>
                      )}
                    </div>
                  )}
                </>
          )}

          {/* Rejected */}
          {!searchMode && view === 'rejected' && (
            <div style={{ maxWidth: 1200 }}>
              <div style={{ padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <I.Archive />
                <span style={{ fontSize: 18, fontWeight: 600 }}>Rejected Videos</span>
              </div>
              {rejectedVids.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><I.Archive /></div>
                  <div>No rejected videos</div>
                  <div className="empty-text">Archived videos will appear here.</div>
                </div>
              ) : (
                <div className="video-grid">
                  {rejectedVids.map(v => (
                    <VideoCard
                      key={v.id} v={v} wp={wp} seenVids={seenVids}
                      newBadgeDays={settings.new_badge_days ?? 2}
                      onWatch={watch} onDelete={deleteVideo}
                      onRedownload={setConfirmRedownload}
                      onMarkWatched={markVideoWatched}
                      onHide={hideVideo}
                      onAddToPlaylist={setShowPlaylistModal}
                      onRestore={() => {
                        apiFetch(`${API}/api/videos/${v.id}/restore`, { method: 'POST' }).then(() => {
                          setRejectedVids(prev => prev.filter(x => x.id !== v.id))
                          setRejectedCount(prev => Math.max(0, prev - 1))
                          fV(chFilter)
                        }).catch(e => console.error('Failed to restore:', e))
                      }}
                      watchedStyle={settings.watched_style}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watch Later */}
          {!searchMode && view === 'watch-later' && (
            <div style={{ maxWidth: 1200 }}>
              <div style={{ padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <I.Clock />
                <span style={{ fontSize: 18, fontWeight: 600 }}>Watch Later</span>
              </div>
              {watchLaterVids.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><I.Clock /></div>
                  <div>No videos scheduled</div>
                  <div className="empty-text">Right-click or use the menu on a video to schedule it for later.</div>
                </div>
              ) : (
                <div className="video-grid">
                  {watchLaterVids.map(v => (
                    <VideoCard
                      key={v.id} v={v} wp={wp} seenVids={seenVids}
                      newBadgeDays={settings.new_badge_days ?? 2}
                      onWatch={watch} onDelete={deleteVideo}
                      onRedownload={setConfirmRedownload}
                      onMarkWatched={markVideoWatched}
                      onHide={hideVideo}
                      onAddToPlaylist={setShowPlaylistModal}
                      watchedStyle={settings.watched_style}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watch */}
          {!searchMode && view === 'watch' && cur && (isMobile ? (
            <>
              <div className="mobile-watch-player" style={{ position: 'relative' }}>
                    {useCustomPlayer
                      ? <CustomPlayer key={cur.id} vRef={vRef} cur={cur} chapters={chapters} sponsorSegs={sponsorSegs}
                          settings={settings} playbackQ={playbackQ} qualityOpts={qualityOpts} changeQuality={changeQuality}
                          isBuffering={isBuffering} pipSupported={pipSupported} subtitleSrc={subtitleSrc}
                          onSubsToggle={v => updS({ show_subtitles: v })}
                          onRateChange={r => updS({ playback_rate: r })}
                          storyboard={storyboard}
                          onPip={() => {
                          const v = vRef.current
                          if (!v) return
                          if (v.requestPictureInPicture) v.requestPictureInPicture().catch(() => {})
                          else if (v.webkitSetPresentationMode) v.webkitSetPresentationMode('picture-in-picture')
                        }}
                          onLoaded={onLoaded}
                          onPlayNext={playlistQueue.length > 0 ? playNext : null}
                          onPlayPrev={playlistQueue.length > 0 ? playPrev : null} />
                  : <>
                      <video ref={vRef} key={cur.id} controls playsInline webkitPlaysInline="true" x-webkit-airplay="allow"
                        autoPlay={settings.autoplay !== false && (!playbackQ || playbackQ === 'original')}
                        onLoadedMetadata={onLoaded}
                        onEnded={() => { if (playlistQueue.length > 0) playNext() }}
                        style={{ width: '100%', display: 'block', maxHeight: '100%' }} />
                      {isBuffering && <div className="player-buffering-overlay"><I.Buffering /></div>}
                    </>
                }
              </div>
              <div className="watch-scroll-body" ref={watchScrollRef}>
                <div className="watch-info" style={{ paddingTop: 14 }}>
                  {watchInfo.props.children}
                </div>
                {settings.comments_enabled && (
                  <div className="comments-section" style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setShowComments(s => !s)}>
                      <I.Message /> Comments & Stats {showComments ? '▲' : '▼'}
                    </div>
                    {showComments && (
                      commentsLoading ? (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0' }}>Loading…</div>
                      ) : comments.length > 0 ? (
                        comments.map((c, i) => (
                          <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0' }}>
                            {c.text}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0' }}>No stats available</div>
                      )
                    )}
                  </div>
                )}
                {watchSidebar}
              </div>
            </>
          ) : (
            <div className={`watch-layout ${scrolledDown ? 'watch-sticky' : ''}`}>
              <div className="watch-main">
                <div className="player-wrap">
                  <div className="player-container" style={{ position: 'relative' }}>
                    {useCustomPlayer
                      ? <CustomPlayer key={cur.id} vRef={vRef} cur={cur} chapters={chapters} sponsorSegs={sponsorSegs}
                          settings={settings} playbackQ={playbackQ} qualityOpts={qualityOpts} changeQuality={changeQuality}
                          isBuffering={isBuffering} pipSupported={pipSupported} subtitleSrc={subtitleSrc}
                          onSubsToggle={v => updS({ show_subtitles: v })}
                          onRateChange={r => updS({ playback_rate: r })}
                          storyboard={storyboard}
                          onPip={() => {
                      const v = vRef.current
                      if (!v) return
                      if (v.requestPictureInPicture) v.requestPictureInPicture().catch(() => {})
                      else if (v.webkitSetPresentationMode) v.webkitSetPresentationMode('picture-in-picture')
                    }}
                          onLoaded={onLoaded}
                          onPlayNext={playlistQueue.length > 0 ? playNext : null}
                          onPlayPrev={playlistQueue.length > 0 ? playPrev : null} />
                      : <>
                          <video ref={vRef} key={cur.id} controls playsInline webkitPlaysInline="true" x-webkit-airplay="allow"
                            autoPlay={settings.autoplay !== false && (!playbackQ || playbackQ === 'original')}
                            onLoadedMetadata={onLoaded}
                            onEnded={() => { if (playlistQueue.length > 0) playNext() }} />
                          {isBuffering && <div className="player-buffering-overlay"><I.Buffering /></div>}
                          {pipSupported && <button className="pip-btn" title="Picture in Picture" onClick={() => {
                              const v = vRef.current
                              if (!v) return
                              if (v.requestPictureInPicture) v.requestPictureInPicture().catch(() => {})
                              else if (v.webkitSetPresentationMode) v.webkitSetPresentationMode('picture-in-picture')
                            }}><I.Pip /></button>}
                        </>
                    }
                  </div>
                </div>
                {watchInfo}
                {settings.comments_enabled && (
                  <div className="comments-section" style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setShowComments(s => !s)}>
                      <I.Message /> Comments & Stats {showComments ? '▲' : '▼'}
                    </div>
                    {showComments && (
                      commentsLoading ? (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0' }}>Loading…</div>
                      ) : comments.length > 0 ? (
                        comments.map((c, i) => (
                          <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0' }}>
                            {c.text}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0' }}>No stats available</div>
                      )
                    )}
                  </div>
                )}
              </div>
              {watchSidebar}
            </div>
          ))}

          {/* Browse */}
          {!searchMode && view === 'browse' && (
            <div style={{ maxWidth: 820 }}>
              <BrowseView
                browseLoading={browseLoading}
                browseVids={browseVids}
                browseSelected={browseSelected}
                toggleBrowseSelect={toggleBrowseSelect}
              />
            </div>
          )}

          {/* Playlist */}
          {!searchMode && view === 'playlist' && activePlaylist && (
            <div style={{ maxWidth: 960 }}>
              <PlaylistView
                playlistId={activePlaylist}
                onWatch={(vids, idx) => {
                  setPlaylistQueue(vids)
                  setPlaylistQueueIdx(idx)
                  watch(vids[idx], 'queue')
                }}
                onDelete={deleteVideo}
                wp={wp}
                seenVids={seenVids}
                newBadgeDays={settings.new_badge_days ?? 2}
                onRedownload={setConfirmRedownload}
                onMarkWatched={markVideoWatched}
                onHide={hideVideo}
                onAddToPlaylist={setShowPlaylistModal}
                onRefresh={fPlaylists}
                onPlayAll={playAll}
                onBack={() => { setView('feed'); setActivePlaylist(null); history.pushState({ view: 'feed' }, '', '#feed') }}
              />
            </div>
          )}

          {/* Settings */}
          {!searchMode && view === 'settings' && (
            <SettingsPanel
              settings={settings}
              channels={channels}
              sortedChannels={sortedChannels}
              updS={updS}
              updCh={updCh}
              rmCh={rmCh}
              openBrowse={openBrowse}
              setShowAdd={setShowAdd}
              editCh={editCh}
              setEditCh={setEditCh}
              checkNow={checkNow}
              checking={checking}
              settingsPage={settingsPage}
              setSettingsPage={changeSettingsPage}
              onRefresh={() => { fCh(); fV(chFilter) }}
            />
          )}
        </div>
      </div>

      {showAdd && (
        <AddChannelModal
          onClose={() => setShowAdd(false)}
          addUrl={addUrl} setAddUrl={setAddUrl}
          addMode={addMode} setAddMode={setAddMode}
          addMaxDays={addMaxDays} setAddMaxDays={setAddMaxDays}
          addErr={addErr} addLoading={addLoading}
          onAdd={addChannel}
        />
      )}

      {showPlaylistModal && (
        <PlaylistModal
          videoId={showPlaylistModal.id}
          videoTitle={showPlaylistModal.title}
          onClose={() => setShowPlaylistModal(null)}
          onCreated={fPlaylists}
        />
      )}

      {showCreatePlaylist && (
        <CreatePlaylistModal
          onClose={() => setShowCreatePlaylist(false)}
          onCreated={(plId) => {
            fPlaylists()
            setShowCreatePlaylist(false)
            if (plId) { setView('playlist'); setActivePlaylist(plId); history.pushState({ view: 'playlist', playlistId: plId }, '', `#playlist/${plId}`) }
          }}
        />
      )}

      {confirmRedownload && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setConfirmRedownload(null) }}>
          <div className="modal">
            <div className="modal-title">
              Re-download Video
              <button className="btn-icon" onClick={() => setConfirmRedownload(null)}><I.X /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>Download this video again?</p>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 24 }}>{confirmRedownload.title}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setConfirmRedownload(null)}>Cancel</button>
              <button className="btn btn-accent" onClick={() => redownloadVideo(confirmRedownload)}><I.Download /> Download</button>
            </div>
          </div>
        </div>
      )}
      {showOneOff && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowOneOff(false); setOneOffUrl(''); setOneOffStatus('') } }}>
          <div className="modal">
            <div className="modal-title">
              Download YouTube URL
              <button className="btn-icon" onClick={() => { setShowOneOff(false); setOneOffUrl(''); setOneOffStatus('') }}><I.X /></button>
            </div>
            <div className="form-group">
              <label className="form-label">YouTube URL</label>
              <input
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={oneOffUrl}
                onChange={e => setOneOffUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitOneOff()}
                autoFocus
              />
              <div className="form-hint">Paste any YouTube video URL — it will be saved under Uncategorized</div>
              {oneOffStatus && (
                <div style={{ fontSize: 13, marginTop: 8, color: oneOffStatus.includes('Error') ? 'var(--accent)' : 'var(--green)' }}>{oneOffStatus}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => { setShowOneOff(false); setOneOffUrl(''); setOneOffStatus('') }}>Cancel</button>
              <button className="btn btn-accent" onClick={submitOneOff} disabled={!oneOffUrl.trim()}>
                <I.Download /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div></>
  )
}

function CreatePlaylistModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const create = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const r = await apiFetch(`${API}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
      })
      if (r.ok) {
        const pl = await r.json()
        onCreated?.(pl.id)
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
          Create Playlist
          <button className="btn-icon" onClick={onClose}><I.X /></button>
        </div>
        <div className="playlist-modal-create">
          <input
            className="form-input"
            placeholder="Playlist name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            autoFocus
          />
          <input
            className="form-input"
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <button
            className="btn btn-accent"
            onClick={create}
            disabled={!name.trim() || creating}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
