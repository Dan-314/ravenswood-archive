const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

export function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const rtf = new Intl.RelativeTimeFormat('en')
  for (const [unit, unitSeconds] of UNITS) {
    if (seconds >= unitSeconds) return rtf.format(-Math.floor(seconds / unitSeconds), unit)
  }
  return 'just now'
}

export function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString()
}
