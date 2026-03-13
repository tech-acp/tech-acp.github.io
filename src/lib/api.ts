import { supabase } from './supabase'
import { Brevet } from '../types/brevet'

// Colonnes légères pour l'affichage carte (pas de club join, pas d'organisateur)
const MAP_COLUMNS = `
  id,
  date_brevet,
  distance_brevet,
  nom_brm,
  latitude,
  longitude,
  ville_depart,
  departement,
  region,
  denivele,
  eligible_r10000
`

// Colonnes complètes pour les détails (avec club join)
const FULL_COLUMNS = `
  id,
  date_brevet,
  distance_brevet,
  nom_brm,
  latitude,
  longitude,
  ville_depart,
  departement,
  region,
  nom_organisateur,
  mail_organisateur,
  club_id,
  denivele,
  eligible_r10000,
  lien_itineraire_brm,
  acces_homologations,
  club:clubs(
    code_acp,
    nom_club,
    page_web_club,
    representant_acp,
    email_representant_acp,
    pays
  )
`

// --- Cache localStorage ---
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 heures

interface CacheEntry<T> {
  timestamp: number
  data: T
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { timestamp: Date.now(), data }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage plein ou indisponible — on continue sans cache
  }
}

export function invalidateCache(year?: number): void {
  try {
    if (year) {
      localStorage.removeItem(`brevets_map_${year}`)
    } else {
      // Invalider tous les caches brevets
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith('brevets_')) {
          localStorage.removeItem(key)
        }
      }
    }
  } catch {
    // Silencieux
  }
}

// Fetch léger pour la carte (colonnes minimales, avec cache)
export async function fetchBrevets(year: number): Promise<Brevet[]> {
  const cacheKey = `brevets_map_${year}`
  const cached = getCache<Brevet[]>(cacheKey)
  if (cached) {
    console.log(`🟢 Loaded ${cached.length} brevets from cache`)
    return cached
  }

  console.log('🔵 Fetching BRMs from Supabase for year:', year)

  try {
    const PAGE_SIZE = 1000
    let allBrevets: Brevet[] = []
    let page = 0
    let hasMore = true

    const yearStart = `${year}-01-01`
    const yearEnd = `${year}-12-31`

    while (hasMore) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error } = await supabase
        .from('brevets')
        .select(MAP_COLUMNS)
        .gte('date_brevet', yearStart)
        .lte('date_brevet', yearEnd)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .range(from, to)

      if (error) {
        console.error('🔴 Supabase error:', error)
        throw error
      }

      const brevets = (data || []) as Brevet[]
      allBrevets = [...allBrevets, ...brevets]

      console.log(`🟢 Fetched page ${page + 1}: ${brevets.length} brevets (total: ${allBrevets.length})`)

      hasMore = brevets.length === PAGE_SIZE
      page++
    }

    console.log('🟢 Supabase returned all data:', { count: allBrevets.length, pages: page })

    setCache(cacheKey, allBrevets)
    return allBrevets
  } catch (error) {
    console.error('🔴 Error fetching brevets from Supabase:', error)
    throw error
  }
}

// Fetch des détails complets pour un ensemble de brevets (quand l'utilisateur clique sur un marqueur)
export async function fetchBrevetDetails(brevetIds: number[]): Promise<Brevet[]> {
  if (brevetIds.length === 0) return []

  const { data, error } = await supabase
    .from('brevets')
    .select(FULL_COLUMNS)
    .in('id', brevetIds)

  if (error) {
    console.error('🔴 Error fetching brevet details:', error)
    throw error
  }

  return (data || []) as Brevet[]
}

// Fonction pour récupérer TOUS les brevets (y compris sans coordonnées) pour la page admin
export async function fetchAllBrevets(): Promise<Brevet[]> {
  console.log('🔵 Fetching ALL BRMs from Supabase (including without coordinates)')

  try {
    const PAGE_SIZE = 1000
    let allBrevets: Brevet[] = []
    let page = 0
    let hasMore = true

    while (hasMore) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('brevets')
        .select(FULL_COLUMNS)
        .range(from, to)
        .order('date_brevet', { ascending: true })
        .order('id', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error('🔴 Supabase error:', error)
        throw error
      }

      const brevets = (data || []) as Brevet[]
      allBrevets = [...allBrevets, ...brevets]

      console.log(`🟢 Fetched page ${page + 1}: ${brevets.length} brevets (total: ${allBrevets.length})`)

      // Si on a récupéré moins de PAGE_SIZE résultats, c'est la dernière page
      hasMore = brevets.length === PAGE_SIZE
      page++
    }

    console.log('🟢 Supabase returned all brevets:', {
      count: allBrevets.length,
      pages: page
    })

    return allBrevets
  } catch (error) {
    console.error('🔴 Error fetching all brevets from Supabase:', error)
    throw error
  }
}
