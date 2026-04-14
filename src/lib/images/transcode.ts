import { createHash } from 'node:crypto'
import sharp from 'sharp'

export const MAX_INPUT_BYTES = 2 * 1024 * 1024 // 2 MB
export const MAX_INPUT_PIXELS = 4_000_000      // decompression-bomb guard
export const MAX_OUTPUT_DIMENSION = 1024       // px, longest side

const ALLOWED_FORMATS = new Set(['png', 'jpeg', 'jpg', 'webp'])

export type TranscodeError =
  | { kind: 'too-large' }
  | { kind: 'bad-format'; detected: string | null }
  | { kind: 'decode-failed' }

export type TranscodeResult = {
  buffer: Buffer
  hash: string
  width: number
  height: number
}

export async function transcodeImage(
  input: Buffer,
): Promise<{ ok: true; value: TranscodeResult } | { ok: false; error: TranscodeError }> {
  if (input.byteLength > MAX_INPUT_BYTES) {
    return { ok: false, error: { kind: 'too-large' } }
  }

  let pipeline: sharp.Sharp
  let metadata: sharp.Metadata
  try {
    pipeline = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
    metadata = await pipeline.metadata()
  } catch {
    return { ok: false, error: { kind: 'decode-failed' } }
  }

  const format = metadata.format ?? null
  if (!format || !ALLOWED_FORMATS.has(format)) {
    return { ok: false, error: { kind: 'bad-format', detected: format } }
  }

  let out: Buffer
  try {
    out = await pipeline
      .rotate()
      .resize({
        width: MAX_OUTPUT_DIMENSION,
        height: MAX_OUTPUT_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer()
  } catch {
    return { ok: false, error: { kind: 'decode-failed' } }
  }

  const outMeta = await sharp(out).metadata()
  const hash = createHash('sha256').update(out).digest('hex')

  return {
    ok: true,
    value: {
      buffer: out,
      hash,
      width: outMeta.width ?? 0,
      height: outMeta.height ?? 0,
    },
  }
}
