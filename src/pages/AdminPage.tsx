import { useEffect, useState } from 'react'
import { fetchAllBrevets } from '../lib/api'
import { Brevet } from '../types/brevet'
import { ArrowUpDown, Filter, Home } from 'lucide-react'
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

  // Appliquer les filtres et le tri
  useEffect(() => {
    let result = [...brevets]

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
  }, [brevets, sortField, sortDirection, columnFilters])

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
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Retour à la carte
          </Link>
        </div>

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
