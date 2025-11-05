import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { supabase } from './lib/supabase'
import { Brevet, BrevetFilters as BrevetFiltersType } from './types/brevet'
import { BrevetFilters } from './components/BrevetFilters'
import { BrevetSidebar } from './components/BrevetSidebar'

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  
  const [brevets, setBrevets] = useState<Brevet[]>([])
  const [selectedBrevet, setSelectedBrevet] = useState<Brevet | null>(null)
  const [filters, setFilters] = useState<BrevetFiltersType>({
    distances: [200, 300, 400, 600, 1000],
    dateStart: null,
    dateEnd: null
  })
  const [loading, setLoading] = useState(true)

  // Récupérer les brevets depuis Supabase
  useEffect(() => {
    const fetchBrevets = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('brevets')
          .select(`
            *,
            club:clubs(*)
          `)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)

        // Filtrer par distance
        if (filters.distances.length > 0) {
          query = query.in('distance_brevet', filters.distances)
        }

        // Filtrer par date
        if (filters.dateStart) {
          query = query.gte('date_brevet', filters.dateStart)
        }
        if (filters.dateEnd) {
          query = query.lte('date_brevet', filters.dateEnd)
        }

        const { data, error } = await query

        if (error) {
          console.error('Erreur lors de la récupération des brevets:', error)
        } else {
          setBrevets(data || [])
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBrevets()
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

      // Créer les données GeoJSON
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: brevets.map(brevet => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [brevet.longitude!, brevet.latitude!]
          },
          properties: {
            id: brevet.id,
            nom_brm: brevet.nom_brm,
            distance_brevet: brevet.distance_brevet,
            ville_depart: brevet.ville_depart
          }
        }))
      }

      // Ajouter la source
      map.current!.addSource('brevets', {
        type: 'geojson',
        data: geojsonData
      })

      // Ajouter la couche de marqueurs avec les couleurs ACP
      map.current!.addLayer({
        id: 'brevets-layer',
        type: 'circle',
        source: 'brevets',
        paint: {
          'circle-radius': 8,
          'circle-color': '#E52421', // Rouge ACP
          'circle-stroke-width': 2,
          'circle-stroke-color': '#005EB8' // Bleu ACP
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
        if (!e.features || e.features.length === 0) return

        const feature = e.features[0]
        const brevetId = feature.properties?.id

        const brevet = brevets.find(b => b.id === brevetId)
        if (brevet) {
          setSelectedBrevet(brevet)
        }
      })
    }
  }, [brevets, loading])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%' }}
      />
      
      <BrevetFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />
      
      <BrevetSidebar 
        brevet={selectedBrevet} 
        onClose={() => setSelectedBrevet(null)} 
      />
      
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-3 rounded-lg shadow-lg">
          <p className="text-gray-700">Chargement des brevets...</p>
        </div>
      )}
    </div>
  )
}

export default App
