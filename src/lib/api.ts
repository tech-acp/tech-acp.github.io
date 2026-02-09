import { supabase } from './supabase'
import { Brevet } from '../types/brevet'

export async function fetchBrevets(year: number): Promise<Brevet[]> {
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

      const query = supabase
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
        .gte('date_brevet', yearStart)
        .lte('date_brevet', yearEnd)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .range(from, to)

      const { data, error } = await query

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

    console.log('🟢 Supabase returned all data:', {
      count: allBrevets.length,
      pages: page
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
