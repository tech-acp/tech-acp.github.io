import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction pour convertir le format de date DD/MM/YYYY → YYYY-MM-DD
function convertDateFormat(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Fonction pour comparer deux brevets et détecter les changements
function hasBrevetChanged(existing: any, newData: any): boolean {
  const fieldsToCompare = [
    'club_id',
    'nom_organisateur',
    'mail_organisateur',
    'distance_brevet',
    'date_brevet',
    'denivele',
    'eligible_r10000',
    'ville_depart',
    'departement',
    'region',
    'lien_itineraire_brm',
    'nom_brm',
    'pays',
    'acces_homologations'
  ];

  for (const field of fieldsToCompare) {
    const existingVal = existing[field] ?? null;
    const newVal = newData[field] ?? null;

    if (existingVal !== newVal) {
      return true;
    }
  }
  return false;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec la service_role key pour bypasser RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
    const apiBrevets = allApiBrevets.filter((brevet) => brevet.statut !== 'Annule');
    const cancelledBrevets = allApiBrevets.filter((brevet) => brevet.statut === 'Annule');
    console.log(`🟢 Filtered ${apiBrevets.length} valid brevets (excluded ${cancelledBrevets.length} cancelled brevets)`);
    // 3. Extraire et upsert les clubs
    const clubsMap = new Map();
    apiBrevets.forEach((brevet) => {
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
      const { error: clubsError } = await supabase.from('clubs').upsert(clubs, {
        onConflict: 'code_acp'
      });
      if (clubsError) {
        console.error('🔴 Error upserting clubs:', clubsError);
        throw new Error(`Failed to upsert clubs: ${clubsError.message}`);
      }
      console.log(`🟢 Upserted ${clubs.length} clubs`);
    }
    // 4. Récupérer TOUS les brevets existants avec pagination (Supabase limite à 1000 par requête)
    // On récupère toutes les colonnes comparables pour détecter les vrais changements
    const existingBrevetsMap = new Map();
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: page, error: fetchError } = await supabase
        .from('brevets')
        .select(`
          id,
          club_id,
          nom_organisateur,
          mail_organisateur,
          distance_brevet,
          date_brevet,
          denivele,
          eligible_r10000,
          ville_depart,
          departement,
          region,
          lien_itineraire_brm,
          nom_brm,
          pays,
          acces_homologations,
          gpx_file_path,
          gpx_uploaded_at,
          gpx_file_size
        `)
        .range(offset, offset + PAGE_SIZE - 1);
      if (fetchError) {
        console.error('🔴 Error fetching existing brevets:', fetchError);
        throw new Error(`Failed to fetch brevets: ${fetchError.message}`);
      }
      if (page && page.length > 0) {
        page.forEach((b) => existingBrevetsMap.set(b.id, b));
        offset += page.length;
        hasMore = page.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }
    console.log(`🟢 Found ${existingBrevetsMap.size} existing brevets in database`);
    // 5. Préparer tous les brevets pour upsert (sans toucher aux coordonnées et données GPX)
    const brevetsToUpsert = apiBrevets.map((apiBrevet) => {
      const existingBrevet = existingBrevetsMap.get(apiBrevet.id);
      return {
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
        pays: apiBrevet.pays || null,
        // Préserver les données GPX existantes
        gpx_file_path: existingBrevet?.gpx_file_path || null,
        gpx_uploaded_at: existingBrevet?.gpx_uploaded_at || null,
        gpx_file_size: existingBrevet?.gpx_file_size || null
      };
    });
    // 6. Upsert tous les brevets valides (sans modifier les coordonnées et données GPX existantes)
    const { error: upsertError } = await supabase.from('brevets').upsert(brevetsToUpsert, {
      onConflict: 'id'
    });
    if (upsertError) {
      console.error('🔴 Error upserting brevets:', upsertError);
      throw new Error(`Failed to upsert brevets: ${upsertError.message}`);
    }
    console.log(`🟢 Upserted ${brevetsToUpsert.length} brevets (coordinates and GPX data preserved)`);
    // 7. Supprimer les brevets obsolètes ET les brevets annulés
    const validApiBrevetIds = new Set(apiBrevets.map((b) => b.id));
    const cancelledBrevetIds = cancelledBrevets.map((b) => b.id);
    let deletedCount = 0;
    let deletedIds = [];
    let deletedCancelledCount = 0;
    let deletedObsoleteCount = 0;
    // Utiliser existingBrevetsMap (déjà récupéré avec pagination) pour identifier les IDs à supprimer
    const idsToDelete = Array.from(existingBrevetsMap.keys()).filter((id) => !validApiBrevetIds.has(id));
    if (idsToDelete.length > 0) {
      // Supprimer par batch (Supabase accepte les arrays directement)
      const { data: deletedBrevets, error: deleteError } = await supabase.from('brevets').delete().in('id', idsToDelete).select('id');
      if (deleteError) {
        console.error('🔴 Error deleting obsolete/cancelled brevets:', deleteError);
        throw new Error(`Failed to delete obsolete/cancelled brevets: ${deleteError.message}`);
      }
      deletedCount = deletedBrevets?.length || 0;
      deletedIds = deletedBrevets?.map((b) => b.id) || [];
      // Identifier quels brevets supprimés étaient annulés
      deletedCancelledCount = deletedIds.filter((id) => cancelledBrevetIds.includes(id)).length;
      deletedObsoleteCount = deletedCount - deletedCancelledCount;
      console.log(`🟢 Deleted ${deletedCount} brevets from database:`);
      console.log(`   - ${deletedObsoleteCount} obsolete brevets (no longer in API)`);
      console.log(`   - ${deletedCancelledCount} cancelled brevets (statut=Annule)`);
      console.log(`   Deleted IDs: ${deletedIds.join(', ')}`);
    } else {
      console.log('🟢 No obsolete brevets to delete');
    }
    // 8. Compter les brevets nécessitant un géocodage et les vrais changements
    const newBrevetsCount = apiBrevets.filter((b) => !existingBrevetsMap.has(b.id)).length;
    const newBrevetsWithCity = apiBrevets.filter((b) => !existingBrevetsMap.has(b.id) && b.ville).length;

    // Compter les brevets réellement modifiés (comparaison champ par champ)
    let actuallyUpdatedCount = 0;
    for (const newBrevet of brevetsToUpsert) {
      const existingBrevet = existingBrevetsMap.get(newBrevet.id);
      if (existingBrevet && hasBrevetChanged(existingBrevet, newBrevet)) {
        actuallyUpdatedCount++;
      }
    }
    const unchangedBrevetsCount = existingBrevetsMap.size - actuallyUpdatedCount - deletedCount;
    console.log(`🟢 Changes detected: ${newBrevetsCount} new, ${actuallyUpdatedCount} updated, ${unchangedBrevetsCount} unchanged`);
    // 9. Déclencher le géocodage en background via geocode-all-brevets (fire-and-forget)
    let geocodingTriggered = false;
    if (newBrevetsWithCity > 0) {
      const geocodeUrl = `${supabaseUrl}/functions/v1/geocode-all-brevets?limit=30&depth=1`;
      console.log(`🔵 Triggering geocoding for ${newBrevetsWithCity} new brevets...`);
      fetch(geocodeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      }).catch(err => console.error('🔴 Failed to trigger geocoding:', err));
      geocodingTriggered = true;
    } else {
      console.log('🟢 No new brevets to geocode');
    }
    // 10. Retourner un rapport de synchronisation détaillé
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
          existing_brevets_before_sync: existingBrevetsMap.size
        },
        changes: {
          new_brevets_inserted: newBrevetsCount,
          existing_brevets_updated: actuallyUpdatedCount,
          unchanged_brevets: unchangedBrevetsCount,
          total_upserted: brevetsToUpsert.length,
          deleted_brevets_total: deletedCount,
          deleted_obsolete_brevets: deletedObsoleteCount,
          deleted_cancelled_brevets: deletedCancelledCount,
          deleted_brevet_ids: deletedIds
        },
        geocoding: {
          new_brevets_to_geocode: newBrevetsWithCity,
          geocoding_triggered: geocodingTriggered,
          note: geocodingTriggered ? 'Geocoding is running in background via geocode-all-brevets function' : 'No geocoding needed'
        }
      },
      message: 'Successfully synchronized brevets. Cancelled brevets (statut=Annule) are excluded. GPX data preserved. Geocoding triggered separately for new brevets.'
    };
    return new Response(JSON.stringify(report, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      },
      status: 200
    });
  } catch (error) {
    console.error('🔴 Sync error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      },
      status: 500
    });
  }
});
