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
  club_id: string | null
  club?: Club | null
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

// Fonction pour convertir les données de l'API vers le format Brevet
export function mapApiBrevet(apiBrevet: {
  id: number
  codeclub: string
  nom_organisateur: string | null
  mail_organisateur: string | null
  distance: number | null
  date: string
  denivele: number | null
  eligible_r10000: number | null
  ville_depart: string | null
  departement: string | null
  region: string | null
  acces_homologations: number | null
  lien_itineraire_brm: string | null
  nom_brm: string | null
  latitude: number | null
  longitude: number | null
  code_acp?: string
  nom_club?: string | null
  pays?: string | null
  representant_acp?: string | null
  email_representant_acp?: string | null
  page_web_club?: string | null
}): Brevet {
  return {
    id: apiBrevet.id,
    club_id: apiBrevet.codeclub,
    nom_organisateur: apiBrevet.nom_organisateur,
    mail_organisateur: apiBrevet.mail_organisateur,
    distance_brevet: apiBrevet.distance,
    date_brevet: apiBrevet.date,
    denivele: apiBrevet.denivele,
    eligible_r10000: apiBrevet.eligible_r10000 === 1,
    ville_depart: apiBrevet.ville_depart,
    departement: apiBrevet.departement,
    region: apiBrevet.region,
    acces_homologations: apiBrevet.acces_homologations === 1,
    lien_itineraire_brm: apiBrevet.lien_itineraire_brm,
    nom_brm: apiBrevet.nom_brm,
    latitude: apiBrevet.latitude,
    longitude: apiBrevet.longitude,
    // Mapper les données du club si disponibles
    club: apiBrevet.code_acp ? {
      code_acp: apiBrevet.code_acp,
      nom_club: apiBrevet.nom_club || null,
      pays: apiBrevet.pays || null,
      representant_acp: apiBrevet.representant_acp || null,
      email_representant_acp: apiBrevet.email_representant_acp || null,
      page_web_club: apiBrevet.page_web_club || null,
    } : undefined,
  }
}

export interface BrevetFilters {
  distances: number[]
  dateStart: string | null
  dateEnd: string | null
  eligibleR10000: boolean
}

// Palette de couleurs pour les distances (correspond aux boutons de filtre)
export function getDistanceColor(distance: number): string {
  const colors: Record<number, string> = {
    200: '#2E5077',  // Bleu foncé
    300: '#4A6FA5',  // Bleu moyen
    400: '#6B9BD1',  // Bleu clair
    600: '#8B5A8A',  // Violet
    1000: '#A84448', // Rouge brique
  }
  return colors[distance] || '#2E5077' // Par défaut: bleu foncé
}

