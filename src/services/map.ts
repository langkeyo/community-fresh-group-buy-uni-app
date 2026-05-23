interface GeocodeResult {
  lat: number
  lng: number
}

export async function geocodeByTencentMap(
  address: string,
  key: string
): Promise<GeocodeResult | null> {
  const safeAddress = address?.trim()
  const safeKey = key?.trim()
  if (!safeAddress || !safeKey) return null

  // #ifdef MP-WEIXIN
  try {
    const response = await uni.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      method: 'GET',
      data: {
        address: safeAddress,
        key: safeKey
      }
    })
    const raw = (response.data || {}) as any
    if (Number(raw.status) !== 0) return null
    const location = raw?.result?.location
    const lat = Number(location?.lat)
    const lng = Number(location?.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
  // #endif

  return null
}

export function buildTencentMapMarkerUrl(params: {
  name: string
  address: string
  latitude?: number
  longitude?: number
  key?: string
  referer?: string
}) {
  const name = encodeURIComponent(params.name || '目的地')
  const address = encodeURIComponent(params.address || '')
  const referer = encodeURIComponent(params.referer || 'community-group-buy')
  const key = encodeURIComponent(params.key || '')
  const coord =
    Number.isFinite(params.latitude) && Number.isFinite(params.longitude)
      ? `${params.latitude},${params.longitude}`
      : ''
  const encodedCoord = encodeURIComponent(coord)
  const keyPart = key ? `&key=${key}` : ''
  return `https://apis.map.qq.com/uri/v1/marker?marker=coord:${encodedCoord};title:${name};addr:${address}&referer=${referer}${keyPart}`
}
