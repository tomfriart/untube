import { useState, useEffect, useRef, useCallback } from 'react'
import { I } from '../icons'

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isAndroid = /Android/.test(navigator.userAgent)

const SPONSOR_COLORS = {
  sponsor: '#3fb950',
  selfpromo: '#ffd93d',
  interaction: '#58b0ff',
  intro: '#6e7dff',
  outro: '#a371f7',
  music_offtopic: '#ff9a3c',
}

function fmtTime(t) {
  if (!t || isNaN(t) || !isFinite(t)) return '0:00'
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = Math.floor(t % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const SPEED_OPTS = [0.75, 1, 1.25, 1.5, 1.75, 2]

export function CustomPlayer({
  vRef, cur, chapters, sponsorSegs, settings,
  playbackQ, qualityOpts, changeQuality,
  isBuffering, pipSupported, onPip, onLoaded,
  subtitleSrc, onSubsToggle, onRateChange, storyboard,
  onPlayNext, onPlayPrev,
}) {
  const containerRef = useRef(null)
  const seekBarRef = useRef(null)
  const hideTimerRef = useRef(null)
  const seekingRef = useRef(false)
  const showControlsRef = useRef(true)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(cur?.duration || 0)
  const [volume, setVolume] = useState(settings.volume ?? 1)
  const [muted, setMuted] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [showControls, setShowControls] = useState(true)
  useEffect(() => { showControlsRef.current = showControls }, [showControls])
  const [showChaptersPanel, setShowChaptersPanel] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [settingsView, setSettingsView] = useState('main')
  const [playbackRate, setPlaybackRate] = useState(settings.playback_rate || 1)
  const [hoverPct, setHoverPct] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSubs, setShowSubs] = useState(!!settings.show_subtitles)
  const [activeCueText, setActiveCueText] = useState('')
  const [countdown, setCountdown] = useState(null)
  const countdownRef = useRef(null)
  const onPlayNextRef = useRef(onPlayNext)
  useEffect(() => { onPlayNextRef.current = onPlayNext }, [onPlayNext])

  // Sync video events into local state
  useEffect(() => {
    const v = vRef.current
    if (!v) return
    const onPlay = () => {
      setPlaying(true)
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => { if (!seekingRef.current) setShowControls(false) }, 3000)
    }
    const onPause = () => {
      setPlaying(false)
      setShowControls(true)
      clearTimeout(hideTimerRef.current)
    }
    const onTimeUpdate = () => setCurrentTime(v.currentTime)
    const onDurationChange = () => { if (v.duration && isFinite(v.duration)) setDuration(v.duration) }
    const onVolumeChange = () => { setVolume(v.volume); setMuted(v.muted) }
    const onProgress = () => { if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1)) }
    const onEnded = () => {
      if (onPlayNextRef.current) {
        const cd = settings.playlist_countdown ?? 5
        if (cd > 0) {
          setCountdown(cd)
        } else {
          onPlayNextRef.current()
        }
      }
    }
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('durationchange', onDurationChange)
    v.addEventListener('volumechange', onVolumeChange)
    v.addEventListener('progress', onProgress)
    v.addEventListener('ended', onEnded)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('durationchange', onDurationChange)
      v.removeEventListener('volumechange', onVolumeChange)
      v.removeEventListener('progress', onProgress)
      v.removeEventListener('ended', onEnded)
    }
  }, [vRef])

  // Fullscreen change (standard + webkit)
  useEffect(() => {
    const onChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement
      setIsFullscreen(!!fsEl)
      // Exiting fullscreen → lock back to portrait on mobile
      if (!fsEl && (isIOS || isAndroid) && screen.orientation?.lock) {
        screen.orientation.lock('portrait').catch(() => {})
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // Cleanup hide timer on unmount
  useEffect(() => () => clearTimeout(hideTimerRef.current), [])

  // Playlist countdown timer
  useEffect(() => {
    if (countdown === null) { clearInterval(countdownRef.current); return }
    if (countdown <= 0) {
      setCountdown(null)
      if (onPlayNextRef.current) onPlayNextRef.current()
      return
    }
    countdownRef.current = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(countdownRef.current)
  }, [countdown])

  // Mobile landscape → auto-enter fullscreen; exiting fullscreen → lock portrait
  useEffect(() => {
    if (!isIOS && !isAndroid) return
    const el = containerRef.current
    if (!el) return

    const goLandscape = () => {
      const v = vRef.current
      if (!v || v.paused) return
      // Already fullscreen? skip
      if (el.classList.contains('pseudo-fs') || document.fullscreenElement || document.webkitFullscreenElement) return
      const isLandscape = window.matchMedia('(orientation: landscape)').matches
      if (!isLandscape) return
      el.classList.add('pseudo-fs')
      setIsFullscreen(true)
    }

    const onOrientationChange = () => {
      // Short delay so layout settles after rotation
      setTimeout(goLandscape, 300)
    }

    // Also check on play — user may rotate after pressing play
    const v = vRef.current
    const onPlay = () => setTimeout(goLandscape, 300)

    window.addEventListener('orientationchange', onOrientationChange)
    window.addEventListener('resize', onOrientationChange)
    if (v) v.addEventListener('play', onPlay)
    return () => {
      window.removeEventListener('orientationchange', onOrientationChange)
      window.removeEventListener('resize', onOrientationChange)
      if (v) v.removeEventListener('play', onPlay)
    }
  }, [vRef, cur?.id])

  // Apply playback rate — new sources reset the rate, so re-apply on load too
  useEffect(() => {
    const v = vRef.current
    if (!v) return
    v.playbackRate = playbackRate
    const onLoadStart = () => { v.playbackRate = playbackRate }
    v.addEventListener('loadedmetadata', onLoadStart)
    return () => v.removeEventListener('loadedmetadata', onLoadStart)
  }, [playbackRate, vRef, cur?.id])

  const setRate = r => {
    setPlaybackRate(r)
    setSettingsView('main')
    onRateChange?.(r)
  }

  // Reset cue text on video change; restore saved subtitle preference
  useEffect(() => { setActiveCueText(''); setShowSubs(!!settings.show_subtitles) }, [subtitleSrc])

  // Clear cue text when subs turned off
  useEffect(() => { if (!showSubs) setActiveCueText('') }, [showSubs])

  // Close popup menus when controls auto-hide
  useEffect(() => {
    if (!showControls) { setShowSettingsMenu(false); setSettingsView('main'); setShowVolumeSlider(false) }
  }, [showControls])

  // Keep native track hidden; drive a custom overlay via cuechange
  useEffect(() => {
    const v = vRef.current
    if (!v) return
    const track = Array.from(v.textTracks).find(t => t.kind === 'subtitles')
    if (!track) return
    track.mode = 'hidden'
    const stripVtt = t => t
      .replace(/<[^>]+>/g, '')        // remove tags: <c>, <i>, <00:00:01.000>, etc.
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
    const onCueChange = () => {
      setActiveCueText(
        track.activeCues && track.activeCues.length > 0
          ? stripVtt(Array.from(track.activeCues).sort((a, b) => a.startTime - b.startTime).pop().text ?? '')
          : ''
      )
    }
    track.addEventListener('cuechange', onCueChange)
    return () => track.removeEventListener('cuechange', onCueChange)
  }, [subtitleSrc, vRef])

  // Auto-hide controls: show on activity, hide after 3s when playing
  const showControlsNow = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimerRef.current)
    const v = vRef.current
    if (v && !v.paused) {
      hideTimerRef.current = setTimeout(() => {
        if (!seekingRef.current) setShowControls(false)
      }, 3000)
    }
  }, [vRef])

  // Seek helpers
  const getSeekPct = useCallback(clientX => {
    const bar = seekBarRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [])

  const doSeek = useCallback(pct => {
    const v = vRef.current
    if (!v || !duration) return
    v.currentTime = pct * duration
  }, [vRef, duration])

  // Document-level drag handling for seek bar (mouse + touch)
  useEffect(() => {
    const getX = e => e.touches ? e.touches[0].clientX : e.clientX
    const onMove = e => {
      if (!seekingRef.current) return
      if (e.cancelable) e.preventDefault()
      showControlsNow()
      doSeek(getSeekPct(getX(e)))
    }
    const onUp = () => { seekingRef.current = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [getSeekPct, doSeek, showControlsNow])

  const onSeekMouseDown = e => {
    e.preventDefault()
    seekingRef.current = true
    doSeek(getSeekPct(e.clientX))
  }

  const onSeekTouchStart = e => {
    e.preventDefault()
    seekingRef.current = true
    doSeek(getSeekPct(e.touches[0].clientX))
  }

  const togglePlay = useCallback(() => {
    const v = vRef.current
    if (!v) return
    v.paused ? v.play().catch(() => {}) : v.pause()
  }, [vRef])

  // Tap/click video area — only show/hide controls, never toggle play
  const handleContainerClick = useCallback(() => {
    showControlsNow()
  }, [showControlsNow])

  const seekRelative = useCallback(secs => {
    const v = vRef.current
    if (!v || !duration) return
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs))
    showControlsNow()
  }, [vRef, duration, showControlsNow])

  // Double-tap left/right third of the video: seek ∓/± 10s (like YouTube)
  const lastTapRef = useRef({ t: 0, x: 0 })
  const [tapFeedback, setTapFeedback] = useState(null) // 'back' | 'fwd'
  const tapFeedbackTimer = useRef(null)
  useEffect(() => () => clearTimeout(tapFeedbackTimer.current), [])

  const handleContainerTouchEnd = useCallback(e => {
    e.preventDefault()
    const touch = e.changedTouches && e.changedTouches[0]
    const el = containerRef.current
    if (touch && el) {
      const rect = el.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const now = Date.now()
      const last = lastTapRef.current
      const isDouble = now - last.t < 300 && Math.abs(touch.clientX - last.x) < 60
      lastTapRef.current = { t: now, x: touch.clientX }
      if (isDouble) {
        const third = rect.width / 3
        if (x < third) {
          seekRelative(-10)
          setTapFeedback('back')
        } else if (x > rect.width - third) {
          seekRelative(10)
          setTapFeedback('fwd')
        }
        clearTimeout(tapFeedbackTimer.current)
        tapFeedbackTimer.current = setTimeout(() => setTapFeedback(null), 500)
        lastTapRef.current = { t: 0, x: 0 }
        return
      }
    }
    showControlsNow()
  }, [showControlsNow, seekRelative])

  const toggleMute = () => {
    const v = vRef.current
    if (v) v.muted = !v.muted
  }

  const handleVolumeChange = e => {
    const v = vRef.current
    if (!v) return
    const val = parseFloat(e.target.value)
    v.volume = val
    v.muted = val === 0
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    const v = vRef.current
    if (!el) return

    const isPseudoFs = el.classList.contains('pseudo-fs')
    const isNativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement)

    if (isPseudoFs) {
      el.classList.remove('pseudo-fs')
      setIsFullscreen(false)
      // Exiting pseudo-fullscreen → lock portrait
      if (screen.orientation?.lock) screen.orientation.lock('portrait').catch(() => {})
    } else if (isNativeFs) {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
      // portrait lock handled by fullscreenchange listener
    } else if (isIOS || isAndroid) {
      // iOS/Android: use CSS pseudo-fullscreen
      el.classList.add('pseudo-fs')
      setIsFullscreen(true)
      // Lock to landscape
      if (screen.orientation?.lock) screen.orientation.lock('landscape').catch(() => {})
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        el.classList.add('pseudo-fs')
        setIsFullscreen(true)
      })
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
    } else if (v?.webkitEnterFullscreen) {
      v.webkitEnterFullscreen()
    }
  }

  // Keyboard shortcuts (desktop): space/k play, ←/→ ±5s, j/l ±10s,
  // ↑/↓ volume, m mute, f fullscreen, c subtitles, 0-9 percent-seek,
  // </> playback speed
  const keyCtxRef = useRef({})
  keyCtxRef.current = { togglePlay, seekRelative, toggleMute, toggleFullscreen, duration, playbackRate, setRate }
  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      const ctx = keyCtxRef.current
      const v = vRef.current
      if (!v) return
      let handled = true
      if (e.key === 'ArrowRight' && e.shiftKey && onPlayNextRef.current) { onPlayNextRef.current(); showControlsNow(); return }
      switch (e.key) {
        case ' ': case 'k': ctx.togglePlay(); break
        case 'ArrowLeft': ctx.seekRelative(-5); break
        case 'ArrowRight': ctx.seekRelative(5); break
        case 'j': ctx.seekRelative(-10); break
        case 'l': ctx.seekRelative(10); break
        case 'ArrowUp': v.volume = Math.min(1, v.volume + 0.05); v.muted = false; break
        case 'ArrowDown': v.volume = Math.max(0, v.volume - 0.05); break
        case 'm': ctx.toggleMute(); break
        case 'f': ctx.toggleFullscreen(); break
        case 'c': if (subtitleSrc) setShowSubs(p => { onSubsToggle?.(!p); return !p }); else handled = false; break
        case '<': setRateNearest(-1); break
        case '>': setRateNearest(1); break
        default:
          if (/^[0-9]$/.test(e.key) && ctx.duration > 0) {
            v.currentTime = (parseInt(e.key) / 10) * ctx.duration
          } else handled = false
      }
      if (handled) { e.preventDefault(); showControlsNow() }
    }
    const setRateNearest = dir => {
      const cur = keyCtxRef.current.playbackRate
      const i = SPEED_OPTS.findIndex(s => s >= cur)
      const next = SPEED_OPTS[Math.max(0, Math.min(SPEED_OPTS.length - 1, (i < 0 ? SPEED_OPTS.length - 1 : i) + dir))]
      keyCtxRef.current.setRate(next)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [subtitleSrc, vRef, showControlsNow])

  // Derived values
  const pct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0
  const bufferedPct = duration > 0 ? Math.min((buffered / duration) * 100, 100) : 0
  const activeCats = settings.sponsor_categories || ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'music_offtopic']
  const currentChapter = chapters.length > 0
    ? [...chapters].reverse().find(c => currentTime >= c.time) || null
    : null
  const hoverTime = hoverPct !== null && duration > 0 ? hoverPct * duration : null
  const hoverChapter = hoverTime !== null && chapters.length > 0
    ? [...chapters].reverse().find(c => hoverTime >= c.time) || null
    : null

  return (
    <div
      className="custom-player"
      ref={containerRef}
      onMouseMove={showControlsNow}
      onClick={handleContainerClick}
      onTouchEnd={handleContainerTouchEnd}
    >
      <video
        ref={vRef}
        playsInline
        webkitPlaysInline="true"
        x-webkit-airplay="allow"
        autoPlay={settings.autoplay !== false && (!playbackQ || playbackQ === 'original')}
        onLoadedMetadata={onLoaded}
      >
        {subtitleSrc && (
          <track kind="subtitles" src={subtitleSrc} srcLang="en" label="English" />
        )}
      </video>

      {isBuffering && <div className="player-buffering-overlay"><I.Buffering /></div>}

      {tapFeedback && (
        <div className={`cp-tap-feedback ${tapFeedback === 'back' ? 'left' : 'right'}`}>
          {tapFeedback === 'back' ? <><I.Rewind10 /><span>-10s</span></> : <><I.Skip10 /><span>+10s</span></>}
        </div>
      )}

      {showSubs && activeCueText && (
        <div className={`cp-subtitle-overlay${showControls ? ' controls-visible' : ''}`}>
          {activeCueText.split('\n').filter(l => l.trim()).slice(-1).map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      )}

      {/* Center overlay: rewind / play-pause / skip */}
      <div
        className={`cp-center-overlay${showControls ? '' : ' hidden'}`}
        onClick={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        <button className="cp-center-btn" onClick={() => seekRelative(-10)} title="Rewind 10s">
          <I.Rewind10 />
        </button>
        <button className="cp-center-btn cp-center-play" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
          {playing ? <I.Pause /> : <I.Play />}
        </button>
        <button className="cp-center-btn" onClick={() => seekRelative(10)} title="Skip 10s">
          <I.Skip10 />
        </button>
      </div>

      <div
        className={`cp-controls${showControls ? '' : ' hidden'}`}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => { e.stopPropagation(); showControlsNow() }}
        onTouchEnd={e => e.stopPropagation()}
      >
        <div className="cp-gradient" />

        {/* Seek bar */}
        <div
          className="cp-seek-wrap"
          ref={seekBarRef}
          onMouseDown={onSeekMouseDown}
          onTouchStart={onSeekTouchStart}
          onMouseMove={e => setHoverPct(getSeekPct(e.clientX))}
          onMouseLeave={() => setHoverPct(null)}
        >
          <div className="cp-seek-track" />
          <div className="cp-seek-buffered" style={{ width: `${bufferedPct}%` }} />
          <div className="cp-seek-progress" style={{ width: `${pct}%` }} />

          {/* Sponsor segment blocks */}
          {sponsorSegs.map((seg, i) => {
            const [start, end] = seg.segment || []
            if (start == null || end == null || !duration) return null
            const active = activeCats.includes(seg.category)
            return (
              <div
                key={i}
                className="cp-seek-sponsor"
                style={{
                  left: `${(start / duration) * 100}%`,
                  width: `${Math.max(0.5, ((end - start) / duration) * 100)}%`,
                  background: SPONSOR_COLORS[seg.category] || '#fff',
                  opacity: active ? 0.85 : 0.25,
                }}
              />
            )
          })}

          {/* Chapter tick marks (skip index 0 — start of video) */}
          {chapters.map((c, i) => i > 0 && duration > 0 && (
            <div
              key={i}
              className="cp-seek-chapter-tick"
              style={{ left: `${(c.time / duration) * 100}%` }}
            />
          ))}

          {/* Seek thumb */}
          <div className="cp-seek-thumb" style={{ left: `${pct}%` }} />

          {/* Hover tooltip */}
          {hoverPct !== null && hoverTime !== null && (
            <div
              className="cp-seek-tooltip"
              style={{ left: `${Math.max(2, Math.min(98, hoverPct * 100))}%` }}
            >
              {storyboard && storyboard.url && (() => {
                const idx = Math.max(0, Math.min(storyboard.count - 1, Math.floor(hoverTime / storyboard.interval)))
                const col = idx % storyboard.cols
                const row = Math.floor(idx / storyboard.cols)
                return (
                  <div
                    className="cp-seek-preview"
                    style={{
                      width: storyboard.tile_w,
                      height: storyboard.tile_h,
                      backgroundImage: `url(${storyboard.url})`,
                      backgroundPosition: `-${col * storyboard.tile_w}px -${row * storyboard.tile_h}px`,
                    }}
                  />
                )
              })()}
              {fmtTime(hoverTime)}
              {hoverChapter && <div className="cp-seek-tooltip-chapter">{hoverChapter.label}</div>}
            </div>
          )}
        </div>

        {/* Button row */}
        <div className="cp-btn-row">
          {onPlayPrev && (
            <button className="cp-btn" onClick={onPlayPrev} title="Previous">
              <I.SkipPrev />
            </button>
          )}
          <button className="cp-btn" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
            {playing ? <I.Pause /> : <I.Play />}
          </button>
          {onPlayNext && (
            <button className="cp-btn" onClick={onPlayNext} title="Next">
              <I.SkipNext />
            </button>
          )}

          <span className="cp-time">{fmtTime(currentTime)} / {fmtTime(duration)}</span>

          <div style={{ flex: 1 }} />

          {/* Volume — Android Chrome has read-only volume, hide controls there */}
          {!isAndroid && (
            <div className="cp-vol-wrap" onClick={e => e.stopPropagation()}>
              <button
                className="cp-btn"
                onClick={() => setShowVolumeSlider(p => !p)}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <I.VolumeMuted /> : <I.Volume />}
              </button>
              {showVolumeSlider && (
                <input
                  className="cp-vol-slider"
                  type="range" min="0" max="1" step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                />
              )}
            </div>
          )}

          {/* Settings menu */}
          <div className="cp-menu-wrap" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              className={`cp-btn${showSettingsMenu ? ' cp-btn-active' : ''}`}
              title="Settings"
              onClick={() => { setShowSettingsMenu(true); setSettingsView('main') }}
            >
              <I.Settings />
            </button>
          </div>

          {/* Chapters */}
          {chapters.length > 0 && (
            <div className="cp-chapters-btn-wrap" style={{ position: 'relative' }}>
              <button
                className="cp-btn"
                title="Chapters"
                onClick={e => { e.stopPropagation(); setShowChaptersPanel(p => !p) }}
              >
                <I.List />
              </button>
              {showChaptersPanel && (
                <div className="cp-chapters-panel" onClick={e => e.stopPropagation()}>
                  {chapters.map((c, i) => (
                    <div
                      key={i}
                      className={`cp-chapter-item${currentChapter === c ? ' active' : ''}`}
                      onClick={() => {
                        const v = vRef.current
                        if (v) { v.currentTime = c.time; v.play().catch(() => {}) }
                        setShowChaptersPanel(false)
                      }}
                    >
                      <span className="chapter-time">{c.display}</span>
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen */}
          <button className="cp-btn" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
            {isFullscreen ? <I.ExitFullscreen /> : <I.Fullscreen />}
          </button>
        </div>
      </div>

      {/* Playlist countdown overlay */}
      {countdown !== null && (
        <div className="cp-countdown-overlay" onClick={e => e.stopPropagation()}>
          <div className="cp-countdown-box">
            <div className="cp-countdown-number">{countdown}</div>
            <div className="cp-countdown-label">Next video</div>
            <div className="cp-countdown-actions">
              <button className="cp-countdown-btn" onClick={() => { setCountdown(null); onPlayNextRef.current?.() }}>
                Skip
              </button>
              <button className="cp-countdown-btn cp-countdown-cancel" onClick={() => setCountdown(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings menu — top-level for z-index above center overlay */}
      {showSettingsMenu && (
        <div
          className="cp-settings-backdrop"
          onClick={() => setShowSettingsMenu(false)}
          onTouchEnd={e => { e.stopPropagation(); setShowSettingsMenu(false) }}
          onPointerDown={e => e.stopPropagation()}
        />
      )}
      {showSettingsMenu && (
        <div
          className="cp-settings-menu"
          onClick={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Main menu view */}
          {settingsView === 'main' && (
            <>
              {/* Subtitles / CC */}
              {subtitleSrc && (
                <button
                  className="cp-settings-row"
                  onClick={() => setShowSubs(p => { onSubsToggle?.(!p); return !p })}
                >
                  <span className="cp-settings-icon"><I.CC /></span>
                  <span className="cp-settings-label">Subtitles</span>
                  <span className={`cp-settings-value${showSubs ? ' active' : ''}`}>{showSubs ? 'On' : 'Off'}</span>
                </button>
              )}

              {/* Playback speed */}
              <button
                className="cp-settings-row"
                onClick={() => setSettingsView('speed')}
              >
                <span className="cp-settings-icon"><I.Speed /></span>
                <span className="cp-settings-label">Playback speed</span>
                <span className={`cp-settings-value${playbackRate !== 1 ? ' active' : ''}`}>{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
              </button>

              {/* Quality */}
              <button
                className="cp-settings-row"
                onClick={() => setSettingsView('quality')}
              >
                <span className="cp-settings-icon"><I.Settings /></span>
                <span className="cp-settings-label">Quality</span>
                <span className="cp-settings-value">{(qualityOpts.find(o => o.v === playbackQ) || qualityOpts[0])?.l ?? playbackQ}</span>
              </button>

              {/* PiP */}
              {pipSupported && (
                <button className="cp-settings-row" onClick={onPip}>
                  <span className="cp-settings-icon"><I.Pip /></span>
                  <span className="cp-settings-label">Picture in Picture</span>
                </button>
              )}
            </>
          )}

          {/* Speed sub-selector */}
          {settingsView === 'speed' && (
            <>
              <button className="cp-settings-row cp-settings-back" onClick={() => setSettingsView('main')}>
                <span className="cp-settings-icon"><I.Back /></span>
                <span className="cp-settings-label">Playback speed</span>
              </button>
              <div className="cp-settings-sub">
                {SPEED_OPTS.map(s => (
                  <button
                    key={s}
                    className={`cp-popup-item${s === playbackRate ? ' active' : ''}`}
                    onClick={() => setRate(s)}
                  >
                    {s === 1 ? 'Normal' : `${s}x`}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Quality sub-selector */}
          {settingsView === 'quality' && (
            <>
              <button className="cp-settings-row cp-settings-back" onClick={() => setSettingsView('main')}>
                <span className="cp-settings-icon"><I.Back /></span>
                <span className="cp-settings-label">Quality</span>
              </button>
              <div className="cp-settings-sub">
                {qualityOpts.map(o => (
                  <button
                    key={o.v}
                    className={`cp-popup-item${o.v === playbackQ ? ' active' : ''}`}
                    onClick={() => { setSettingsView('main'); changeQuality(o.v) }}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
