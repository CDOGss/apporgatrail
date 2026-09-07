import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { GpxPoint, CalculatedCheckpoint } from '../../types/trail'
import { formatPassingDateTime } from '../../utils/pacingEngine'
import { Layers } from 'lucide-react'

interface TrailMapProps {
  points: GpxPoint[]
  checkpoints: CalculatedCheckpoint[]
  hoveredCheckpointId?: string | null
  onSelectCheckpoint?: (id: string) => void
}

type MapProvider = 'opentopo' | 'satellite' | 'esritopo' | 'osm'

interface ProviderConfig {
  name: string
  label: string
  url: string
  options: L.TileLayerOptions
}

const PROVIDERS: Record<MapProvider, ProviderConfig> = {
  opentopo: {
    name: 'OpenTopoMap',
    label: '🏔️ OpenTopo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 17,
      subdomains: 'abc',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
  },
  satellite: {
    name: 'Satellite HD',
    label: '🛰️ Satellite HD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    },
  },
  esritopo: {
    name: 'ESRI Topo',
    label: '🗺️ ESRI Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution:
        'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN',
    },
  },
  osm: {
    name: 'OpenStreetMap',
    label: '🌍 OSM Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
}

export const TrailMap: React.FC<TrailMapProps> = ({
  points,
  checkpoints,
  hoveredCheckpointId,
  onSelectCheckpoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const activeTileLayerRef = useRef<L.TileLayer | null>(null)
  const polylineHaloRef = useRef<L.Polyline | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})

  // Default to OpenTopoMap (as requested by organizers for trail relief & contour lines)
  const [activeProvider, setActiveProvider] = useState<MapProvider>('opentopo')

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([-21.115, 55.536], 10)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // 2. Manage Active Tile Layer dynamically
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (activeTileLayerRef.current) {
      activeTileLayerRef.current.remove()
    }

    const cfg = PROVIDERS[activeProvider]
    const layer = L.tileLayer(cfg.url, cfg.options).addTo(map)
    activeTileLayerRef.current = layer
  }, [activeProvider])

  // 3. Update Polyline and Markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear old polylines
    if (polylineHaloRef.current) {
      polylineHaloRef.current.remove()
      polylineHaloRef.current = null
    }
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    if (!points || points.length < 2) return

    // Draw GPX track with high-contrast halo for perfect visibility on all backgrounds (Topo, Satellite, OSM)
    const latlngs: [number, number][] = points.map((p) => [p.lat, p.lon])

    const halo = L.polyline(latlngs, {
      color: '#ffffff',
      weight: 5.5,
      opacity: 0.7,
      lineJoin: 'round',
    }).addTo(map)
    polylineHaloRef.current = halo

    const polyline = L.polyline(latlngs, {
      color: '#ff4500',
      weight: 3.5,
      opacity: 0.95,
      lineJoin: 'round',
    }).addTo(map)
    polylineRef.current = polyline

    // Add Aid Station markers
    checkpoints.forEach((cp, idx) => {
      const gpxIdx = cp.aidStation.gpxPointIndex ?? 0
      const pt =
        points[gpxIdx] ||
        points[
          Math.min(
            points.length - 1,
            Math.round(
              (cp.distanceKm / (points[points.length - 1].dist || 1)) *
                points.length
            )
          )
        ]
      if (!pt) return

      const isBaseVie = cp.aidStation.type === 'BASE_VIE'
      const isStart = cp.aidStation.type === 'DEPART'
      const isFinish = cp.aidStation.type === 'ARRIVEE'

      const pinBg = isStart
        ? 'bg-emerald-500 text-white shadow-emerald-500/40 ring-2 ring-emerald-300'
        : isFinish
        ? 'bg-red-500 text-white shadow-red-500/40 ring-2 ring-red-300'
        : isBaseVie
        ? 'bg-amber-400 text-slate-950 font-black shadow-amber-400/40 ring-2 ring-amber-200'
        : 'bg-orange-500 text-white shadow-orange-500/40'

      const iconHtml = `
        <div class="flex items-center justify-center h-7 w-7 rounded-full ${pinBg} shadow-lg font-bold text-xs border-2 border-white cursor-pointer transition-transform transform hover:scale-125">
          ${idx + 1}
        </div>
      `

      const customIcon = L.divIcon({
        className: 'custom-trail-marker',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      })

      const marker = L.marker([pt.lat, pt.lon], { icon: customIcon }).addTo(map)

      const firstPass = formatPassingDateTime(cp.firstRunner.passingTime)
      const lastPass = formatPassingDateTime(cp.lastRunner.passingTime)

      const popupContent = `
        <div class="p-1 min-w-[220px] space-y-1.5 font-sans">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1">
            <span class="font-bold text-white text-sm">#${idx + 1} ${cp.aidStation.name}</span>
          </div>
          <div class="text-xs text-slate-300 grid grid-cols-2 gap-1 py-0.5">
            <div>Km: <span class="font-bold text-orange-400 font-mono">${cp.distanceKm} km</span></div>
            <div>Alt: <span class="font-bold text-white font-mono">${cp.elevation} m</span></div>
            <div>D+: <span class="font-bold text-emerald-400 font-mono">+${cp.cumDPlus} m</span></div>
            <div>Type: <span class="font-semibold text-slate-200">${cp.aidStation.type}</span></div>
          </div>
          <div class="rounded bg-slate-900/90 p-1.5 border border-slate-800 text-[11px] space-y-1">
            <div class="flex justify-between">
              <span class="text-orange-400 font-semibold">1er coureur :</span>
              <span class="font-mono text-white font-bold">${firstPass.fullStr}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-cyan-400 font-semibold">Barrière (Serre-file) :</span>
              <span class="font-mono text-white font-bold">${lastPass.fullStr}</span>
            </div>
          </div>
          <div class="text-[10px] text-slate-400 flex justify-between pt-0.5">
            <span>Accès: ${cp.aidStation.accessibility}</span>
            <span>Réseau: ${cp.aidStation.network}</span>
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      marker.on('click', () => {
        if (onSelectCheckpoint) onSelectCheckpoint(cp.aidStation.id)
      })

      markersRef.current[cp.aidStation.id] = marker
    })

    // Fit map bounds to track
    if (latlngs.length > 0) {
      map.fitBounds(polyline.getBounds(), { padding: [35, 35] })
    }
  }, [points, checkpoints, onSelectCheckpoint])

  // React to hover selection from table or elevation chart
  useEffect(() => {
    if (!hoveredCheckpointId) return
    const marker = markersRef.current[hoveredCheckpointId]
    if (marker && mapInstanceRef.current) {
      marker.openPopup()
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true })
    }
  }, [hoveredCheckpointId])

  return (
    <div className="relative h-full min-h-[420px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Course Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-[1000] rounded-xl bg-slate-950/85 px-3 py-1.5 text-xs text-slate-300 backdrop-blur border border-slate-800 pointer-events-none shadow-xl flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-white">Carte Officielle du Parcours</span>
        <span className="text-slate-600">•</span>
        <span className="text-orange-400 font-bold">{checkpoints.length} Postes</span>
      </div>

      {/* Map Provider Selector (Top Right) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 rounded-xl bg-slate-950/90 p-1 backdrop-blur border border-slate-800 shadow-xl">
        <div className="hidden sm:flex items-center gap-1 px-1.5 text-[11px] font-medium text-slate-400">
          <Layers className="h-3 w-3 text-orange-400" />
          <span>Fonds :</span>
        </div>
        {(Object.keys(PROVIDERS) as MapProvider[]).map((key) => {
          const cfg = PROVIDERS[key]
          const isActive = activeProvider === key
          return (
            <button
              key={key}
              onClick={() => setActiveProvider(key)}
              title={`Fond de carte : ${cfg.name}`}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <span>{cfg.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
