import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

export function getRealIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}
