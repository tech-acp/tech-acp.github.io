import { useEffect, useState, useCallback } from 'react'
import { fetchAllBrevets } from '../lib/api'
import { supabase } from '../lib/supabase'
import { Brevet } from '../types/brevet'
import { ArrowUpDown, Check, Circle, Filter, Home, Loader2, Lock, MapPin, RefreshCw, Search, X, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const ADMIN_PASSWORD = 'Velocio2026!'

type SortDirection = 'asc' | 'desc' | null
type SortField = keyof Brevet | 'club.nom_club' | 'club.pays'

interface ColumnFilter {
  [key: string]: boolean // true = afficher seulement les valeurs vides
}

type StepStatus = 'pending' | 'running' | 'success' | 'error'

interface Step {
  id: string
  label: string
  status: StepStatus
  details?: string
  stats?: Record<string, number | string>
}

interface GeocodingProgress {
  batch: number
  processed: number
  geocoded: number
  errors: number
  remaining: number
}

export function AdminPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true'
  })
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const [brevets, setBrevets] = useState<Brevet[]>([])
  const [filteredBrevets, setFilteredBrevets] = useState<Brevet[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Sync workflow state
  const [isRunning, setIsRunning] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [geocodingProgress, setGeocodingProgress] = useState<GeocodingProgress | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAllBrevets()
        setBrevets(data)
        setFilteredBrevets(data)
      } catch (error) {
        console.error('Error fetching brevets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Appliquer les filtres, la recherche et le tri
  useEffect(() => {
    let result = [...brevets]

    // Appliquer la recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(brevet => {
        const searchableFields = [
          brevet.id?.toString(),
          brevet.nom_brm,
          brevet.ville_depart,
          brevet.departement,
          brevet.region,
          brevet.nom_organisateur,
          brevet.mail_organisateur,
          brevet.club?.nom_club,
          brevet.club?.pays,
          brevet.distance_brevet?.toString(),
          brevet.date_brevet,
        ]
        return searchableFields.some(field =>
          field?.toLowerCase().includes(query)
        )
      })
    }

    // Appliquer les filtres de colonnes vides
    Object.entries(columnFilters).forEach(([field, showEmpty]) => {
      if (showEmpty) {
        result = result.filter(brevet => {
          if (field.startsWith('club.')) {
            const clubField = field.split('.')[1] as keyof typeof brevet.club
            return !brevet.club || brevet.club[clubField] === null || brevet.club[clubField] === ''
          }
          const value = brevet[field as keyof Brevet]
          return value === null || value === ''
        })
      }
    })

    // Appliquer le tri
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal: any
        let bVal: any

        if (sortField.startsWith('club.')) {
          const clubField = sortField.split('.')[1] as keyof typeof a.club
          aVal = a.club?.[clubField] ?? ''
          bVal = b.club?.[clubField] ?? ''
        } else {
          aVal = a[sortField as keyof Brevet] ?? ''
          bVal = b[sortField as keyof Brevet] ?? ''
        }

        // Traiter les valeurs null/undefined
        if (aVal === null || aVal === undefined || aVal === '') aVal = ''
        if (bVal === null || bVal === undefined || bVal === '') bVal = ''

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }

        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          return sortDirection === 'asc'
            ? (aVal === bVal ? 0 : aVal ? 1 : -1)
            : (aVal === bVal ? 0 : aVal ? -1 : 1)
        }

        return 0
      })
    }

    setFilteredBrevets(result)
  }, [brevets, sortField, sortDirection, columnFilters, searchQuery])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleColumnFilter = (field: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const updateStep = useCallback((stepId: string, updates: Partial<Step>) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s))
  }, [])

  const runFullSync = async () => {
    setIsRunning(true)
    setGeocodingProgress(null)

    // Initialize steps
    const initialSteps: Step[] = [
      { id: 'fetch-api', label: 'Récupération des données ACP', status: 'pending' },
      { id: 'sync-db', label: 'Synchronisation base de données', status: 'pending' },
      { id: 'geocoding', label: 'Récupération des coordonnées', status: 'pending' },
      { id: 'refresh', label: 'Rafraîchissement de la liste', status: 'pending' },
    ]
    setSteps(initialSteps)

    try {
      // Step 1: Fetch from ACP API + Sync DB (done together by sync-brevets)
      updateStep('fetch-api', { status: 'running', details: 'Connexion à l\'API ACP...' })

      const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-brevets')

      if (syncError) throw syncError

      // Update step 1 with results
      updateStep('fetch-api', {
        status: 'success',
        details: `${syncData.stats?.api?.total_brevets_fetched} brevets récupérés`,
        stats: {
          'Total': syncData.stats?.api?.total_brevets_fetched,
          'Valides': syncData.stats?.api?.valid_brevets_processed,
          'Annulés': syncData.stats?.api?.cancelled_brevets_excluded,
        }
      })

      // Step 2: Database sync results
      updateStep('sync-db', {
        status: 'success',
        details: `${syncData.stats?.changes?.new_brevets_inserted} nouveaux, ${syncData.stats?.changes?.existing_brevets_updated} modifiés`,
        stats: {
          'Nouveaux': syncData.stats?.changes?.new_brevets_inserted,
          'Modifiés': syncData.stats?.changes?.existing_brevets_updated,
          'Inchangés': syncData.stats?.changes?.unchanged_brevets,
          'Supprimés': syncData.stats?.changes?.deleted_brevets_total,
          'Clubs': syncData.stats?.api?.total_clubs,
        }
      })

      // Step 3: Geocoding
      const brevetsToGeocode = syncData.stats?.geocoding?.brevets_to_geocode || 0

      if (brevetsToGeocode > 0) {
        updateStep('geocoding', {
          status: 'running',
          details: `${brevetsToGeocode} brevets à géocoder...`
        })

        // Poll for geocoding progress
        let totalGeocoded = 0
        let totalErrors = 0
        let batchCount = 0
        let remaining = brevetsToGeocode

        while (remaining > 0 && batchCount < 100) {
          batchCount++

          const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-all-brevets', {
            body: {}
          })

          if (geocodeError) {
            updateStep('geocoding', {
              status: 'error',
              details: `Erreur: ${geocodeError.message}`
            })
            break
          }

          totalGeocoded += geocodeData.stats?.geocoded || 0
          totalErrors += geocodeData.stats?.errors || 0
          remaining = geocodeData.stats?.remaining_to_geocode || 0

          setGeocodingProgress({
            batch: batchCount,
            processed: totalGeocoded + totalErrors,
            geocoded: totalGeocoded,
            errors: totalErrors,
            remaining: remaining
          })

          updateStep('geocoding', {
            status: 'running',
            details: `Batch ${batchCount}: ${totalGeocoded} géocodés, ${remaining} restants...`,
            stats: {
              'Géocodés': totalGeocoded,
              'Erreurs': totalErrors,
              'Restants': remaining,
            }
          })

          // Small delay between batches to avoid rate limiting
          if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        updateStep('geocoding', {
          status: totalErrors > 0 && totalGeocoded === 0 ? 'error' : 'success',
          details: `${totalGeocoded} géocodés, ${totalErrors} erreurs`,
          stats: {
            'Géocodés': totalGeocoded,
            'Erreurs': totalErrors,
            'Batches': batchCount,
          }
        })
      } else {
        updateStep('geocoding', {
          status: 'success',
          details: 'Aucun brevet à géocoder'
        })
      }

      // Step 4: Refresh list
      updateStep('refresh', { status: 'running', details: 'Chargement des données...' })
      const brevetsData = await fetchAllBrevets()
      setBrevets(brevetsData)
      setFilteredBrevets(brevetsData)
      updateStep('refresh', {
        status: 'success',
        details: `${brevetsData.length} brevets chargés`
      })

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      // Mark current running step as error
      setSteps(prev => prev.map(s =>
        s.status === 'running' ? { ...s, status: 'error', details: errorMsg } : s
      ))
    } finally {
      setIsRunning(false)
    }
  }

  const runGeocodeOnly = async () => {
    setIsRunning(true)
    setGeocodingProgress(null)

    const initialSteps: Step[] = [
      { id: 'geocoding', label: 'Récupération des coordonnées', status: 'pending' },
      { id: 'refresh', label: 'Rafraîchissement de la liste', status: 'pending' },
    ]
    setSteps(initialSteps)

    try {
      updateStep('geocoding', { status: 'running', details: 'Recherche des brevets à géocoder...' })

      let totalGeocoded = 0
      let totalErrors = 0
      let batchCount = 0
      let remaining = 1 // Start with 1 to enter the loop

      while (remaining > 0 && batchCount < 100) {
        batchCount++

        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-all-brevets', {
          body: {}
        })

        if (geocodeError) {
          updateStep('geocoding', { status: 'error', details: `Erreur: ${geocodeError.message}` })
          break
        }

        if (batchCount === 1 && geocodeData.stats?.processed_in_batch === 0) {
          updateStep('geocoding', { status: 'success', details: 'Aucun brevet à géocoder' })
          break
        }

        totalGeocoded += geocodeData.stats?.geocoded || 0
        totalErrors += geocodeData.stats?.errors || 0
        remaining = geocodeData.stats?.remaining_to_geocode || 0

        setGeocodingProgress({
          batch: batchCount,
          processed: totalGeocoded + totalErrors,
          geocoded: totalGeocoded,
          errors: totalErrors,
          remaining: remaining
        })

        updateStep('geocoding', {
          status: 'running',
          details: `Batch ${batchCount}: ${totalGeocoded} géocodés, ${remaining} restants...`,
          stats: {
            'Géocodés': totalGeocoded,
            'Erreurs': totalErrors,
            'Restants': remaining,
          }
        })

        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (batchCount > 0 && steps.find(s => s.id === 'geocoding')?.status === 'running') {
        updateStep('geocoding', {
          status: 'success',
          details: `${totalGeocoded} géocodés, ${totalErrors} erreurs`,
          stats: {
            'Géocodés': totalGeocoded,
            'Erreurs': totalErrors,
            'Batches': batchCount,
          }
        })
      }

      // Refresh list
      updateStep('refresh', { status: 'running', details: 'Chargement des données...' })
      const brevetsData = await fetchAllBrevets()
      setBrevets(brevetsData)
      setFilteredBrevets(brevetsData)
      updateStep('refresh', { status: 'success', details: `${brevetsData.length} brevets chargés` })

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      setSteps(prev => prev.map(s =>
        s.status === 'running' ? { ...s, status: 'error', details: errorMsg } : s
      ))
    } finally {
      setIsRunning(false)
    }
  }

  const clearProgress = () => {
    setSteps([])
    setGeocodingProgress(null)
  }

  const columns: { key: SortField; label: string; render?: (brevet: Brevet) => React.ReactNode }[] = [
    { key: 'id', label: 'ID' },
    { key: 'nom_brm', label: 'Nom BRM' },
    { key: 'date_brevet', label: 'Date', render: (b) => b.date_brevet ? new Date(b.date_brevet).toLocaleDateString('fr-FR') : '-' },
    { key: 'distance_brevet', label: 'Distance' },
    { key: 'ville_depart', label: 'Ville' },
    { key: 'departement', label: 'Département' },
    { key: 'region', label: 'Région' },
    { key: 'club.nom_club', label: 'Club', render: (b) => b.club?.nom_club || '-' },
    { key: 'club.pays', label: 'Pays', render: (b) => b.club?.pays || '-' },
    { key: 'nom_organisateur', label: 'Organisateur' },
    { key: 'mail_organisateur', label: 'Email Organisateur' },
    { key: 'denivele', label: 'Dénivelé' },
    { key: 'eligible_r10000', label: 'R10000', render: (b) => b.eligible_r10000 ? '✓' : '-' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'lien_itineraire_brm', label: 'Lien Itinéraire', render: (b) => b.lien_itineraire_brm ? <a href={b.lien_itineraire_brm} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lien</a> : '-' },
  ]

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Administration
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Entrez le mot de passe pour accéder à cette page
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError(false)
              }}
              placeholder="Mot de passe"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                passwordError ? 'border-red-500' : 'border-gray-300'
              }`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-2">Mot de passe incorrect</p>
            )}
            <button
              type="submit"
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Se connecter
            </button>
          </form>
          <Link
            to="/"
            className="block text-center mt-4 text-blue-600 hover:underline"
          >
            Retour à la carte
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Chargement des brevets...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[98%] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administration des Brevets</h1>
            <p className="text-gray-600 mt-1">
              {filteredBrevets.length} brevet{filteredBrevets.length > 1 ? 's' : ''} affiché{filteredBrevets.length > 1 ? 's' : ''} sur {brevets.length} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runFullSync}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'En cours...' : 'Synchronisation complète'}
            </button>
            <button
              onClick={runGeocodeOnly}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <MapPin className={`w-5 h-5 ${isRunning ? 'animate-pulse' : ''}`} />
              Géocoder seulement
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Retour à la carte
            </Link>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, ville, club, organisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Panneau de progression par étapes */}
        {steps.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-gray-900">Progression</h3>
              {!isRunning && (
                <button
                  onClick={clearProgress}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4">
                  {/* Step indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'pending' && (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                    {step.status === 'running' && (
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    )}
                    {step.status === 'success' && (
                      <Check className="w-6 h-6 text-green-500" />
                    )}
                    {step.status === 'error' && (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        step.status === 'pending' ? 'text-gray-400' :
                        step.status === 'running' ? 'text-blue-600' :
                        step.status === 'success' ? 'text-green-600' :
                        'text-red-600'
                      }`}>
                        {step.label}
                      </span>
                      {step.status === 'running' && (
                        <span className="text-xs text-gray-500 animate-pulse">en cours...</span>
                      )}
                    </div>

                    {step.details && (
                      <p className={`text-sm mt-1 ${
                        step.status === 'error' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {step.details}
                      </p>
                    )}

                    {/* Stats badges */}
                    {step.stats && Object.keys(step.stats).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(step.stats).map(([key, value]) => (
                          <span
                            key={key}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              key === 'Nouveaux' || key === 'Géocodés' ? 'bg-green-100 text-green-700' :
                              key === 'Modifiés' ? 'bg-blue-100 text-blue-700' :
                              key === 'Supprimés' || key === 'Erreurs' || key === 'Annulés' ? 'bg-red-100 text-red-700' :
                              key === 'Restants' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Geocoding progress bar */}
            {geocodingProgress && geocodingProgress.remaining > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Géocodage en cours...</span>
                  <span>{geocodingProgress.geocoded} / {geocodingProgress.geocoded + geocodingProgress.remaining}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(geocodingProgress.geocoded / (geocodingProgress.geocoded + geocodingProgress.remaining)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleSort(column.key)}
                          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                        >
                          <span>{column.label}</span>
                          <ArrowUpDown className="w-3 h-3" />
                          {sortField === column.key && (
                            <span className="text-blue-600 font-bold">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => toggleColumnFilter(column.key)}
                          className={`flex items-center gap-1 text-xs ${
                            columnFilters[column.key]
                              ? 'text-blue-600 font-semibold'
                              : 'text-gray-500 hover:text-gray-700'
                          } transition-colors`}
                          title="Filtrer les valeurs vides"
                        >
                          <Filter className="w-3 h-3" />
                          <span>{columnFilters[column.key] ? 'Vides only' : 'Filtrer vides'}</span>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBrevets.map((brevet) => (
                  <tr key={brevet.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {column.render
                          ? column.render(brevet)
                          : column.key.startsWith('club.')
                            ? (brevet.club?.[column.key.split('.')[1] as keyof typeof brevet.club] as string) || '-'
                            : (brevet[column.key as keyof Brevet] as string | number) || '-'
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredBrevets.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun brevet ne correspond aux filtres appliqués.</p>
          </div>
        )}
      </div>
    </div>
  )
}
