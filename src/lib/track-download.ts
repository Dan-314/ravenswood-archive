/**
 * Fire-and-forget download tracking.
 * Intentionally swallows errors -- tracking failure should never
 * block user's action.
 */
export function trackDownload(scriptId: string): void {
  fetch('/api/track-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptId }),
  }).catch(() => {
    // Best-effort tracking; silently ignore failures
  })
}
