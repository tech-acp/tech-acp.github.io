import { useEffect, useState } from 'react'
import { fetchAllBrevets } from '../lib/api'
import { supabase } from '../lib/supabase'
import { Brevet } from '../types/brevet'
import { ArrowUpDown, Filter, Home, RefreshCw, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'

type SortDirection = 'asc' | 'desc' | null
type SortField = keyof Brevet | 'club.nom_club' | 'club.pays'

interface ColumnFilter {
  [key: string]: boolean // true = afficher seulement les valeurs vides
}

export function AdminPage() {
  const [brevets, setBrevets] = useState<Brevet[]>([])
  const [filteredBrevets, setFilteredBrevets] = useState<Brevet[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    setSyncError(null)

    try {
      const { data, error } = await supabase.functions.invoke('sync-brevets')

      if (error) throw error

      setSyncResult(data)
      // Rafraîchir la liste des brevets après sync
      const brevetsData = await fetchAllBrevets()
      setBrevets(brevetsData)
      setFilteredBrevets(brevetsData)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSyncing(false)
    }
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
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronisation...' : 'Synchroniser'}
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

        {/* Panneau de résultats de synchronisation */}
        {(syncResult || syncError) && (
          <div className={`mb-6 p-4 rounded-lg ${syncError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900">
                {syncError ? 'Erreur de synchronisation' : 'Synchronisation réussie'}
              </h3>
              <button
                onClick={() => { setSyncResult(null); setSyncError(null) }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {syncError ? (
              <p className="text-red-600 mt-2">{syncError}</p>
            ) : syncResult && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500">API - Total récupéré</p>
                  <p className="text-xl font-bold">{syncResult.stats?.api?.total_brevets_fetched ?? '-'}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500">Brevets valides</p>
                  <p className="text-xl font-bold">{syncResult.stats?.api?.valid_brevets_processed ?? '-'}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500">Annulés exclus</p>
                  <p className="text-xl font-bold text-orange-600">{syncResult.stats?.api?.cancelled_brevets_excluded ?? '-'}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500">Clubs</p>
                  <p className="text-xl font-bold">{syncResult.stats?.api?.total_clubs ?? '-'}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500">Nouveaux brevets</p>
                  <p className="text-xl font-bold text-green-600">{syncResult.stats?.changes?.new_brevets_inserted ?? '-'}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500">Modifiés</p>
                  <p className="text-xl font-bold text-blue-600">{syncResult.stats?.changes?.existing_brevets_updated ?? '-'}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500">Inchangés</p>
                  <p className="text-xl font-bold text-gray-400">{syncResult.stats?.changes?.unchanged_brevets ?? '-'}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500">Supprimés</p>
                  <p className="text-xl font-bold text-red-600">{syncResult.stats?.changes?.deleted_brevets_total ?? '-'}</p>
                </div>
                {syncResult.stats?.geocoding?.geocoding_triggered && (
                  <div className="bg-white p-3 rounded border">
                    <p className="text-gray-500">À géocoder</p>
                    <p className="text-xl font-bold text-purple-600">{syncResult.stats?.geocoding?.new_brevets_to_geocode ?? '-'}</p>
                  </div>
                )}
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
