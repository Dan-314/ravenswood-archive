interface DownloadPdfParams {
  rawJson: unknown
  options: unknown
  filename: string
  scriptId?: string
}

/**
 * Fetch a generated PDF from the API and trigger a browser download.
 * Throws on failure with a user-safe error message.
 */
export async function downloadPdf({ rawJson, options, filename, scriptId }: DownloadPdfParams): Promise<void> {
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawJson, options, filename, scriptId }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(err.error || 'Failed to generate PDF')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
