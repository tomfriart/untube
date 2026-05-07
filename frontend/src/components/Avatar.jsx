import { useState, useEffect } from 'react'
import { thumbUrl } from '../utils'

export function Av({ src, name, size = 28, onClick, active }) {
  const [err, setErr] = useState(false)
  useEffect(() => { setErr(false) }, [src])
  const ch = (name || '?').charAt(0).toUpperCase()
  const style = {
    width: size, height: size, minWidth: size, fontSize: size * 0.43,
    cursor: onClick ? 'pointer' : 'default',
    ...(active ? { outline: '2px solid var(--accent)', outlineOffset: '2px' } : {}),
  }
  if (!src || err)
    return <div className="channel-dot" style={style} onClick={onClick} title={name}>{ch}</div>
  return (
    <div className="channel-dot" style={style} onClick={onClick} title={name}>
      <img src={thumbUrl(src)} alt="" loading="lazy" onError={() => setErr(true)} />
    </div>
  )
}
