// Tracés des itinéraires BRM, lus directement depuis RideWithGPS et OpenRunner
// (API publiques, appel autorisé depuis le navigateur). Les autres sites restent en lien externe.

export interface RouteTrack {
  coords: [number, number][] // [longitude, latitude]
  ele: (number | null)[] // altitude en m, par point
  dist: number[] // distance cumulée en km, par point
}

type RouteSource = { kind: 'rwgps' | 'openrunner'; id: string }
type RawPoint = { lon: number; lat: number; ele: number | null }

function getRouteSource(url: string | null): RouteSource | null {
  if (!url) return null
  const rwgps = url.match(/ridewithgps\.com\/routes\/(\d+)/)
  if (rwgps) return { kind: 'rwgps', id: rwgps[1] }
  const openrunner = url.match(/openrunner\.com\/(?:[a-z]{2}\/)?(?:route-details|r)\/(\d+)/)
  if (openrunner) return { kind: 'openrunner', id: openrunner[1] }
  return null
}

export function canDisplayRoute(url: string | null): boolean {
  return getRouteSource(url) !== null
}

function haversineKm(a: RawPoint, b: RawPoint): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

// ponytail: un point sur N au-delà de 1500 points, suffisant à l'échelle d'un BRM ; simplification Douglas-Peucker si ça se voit
const MAX_POINTS = 1500
function toTrack(points: RawPoint[]): RouteTrack | null {
  if (points.length < 2) return null
  // Distance cumulée calculée sur tous les points, avant de réduire leur nombre
  const cumul = [0]
  for (let i = 1; i < points.length; i++) cumul.push(cumul[i - 1] + haversineKm(points[i - 1], points[i]))
  const step = Math.max(1, Math.ceil(points.length / MAX_POINTS))
  const kept = points.map((_, i) => i).filter(i => i % step === 0 || i === points.length - 1)
  return {
    coords: kept.map(i => [points[i].lon, points[i].lat]),
    ele: kept.map(i => points[i].ele),
    dist: kept.map(i => cumul[i])
  }
}

async function fetchRwgps(id: string): Promise<RawPoint[]> {
  const res = await fetch(`https://ridewithgps.com/routes/${id}.json`)
  if (!res.ok) throw new Error(`RideWithGPS ${res.status}`)
  const { track_points } = await res.json() as { track_points?: { x: number; y: number; e?: number }[] }
  return (track_points ?? []).map(p => ({ lon: p.x, lat: p.y, ele: p.e ?? null }))
}

async function fetchOpenrunner(id: string): Promise<RawPoint[]> {
  const res = await fetch(`https://api.openrunner.com/api/v2/routes/${id}/export/gpx-track`)
  if (!res.ok) throw new Error(`OpenRunner ${res.status}`)
  const gpx = new DOMParser().parseFromString(await res.text(), 'application/xml')
  return Array.from(gpx.getElementsByTagName('trkpt')).map(pt => {
    const ele = pt.getElementsByTagName('ele')[0]?.textContent
    return { lon: Number(pt.getAttribute('lon')), lat: Number(pt.getAttribute('lat')), ele: ele ? Number(ele) : null }
  })
}

// Cache mémoire : un même parcours sert souvent à plusieurs brevets, et on rouvre souvent le même point
const cache = new Map<string, Promise<RouteTrack | null>>()

export function fetchRouteTrack(url: string | null): Promise<RouteTrack | null> {
  const source = getRouteSource(url)
  if (!source) return Promise.resolve(null)
  const key = `${source.kind}:${source.id}`
  if (!cache.has(key)) {
    const load = source.kind === 'rwgps' ? fetchRwgps(source.id) : fetchOpenrunner(source.id)
    cache.set(key, load
      .then(toTrack)
      .catch(err => {
        console.error('🔴 Itinéraire indisponible:', url, err)
        cache.delete(key) // réessayer au prochain clic
        return null
      }))
  }
  return cache.get(key)!
}
