import { useState, useEffect } from 'react'
import { thumbUrl } from '../utils'

export function Av({ src, name, size = 28, onClick, active, icon }) {
  const [err, setErr] = useState(false)
  useEffect(() => { setErr(false) }, [src])
  const ch = (name || '?').charAt(0).toUpperCase()
  const style = {
    width: size, height: size, minWidth: size, fontSize: size * 0.43,
    cursor: onClick ? 'pointer' : 'default',
    borderRadius: '50%',
    background: 'var(--bg-active)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: 'var(--accent)',
    overflow: 'hidden',
    flexShrink: 0,
    transition: 'outline-color 0.2s, transform 0.15s',
    ...(active ? { outline: '2.5px solid var(--accent)', outlineOffset: '2px', transform: 'scale(1.05)' } : {}),
  }
  if (icon && (!src || err))
    return <div style={style} onClick={onClick} title={name}>{icon}</div>
  if (!src || err)
    return <div style={style} onClick={onClick} title={name}>{ch}</div>
  return (
    <div style={style} onClick={onClick} title={name}>
      <img src={thumbUrl(src)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setErr(true)} />
    </div>
  )
}
