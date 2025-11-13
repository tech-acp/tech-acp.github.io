import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchBrevets } from './lib/api'
import { Brevet, BrevetFilters as BrevetFiltersType } from './types/brevet'
import { BrevetFilters } from './components/BrevetFilters'
import { BrevetSidebar } from './components/BrevetSidebar'
import { BrevetBottomSheet } from './components/BrevetBottomSheet'
import { useIsMobile } from './hooks/useMediaQuery'
import { Eye, SlidersHorizontal } from 'lucide-react'
import { isBrevetPast } from './lib/utils'

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const isMobile = useIsMobile()

  const [brevets, setBrevets] = useState<Brevet[]>([])
  const [selectedBrevets, setSelectedBrevets] = useState<Brevet[]>([])
  const [filters, setFilters] = useState<BrevetFiltersType>({
    distances: [200, 300, 400, 600, 1000],
    dateStart: '2026-01-01',
    dateEnd: '2026-12-31',
    eligibleR10000: false
  })
  const [loading, setLoading] = useState(true)
  const [allBrevetsForCounts, setAllBrevetsForCounts] = useState<Brevet[]>([])
  const [showFilters, setShowFilters] = useState(!isMobile)

  // Récupérer tous les brevets pour les counts (une seule fois)
  useEffect(() => {
    const fetchAllBrevets = async () => {
      try {
        const data = await fetchBrevets({ year: 2026 })
        setAllBrevetsForCounts(data)
      } catch (error) {
        console.error('Erreur lors de la récupération des counts:', error)
      }
    }

    fetchAllBrevets()
  }, [])

  // Récupérer les brevets filtrés depuis Supabase
  useEffect(() => {
    const fetchFilteredBrevets = async () => {
      setLoading(true)
      try {
        console.log('🔵 App: Fetching brevets with filters:', filters)

        const data = await fetchBrevets({
          year: 2026,
          dateStart: filters.dateStart,
          dateEnd: filters.dateEnd,
          distances: filters.distances,
          eligibleR10000: filters.eligibleR10000
        })

        console.log('🟢 App: Final brevets count:', data.length)
        setBrevets(data)
      } catch (error) {
        console.error('🔴 App: Erreur lors de la récupération des brevets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFilteredBrevets()
  }, [filters])

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current) return
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [1.888334, 46.603354],
      zoom: 6
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Ajouter les marqueurs sur la carte
  useEffect(() => {
    if (!map.current || loading) return

    // Attendre que la carte soit chargée
    if (!map.current.loaded()) {
      map.current.on('load', () => {
        updateMarkers()
      })
    } else {
      updateMarkers()
    }

    function updateMarkers() {
      if (!map.current) return

      // Supprimer la source et la couche existantes si elles existent
      if (map.current.getLayer('brevets-layer')) {
        map.current.removeLayer('brevets-layer')
      }
      if (map.current.getSource('brevets')) {
        map.current.removeSource('brevets')
      }

      addMarkersToMap()
    }

    function addMarkersToMap() {
      if (!map.current) return

      // Calculer pour chaque point si TOUS les brevets à ce point sont passés
      const locationStatus = new Map<string, boolean>()
      
      brevets.forEach(brevet => {
        if (brevet.latitude === null || brevet.longitude === null) return
        
        const key = `${brevet.latitude},${brevet.longitude}`
        
        // Si la clé n'existe pas encore, initialiser à true
        if (!locationStatus.has(key)) {
          locationStatus.set(key, true)
        }
        
        // Si au moins un brevet n'est pas passé, le point ne doit pas être transparent
        if (!isBrevetPast(brevet.date_brevet)) {
          locationStatus.set(key, false)
        }
      })

      // Créer les données GeoJSON (sans l'état isSelected)
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: brevets.map(brevet => {
          const key = `${brevet.latitude},${brevet.longitude}`
          const allPast = locationStatus.get(key) || false
          
          return {
            type: 'Feature',
            id: brevet.id, // Important pour setFeatureState
            geometry: {
              type: 'Point',
              coordinates: [brevet.longitude!, brevet.latitude!]
            },
            properties: {
              id: brevet.id,
              nom_brm: brevet.nom_brm,
              distance_brevet: brevet.distance_brevet,
              ville_depart: brevet.ville_depart,
              all_past: allPast
            }
          }
        })
      }

      // Ajouter la source avec promoteId pour utiliser feature-state
      map.current!.addSource('brevets', {
        type: 'geojson',
        data: geojsonData,
        promoteId: 'id'
      })

      // Ajouter la couche de marqueurs avec styles basés sur feature-state
      map.current!.addLayer({
        id: 'brevets-layer',
        type: 'circle',
        source: 'brevets',
        paint: {
          // Taille plus grande si sélectionné
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            12, // Taille si sélectionné
            8   // Taille par défaut
          ],
          // Couleur bleue si sélectionné, rouge sinon
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#2E5077', // Bleu si sélectionné
            '#8B3A3A'  // Rouge des badges par défaut
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          // Opacité réduite si tous les brevets du point sont passés
          'circle-opacity': [
            'case',
            ['boolean', ['get', 'all_past'], false],
            0.1, // Opacité pour les points où tous les brevets sont passés
            1    // Opacité normale
          ]
        }
      })

      // Changer le curseur au survol
      map.current!.on('mouseenter', 'brevets-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer'
        }
      })

      map.current!.on('mouseleave', 'brevets-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = ''
        }
      })

      // Gérer le clic sur un marqueur
      map.current!.on('click', 'brevets-layer', (e) => {
        e.preventDefault()
        if (!e.features || e.features.length === 0) return

        const feature = e.features[0]
        const clickedBrevetId = feature.properties?.id
        const clickedBrevet = brevets.find(b => b.id === clickedBrevetId)

        if (clickedBrevet && clickedBrevet.latitude !== null && clickedBrevet.longitude !== null) {
          // Trouver tous les brevets avec les mêmes coordonnées
          const brevetsAtSameLocation = brevets.filter(b =>
            b.latitude === clickedBrevet.latitude &&
            b.longitude === clickedBrevet.longitude
          )

          console.log('🔵 Brevets au même point:', brevetsAtSameLocation.length)
          setSelectedBrevets(brevetsAtSameLocation)
        }
      })

      // Gérer le clic sur la carte (en dehors des marqueurs) pour fermer la sidebar
      map.current!.on('click', (e) => {
        // Vérifier si le clic est sur un marqueur
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['brevets-layer']
        })

        // Si aucun marqueur n'est cliqué, fermer la sidebar
        if (features.length === 0) {
          setSelectedBrevets([])
        }
      })
    }
  }, [brevets, loading])

  // Gérer l'état de sélection des marqueurs avec feature-state
  useEffect(() => {
    if (!map.current || !map.current.getSource('brevets')) return

    const selectedIds = new Set(selectedBrevets.map(b => b.id))

    // Mettre à jour le feature-state pour tous les brevets
    brevets.forEach(brevet => {
      map.current!.setFeatureState(
        { source: 'brevets', id: brevet.id },
        { selected: selectedIds.has(brevet.id) }
      )
    })
  }, [selectedBrevets, brevets])

  // Calculer les counts de brevets par distance (en tenant compte des filtres de date)
  const distanceCounts = allBrevetsForCounts.reduce((acc, brevet) => {
    const distance = brevet.distance_brevet
    if (distance) {
      // Appliquer les filtres de date si présents
      const passesDateFilter = 
        (!filters.dateStart || (brevet.date_brevet && brevet.date_brevet >= filters.dateStart)) &&
        (!filters.dateEnd || (brevet.date_brevet && brevet.date_brevet <= filters.dateEnd))
      
      if (passesDateFilter) {
        acc[distance] = (acc[distance] || 0) + 1
      }
    }
    return acc
  }, {} as Record<number, number>)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Bouton flottant pour afficher les filtres (mobile uniquement) */}
      {isMobile && !showFilters && (
        <button
          onClick={() => setShowFilters(true)}
          className="absolute top-2 left-2 bg-white rounded-lg shadow-md p-3 z-10 hover:bg-gray-50 transition-colors"
          aria-label="Afficher les filtres"
        >
          <SlidersHorizontal className="w-6 h-6 text-slate-700" />
        </button>
      )}

      <BrevetFilters
        filters={filters}
        onFiltersChange={setFilters}
        distanceCounts={distanceCounts}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {isMobile ? (
        <BrevetBottomSheet
          brevets={selectedBrevets}
          onClose={() => setSelectedBrevets([])}
        />
      ) : (
        <BrevetSidebar
          brevets={selectedBrevets}
          onClose={() => setSelectedBrevets([])}
        />
      )}
      
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-3 rounded-lg shadow-lg">
          <p className="text-gray-700">Chargement des brevets...</p>
        </div>
      )}

      <div className="absolute bottom-3 left-3 bg-white/30 px-2 py-1 rounded text-xs backdrop-blur-sm">
        <a
          href="https://www.hugofaye.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="!text-gray-500 hover:!text-gray-700 transition-colors flex items-center gap-1 !no-underline"
        >
          <Eye className="w-3 h-3" />
          Développé par Hugo Faye
        </a>
      </div>
    </div>
  )
}

export default App
