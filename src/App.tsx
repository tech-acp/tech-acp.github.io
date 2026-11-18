import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchBrevets, fetchBrevetDetails } from './lib/api'
import { Brevet, BrevetFilters as BrevetFiltersType, getDistanceColor } from './types/brevet'
import { canDisplayRoute, fetchRouteTrack, RouteTrack } from './lib/routes'
import { ElevationProfile } from './components/ElevationProfile'
import { BrevetFilters } from './components/BrevetFilters'
import { BrevetSidebar } from './components/BrevetSidebar'
import { BrevetBottomSheet } from './components/BrevetBottomSheet'
import { useIsMobile } from './hooks/useMediaQuery'
import { Eye, SlidersHorizontal } from 'lucide-react'
import { isBrevetPast } from './lib/utils'

// Année en cours + suivante, comme la synchro (sync-brevets)
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1]

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const isMobile = useIsMobile()

  const [allBrevets, setAllBrevets] = useState<Brevet[]>([])
  const [selectedBrevets, setSelectedBrevets] = useState<Brevet[]>([])
  // Itinéraires affichés : ceux du point cliqué, avec éventuellement un seul mis en avant
  const [routeBrevets, setRouteBrevets] = useState<Brevet[]>([])
  const [focusedRouteId, setFocusedRouteId] = useState<number | null>(null)
  // Survol partagé entre un tracé sur la carte et sa carte dans la liste
  const [hoveredRouteId, setHoveredRouteId] = useState<number | null>(null)
  const [routes, setRoutes] = useState<Record<number, RouteTrack | null>>({})
  // Profil replié : le choix est gardé d'un tracé à l'autre
  const [profileCollapsed, setProfileCollapsed] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [filters, setFilters] = useState<BrevetFiltersType>({
    distances: [200, 300, 400, 600, 1000],
    dateStart: null,
    dateEnd: null,
    eligibleR10000: false
  })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(!isMobile)
  // Liste des brevets repliée (desktop) : la sélection et les tracés restent affichés
  const [listCollapsed, setListCollapsed] = useState(false)
  const listVisible = !isMobile && selectedBrevets.length > 0 && !listCollapsed

  // Fetch unique au montage — toutes les données des années synchronisées
  useEffect(() => {
    const loadBrevets = async () => {
      setLoading(true)
      try {
        const data = (await Promise.all(YEARS.map(fetchBrevets))).flat()
        console.log('🟢 App: Loaded all brevets:', data.length)
        setAllBrevets(data)
      } catch (error) {
        console.error('🔴 App: Erreur lors de la récupération des brevets:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBrevets()
  }, [])

  // Filtrage client-side — instantané, aucune requête réseau.
  // Tous les filtres sauf la distance : sert aussi aux compteurs des boutons de distance
  const brevetsBeforeDistance = useMemo(() => {
    return allBrevets.filter(brevet => {
      if (filters.dateStart) {
        // Période choisie (passée comprise, affichée en transparence) ou un seul jour
        if (brevet.date_brevet < filters.dateStart || brevet.date_brevet > (filters.dateEnd ?? filters.dateStart)) return false
      } else if (isBrevetPast(brevet.date_brevet)) {
        return false
      }
      if (filters.eligibleR10000 && !brevet.eligible_r10000) return false
      return true
    })
  }, [allBrevets, filters.dateStart, filters.dateEnd, filters.eligibleR10000])

  const brevets = useMemo(() => {
    return brevetsBeforeDistance.filter(brevet =>
      !brevet.distance_brevet || filters.distances.includes(brevet.distance_brevet)
    )
  }, [brevetsBeforeDistance, filters.distances])

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

    // Tracés sous les marqueurs (la couche des marqueurs est ajoutée après, donc au-dessus)
    map.current.on('load', () => {
      map.current!.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'id' })
      map.current!.addLayer({
        id: 'routes-casing',
        type: 'line',
        source: 'routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 11, ['get', 'focused'], 9, 6],
          'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, ['get', 'opacity']]
        }
      })
      map.current!.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 7, ['get', 'focused'], 5, 3],
          'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, ['get', 'opacity']]
        }
      })

      // Pastilles arrondies de la couleur de chaque distance, étirées autour du texte (icon-text-fit)
      const pillColors = new Set([200, 300, 400, 600, 1000, 0].map(getDistanceColor))
      pillColors.forEach(color => {
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = color
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.roundRect(2, 2, size - 4, size - 4, 12)
        ctx.fill()
        ctx.stroke()
        map.current!.addImage(`pill-${color}`, ctx.getImageData(0, 0, size, size), {
          pixelRatio: 2,
          stretchX: [[12, 20]],
          stretchY: [[12, 20]],
          content: [8, 8, 24, 24]
        })
      })

      // Distance de chaque tracé, en étiquette horizontale posée sur le parcours
      // (un texte qui suit la ligne ne trouve pas de portion assez droite sur des tracés aussi sinueux)
      map.current!.addSource('routes-labels', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current!.addLayer({
        id: 'routes-label',
        type: 'symbol',
        source: 'routes-labels',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
          'icon-image': ['concat', 'pill-', ['get', 'color']],
          'icon-text-fit': 'both',
          'icon-text-fit-padding': [3, 7, 3, 7],
          // Couche au-dessus du fond de carte, donc placée en priorité sur ses libellés ;
          // une pastille qui en chevauche une autre est masquée plutôt qu'empilée
          'text-padding': 4
        },
        paint: {
          'text-color': '#ffffff'
        }
      })

      // Départ (vert) et arrivée (noir) du tracé affiché avec son profil ; une boucle n'a qu'un point « D/A »
      map.current!.addSource('route-ends', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current!.addLayer({
        id: 'route-ends',
        type: 'circle',
        source: 'route-ends',
        paint: {
          'circle-radius': ['match', ['get', 'kind'], 'loop', 12, 10],
          'circle-color': ['match', ['get', 'kind'], 'end', '#0f172a', '#15803d'],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff'
        }
      })
      map.current!.addLayer({
        id: 'route-ends-label',
        type: 'symbol',
        source: 'route-ends',
        layout: {
          'text-field': ['match', ['get', 'kind'], 'start', 'D', 'end', 'A', 'D/A'],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['match', ['get', 'kind'], 'loop', 9, 11],
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: { 'text-color': '#ffffff' }
      })

      // Point qui suit le survol du profil altimétrique
      map.current!.addSource('route-cursor', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current!.addLayer({
        id: 'route-cursor',
        type: 'circle',
        source: 'route-cursor',
        paint: { 'circle-radius': 7, 'circle-color': ['get', 'color'], 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' }
      })

      // Survol d'un tracé : surligne le brevet dans la liste ; clic : le met en avant
      map.current!.on('mousemove', 'routes-line', e => {
        const id = e.features?.[0]?.properties?.id
        if (id != null) setHoveredRouteId(Number(id))
        map.current!.getCanvas().style.cursor = 'pointer'
      })
      map.current!.on('mouseleave', 'routes-line', () => {
        setHoveredRouteId(null)
        map.current!.getCanvas().style.cursor = ''
      })
      map.current!.on('click', 'routes-line', e => {
        const id = e.features?.[0]?.properties?.id
        if (id != null) setFocusedRouteId(Number(id))
      })
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  const brevetsRef = useRef<Brevet[]>([])
  const handlersBound = useRef(false)
  useEffect(() => { brevetsRef.current = brevets }, [brevets])

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
          'circle-stroke-opacity': [
            'case',
            ['boolean', ['get', 'all_past'], false],
            0.35,
            1
          ],
          // Opacité réduite si tous les brevets du point sont passés
          'circle-opacity': [
            'case',
            ['boolean', ['get', 'all_past'], false],
            0.35, // Opacité pour les points où tous les brevets sont passés
            1    // Opacité normale
          ]
        }
      })

      // Départ/arrivée et curseur du profil restent au-dessus des marqueurs, recréés à chaque filtre
      for (const id of ['route-ends', 'route-ends-label', 'route-cursor']) {
        if (map.current!.getLayer(id)) map.current!.moveLayer(id)
      }

      // Gestionnaires posés une seule fois (la couche est recréée à chaque filtre, pas les écouteurs) :
      // ils lisent la liste filtrée courante via brevetsRef
      if (handlersBound.current) return
      handlersBound.current = true

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
        const clickedBrevet = brevetsRef.current.find(b => b.id === clickedBrevetId)

        if (clickedBrevet && clickedBrevet.latitude !== null && clickedBrevet.longitude !== null) {
          // Trouver tous les brevets avec les mêmes coordonnées
          const brevetsAtSameLocation = brevetsRef.current.filter(b =>
            b.latitude === clickedBrevet.latitude &&
            b.longitude === clickedBrevet.longitude
          )

          console.log('🔵 Brevets au même point:', brevetsAtSameLocation.length)

          // Fetch les détails complets (club, organisateur, etc.) à la demande
          setLoadingDetails(true)
          setSelectedBrevets(brevetsAtSameLocation) // Afficher immédiatement les données légères
          setListCollapsed(false)
          setFocusedRouteId(null)
          setRouteBrevets([])
          fetchBrevetDetails(brevetsAtSameLocation.map(b => b.id))
            .then(detailedBrevets => {
              setSelectedBrevets(detailedBrevets)
              setRouteBrevets(detailedBrevets) // les liens d'itinéraire arrivent avec les détails
            })
            .catch(err => {
              console.error('🔴 Error fetching brevet details:', err)
              // On garde les données légères en fallback
            })
            .finally(() => setLoadingDetails(false))
        }
      })

      // Gérer le clic sur la carte (en dehors des marqueurs) pour fermer la sidebar
      map.current!.on('click', (e) => {
        // Vérifier si le clic est sur un marqueur
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['brevets-layer', 'routes-line'] // un clic sur un tracé le met en avant, sans fermer
        })

        // Si aucun marqueur n'est cliqué, fermer la sidebar et retirer les itinéraires
        if (features.length === 0) {
          closeSelection()
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

  // Charger les tracés des brevets du point cliqué (cache dans lib/routes)
  useEffect(() => {
    let cancelled = false
    routeBrevets.filter(b => canDisplayRoute(b.lien_itineraire_brm)).forEach(brevet => {
      // null = tracé introuvable, pour ne pas attendre indéfiniment avant de cadrer la carte
      fetchRouteTrack(brevet.lien_itineraire_brm).then(track => {
        if (!cancelled) setRoutes(prev => ({ ...prev, [brevet.id]: track }))
      })
    })
    return () => { cancelled = true }
  }, [routeBrevets])

  // Dessiner les tracés ; un itinéraire mis en avant estompe les autres
  useEffect(() => {
    const source = map.current?.getSource('routes') as maplibregl.GeoJSONSource | undefined
    if (!source) return
    const shown = routeBrevets.filter(b => routes[b.id])
    source.setData({
      type: 'FeatureCollection',
      features: shown.map(b => ({
        type: 'Feature',
        id: b.id,
        geometry: { type: 'LineString', coordinates: routes[b.id]!.coords },
        properties: {
          id: b.id,
          color: getDistanceColor(b.distance_brevet ?? 0),
          focused: b.id === focusedRouteId,
          opacity: focusedRouteId === null || b.id === focusedRouteId ? 0.9 : 0.2
        }
      }))
    })
    // Étiquettes de distance : à ~40 % du parcours, décalées d'un tracé à l'autre pour ne pas se superposer.
    // Tracé mis en avant : seule son étiquette reste (estompées, les autres étaient illisibles et lui prenaient la place)
    const labels = map.current?.getSource('routes-labels') as maplibregl.GeoJSONSource | undefined
    labels?.setData({
      type: 'FeatureCollection',
      features: shown.filter(b => b.distance_brevet && (focusedRouteId === null || b.id === focusedRouteId)).map((b, i) => {
        const track = routes[b.id]!
        const target = track.dist[track.dist.length - 1] * (0.3 + (i % 4) * 0.12)
        const at = Math.max(0, track.dist.findIndex(d => d >= target))
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: track.coords[at] },
          properties: {
            label: `${b.distance_brevet} km`,
            color: getDistanceColor(b.distance_brevet ?? 0)
          }
        }
      })
    })
  }, [routeBrevets, routes, focusedRouteId])

  // Surligner sur la carte le tracé survolé (sur la carte ou dans la liste)
  useEffect(() => {
    if (!map.current?.getSource('routes')) return
    map.current.removeFeatureState({ source: 'routes' })
    if (hoveredRouteId !== null) map.current.setFeatureState({ source: 'routes', id: hoveredRouteId }, { hover: true })
  }, [hoveredRouteId, routes, routeBrevets])

  // Cadrer la carte sur l'itinéraire mis en avant, ou sur tous ceux du point (une fois par sélection)
  const lastFitKey = useRef('')
  // Lus au moment du cadrage, sans relancer l'effet quand on masque un panneau
  const showFiltersRef = useRef(showFilters)
  const listVisibleRef = useRef(listVisible)
  useEffect(() => { showFiltersRef.current = showFilters; listVisibleRef.current = listVisible })
  useEffect(() => {
    if (!map.current) return
    const target = focusedRouteId !== null ? routeBrevets.filter(b => b.id === focusedRouteId) : routeBrevets
    const coords = target.flatMap(b => routes[b.id]?.coords ?? [])
    const key = `${focusedRouteId}:${target.map(b => b.id).join(',')}`
    if (coords.length === 0 || key === lastFitKey.current) return
    // Tous les tracés du point sont-ils chargés ? (sinon on attend le suivant)
    if (focusedRouteId === null && target.some(b => routes[b.id] === undefined && canDisplayRoute(b.lien_itineraire_brm))) return
    lastFitKey.current = key
    const willShowProfile = focusedRouteId !== null || target.filter(b => routes[b.id]).length === 1
    const bounds = coords.reduce((acc, c) => acc.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]))
    map.current.fitBounds(bounds, {
      // Marges : panneau des filtres en haut à gauche, liste des brevets à droite (desktop)
      padding: isMobile
        ? { top: 80, bottom: willShowProfile ? 190 : 40, left: 30, right: 30 }
        : { top: showFiltersRef.current ? 230 : 70, bottom: willShowProfile ? 200 : 50, left: 60, right: listVisibleRef.current ? 460 : 60 },
      maxZoom: 12,
      duration: 800
    })
  }, [routeBrevets, routes, focusedRouteId, isMobile])

  // Profil : le tracé mis en avant, ou le seul tracé du point
  const shownTracks = routeBrevets.filter(b => routes[b.id])
  const profileBrevet =
    (focusedRouteId !== null ? shownTracks.find(b => b.id === focusedRouteId) : shownTracks.length === 1 ? shownTracks[0] : undefined) ?? null
  const profileTrack = profileBrevet ? routes[profileBrevet.id]! : null


  // Points de départ et d'arrivée du tracé du profil
  useEffect(() => {
    const source = map.current?.getSource('route-ends') as maplibregl.GeoJSONSource | undefined
    if (!source) return
    if (!profileTrack) {
      source.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    const start = profileTrack.coords[0]
    const end = profileTrack.coords[profileTrack.coords.length - 1]
    // ponytail: écart en degrés (~300 m sous nos latitudes), suffisant pour reconnaître une boucle
    const isLoop = Math.abs(start[0] - end[0]) < 0.004 && Math.abs(start[1] - end[1]) < 0.003
    const point = (coordinates: [number, number], kind: string) =>
      ({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates }, properties: { kind } })
    source.setData({
      type: 'FeatureCollection',
      // Arrivée d'abord : le départ, dessiné ensuite, reste visible s'ils sont proches
      features: isLoop ? [point(start, 'loop')] : [point(end, 'end'), point(start, 'start')]
    })
  }, [profileTrack])

  // Position survolée sur le profil -> point sur la carte (et retrait quand le profil disparaît)
  const moveRouteCursor = (index: number | null) => {
    const source = map.current?.getSource('route-cursor') as maplibregl.GeoJSONSource | undefined
    if (!source) return
    source.setData({
      type: 'FeatureCollection',
      features: index !== null && profileBrevet && profileTrack
        ? [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: profileTrack.coords[index] },
            properties: { color: getDistanceColor(profileBrevet.distance_brevet ?? 0) }
          }]
        : []
    })
  }
  useEffect(() => {
    if (profileTrack) return
    const source = map.current?.getSource('route-cursor') as maplibregl.GeoJSONSource | undefined
    source?.setData({ type: 'FeatureCollection', features: [] })
  }, [profileTrack])

  const closeSelection = () => {
    setHoveredRouteId(null)
    setSelectedBrevets([])
    setRouteBrevets([])
    setFocusedRouteId(null)
  }

  // « Voir l'itinéraire » : mettre ce tracé en avant ; sur mobile, refermer le panneau pour voir la carte
  const showRoute = (brevetId: number) => {
    // Tracé introuvable (parcours privé ou supprimé) : ouvrir le lien d'origine
    if (routes[brevetId] === null) {
      const link = routeBrevets.find(b => b.id === brevetId)?.lien_itineraire_brm
      if (link) window.open(link, '_blank', 'noopener')
      return
    }
    setFocusedRouteId(prev => (prev === brevetId && !isMobile ? null : brevetId))
    if (isMobile) setSelectedBrevets([])
  }

  // Nombre de brevets par distance, selon tous les autres filtres
  const distanceCounts = useMemo(() => {
    return brevetsBeforeDistance.reduce((acc, brevet) => {
      const distance = brevet.distance_brevet
      if (distance) acc[distance] = (acc[distance] || 0) + 1
      return acc
    }, {} as Record<number, number>)
  }, [brevetsBeforeDistance])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Bouton flottant pour afficher les filtres (mobile uniquement) */}
      {/* Filtres masqués : bouton pour les réafficher */}
      {!showFilters && (
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="ui-fade absolute top-2 left-2 md:top-4 md:left-4 z-10 flex items-center gap-2 bg-white/75 backdrop-blur-md rounded-lg shadow-md p-3 md:px-3.5 md:py-2.5 hover:bg-white/90 transition-colors cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40"
          aria-label="Afficher les filtres"
        >
          <SlidersHorizontal className="w-5 h-5 text-slate-700" aria-hidden="true" />
          <span className="hidden md:inline text-sm font-semibold text-slate-700">Filtres</span>
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
          onClose={closeSelection}
          onShowRoute={showRoute}
          focusedRouteId={focusedRouteId}
          hoveredRouteId={hoveredRouteId}
          onHoverRoute={setHoveredRouteId}
        />
      ) : (
        <BrevetSidebar
          brevets={selectedBrevets}
          collapsed={listCollapsed}
          onToggleCollapsed={() => setListCollapsed(c => !c)}
          onClose={closeSelection}
          onShowRoute={showRoute}
          focusedRouteId={focusedRouteId}
          hoveredRouteId={hoveredRouteId}
          onHoverRoute={setHoveredRouteId}
        />
      )}
      
      {profileBrevet && profileTrack && (
        <ElevationProfile
          key={profileBrevet.id}
          track={profileTrack}
          color={getDistanceColor(profileBrevet.distance_brevet ?? 0)}
          title={profileBrevet.nom_brm || `BRM ${profileBrevet.distance_brevet ?? ''} km`}
          denivele={profileBrevet.denivele}
          onHoverIndex={moveRouteCursor}
          collapsed={profileCollapsed}
          onToggleCollapsed={() => { setProfileCollapsed(c => !c); moveRouteCursor(null) }}
          className={`absolute bottom-0 left-0 z-30 transition-[right] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${listVisible ? 'right-[400px]' : 'right-0'}`}
        />
      )}

      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md px-6 py-3 rounded-lg shadow-lg">
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
