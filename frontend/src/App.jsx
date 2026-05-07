import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Hls from 'hls.js'
import { API, thumbUrl, fmtDur, fmtViews, fmtDate, timeAgo, jsonEq, parseTimestamps, daysLabel } from './utils'
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
  const [feedFilter, setFeedFilter] = useState('All')
  const [feedSort, setFeedSort] = useState('date')
  const [feedSearch, setFeedSearch] = useState('')
  const [hiddenVids, setHiddenVids] = useState(new Set())
  const [confirmMarkAll, setConfirmMarkAll] = useState(false)
  const confirmMarkAllRef = useRef(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [settingsPage, setSettingsPage] = useState('downloads')
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
  const [newCounts, setNewCounts] = useState({})
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStartY = useRef(null)
  const [playbackQ, setPlaybackQ] = useState('original')
  const [subtitleSrc, setSubtitleSrc] = useState(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [pipSupported, setPipSupported] = useState(false)
  const [origHeight, setOrigHeight] = useState(0)
  const useCustomPlayer = settings.player_mode === 'custom'
  const vRef = useRef(null)
  const saveT = useRef(null)
  useEffect(() => { if (vRef.current && settings.volume !== undefined) vRef.current.volume = settings.volume }, [settings.volume])
  const volTimer = useRef(null)
  const contentRef = useRef(null)
  const watchScrollRef = useRef(null)
  const sidebarNavRef = useRef(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const chFilterRef = useRef(chFilter)
  useEffect(() => { chFilterRef.current = chFilter }, [chFilter])
  const feedPageRef = useRef(feedPage)
  useEffect(() => { feedPageRef.current = feedPage }, [feedPage])
  const wpRef = useRef(wp)
  useEffect(() => { wpRef.current = wp }, [wp])
  const lastWatchTimeRef = useRef(0)
  const pendingWatchSecondsRef = useRef(0)

  const smartSet = setter => d => setter(prev => jsonEq(prev, d) ? prev : d)
  const fCh = useCallback(async () => { try { const r = await fetch(`${API}/api/channels`); if (r.ok) smartSet(setCh)(await r.json()) } catch (e) {} }, [])
  const fV = useCallback(async (c, pg = 1, append = false, perPage = 100) => {
    try {
      const params = new URLSearchParams({ per_page: String(perPage), page: String(pg), ...(c ? { channel_id: c } : {}) })
      const r = await fetch(`${API}/api/videos?${params}`)
      if (r.ok) {
        const d = await r.json()
        const vlist = d.videos || []
        const meta = { total: d.total, pages: d.pages, page: d.page }
        if (append) { setVids(prev => [...prev, ...vlist.filter(v => !prev.find(p => p.id === v.id))]) }
        else { smartSet(setVids)(vlist); if (!c) smartSet(setSortVids)(vlist) }
        setVidMeta(meta)
      }
    } catch (e) {}
  }, [])
  const fD = useCallback(async c => { try { const r = await fetch(`${API}/api/downloads${c ? `?channel_id=${c}` : ''}`); if (r.ok) smartSet(setDls)(await r.json()) } catch (e) {} }, [])
  const fS = useCallback(async () => { try { const r = await fetch(`${API}/api/settings`); if (r.ok) smartSet(setS)(await r.json()) } catch (e) {} }, [])
  const fWp = useCallback(async () => { try { const r = await fetch(`${API}/api/progress`); if (r.ok) smartSet(setWp)(await r.json()) } catch (e) {} }, [])
  const fNewCounts = useCallback(async () => {
    try { const r = await fetch(`${API}/api/new-counts`); if (r.ok) smartSet(setNewCounts)(await r.json()) } catch (e) {}
  }, [])
  const fSeen = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/seen`)
      if (r.ok) {
        const serverIds = await r.json()
        setSeenVids(prev => {
          const localOnly = [...prev].filter(id => !serverIds.includes(id))
          if (localOnly.length > 0) {
            fetch(`${API}/api/seen`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localOnly) }).catch(() => {})
          }
          const merged = new Set([...prev, ...serverIds])
          localStorage.setItem('seenVids', JSON.stringify([...merged]))
          return merged
        })
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    fCh(); fV(null, 1); fD(); fS(); fWp(); fSeen(); fNewCounts()
    const s = setInterval(() => { fV(chFilterRef.current, 1, false, feedPageRef.current * 100); fCh(); fWp(); fNewCounts() }, 15e3)
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
      setView('settings'); history.replaceState({ view: 'settings' }, '', '#settings')
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
        if (st.view === 'watch' && st.videoId) {
          fetch(`${API}/api/videos/${st.videoId}`).then(r => r.ok ? r.json() : null).then(v => { if (v) setCur(v) }).catch(() => {})
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
    if (!vid || !t || t < 2) return
    const url = `${API}/api/progress/${vid}`
    const body = JSON.stringify({ time: t })
    if (document.visibilityState === 'hidden' || !document.hasFocus()) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    } else {
      fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {})
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
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {})
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
        navigator.sendBeacon(`${API}/api/hls/${cur.id}/${playbackQ}/stop`)
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
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (!playbackQ || playbackQ === 'original') {
      v.src = `/media/${cur.file_path}`; v.load()
    } else {
      const hlsUrl = `${API}/api/hls/${cur.id}/${playbackQ}/index.m3u8`
      if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60, enableWorker: true, startPosition: -1, maxBufferHole: 2, maxFragLookUpTolerance: 0.5 })
        hls.loadSource(hlsUrl); hls.startLoad(-1); hls.attachMedia(v)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const pending = pendingSeekRef.current
          const saved = wpRef.current[cur.id] || 0
          const dur = v.duration || cur.duration || 0
          const seekTarget = (pending && pending > 2) ? pending : (saved > 2 && dur > 0 && saved / dur < 0.95 ? saved : 0)
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
        fetch(`${API}/api/hls/${cur.id}/${playbackQ}/stop`, { method: 'POST' }).catch(() => {})
    }
  }, [cur?.id, playbackQ])

  const onLoaded = useCallback(() => {
    if (!vRef.current || !cur) return
    if (!playbackQ || playbackQ === 'original') {
      const p = pendingSeekRef.current
      if (p && p > 2) { vRef.current.currentTime = p; pendingSeekRef.current = null }
      else { const s = wp[cur.id] || 0, d = vRef.current.duration || cur.duration || 0; if (s > 2 && d > 0 && s / d < .95) vRef.current.currentTime = s }
    }
    const sv = settings.volume; if (sv !== undefined && sv !== null) vRef.current.volume = sv
  }, [cur, wp, settings.volume, playbackQ])

  const addChannel = async () => {
    if (!addUrl.trim()) return
    setAddLoading(true); setAddErr('')
    try {
      const r = await fetch(`${API}/api/channels`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: addUrl, download_mode: addMode, max_days_old: addMaxDays || 0 }) })
      const d = await r.json()
      if (!r.ok) { setAddErr(d.error || 'Failed'); return }
      setAddUrl(''); setAddMode('all'); setAddMaxDays(0); setShowAdd(false); fCh(); setTimeout(() => fV(chFilter), 3e3)
    } catch (e) { setAddErr('Network error') } finally { setAddLoading(false) }
  }
  const rmCh = async id => { if (!confirm('Remove channel and videos?')) return; await fetch(`${API}/api/channels/${id}`, { method: 'DELETE' }); fCh(); fV(chFilter) }
  const updCh = async (cid, p) => { try { await fetch(`${API}/api/channels/${cid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }); fCh() } catch (e) {} }
  const updS = async p => { const n = { ...settings, ...p }; setS(n); await fetch(`${API}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(n) }) }
  const checkNow = async () => { setChecking(true); await fetch(`${API}/api/check-now`, { method: 'POST' }); setTimeout(() => { fV(chFilter); setChecking(false) }, 5e3) }
  const cancelDl = async vid => { await fetch(`${API}/api/downloads/${vid}/cancel`, { method: 'POST' }); fD(chFilter) }
  const cancelAll = async () => { await fetch(`${API}/api/downloads/cancel-all`, { method: 'POST' }); fD(chFilter) }

  const goHome = () => { setView('feed'); setChF(null); setCur(null); setMobileMenu(false); setSearchMode(false); history.pushState({ view: 'feed' }, '', '#feed') }
  const navTo = (v, cf) => {
    const savedScroll = sidebarNavRef.current?.scrollTop || 0
    setView(v); setChF(cf); setMobileMenu(false); setSearchMode(false)
    history.pushState({ view: v, chFilter: cf }, '', `#${v}${cf ? '/' + cf : ''}`)
    requestAnimationFrame(() => { if (sidebarNavRef.current) sidebarNavRef.current.scrollTop = savedScroll })
  }
  const watch = v => {
    setIsBuffering(false)
    if (!v.ghost) {
      setSeenVids(prev => {
        if (prev.has(v.id)) return prev
        const next = new Set(prev); next.add(v.id)
        localStorage.setItem('seenVids', JSON.stringify([...next]))
        fetch(`${API}/api/seen`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([v.id]) })
          .then(() => fNewCounts())
          .catch(() => {})
        return next
      })
      setCur(v); setView('watch'); setMobileMenu(false); setSearchMode(false)
      setShowChapters(false); setShowDesc(false); setShowSegs(false); setScrolledDown(false)
      history.pushState({ view: 'watch', videoId: v.id }, '', '#watch/' + v.id)
      requestAnimationFrame(() => { contentRef.current?.scrollTo(0, 0); watchScrollRef.current?.scrollTo(0, 0) })
    }
  }
  const seekTo = t => { if (vRef.current) { vRef.current.currentTime = t; vRef.current.play() } }

  const deleteVideo = async (e, vid) => { e.stopPropagation(); if (!confirm('Delete this video?')) return; await fetch(`${API}/api/videos/${vid}`, { method: 'DELETE' }); fV(chFilter) }
  const redownloadVideo = async v => { setConfirmRedownload(null); await fetch(`${API}/api/videos/${v.id}/restore`, { method: 'POST' }); fV(chFilter); fD(chFilter) }

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
    try { await fetch(`${API}/api/videos/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video_ids: ids, channel_id: browseCh.id }) }) } catch (e) {}
    setBrowseDownloading(false)
    try { const r = await fetch(`${API}/api/channels/${browseCh.id}/browse?max=100`); if (r.ok) setBrowseVids(await r.json()) } catch (e) {}
    fD(chFilter)
  }
  const selectAllAvailable = () => setBrowseSelected(new Set(browseVids.filter(v => v.status === 'available').map(v => v.id)))

  const doSearch = useCallback(async q => {
    setSearchQ(q)
    if (!q.trim()) { setSearchResults([]); return }
    try { const r = await fetch(`${API}/api/videos/search?q=${encodeURIComponent(q)}`); if (r.ok) setSearchResults(await r.json()) } catch (e) {}
  }, [])

  const pct = v => { const t = wp[v.id], d = v.duration; return (!t || !d || t < 2) ? 0 : Math.min(t / d * 100, 100) }
  const isWatched = v => { const t = wp[v.id], d = v.duration; return !!(t && d && t / d >= 0.95) }

  const chVids = useMemo(() => {
    if (!cur) return []
    const pool = videos.filter(v => v.channel_id === cur.channel_id && !v.ghost && v.id !== cur.id)
    return [...pool].sort(() => Math.random() - .5).slice(0, 6)
  }, [cur, videos])
  const recommendations = useMemo(() => {
    if (!cur) return []
    return [...videos.filter(v => v.channel_id !== cur.channel_id && !v.ghost)].sort(() => Math.random() - .5).slice(0, 8)
  }, [cur, videos])
  const feedVideos = useMemo(() => [...videos.filter(v => !v.ghost), ...(showGhosts ? videos.filter(v => v.ghost) : [])], [videos, showGhosts])
  const ghostCount = videos.filter(v => v.ghost).length

  useEffect(() => {
    if (!confirmMarkAll) return
    const handler = e => { if (confirmMarkAllRef.current && !confirmMarkAllRef.current.contains(e.target)) setConfirmMarkAll(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [confirmMarkAll])

  const daysSince = ds => {
    if (!ds) return 999
    const raw = ds.length === 8
      ? new Date(`${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`)
      : new Date(ds)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const upload = new Date(raw); upload.setHours(0, 0, 0, 0)
    return Math.round((today - upload) / 86400000)
  }

  const filteredAndSortedFeed = useMemo(() => {
    let list = feedVideos.filter(v => !hiddenVids.has(v.id))
    if (feedSearch.trim()) {
      const q = feedSearch.toLowerCase()
      list = list.filter(v => v.title?.toLowerCase().includes(q) || v.channel_name?.toLowerCase().includes(q))
    }
    if (feedFilter === 'New') {
      const days = settings.new_badge_days ?? 2
      list = list.filter(v => !isWatched(v) && !seenVids.has(v.id) && v.downloaded_at && (Date.now() - new Date(v.downloaded_at).getTime()) < days * 86400000)
    } else if (feedFilter === 'Today') {
      list = list.filter(v => daysSince(v.upload_date || v.downloaded_at) === 0)
    } else if (feedFilter === 'This week') {
      list = list.filter(v => daysSince(v.upload_date || v.downloaded_at) < 7)
    } else if (feedFilter === 'Unwatched') {
      list = list.filter(v => !isWatched(v))
    } else if (feedFilter === 'In progress') {
      list = list.filter(v => { const p = pct(v); return p > 0 && p < 95 })
    }
    if (feedSort === 'views') {
      list = [...list].sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    } else if (feedSort === 'channel') {
      list = [...list].sort((a, b) => (a.channel_name || '').localeCompare(b.channel_name || ''))
    }
    return list
  }, [feedVideos, feedFilter, feedSort, feedSearch, hiddenVids, wp, seenVids, settings.new_badge_days])

  const markVideoWatched = useCallback(v => {
    const t = wpRef.current[v.id], d = v.duration
    const watched = !!(t && d && t / d >= 0.95)
    if (watched) {
      setWp(p => ({ ...p, [v.id]: 0 }))
      saveProg(v.id, 0)
    } else if (d > 0) {
      setWp(p => ({ ...p, [v.id]: d }))
      saveProg(v.id, d)
    }
  }, [saveProg])

  const markAllWatched = useCallback(() => {
    setConfirmMarkAll(false)
    const newWp = { ...wpRef.current }
    for (const v of filteredAndSortedFeed) {
      if (!v.ghost && v.duration > 0) {
        const t = wpRef.current[v.id]
        if (!(t && v.duration && t / v.duration >= 0.95)) {
          newWp[v.id] = v.duration
          saveProg(v.id, v.duration)
        }
      }
    }
    setWp(newWp)
  }, [filteredAndSortedFeed, saveProg])

  const hideVideo = useCallback(id => {
    setHiddenVids(s => { const n = new Set(s); n.add(id); return n })
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
    view, chFilter, sidebarCollapsed, setSidebarCollapsed,
    sortedChannels, newCounts, checking, navTo, setShowAdd, setMobileMenu, checkNow,
    settingsPage, setSettingsPage,
    navRef: sidebarNavRef,
  }

  const watchSidebar = (
    <div className="watch-sidebar">
      <div className="playlist-header">More from {cur?.channel_name}</div>
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
      <div className="watch-title">{cur?.title}</div>
      <div className="watch-meta">
        <Av src={channels.find(c => c.id === cur?.channel_id)?.thumbnail} name={cur?.channel_name} size={24} />
        <span style={{ fontWeight: 600 }}>{cur?.channel_name}</span>
        <span>·</span><span>{fmtViews(cur?.view_count)}</span>
        <span>·</span><span>{fmtDate(cur?.upload_date)}</span>
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
    <div className="app">
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
              {dls.length > 0 && <div className="checking-badge"><div className="spinner" />{dls.length}</div>}
              <button className="btn-icon btn-ghost" onClick={() => { setSearchMode(!searchMode); setSearchQ(''); setSearchResults([]) }}><I.Search /></button>
              <button className="btn-icon btn-ghost" onClick={() => navTo('settings', null)}><I.Settings /></button>
            </div>
          </div>
          {channels.length > 0 && (
            <div className="mobile-channel-strip">
              <Av name="All" size={34} onClick={() => navTo('feed', null)} active={!chFilter && view === 'feed'} src="" />
              {sortedChannels.map(c => <Av key={c.id} src={c.thumbnail} name={c.name} size={34} onClick={() => navTo('feed', c.id)} active={chFilter === c.id} />)}
            </div>
          )}
        </div>

        {/* Top bar */}
        <div className={`topbar ${scrolledDown && view === 'watch' ? 'collapsed' : ''}${view === 'watch' ? ' watch-mobile' : ''}${view === 'feed' ? ' feed-topbar' : ''}`}>
          <div className="topbar-title">
            {view === 'browse' && (
              <button className="btn-icon" onClick={() => { setView('settings'); history.pushState({ view: 'settings' }, '', '#settings') }} style={{ marginRight: 4 }}>
                <I.Back />
              </button>
            )}
            <span className="topbar-title-text">
              {searchMode ? 'Search'
                : view === 'settings' && isMobile
                  ? (
                    <select
                      className="topbar-settings-select"
                      value={settingsPage}
                      onChange={e => setSettingsPage(e.target.value)}
                    >
                      <option value="downloads">Downloads</option>
                      <option value="playback">Playback</option>
                      <option value="channels">Channels</option>
                      <option value="system">System</option>
                    </select>
                  )
                : view === 'settings' ? ({ downloads: 'Downloads', playback: 'Playback', channels: 'Channels', system: 'System' }[settingsPage] || 'Settings')
                : view === 'watch' ? (cur?.channel_name || 'Watch')
                : view === 'browse' ? `Browse: ${browseCh?.name || ''}`
                : chFilter ? channels.find(c => c.id === chFilter)?.name || 'Channel'
                : 'Your Feed'}
            </span>
          </div>
          <div className="topbar-actions">
            {view === 'feed' && !searchMode && (
              <>
                <span className="video-count">{filteredAndSortedFeed.filter(v => !v.ghost).length} videos</span>
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => setConfirmMarkAll(true)}
                    disabled={filteredAndSortedFeed.filter(v => !v.ghost && !isWatched(v)).length === 0}
                  >
                    Mark all watched
                  </button>
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
            {(view === 'browse' && browseSelected.size > 0) || browseDownloading ? (
              <button className="btn btn-accent btn-sm" onClick={downloadSelected} disabled={browseDownloading}>
                {browseDownloading
                  ? <><span className="dl-spinner" style={{ borderTopColor: 'currentColor' }} /> Queuing…</>
                  : <><I.Download /><span className="btn-text"> {browseSelected.size}</span></>}
              </button>
            ) : null}
            {view === 'browse' && <button className="btn btn-sm" onClick={selectAllAvailable}>Select All</button>}
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
                ? <div className="video-grid">{searchResults.map(v => <VideoCard key={v.id} v={v} wp={wp} seenVids={seenVids} newBadgeDays={settings.new_badge_days ?? 2} onWatch={watch} onDelete={deleteVideo} onRedownload={setConfirmRedownload} onMarkWatched={markVideoWatched} onHide={hideVideo} />)}</div>
                : searchQ ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No results</div>
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
                  {channels.length === 0 && <button className="btn btn-accent" style={{ marginTop: 20 }} onClick={() => setShowAdd(true)}><I.Plus /> Add Channel</button>}
                </div>
              : <>
                  <div className="video-grid">
                    {filteredDls.map(dl => <DownloadCard key={`dl-${dl.id}`} dl={dl} onCancel={cancelDl} />)}
                    {filteredAndSortedFeed.map(v => (
                      <VideoCard
                        key={v.id}
                        v={v}
                        wp={wp}
                        seenVids={seenVids}
                        newBadgeDays={settings.new_badge_days ?? 2}
                        onWatch={watch}
                        onDelete={deleteVideo}
                        onRedownload={setConfirmRedownload}
                        onMarkWatched={markVideoWatched}
                        onHide={hideVideo}
                      />
                    ))}
                  </div>
                  {vidMeta.pages > 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {feedPage} of {vidMeta.pages} · {vidMeta.total} videos total</div>
                      {feedPage < vidMeta.pages && (
                        <button className="btn" onClick={loadMore} disabled={loadingMore} style={{ minWidth: 140 }}>
                          {loadingMore ? <><span className="dl-spinner" /> Loading...</> : <><I.Download /> Load More</>}
                        </button>
                      )}
                    </div>
                  )}
                </>
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
                      onPip={() => {
                      const v = vRef.current
                      if (!v) return
                      if (v.requestPictureInPicture) v.requestPictureInPicture().catch(() => {})
                      else if (v.webkitSetPresentationMode) v.webkitSetPresentationMode('picture-in-picture')
                    }}
                      onLoaded={onLoaded} />
                  : <>
                      <video ref={vRef} key={cur.id} controls playsInline webkitPlaysInline="true" x-webkit-airplay="allow"
                        autoPlay={settings.autoplay !== false && (!playbackQ || playbackQ === 'original')}
                        onLoadedMetadata={onLoaded} style={{ width: '100%', display: 'block', maxHeight: '100%' }} />
                      {isBuffering && <div className="player-buffering-overlay"><I.Buffering /></div>}
                    </>
                }
              </div>
              <div className="watch-scroll-body" ref={watchScrollRef}>
                <div className="watch-info" style={{ paddingTop: 14 }}>
                  {watchInfo.props.children}
                </div>
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
                          onPip={() => {
                      const v = vRef.current
                      if (!v) return
                      if (v.requestPictureInPicture) v.requestPictureInPicture().catch(() => {})
                      else if (v.webkitSetPresentationMode) v.webkitSetPresentationMode('picture-in-picture')
                    }}
                          onLoaded={onLoaded} />
                      : <>
                          <video ref={vRef} key={cur.id} controls playsInline webkitPlaysInline="true" x-webkit-airplay="allow"
                            autoPlay={settings.autoplay !== false && (!playbackQ || playbackQ === 'original')}
                            onLoadedMetadata={onLoaded} />
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
              </div>
              {watchSidebar}
            </div>
          ))}

          {/* Browse */}
          {!searchMode && view === 'browse' && (
            <div style={{ maxWidth: 800 }}>
              <BrowseView
                browseLoading={browseLoading}
                browseVids={browseVids}
                browseSelected={browseSelected}
                toggleBrowseSelect={toggleBrowseSelect}
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

      {confirmRedownload && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setConfirmRedownload(null) }}>
          <div className="modal">
            <div className="modal-title">
              Re-download Video
              <button className="btn-icon" onClick={() => setConfirmRedownload(null)}><I.X /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Download this video again?</p>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{confirmRedownload.title}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setConfirmRedownload(null)}>Cancel</button>
              <button className="btn btn-accent" onClick={() => redownloadVideo(confirmRedownload)}><I.Download /> Download</button>
            </div>
          </div>
        </div>
      )}
    </div></>
  )
}
