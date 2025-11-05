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
    let query = supabase
      .from('brevets')
      .select(`
        *,
        club:clubs(*)
      `)

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

    console.log('🟢 Supabase returned data:', {
      count: data?.length || 0,
      firstItem: data && data.length > 0 ? data[0] : null
    })

    return (data || []) as Brevet[]
  } catch (error) {
    console.error('🔴 Error fetching brevets from Supabase:', error)
    throw error
  }
}
