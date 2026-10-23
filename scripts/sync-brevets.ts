import dotenv from 'dotenv'
import chalk from 'chalk'

// Load .env.local file
dotenv.config({ path: '.env.local' })
import { createServiceClient } from './lib/supabase-client.js'
import { fetchBrevets } from './lib/acp-api.js'
import { Geocoder } from './lib/geocoder.js'
import { ProgressTracker } from './lib/progress-tracker.js'

// Parse CLI arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
// Les brevets absents des années synchronisées sont supprimés : garder toutes les années affichées
const yearArg = parseInt(args.find(arg => arg.startsWith('--year='))?.split('=')[1] || '')
const years = yearArg ? [yearArg] : [2026, 2027]
const geocodeOnly = args.includes('--geocode-only')

async function main() {
  const startTime = Date.now()
  console.log(chalk.blue.bold('\n🔵 BRM Sync Script v1.0.0'))
  console.log(chalk.gray('━'.repeat(50)))

  // Initialize
  const supabase = createServiceClient()
  const geocoder = new Geocoder()
  const progress = new ProgressTracker()

  console.log(chalk.green('✓ Environment loaded'))
  console.log(chalk.green('✓ Supabase client connected'))
  console.log(chalk.gray('━'.repeat(50) + '\n'))

  if (!geocodeOnly) {
    // 1. Fetch from API
    console.log(chalk.blue(`📡 Fetching brevets from ACP API (years: ${years.join(', ')})...`))
    const allApiBrevets = (await Promise.all(years.map(fetchBrevets))).flat()
    const apiBrevets = allApiBrevets.filter(b => b.statut !== 'Annule')
    const cancelledBrevets = allApiBrevets.filter(b => b.statut === 'Annule')

    console.log(chalk.green(`✓ Fetched ${allApiBrevets.length} total brevets`))
    console.log(chalk.green(`✓ Filtered ${apiBrevets.length} valid brevets (${cancelledBrevets.length} cancelled)\n`))

    if (dryRun) {
      console.log(chalk.yellow('🏃 DRY RUN MODE - No database changes will be made\n'))
      return
    }

    // 2. Upsert clubs
    console.log(chalk.blue('🏢 Syncing clubs...'))
    const clubsMap = new Map()
    apiBrevets.forEach(brevet => {
      if (brevet.codeClub && !clubsMap.has(brevet.codeClub)) {
        clubsMap.set(brevet.codeClub, {
          code_acp: brevet.codeClub,
          nom_club: brevet.nomclub || null,
          pays: brevet.pays || null,
          representant_acp: null,
          email_representant_acp: null,
          page_web_club: brevet.clubwebsite || null
        })
      }
    })

    const clubs = Array.from(clubsMap.values())
    if (clubs.length > 0) {
      const { error } = await supabase.from('clubs').upsert(clubs, { onConflict: 'code_acp' })
      if (error) throw new Error(`Failed to upsert clubs: ${error.message}`)
      console.log(chalk.green(`✓ Upserted ${clubs.length} clubs\n`))
    }

    // 3. Fetch existing brevets
    const { data: existingBrevets } = await supabase
      .from('brevets')
      .select('id, latitude, longitude, ville_depart, departement, pays, gpx_file_path, gpx_uploaded_at, gpx_file_size')

    const existingBrevetsMap = new Map(existingBrevets?.map(b => [b.id, b]) || [])

    // 4. Upsert brevets
    console.log(chalk.blue('📋 Syncing brevets...'))
    const brevetsToUpsert = apiBrevets.map(apiBrevet => {
      const existing = existingBrevetsMap.get(apiBrevet.id)
      return {
        id: apiBrevet.id,
        club_id: apiBrevet.codeClub || null,
        nom_organisateur: apiBrevet.nomorganisateur || null,
        mail_organisateur: apiBrevet.mailorganisateur || null,
        distance_brevet: apiBrevet.distance ? parseInt(apiBrevet.distance) : null,
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
        gpx_file_path: existing?.gpx_file_path || null,
        gpx_uploaded_at: existing?.gpx_uploaded_at || null,
        gpx_file_size: existing?.gpx_file_size || null
      }
    })

    const { error: upsertError } = await supabase
      .from('brevets')
      .upsert(brevetsToUpsert, { onConflict: 'id' })

    if (upsertError) throw new Error(`Failed to upsert brevets: ${upsertError.message}`)

    const newCount = brevetsToUpsert.filter(b => !existingBrevetsMap.has(b.id)).length
    console.log(chalk.green(`✓ Upserted ${brevetsToUpsert.length} brevets (${newCount} new)\n`))

    // 5. Delete obsolete brevets
    const validIds = apiBrevets.map(b => b.id)
    const { data: allBrevetIds } = await supabase.from('brevets').select('id')
    const idsToDelete = (allBrevetIds || []).map(b => b.id).filter(id => !validIds.includes(id))

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('brevets')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) throw new Error(`Failed to delete obsolete brevets: ${deleteError.message}`)
      console.log(chalk.green(`✓ Deleted ${idsToDelete.length} obsolete brevets\n`))
    } else {
      console.log(chalk.green('✓ No obsolete brevets to delete\n'))
    }
  }

  // 6. Geocode missing coordinates
  // First, count total brevets needing geocoding
  const { count: totalNeedingGeocode } = await supabase
    .from('brevets')
    .select('id', { count: 'exact', head: true })
    .or('latitude.is.null,longitude.is.null')

  if (totalNeedingGeocode && totalNeedingGeocode > 0) {
    console.log(chalk.blue(`🗺️  Geocoding ${totalNeedingGeocode} brevets...\n`))

    progress.startPhase('Geocoding', totalNeedingGeocode)

    let success = 0
    let failed = 0
    let processed = 0

    // Process in batches of 1000 (Supabase limit)
    const BATCH_SIZE = 1000

    while (processed < totalNeedingGeocode) {
      // Fetch next batch of brevets needing geocoding
      const { data: brevetsNeedingGeocode } = await supabase
        .from('brevets')
        .select('id, ville_depart, departement, pays, latitude, longitude')
        .or('latitude.is.null,longitude.is.null')
        .limit(BATCH_SIZE)

      if (!brevetsNeedingGeocode || brevetsNeedingGeocode.length === 0) {
        break
      }

      // Process each brevet in the batch
      for (const brevet of brevetsNeedingGeocode) {
        const coords = await geocoder.geocode(brevet.ville_depart, brevet.departement, brevet.pays)

        if (coords) {
          await supabase
            .from('brevets')
            .update({ latitude: coords.lat, longitude: coords.lon })
            .eq('id', brevet.id)
          success++
        } else {
          failed++
        }

        progress.increment()
        processed++
      }
    }

    progress.stop()
    console.log(chalk.green(`\n✓ Geocoded ${success} brevets (${failed} failed)\n`))
  } else {
    console.log(chalk.green('✓ No brevets need geocoding\n'))
  }

  // 7. Final report
  const duration = Math.round((Date.now() - startTime) / 1000)
  console.log(chalk.green.bold('✅ Sync completed successfully!'))
  console.log(chalk.gray('━'.repeat(50)))
  console.log(chalk.bold(`📊 Duration: ${Math.floor(duration / 60)}m ${duration % 60}s\n`))
}

function convertDateFormat(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n🛑 Interrupted - exiting...'))
  process.exit(0)
})

main().catch(error => {
  console.error(chalk.red('\n🔴 Sync failed:'), error)
  process.exit(1)
})
