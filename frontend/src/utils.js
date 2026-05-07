export const API = ''

export const fmtDur = s => {
  if (!s) return ''
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

export const fmtViews = n => {
  if (!n) return ''
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M views`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K views`
  return `${n} views`
}

export const timeAgo = ds => {
  if (!ds) return ''
  const d = ds.length === 8
    ? new Date(`${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`)
    : new Date(ds)
  const upload = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const today = new Date()
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((now - upload) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export const fmtDate = ds => {
  if (!ds) return ''
  if (ds.length === 8) return `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`
  return new Date(ds).toLocaleDateString()
}

export const daysLabel = d => {
  if (!d || d <= 0) return 'No limit'
  if (d === 1) return '1 day'
  if (d < 30) return `${d} days`
  if (d < 365) return `~${Math.round(d / 30)} months`
  return `~${(d / 365).toFixed(1)} years`
}

export const jsonEq = (a, b) => {
  try { return JSON.stringify(a) === JSON.stringify(b) } catch { return false }
}

export const thumbUrl = url => {
  if (!url) return ''
  try {
    const h = new URL(url).hostname
    const yt = ['i.ytimg.com', 'i1.ytimg.com', 'i2.ytimg.com', 'i3.ytimg.com',
      'img.youtube.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com',
      'lh3.googleusercontent.com']
    if (yt.some(d => h === d || h.endsWith('.' + d)))
      return `${API}/api/thumb?url=${encodeURIComponent(url)}`
  } catch (e) {}
  return url
}

export function parseTimestamps(text) {
  if (!text) return []
  const re = /(?:^|\n)\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+[-–—]?\s*(.+)/gm
  const stamps = []; let m
  while ((m = re.exec(text)) !== null) {
    const h = parseInt(m[1] || '0'), min = parseInt(m[2]), sec = parseInt(m[3])
    stamps.push({
      time: h * 3600 + min * 60 + sec,
      label: m[4].trim(),
      display: m[1] ? `${m[1]}:${m[2]}:${m[3]}` : `${m[2]}:${m[3]}`,
    })
  }
  return stamps
}
