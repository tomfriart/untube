import React, { useState, useEffect, useRef, useCallback } from 'react'
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

export function CustomPlayer({
  vRef, cur, chapters, sponsorSegs, settings,
  playbackQ, qualityOpts, changeQuality,
  isBuffering, pipSupported, onPip, onLoaded,
  subtitleSrc, onSubsToggle,
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
  const [hoverPct, setHoverPct] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSubs, setShowSubs] = useState(!!settings.show_subtitles)
  const [activeCueText, setActiveCueText] = useState('')

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
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('durationchange', onDurationChange)
    v.addEventListener('volumechange', onVolumeChange)
    v.addEventListener('progress', onProgress)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('durationchange', onDurationChange)
      v.removeEventListener('volumechange', onVolumeChange)
      v.removeEventListener('progress', onProgress)
    }
  }, [vRef])

  // Fullscreen change (standard + webkit)
  useEffect(() => {
    const onChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement
      setIsFullscreen(!!fsEl)
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

  // Reset cue text on video change; restore saved subtitle preference
  useEffect(() => { setActiveCueText(''); setShowSubs(!!settings.show_subtitles) }, [subtitleSrc])

  // Clear cue text when subs turned off
  useEffect(() => { if (!showSubs) setActiveCueText('') }, [showSubs])

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

  // Desktop: click video to play/pause
  const handleContainerClick = useCallback(() => {
    togglePlay()
  }, [togglePlay])

  // Mobile: tap video to show controls (if hidden) or toggle play (if shown)
  // e.preventDefault() stops the redundant click event from also firing
  const handleContainerTouchEnd = useCallback(e => {
    e.preventDefault()
    if (!showControlsRef.current) {
      showControlsNow()
    } else {
      togglePlay()
    }
  }, [showControlsNow, togglePlay])

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
    } else if (isNativeFs) {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    } else if (isIOS || isAndroid) {
      // iOS/Android: native fullscreen hands control back to the browser's video UI,
      // overriding custom controls. Use CSS pseudo-fullscreen instead.
      el.classList.add('pseudo-fs')
      setIsFullscreen(true)
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // requestFullscreen blocked (e.g. policy) — fall back to pseudo-fullscreen
        el.classList.add('pseudo-fs')
        setIsFullscreen(true)
      })
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
    } else if (v?.webkitEnterFullscreen) {
      v.webkitEnterFullscreen()
    }
  }

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

      {showSubs && activeCueText && (
        <div className={`cp-subtitle-overlay${showControls ? ' controls-visible' : ''}`}>
          {activeCueText.split('\n').filter(l => l.trim()).slice(-1).map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      )}

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
              {fmtTime(hoverTime)}
              {hoverChapter && <div className="cp-seek-tooltip-chapter">{hoverChapter.label}</div>}
            </div>
          )}
        </div>

        {/* Button row */}
        <div className="cp-btn-row">
          <button className="cp-btn" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
            {playing ? <I.Pause /> : <I.Play />}
          </button>

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

          {/* Quality selector */}
          <select className="cp-quality" value={playbackQ} onChange={e => changeQuality(e.target.value)}>
            {qualityOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>

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

          {/* CC */}
          {subtitleSrc && (
            <button
              className="cp-btn"
              title="Subtitles"
              style={showSubs ? { color: 'var(--accent)', position: 'relative', zIndex: 25 } : { position: 'relative', zIndex: 25 }}
              onClick={e => { e.stopPropagation(); setShowSubs(p => { onSubsToggle?.(!p); return !p }) }}
            >
              <I.CC />
            </button>
          )}

          {/* PiP */}
          {pipSupported && (
            <button className="cp-btn" title="Picture in Picture" onClick={onPip}>
              <I.Pip />
            </button>
          )}

          {/* Fullscreen */}
          <button className="cp-btn" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
            {isFullscreen ? <I.ExitFullscreen /> : <I.Fullscreen />}
          </button>
        </div>
      </div>
    </div>
  )
}
