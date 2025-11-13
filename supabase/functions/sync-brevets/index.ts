import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Fonction utilitaire pour attendre (rate limiting)
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fonction pour convertir le format de date DD/MM/YYYY → YYYY-MM-DD
function convertDateFormat(ddmmyyyy: string) {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Fonction de géocodage via Nominatim
async function geocodeAddress(ville: string, departement: string, pays: string) {
  const addressParts = [];
  if (ville && ville !== 'Pas encore déterminée') addressParts.push(ville);
  if (departement) addressParts.push(departement);
  if (pays) addressParts.push(pays);

  if (addressParts.length === 0) {
    console.log('⚠️ No address information available for geocoding');
    return null;
  }

  const query = addressParts.join(', ');
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BRM-Map-App/1.0 (Supabase Edge Function; contact: support@brm-map.com)'
      }
    });

    if (!response.ok) {
      console.error(`🔴 Nominatim error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (data.length === 0) {
      console.log(`⚠️ No results found for: ${query}`);
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    };
  } catch (error) {
    console.error(`🔴 Geocoding error for "${query}":`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    // Créer le client Supabase avec la service_role key pour bypasser RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('🔵 Starting complete BRM sync...');

    // Récupérer le token ACP depuis les variables d'environnement sécurisées
    const acpToken = Deno.env.get('ACP_API_TOKEN');

    if (!acpToken) {
      throw new Error('ACP_API_TOKEN is not configured. Please set it in Supabase Dashboard > Edge Functions > Secrets');
    }

    // 1. Récupérer les données de l'API source
    const apiUrl = 'https://myaccount.audax-club-parisien.com/api/brm?year=2026';
    const response = await fetch(apiUrl, {
      headers: {
        'token': acpToken
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const allApiBrevets = await response.json();
    console.log(`🟢 Fetched ${allApiBrevets.length} total brevets from API`);

    // 2. Filtrer les brevets : exclure ceux avec statut "Annule"
    const apiBrevets = allApiBrevets.filter((brevet: any) => brevet.statut !== 'Annule');
    const cancelledBrevets = allApiBrevets.filter((brevet: any) => brevet.statut === 'Annule');

    console.log(`🟢 Filtered ${apiBrevets.length} valid brevets (excluded ${cancelledBrevets.length} cancelled brevets)`);

    // 3. Extraire et upsert les clubs
    const clubsMap = new Map();
    apiBrevets.forEach((brevet: any) => {
      if (brevet.codeClub && !clubsMap.has(brevet.codeClub)) {
        clubsMap.set(brevet.codeClub, {
          code_acp: brevet.codeClub,
          nom_club: brevet.nomclub || null,
          pays: brevet.pays || null,
          representant_acp: null,
          email_representant_acp: null,
          page_web_club: brevet.clubwebsite || null
        });
      }
    });

    const clubs = Array.from(clubsMap.values());
    if (clubs.length > 0) {
      const { error: clubsError } = await supabase
        .from('clubs')
        .upsert(clubs, { onConflict: 'code_acp' });

      if (clubsError) {
        console.error('🔴 Error upserting clubs:', clubsError);
        throw new Error(`Failed to upsert clubs: ${clubsError.message}`);
      }
      console.log(`🟢 Upserted ${clubs.length} clubs`);
    }

    // 4. Récupérer les brevets existants pour identifier ceux qui nécessitent un géocodage
    const { data: existingBrevets, error: fetchError } = await supabase
      .from('brevets')
      .select('id, latitude, longitude, ville_depart, departement, pays');

    if (fetchError) {
      console.error('🔴 Error fetching existing brevets:', fetchError);
      throw new Error(`Failed to fetch brevets: ${fetchError.message}`);
    }

    const existingBrevetsMap = new Map(
      existingBrevets?.map((b) => [b.id, b]) || []
    );
    console.log(`🟢 Found ${existingBrevets?.length || 0} existing brevets in database`);

    // 5. Préparer tous les brevets pour upsert (sans toucher aux coordonnées)
    const brevetsToUpsert = apiBrevets.map((apiBrevet: any) => ({
      id: apiBrevet.id,
      club_id: apiBrevet.codeClub || null,
      nom_organisateur: apiBrevet.nomorganisateur || null,
      mail_organisateur: apiBrevet.mailorganisateur || null,
      distance_brevet: apiBrevet.distance || null,
      date_brevet: convertDateFormat(apiBrevet.date),
      denivele: apiBrevet.denivele ? parseInt(apiBrevet.denivele) : null,
      eligible_r10000: apiBrevet.r10000 === 1,
      ville_depart: apiBrevet.ville || null,
      departement: apiBrevet.departement || null,
      region: apiBrevet.region || null,
      acces_homologations: false,
      lien_itineraire_brm: apiBrevet.maplink || null,
      nom_brm: apiBrevet.nom || null,
      pays: apiBrevet.pays || null
    }));

    // 6. Upsert tous les brevets valides (sans modifier les coordonnées existantes)
    const { error: upsertError } = await supabase
      .from('brevets')
      .upsert(brevetsToUpsert, { onConflict: 'id' });

    if (upsertError) {
      console.error('🔴 Error upserting brevets:', upsertError);
      throw new Error(`Failed to upsert brevets: ${upsertError.message}`);
    }
    console.log(`🟢 Upserted ${brevetsToUpsert.length} brevets (coordinates preserved)`);

    // 7. Supprimer les brevets obsolètes ET les brevets annulés
    const validApiBrevetIds = apiBrevets.map((b: any) => b.id);
    const cancelledBrevetIds = cancelledBrevets.map((b: any) => b.id);

    let deletedCount = 0;
    let deletedIds: any[] = [];
    let deletedCancelledCount = 0;
    let deletedObsoleteCount = 0;

    if (validApiBrevetIds.length > 0) {
      // Supprimer les brevets qui ne sont plus valides (obsolètes ou annulés)
      const { data: deletedBrevets, error: deleteError } = await supabase
        .from('brevets')
        .delete()
        .not('id', 'in', `(${validApiBrevetIds.join(',')})`)
        .select('id');

      if (deleteError) {
        console.error('🔴 Error deleting obsolete/cancelled brevets:', deleteError);
        throw new Error(`Failed to delete obsolete/cancelled brevets: ${deleteError.message}`);
      }

      deletedCount = deletedBrevets?.length || 0;
      deletedIds = deletedBrevets?.map(b => b.id) || [];

      // Identifier quels brevets supprimés étaient annulés
      deletedCancelledCount = deletedIds.filter(id => cancelledBrevetIds.includes(id)).length;
      deletedObsoleteCount = deletedCount - deletedCancelledCount;

      console.log(`🟢 Deleted ${deletedCount} brevets from database:`);
      console.log(`   - ${deletedObsoleteCount} obsolete brevets (no longer in API)`);
      console.log(`   - ${deletedCancelledCount} cancelled brevets (statut=Annule)`);
      if (deletedCount > 0) {
        console.log(`   Deleted IDs: ${deletedIds.join(', ')}`);
      }
    }

    // 8. Identifier les brevets nécessitant un géocodage
    // Géocoder UNIQUEMENT si:
    // - Les coordonnées (latitude/longitude) ne sont pas renseignées dans la base
    // - OU la ville/département/pays a changé par rapport à ce qui est en base
    const brevetsToGeocode: any[] = [];
    apiBrevets.forEach((apiBrevet: any) => {
      const existingBrevet = existingBrevetsMap.get(apiBrevet.id);

      // Vérifier si le brevet a besoin de géocodage
      if (!existingBrevet) {
        // Nouveau brevet
        if (apiBrevet.ville) {
          brevetsToGeocode.push(apiBrevet);
        }
      } else {
        // Brevet existant
        const hasCoordinates = existingBrevet.latitude && existingBrevet.longitude;
        const locationChanged =
          existingBrevet.ville_depart !== apiBrevet.ville ||
          existingBrevet.departement !== apiBrevet.departement ||
          existingBrevet.pays !== apiBrevet.pays;

        // Géocoder si pas de coordonnées OU si la localisation a changé
        if ((!hasCoordinates || locationChanged) && apiBrevet.ville) {
          brevetsToGeocode.push(apiBrevet);
        }
      }
    });

    console.log(`🔵 Starting geocoding for ${brevetsToGeocode.length} brevets...`);

    // 9. Géocoder les brevets nécessaires
    const RATE_LIMIT_MS = 1200; // 1.2 secondes entre chaque requête
    let geocoded = 0;
    let geocodeFailed = 0;
    const geocodeErrors: number[] = [];

    for (let i = 0; i < brevetsToGeocode.length; i++) {
      const apiBrevet = brevetsToGeocode[i];
      const coords = await geocodeAddress(
        apiBrevet.ville,
        apiBrevet.departement,
        apiBrevet.pays
      );

      if (coords) {
        const { error: geoUpdateError } = await supabase
          .from('brevets')
          .update({
            latitude: coords.lat,
            longitude: coords.lon
          })
          .eq('id', apiBrevet.id);

        if (geoUpdateError) {
          console.error(`🔴 Error updating coordinates for brevet ${apiBrevet.id}:`, geoUpdateError);
          geocodeFailed++;
          geocodeErrors.push(apiBrevet.id);
        } else {
          console.log(`✅ Geocoded brevet ${apiBrevet.id}: ${apiBrevet.ville} → [${coords.lat}, ${coords.lon}]`);
          geocoded++;
        }
      } else {
        geocodeFailed++;
        geocodeErrors.push(apiBrevet.id);
      }

      // Rate limiting: attendre avant la prochaine requête
      if (i < brevetsToGeocode.length - 1) {
        await sleep(RATE_LIMIT_MS);
      }
    }

    console.log(`🟢 Geocoding complete: ${geocoded} success, ${geocodeFailed} failed`);

    // 10. Retourner un rapport de synchronisation détaillé
    const newBrevetsCount = apiBrevets.filter((b: any) => !existingBrevetsMap.has(b.id)).length;
    const updatedBrevetsCount = brevetsToUpsert.length - newBrevetsCount;

    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        api: {
          total_brevets_fetched: allApiBrevets.length,
          valid_brevets_processed: apiBrevets.length,
          cancelled_brevets_excluded: cancelledBrevets.length,
          total_clubs: clubs.length
        },
        database: {
          existing_brevets_before_sync: existingBrevets?.length || 0
        },
        changes: {
          new_brevets_inserted: newBrevetsCount,
          existing_brevets_updated: updatedBrevetsCount,
          total_upserted: brevetsToUpsert.length,
          deleted_brevets_total: deletedCount,
          deleted_obsolete_brevets: deletedObsoleteCount,
          deleted_cancelled_brevets: deletedCancelledCount,
          deleted_brevet_ids: deletedIds
        },
        geocoding: {
          brevets_requiring_geocoding: brevetsToGeocode.length,
          geocoded_success: geocoded,
          geocoded_failed: geocodeFailed,
          failed_geocode_ids: geocodeErrors
        }
      },
      message: 'Successfully synchronized brevets. Cancelled brevets (statut=Annule) are excluded from creation and removed from database if they existed. Coordinates preserved for existing brevets. Geocoding only performed when necessary (missing coordinates or location change).'
    };

    return new Response(JSON.stringify(report, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      },
      status: 200
    });

  } catch (error) {
    console.error('🔴 Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
        status: 500
      }
    );
  }
});
