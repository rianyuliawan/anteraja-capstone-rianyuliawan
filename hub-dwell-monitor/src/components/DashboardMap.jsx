import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function createPopup(hub) {
  const content = document.createElement('div')
  content.className = 'hub-popup'

  const name = document.createElement('strong')
  name.textContent = hub.hub_name
  const place = document.createElement('span')
  place.textContent = hub.city
  const dwell = document.createElement('span')
  dwell.textContent = `Mean dwell ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(hub.mean_dwell_hours)} jam`

  content.append(name, place, dwell)
  return content
}

export default function DashboardMap({ hubs, selectedHubId, onSelectHub }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const markerRef = useRef(new Map())
  const onSelectRef = useRef(onSelectHub)
  const hubsRef = useRef(hubs)
  const selectedHubRef = useRef(selectedHubId)
  onSelectRef.current = onSelectHub
  hubsRef.current = hubs
  selectedHubRef.current = selectedHubId

  useEffect(() => {
    if (!containerRef.current) return undefined
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: false })
    map.setView([-4.25, 111.5], 5)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)
    const layer = L.layerGroup().addTo(map)
    mapRef.current = map
    layerRef.current = layer

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
      if (!selectedHubRef.current && hubsRef.current.length) {
        map.fitBounds(
          L.latLngBounds(hubsRef.current.map((hub) => [hub.latitude, hub.longitude])),
          { padding: [28, 28], maxZoom: 7, animate: false },
        )
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      layer.clearLayers()
      markerRef.current.clear()
      map.remove()
      layerRef.current = null
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    markerRef.current.clear()
    if (!hubs.length) return

    const bounds = L.latLngBounds([])
    for (const hub of hubs) {
      const selected = hub.hub_id === selectedHubId
      const icon = L.divIcon({
        className: 'hub-marker-wrapper',
        html: `<span class="hub-marker${selected ? ' hub-marker--selected' : ''}"><span class="hub-marker-dot"></span></span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      })
      const marker = L.marker([hub.latitude, hub.longitude], { icon, title: hub.hub_name })
        .bindPopup(createPopup(hub), { closeButton: true })
        .on('click', () => onSelectRef.current(hub.hub_id))
        .addTo(layer)
      markerRef.current.set(hub.hub_id, marker)
      bounds.extend([hub.latitude, hub.longitude])
    }

    if (!selectedHubId || !markerRef.current.has(selectedHubId)) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 7, animate: false })
    }
  }, [hubs, selectedHubId])

  useEffect(() => {
    const marker = markerRef.current.get(selectedHubId)
    if (!marker || !mapRef.current) return
    mapRef.current.flyTo(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 8), { duration: 0.55 })
    marker.openPopup()
  }, [selectedHubId, hubs])

  return <div ref={containerRef} className="map-canvas" role="region" aria-label="Peta lokasi hub" />
}
