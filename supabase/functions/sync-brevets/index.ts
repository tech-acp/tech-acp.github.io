import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface ApiBrevet {
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
}

interface DbBrevet {
  id: number
  club_id: string | null
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
  pays: string | null
}

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
}

interface BrevetUpdate {
  id: number
  changes: Record<string, { old: any; new: any }>
  needsGeocoding: boolean
}

// Fonction utilitaire pour attendre (rate limiting)
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fonction pour convertir le format de date DD/MM/YYYY → YYYY-MM-DD
function convertDateFormat(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Fonction de géocodage via Nominatim
async function geocodeAddress(
  ville: string | null,
  departement: string | null,
  pays: string | null
): Promise<{ lat: number; lon: number } | null> {
  const addressParts: string[] = []
  if (ville && ville !== 'Pas encore déterminée') addressParts.push(ville)
  if (departement) addressParts.push(departement)
  if (pays) addressParts.push(pays)

  if (addressParts.length === 0) {
    console.log('⚠️ No address information available for geocoding')
    return null
  }

  const query = addressParts.join(', ')
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BRM-Map-App/1.0 (Supabase Edge Function; contact: support@brm-map.com)'
      }
    })

    if (!response.ok) {
      console.error(`🔴 Nominatim error: ${response.status} ${response.statusText}`)
      return null
    }

    const data: NominatimResponse[] = await response.json()

    if (data.length === 0) {
      console.log(`⚠️ No results found for: ${query}`)
      return null
    }

    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    }
  } catch (error) {
    console.error(`🔴 Geocoding error for "${query}":`, error)
    return null
  }
}

// Fonction pour détecter les changements entre un brevet API et un brevet DB
function detectChanges(apiBrevet: ApiBrevet, dbBrevet: DbBrevet): BrevetUpdate | null {
  const changes: Record<string, { old: any; new: any }> = {}
  let needsGeocoding = false

  // Comparer chaque champ
  if (apiBrevet.codeclub !== dbBrevet.club_id) {
    changes.club_id = { old: dbBrevet.club_id, new: apiBrevet.codeclub }
  }

  if (apiBrevet.nom_organisateur !== dbBrevet.nom_organisateur) {
    changes.nom_organisateur = { old: dbBrevet.nom_organisateur, new: apiBrevet.nom_organisateur }
  }

  if (apiBrevet.mail_organisateur !== dbBrevet.mail_organisateur) {
    changes.mail_organisateur = { old: dbBrevet.mail_organisateur, new: apiBrevet.mail_organisateur }
  }

  if (apiBrevet.distance !== dbBrevet.distance_brevet) {
    changes.distance_brevet = { old: dbBrevet.distance_brevet, new: apiBrevet.distance }
  }

  const convertedDate = convertDateFormat(apiBrevet.date)
  if (convertedDate !== dbBrevet.date_brevet) {
    changes.date_brevet = { old: dbBrevet.date_brevet, new: convertedDate }
  }

  if (apiBrevet.denivele !== dbBrevet.denivele) {
    changes.denivele = { old: dbBrevet.denivele, new: apiBrevet.denivele }
  }

  const apiEligibleR10000 = apiBrevet.eligible_r10000 === 1
  if (apiEligibleR10000 !== dbBrevet.eligible_r10000) {
    changes.eligible_r10000 = { old: dbBrevet.eligible_r10000, new: apiEligibleR10000 }
  }

  // Vérifier si la ville a changé (nécessite géocodage)
  if (apiBrevet.ville_depart !== dbBrevet.ville_depart) {
    changes.ville_depart = { old: dbBrevet.ville_depart, new: apiBrevet.ville_depart }
    needsGeocoding = true
  }

  if (apiBrevet.departement !== dbBrevet.departement) {
    changes.departement = { old: dbBrevet.departement, new: apiBrevet.departement }
    if (!needsGeocoding && apiBrevet.ville_depart) {
      needsGeocoding = true
    }
  }

  if (apiBrevet.region !== dbBrevet.region) {
    changes.region = { old: dbBrevet.region, new: apiBrevet.region }
  }

  const apiAccesHomologations = apiBrevet.acces_homologations === 1
  if (apiAccesHomologations !== dbBrevet.acces_homologations) {
    changes.acces_homologations = { old: dbBrevet.acces_homologations, new: apiAccesHomologations }
  }

  if (apiBrevet.lien_itineraire_brm !== dbBrevet.lien_itineraire_brm) {
    changes.lien_itineraire_brm = { old: dbBrevet.lien_itineraire_brm, new: apiBrevet.lien_itineraire_brm }
  }

  if (apiBrevet.nom_brm !== dbBrevet.nom_brm) {
    changes.nom_brm = { old: dbBrevet.nom_brm, new: apiBrevet.nom_brm }
  }

  if (apiBrevet.pays !== dbBrevet.pays) {
    changes.pays = { old: dbBrevet.pays, new: apiBrevet.pays }
    if (!needsGeocoding && apiBrevet.ville_depart) {
      needsGeocoding = true
    }
  }

  // Si aucun changement, retourner null
  if (Object.keys(changes).length === 0) {
    return null
  }

  return {
    id: apiBrevet.id,
    changes,
    needsGeocoding
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Créer le client Supabase avec la service_role key pour bypasser RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔵 Starting intelligent BRM sync...')

    // 1. Récupérer les données de l'API source
    const apiUrl = 'https://myaccount.audax-club-parisien.com/api/brm?year=2026'
    const acpToken = Deno.env.get('ACP_API_TOKEN') || 'Q1J69k2Agu7ikDTwrjAPRk4nT64OJHUPagERiYnj9FnDwIjrPZvC6ECCGEuyBd4UP6G4lVjPJELn8JV1MEsFyiNdhXcsxLvWyAkW'

    const response = await fetch(apiUrl, {
      headers: {
        'token': acpToken
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const apiBrevets: ApiBrevet[] = await response.json()
    console.log(`🟢 Fetched ${apiBrevets.length} brevets from API`)

    // 2. Récupérer tous les brevets existants depuis Supabase
    const { data: dbBrevets, error: fetchError } = await supabase
      .from('brevets')
      .select('*')

    if (fetchError) {
      console.error('🔴 Error fetching existing brevets:', fetchError)
      throw new Error(`Failed to fetch brevets: ${fetchError.message}`)
    }

    console.log(`🟢 Fetched ${dbBrevets?.length || 0} existing brevets from database`)

    // 3. Créer un Map des brevets existants pour accès rapide
    const dbBrevetsMap = new Map<number, DbBrevet>()
    dbBrevets?.forEach(brevet => {
      dbBrevetsMap.set(brevet.id, brevet)
    })

    // 4. Extraire et upsert les clubs
    const clubsMap = new Map<string, any>()

    apiBrevets.forEach(brevet => {
      if (brevet.code_acp && !clubsMap.has(brevet.code_acp)) {
        clubsMap.set(brevet.code_acp, {
          code_acp: brevet.code_acp,
          nom_club: brevet.nom_club || null,
          pays: brevet.pays || null,
          representant_acp: brevet.representant_acp || null,
          email_representant_acp: brevet.email_representant_acp || null,
          page_web_club: brevet.page_web_club || null,
        })
      }
    })

    const clubs = Array.from(clubsMap.values())

    if (clubs.length > 0) {
      const { error: clubsError } = await supabase
        .from('clubs')
        .upsert(clubs, { onConflict: 'code_acp' })

      if (clubsError) {
        console.error('🔴 Error upserting clubs:', clubsError)
        throw new Error(`Failed to upsert clubs: ${clubsError.message}`)
      }
      console.log(`🟢 Upserted ${clubs.length} clubs`)
    }

    // 5. Détecter les changements et identifier les nouveaux brevets
    const updates: BrevetUpdate[] = []
    const newBrevets: ApiBrevet[] = []

    apiBrevets.forEach(apiBrevet => {
      const dbBrevet = dbBrevetsMap.get(apiBrevet.id)

      if (!dbBrevet) {
        // Nouveau brevet
        newBrevets.push(apiBrevet)
      } else {
        // Brevet existant - vérifier les changements
        const brevetUpdate = detectChanges(apiBrevet, dbBrevet)
        if (brevetUpdate) {
          updates.push(brevetUpdate)
        }
      }
    })

    console.log(`🟡 Detected ${newBrevets.length} new brevets`)
    console.log(`🟡 Detected ${updates.length} brevets with changes`)

    // 6. Insérer les nouveaux brevets
    if (newBrevets.length > 0) {
      const brevetsToInsert = newBrevets.map(apiBrevet => ({
        id: apiBrevet.id,
        club_id: apiBrevet.codeclub || null,
        nom_organisateur: apiBrevet.nom_organisateur || null,
        mail_organisateur: apiBrevet.mail_organisateur || null,
        distance_brevet: apiBrevet.distance || null,
        date_brevet: convertDateFormat(apiBrevet.date),
        denivele: apiBrevet.denivele || null,
        eligible_r10000: apiBrevet.eligible_r10000 === 1,
        ville_depart: apiBrevet.ville_depart || null,
        departement: apiBrevet.departement || null,
        region: apiBrevet.region || null,
        acces_homologations: apiBrevet.acces_homologations === 1,
        lien_itineraire_brm: apiBrevet.lien_itineraire_brm || null,
        nom_brm: apiBrevet.nom_brm || null,
        latitude: apiBrevet.latitude || null,
        longitude: apiBrevet.longitude || null,
        pays: apiBrevet.pays || null,
      }))

      const { error: insertError } = await supabase
        .from('brevets')
        .insert(brevetsToInsert)

      if (insertError) {
        console.error('🔴 Error inserting new brevets:', insertError)
        throw new Error(`Failed to insert brevets: ${insertError.message}`)
      }

      console.log(`🟢 Inserted ${newBrevets.length} new brevets`)
    }

    // 7. Mettre à jour les brevets modifiés
    let updatedCount = 0
    const updateErrors: number[] = []

    for (const update of updates) {
      const apiBrevet = apiBrevets.find(b => b.id === update.id)
      if (!apiBrevet) continue

      const updateData: Partial<DbBrevet> = {}

      // Construire l'objet de mise à jour avec uniquement les champs modifiés
      if (update.changes.club_id) updateData.club_id = apiBrevet.codeclub || null
      if (update.changes.nom_organisateur) updateData.nom_organisateur = apiBrevet.nom_organisateur || null
      if (update.changes.mail_organisateur) updateData.mail_organisateur = apiBrevet.mail_organisateur || null
      if (update.changes.distance_brevet) updateData.distance_brevet = apiBrevet.distance || null
      if (update.changes.date_brevet) updateData.date_brevet = convertDateFormat(apiBrevet.date)
      if (update.changes.denivele) updateData.denivele = apiBrevet.denivele || null
      if (update.changes.eligible_r10000) updateData.eligible_r10000 = apiBrevet.eligible_r10000 === 1
      if (update.changes.ville_depart) updateData.ville_depart = apiBrevet.ville_depart || null
      if (update.changes.departement) updateData.departement = apiBrevet.departement || null
      if (update.changes.region) updateData.region = apiBrevet.region || null
      if (update.changes.acces_homologations) updateData.acces_homologations = apiBrevet.acces_homologations === 1
      if (update.changes.lien_itineraire_brm) updateData.lien_itineraire_brm = apiBrevet.lien_itineraire_brm || null
      if (update.changes.nom_brm) updateData.nom_brm = apiBrevet.nom_brm || null
      if (update.changes.pays) updateData.pays = apiBrevet.pays || null

      const { error: updateError } = await supabase
        .from('brevets')
        .update(updateData)
        .eq('id', update.id)

      if (updateError) {
        console.error(`🔴 Error updating brevet ${update.id}:`, updateError)
        updateErrors.push(update.id)
      } else {
        updatedCount++
        console.log(`✅ Updated brevet ${update.id} - changes: ${Object.keys(update.changes).join(', ')}`)
      }
    }

    console.log(`🟢 Updated ${updatedCount} brevets`)

    // 8. Géocoder les brevets nécessitant un recalcul de coordonnées
    const brevetsToGeocode = updates.filter(u => u.needsGeocoding)
    console.log(`🔵 Starting geocoding for ${brevetsToGeocode.length} brevets with location changes...`)

    const RATE_LIMIT_MS = 1200 // 1.2 secondes entre chaque requête
    let geocoded = 0
    let geocodeFailed = 0
    const geocodeErrors: number[] = []

    for (let i = 0; i < brevetsToGeocode.length; i++) {
      const update = brevetsToGeocode[i]
      const apiBrevet = apiBrevets.find(b => b.id === update.id)
      if (!apiBrevet) continue

      const coords = await geocodeAddress(
        apiBrevet.ville_depart,
        apiBrevet.departement,
        apiBrevet.pays
      )

      if (coords) {
        const { error: geoUpdateError } = await supabase
          .from('brevets')
          .update({
            latitude: coords.lat,
            longitude: coords.lon
          })
          .eq('id', update.id)

        if (geoUpdateError) {
          console.error(`🔴 Error updating coordinates for brevet ${update.id}:`, geoUpdateError)
          geocodeFailed++
          geocodeErrors.push(update.id)
        } else {
          console.log(`✅ Geocoded brevet ${update.id}: ${apiBrevet.ville_depart} → [${coords.lat}, ${coords.lon}]`)
          geocoded++
        }
      } else {
        geocodeFailed++
        geocodeErrors.push(update.id)
      }

      // Rate limiting: attendre avant la prochaine requête
      if (i < brevetsToGeocode.length - 1) {
        await sleep(RATE_LIMIT_MS)
      }
    }

    console.log(`🟢 Geocoding complete: ${geocoded} success, ${geocodeFailed} failed`)

    // 9. Retourner un rapport de synchronisation détaillé
    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        api: {
          total_brevets_fetched: apiBrevets.length,
          total_clubs: clubs.length,
        },
        database: {
          existing_brevets: dbBrevets?.length || 0,
        },
        changes: {
          new_brevets: newBrevets.length,
          updated_brevets: updatedCount,
          brevets_with_changes: updates.length,
          update_errors: updateErrors.length,
          failed_update_ids: updateErrors,
        },
        geocoding: {
          brevets_requiring_geocoding: brevetsToGeocode.length,
          geocoded_success: geocoded,
          geocoded_failed: geocodeFailed,
          failed_geocode_ids: geocodeErrors,
        }
      }
    }

    return new Response(
      JSON.stringify(report, null, 2),
      {
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('🔴 Sync error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
        status: 500
      }
    )
  }
})
