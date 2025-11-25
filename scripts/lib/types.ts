export type { Club, Brevet } from '../../src/types/brevet'

export interface ACPApiBrevet {
  id: number
  codeClub: string
  nomclub: string | null
  nomorganisateur: string | null
  mailorganisateur: string | null
  distance: string | null
  date: string  // DD/MM/YYYY format
  denivele: string | null
  r10000: number
  ville: string | null
  departement: string | null
  region: string | null
  maplink: string | null
  nom: string | null
  pays: string | null
  clubwebsite: string | null
  statut: string  // "Annule" for cancelled brevets
}

export interface SyncReport {
  success: boolean
  timestamp: string
  duration: number
  stats: {
    api: {
      total_fetched: number
      valid_processed: number
      cancelled_excluded: number
    }
    database: {
      clubs_upserted: number
      brevets_new: number
      brevets_updated: number
      brevets_deleted: number
    }
    geocoding: {
      total_required: number
      success: number
      failed: number
    }
  }
}
