import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const NOMINATIM_CONFIG = {
    baseUrl: 'https://nominatim.openstreetmap.org',
    userAgent: 'BRM-Cycling-Map-Explorer/1.0',
    rateLimit: 1000,
    maxRetries: 3
};
// Configuration pour l'auto-invocation récursive
const MAX_RECURSION_DEPTH = 100; // Max 100 itérations = 3000 brevets max
async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Table de normalisation des noms de pays (multi-langues) vers code ISO
const COUNTRY_CODES: Record<string, string> = {
    'switzerland': 'ch', 'suisse': 'ch', 'schweiz': 'ch', 'svizzera': 'ch',
    'germany': 'de', 'allemagne': 'de', 'deutschland': 'de',
    'italy': 'it', 'italie': 'it', 'italia': 'it',
    'spain': 'es', 'espagne': 'es', 'españa': 'es',
    'belgium': 'be', 'belgique': 'be', 'belgië': 'be',
    'netherlands': 'nl', 'pays-bas': 'nl', 'nederland': 'nl',
    'austria': 'at', 'autriche': 'at', 'österreich': 'at',
    'portugal': 'pt', 'united kingdom': 'gb', 'royaume-uni': 'gb',
    'russia': 'ru', 'russie': 'ru', 'russland': 'ru',
    'philippines': 'ph',
    'ireland': 'ie', 'irlande': 'ie',
    'cambodia': 'kh', 'cambodge': 'kh',
    'china': 'cn', 'chine': 'cn',
    'india': 'in', 'inde': 'in',
    'japan': 'jp', 'japon': 'jp',
    'south korea': 'kr', 'corée du sud': 'kr',
    'australia': 'au', 'australie': 'au',
    'canada': 'ca',
    'united states': 'us', 'états-unis': 'us', 'usa': 'us',
    'brazil': 'br', 'brésil': 'br',
};

function areSameCountry(a: string, b: string): boolean {
    const la = a.toLowerCase().trim();
    const lb = b.toLowerCase().trim();
    if (la === lb) return true;
    const codeA = COUNTRY_CODES[la];
    const codeB = COUNTRY_CODES[lb];
    return !!(codeA && codeB && codeA === codeB);
}

async function geocodeAddress(city, department, country, region) {
    // Ne pas géocoder sans ville : on obtiendrait le centre du pays, inutile
    if (!city || city === 'Pas encore déterminée') {
        console.warn('Skipping geocoding: no city provided');
        return null;
    }
    // Construire la requête avec uniquement les parties non-nulles
    const addressParts = [city];

    // Si departement est en fait le nom du pays (ex: BRM suisses avec departement="Switzerland"),
    // utiliser region (canton) à la place et ne pas ajouter pays pour éviter les contradictions
    // (ex: Konstanz est en Allemagne mais le BRM est rattaché à la Suisse)
    if (department && country && areSameCountry(department, country)) {
        if (region) addressParts.push(region);
    } else {
        if (department) addressParts.push(department);
        if (country) addressParts.push(country);
    }
    if (addressParts.length === 0) {
        console.warn('No address information available for geocoding');
        return null;
    }
    const searchQuery = addressParts.join(', ');
    const encodedQuery = encodeURIComponent(searchQuery);
    for (let attempt = 1; attempt <= NOMINATIM_CONFIG.maxRetries; attempt++) {
        try {
            if (attempt > 1) {
                await delay(NOMINATIM_CONFIG.rateLimit * Math.pow(2, attempt - 1));
            } else {
                await delay(NOMINATIM_CONFIG.rateLimit);
            }
            const response = await fetch(`${NOMINATIM_CONFIG.baseUrl}/search?q=${encodedQuery}&format=json&limit=1`, {
                headers: {
                    'User-Agent': NOMINATIM_CONFIG.userAgent
                }
            });
            if (!response.ok) {
                if (response.status === 429 && attempt < NOMINATIM_CONFIG.maxRetries) {
                    continue;
                }
                console.error(`Nominatim API error for ${searchQuery}: ${response.statusText}`);
                return null;
            }
            const results = await response.json();
            if (!results || results.length === 0) {
                console.warn(`No coordinates found for address: ${searchQuery}`);
                return null;
            }
            const { lat, lon } = results[0];
            return {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon)
            };
        } catch (error) {
            console.error(`Error geocoding ${searchQuery} (attempt ${attempt}):`, error);
            if (attempt === NOMINATIM_CONFIG.maxRetries) {
                return null;
            }
        }
    }
    return null;
}
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
            }
        });
    }
    try {
        console.log('🔵 Starting geocode-all-brevets function');
        // Parse query params
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '30');
        const year = url.searchParams.get('year');
        const depth = parseInt(url.searchParams.get('depth') || '1');
        console.log(`🔵 Batch depth: ${depth}/${MAX_RECURSION_DEPTH}, limit: ${limit}`);
        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        // Get brevets without coordinates, with at least ville_depart, and not yet tried
        let query = supabase.from('brevets').select('id, ville_depart, departement, pays, region').is('latitude', null).is('last_geocoding_try', null).not('ville_depart', 'is', null).neq('ville_depart', 'Pas encore déterminée').limit(limit);
        if (year) {
            const yearStart = `${year}-01-01`;
            const yearEnd = `${year}-12-31`;
            query = query.gte('date_brevet', yearStart).lte('date_brevet', yearEnd);
        }
        const { data: brevets, error: fetchError } = await query;
        if (fetchError) {
            throw new Error(`Failed to fetch brevets: ${fetchError.message}`);
        }
        if (!brevets || brevets.length === 0) {
            console.log('🟢 No brevets to geocode - all done!');
            return new Response(JSON.stringify({
                success: true,
                message: 'No brevets to geocode',
                stats: {
                    batch_depth: depth,
                    processed_in_batch: 0,
                    geocoded: 0,
                    errors: 0,
                    remaining_to_geocode: 0,
                    next_batch_triggered: false
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        console.log(`🔵 Found ${brevets.length} brevets to geocode`);
        let geocodedCount = 0;
        let errorCount = 0;
        const errorSamples = [];
        const now = new Date().toISOString();
        for (const brevet of brevets) {
            try {
                const coords = await geocodeAddress(brevet.ville_depart, brevet.departement, brevet.pays, brevet.region);
                if (coords) {
                    // Succès : mettre à jour les coordonnées + last_geocoding_try
                    const { error: updateError } = await supabase.from('brevets').update({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        last_geocoding_try: now
                    }).eq('id', brevet.id);
                    if (updateError) {
                        console.error(`Error updating brevet ${brevet.id}:`, updateError);
                        errorCount++;
                        if (errorSamples.length < 3) {
                            errorSamples.push(`Brevet ${brevet.id}: ${updateError.message}`);
                        }
                    } else {
                        geocodedCount++;
                        console.log(`✅ Geocoded brevet ${brevet.id}`);
                    }
                } else {
                    // Échec : marquer last_geocoding_try pour ne pas réessayer
                    await supabase.from('brevets').update({
                        last_geocoding_try: now
                    }).eq('id', brevet.id);
                    errorCount++;
                    if (errorSamples.length < 3) {
                        errorSamples.push(`Brevet ${brevet.id}: No coordinates found for ${brevet.ville_depart}, ${brevet.departement}`);
                    }
                }
            } catch (error) {
                // Erreur : marquer last_geocoding_try pour ne pas réessayer
                await supabase.from('brevets').update({
                    last_geocoding_try: now
                }).eq('id', brevet.id);
                console.error(`Error processing brevet ${brevet.id}:`, error);
                errorCount++;
                if (errorSamples.length < 3) {
                    errorSamples.push(`Brevet ${brevet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }
        // Vérifier s'il reste des brevets à géocoder (sans coordonnées ET jamais essayé)
        const { count: remainingCount } = await supabase
            .from('brevets')
            .select('id', { count: 'exact', head: true })
            .is('latitude', null)
            .is('last_geocoding_try', null)
            .not('ville_depart', 'is', null)
            .neq('ville_depart', 'Pas encore déterminée');
        const remaining = remainingCount || 0;
        let nextBatchTriggered = false;
        // Auto-invocation récursive si nécessaire
        if (remaining > 0 && depth < MAX_RECURSION_DEPTH) {
            const nextUrl = `${SUPABASE_URL}/functions/v1/geocode-all-brevets?limit=${limit}&depth=${depth + 1}`;
            console.log(`🔵 Triggering next batch (depth ${depth + 1}), ${remaining} brevets remaining...`);
            fetch(nextUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                }
            }).catch(err => console.error('🔴 Failed to trigger next batch:', err));
            nextBatchTriggered = true;
        } else if (remaining > 0) {
            console.log(`⚠️ Max recursion depth reached (${MAX_RECURSION_DEPTH}), ${remaining} brevets still remaining`);
        }
        const result = {
            success: true,
            message: `Geocoded ${geocodedCount} out of ${brevets.length} brevets`,
            stats: {
                batch_depth: depth,
                processed_in_batch: brevets.length,
                geocoded: geocodedCount,
                errors: errorCount,
                remaining_to_geocode: remaining,
                next_batch_triggered: nextBatchTriggered
            },
            errorSamples: errorSamples.length > 0 ? errorSamples : undefined
        };
        console.log('🟢 Geocoding batch completed:', result);
        return new Response(JSON.stringify(result), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('🔴 Error in geocode-all-brevets:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
});
