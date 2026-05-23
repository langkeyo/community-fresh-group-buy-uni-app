const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080'

function toAbsoluteUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('wxfile://')) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return `${API_BASE_URL}/${url}`
}

function isLikelyInvalidMiniProgramUrl(url: string): boolean {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)/i.test(url)
}

export function resolveAvatarUrl(raw?: string, fallback?: string): string {
  const resolved = toAbsoluteUrl(String(raw || '').trim())
  const fb = toAbsoluteUrl(String(fallback || '').trim())
  if (!resolved) return fb
  if (!isLikelyInvalidMiniProgramUrl(resolved)) return resolved
  if (fb && !isLikelyInvalidMiniProgramUrl(fb)) return fb
  return ''
}

