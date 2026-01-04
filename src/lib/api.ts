import { supabase } from './supabase'
import { Brevet } from '../types/brevet'

export interface FetchBrevetsParams {
  year?: number
  dateStart?: string | null
  dateEnd?: string | null
  distances?: number[]
  eligibleR10000?: boolean
}

export async function fetchBrevets(params: FetchBrevetsParams = {}): Promise<Brevet[]> {
  console.log('🔵 Fetching BRMs from Supabase:', params)

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
        .select(`
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
        `)
        .range(from, to)

      // Filtrer par année
      if (params.year) {
        const yearStart = `${params.year}-01-01`
        const yearEnd = `${params.year}-12-31`
        query = query.gte('date_brevet', yearStart).lte('date_brevet', yearEnd)
      }

      // Filtrer par date de début
      if (params.dateStart) {
        query = query.gte('date_brevet', params.dateStart)
      }

      // Filtrer par date de fin
      if (params.dateEnd) {
        query = query.lte('date_brevet', params.dateEnd)
      }

      // Filtrer par distances
      if (params.distances !== undefined) {
        if (params.distances.length === 0) {
          // Si aucune distance n'est sélectionnée, ne retourner aucun résultat
          return []
        }
        query = query.in('distance_brevet', params.distances)
      }

      // Filtrer par éligibilité R10000
      if (params.eligibleR10000) {
        query = query.eq('eligible_r10000', true)
      }

      // Filtrer les brevets avec coordonnées uniquement
      query = query.not('latitude', 'is', null).not('longitude', 'is', null)

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

    console.log('🟢 Supabase returned all data:', {
      count: allBrevets.length,
      pages: page,
      firstItem: allBrevets.length > 0 ? allBrevets[0] : null
    })

    return allBrevets
  } catch (error) {
    console.error('🔴 Error fetching brevets from Supabase:', error)
    throw error
  }
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
        .select(`
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
        `)
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
