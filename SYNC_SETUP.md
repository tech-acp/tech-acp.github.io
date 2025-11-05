# Configuration de la synchronisation automatique des brevets

## 📋 Vue d'ensemble

La fonction Edge `sync-brevets` effectue automatiquement :
1. 📥 Récupération des données des brevets depuis l'API ACP
2. 💾 Synchronisation dans Supabase (upsert sans doublons)
3. 🗺️ **Géocodage automatique** des brevets sans coordonnées via Nominatim (OpenStreetMap)

## 🚀 Déploiement de l'Edge Function

### 1. Installer Supabase CLI (si ce n'est pas déjà fait)

```bash
npm install -g supabase
```

### 2. Login à Supabase

```bash
supabase login
```

### 3. Lier votre projet

```bash
supabase link --project-ref ranqsfwmoexghudpvpob
```

### 4. Déployer la fonction

```bash
supabase functions deploy sync-brevets
```

## ⏰ Configuration du Cron (automatisation quotidienne)

### Option 1 : Via pg_cron (Recommandé)

1. Aller dans **Supabase Dashboard** → **SQL Editor**
2. Exécuter cette requête pour activer l'extension pg_cron :

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

3. Créer le job cron qui s'exécute **tous les jours à 2h du matin** :

```sql
-- Créer le job cron pour synchroniser les brevets quotidiennement
SELECT cron.schedule(
  'sync-brevets-daily',
  '0 2 * * *', -- Tous les jours à 2h du matin
  $$
  SELECT net.http_post(
    url := 'https://ranqsfwmoexghudpvpob.supabase.co/functions/v1/sync-brevets',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

4. Vérifier que le job est créé :

```sql
-- Voir tous les jobs cron actifs
SELECT * FROM cron.job;
```

5. Pour voir l'historique des exécutions :

```sql
-- Voir l'historique des exécutions (dernières 10)
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Option 2 : Via Supabase Webhooks (Alternative)

Si pg_cron ne fonctionne pas, vous pouvez utiliser un service externe comme :
- **GitHub Actions** avec un workflow programmé
- **Vercel Cron Jobs**
- **Zapier** / **Make.com**

Exemple avec GitHub Actions (créer `.github/workflows/sync-brevets.yml`) :

```yaml
name: Sync Brevets Daily

on:
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h UTC
  workflow_dispatch:  # Permet déclenchement manuel

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://ranqsfwmoexghudpvpob.supabase.co/functions/v1/sync-brevets
```

## 🔧 Test manuel de la fonction

Vous pouvez tester manuellement la synchronisation :

```bash
# Via Supabase CLI
supabase functions invoke sync-brevets

# Ou via curl
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://ranqsfwmoexghudpvpob.supabase.co/functions/v1/sync-brevets
```

## 📊 Monitoring

### Voir les logs de la fonction

```bash
# En temps réel
supabase functions logs sync-brevets --follow

# Logs récents
supabase functions logs sync-brevets
```

Ou dans le Dashboard : **Edge Functions** → **sync-brevets** → **Logs**

### Vérifier les données

```sql
-- Compter les brevets par année
SELECT
  EXTRACT(YEAR FROM date_brevet) as annee,
  COUNT(*) as nombre_brevets
FROM brevets
GROUP BY annee
ORDER BY annee DESC;

-- Voir les dernières modifications
SELECT
  id,
  nom_brm,
  date_brevet,
  club_id
FROM brevets
ORDER BY id DESC
LIMIT 10;

-- Vérifier les brevets sans coordonnées
SELECT COUNT(*) as brevets_sans_coords
FROM brevets
WHERE latitude IS NULL OR longitude IS NULL;

-- Voir les brevets sans coordonnées
SELECT id, ville_depart, departement, pays
FROM brevets
WHERE latitude IS NULL OR longitude IS NULL
LIMIT 10;
```

## 🔍 Gestion des erreurs

La fonction retourne un rapport JSON :

**En cas de succès :**
```json
{
  "success": true,
  "timestamp": "2025-11-05T10:30:00.000Z",
  "stats": {
    "total_brevets": 457,
    "total_clubs": 175,
    "api_url": "https://www.audax-club-parisien.fr/fr/api/brevets",
    "geocoding": {
      "processed": 10,
      "geocoded": 8,
      "failed": 2,
      "failed_ids": [104482, 93708]
    }
  }
}
```

**En cas d'erreur :**
```json
{
  "success": false,
  "error": "API request failed: 500",
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

## 🛠️ Commandes utiles

```bash
# Déployer une mise à jour
supabase functions deploy sync-brevets

# Supprimer la fonction
supabase functions delete sync-brevets

# Voir toutes les fonctions
supabase functions list
```

## ⚙️ Gestion du Cron

```sql
-- Désactiver temporairement le job
UPDATE cron.job SET active = false WHERE jobname = 'sync-brevets-daily';

-- Réactiver le job
UPDATE cron.job SET active = true WHERE jobname = 'sync-brevets-daily';

-- Supprimer le job
SELECT cron.unschedule('sync-brevets-daily');

-- Modifier l'horaire (exemple : 4h du matin)
SELECT cron.schedule(
  'sync-brevets-daily',
  '0 4 * * *',
  $$ ... $$
);
```

## 📝 Notes importantes

### Synchronisation des brevets
- ✅ La fonction utilise **upsert** : pas de doublons, les données existantes sont mises à jour
- ✅ Les logs sont conservés 7 jours dans Supabase
- ✅ Environ **10 modifications par jour** = synchronisation très rapide (< 1 seconde)
- ✅ Gratuit dans les limites du plan Supabase gratuit
- ⚠️ L'API source doit être accessible (vérifier si elle nécessite une authentification)

### Géocodage automatique
- 🗺️ **API utilisée** : Nominatim (OpenStreetMap) - gratuite
- ⏱️ **Rate limiting** : 1 requête par seconde (1,2s entre chaque pour sécurité)
- 📊 **Limite** : 100 brevets géocodés maximum par exécution
- 🔄 **Stratégie** : Les brevets sans coordonnées sont géocodés progressivement à chaque run
- 🎯 **Construction adresse** : `ville_depart + departement + pays`
- ✅ **User-Agent** : Header requis par Nominatim (déjà configuré)
- ⚠️ **Échecs possibles** :
  - Adresse incomplète (ex: "Pas encore déterminée")
  - Ville inconnue (ex: villes étrangères rares)
  - Données manquantes (ville_depart = null)

### Durée d'exécution estimée
- **Sans géocodage** : ~2-5 secondes
- **Avec 10 brevets à géocoder** : ~15-20 secondes (1,2s × 10 + synchro)
- **Avec 100 brevets à géocoder** : ~2-3 minutes (reste sous les timeouts)
