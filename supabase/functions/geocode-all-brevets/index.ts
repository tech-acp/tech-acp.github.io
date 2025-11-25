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
async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function geocodeAddress(city, department, country) {
    const searchQuery = `${city}, ${department}, ${country}`;
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
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const year = url.searchParams.get('year');
        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        // Get brevets without coordinates but with valid address
        let query = supabase.from('brevets').select('id, ville_depart, departement, pays').is('latitude', null).not('ville_depart', 'is', null).not('departement', 'is', null).not('pays', 'is', null).limit(limit);
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
            return new Response(JSON.stringify({
                success: true,
                message: 'No brevets to geocode',
                stats: {
                    total: 0,
                    geocoded: 0,
                    errors: 0
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
        for (const brevet of brevets) {
            try {
                const coords = await geocodeAddress(brevet.ville_depart, brevet.departement, brevet.pays);
                if (coords) {
                    const { error: updateError } = await supabase.from('brevets').update({
                        latitude: coords.latitude,
                        longitude: coords.longitude
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
                    errorCount++;
                    if (errorSamples.length < 3) {
                        errorSamples.push(`Brevet ${brevet.id}: No coordinates found for ${brevet.ville_depart}, ${brevet.departement}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing brevet ${brevet.id}:`, error);
                errorCount++;
                if (errorSamples.length < 3) {
                    errorSamples.push(`Brevet ${brevet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }
        const result = {
            success: true,
            message: `Geocoded ${geocodedCount} out of ${brevets.length} brevets`,
            stats: {
                total: brevets.length,
                geocoded: geocodedCount,
                errors: errorCount
            },
            errorSamples: errorSamples.length > 0 ? errorSamples : undefined
        };
        console.log('🟢 Geocoding completed:', result);
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
