export interface Club {
  code_acp: string
  nom_club: string | null
  pays: string | null
  representant_acp: string | null
  email_representant_acp: string | null
  page_web_club: string | null
}

export interface Brevet {
  id: number
  club_id: string
  club?: Club
  nom_organisateur: string | null
  mail_organisateur: string | null
  distance_brevet: number | null
  date_brevet: string
  denivele: number | null
  eligible_r10000: boolean | null
  ville_depart: string | null
  departement: string | null
  region: string | null
  acces_homologations: boolean | null
  lien_itineraire_brm: string | null
  nom_brm: string | null
  latitude: number | null
  longitude: number | null
}

export interface BrevetFilters {
  distances: number[]
  dateStart: string | null
  dateEnd: string | null
}

