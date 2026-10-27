import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, Car, Footprints, MapPin, Navigation, Sparkles, Train } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../ui/Badge';
import mapService from '../../services/mapService';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TRANSPORT_MODES = [
  { mode: 'Walking', icon: Footprints },
  { mode: 'Taxi', icon: Car },
  { mode: 'Car', icon: Car },
  { mode: 'Metro', icon: Train },
  { mode: 'Train', icon: Train },
];

const isValidCoordinate = (coordinates) => (
  Number.isFinite(coordinates?.lat) && Number.isFinite(coordinates?.lng) && (coordinates.lat !== 0 || coordinates.lng !== 0)
);

const markerColor = (marker) => marker.category === 'hotel' ? '#d97706' : marker.category === 'restaurant' ? '#ea580c' : '#0d9488';
const routeColor = (mode) => mode === 'Walking' ? '#0d9488' : mode === 'Metro' ? '#2563eb' : mode === 'Train' ? '#7c3aed' : mode === 'Car' ? '#ea580c' : '#0891b2';

const MapView = ({ trip, itinerary, selectedDay = 1, activeMode: selectedMode, onModeChange, onTelemetryChange }) => {
  const mapContainerRef = useRef(null);
  const leafletMapInstanceRef = useRef(null);
  const [localMode, setLocalMode] = useState(trip?.transportSegments?.[0]?.mode || 'Taxi');
  const activeMode = selectedMode || localMode;
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [mapError, setMapError] = useState('');

  const destName = trip?.destinations?.[0]?.name || trip?.destination?.name || 'Destination';
  const currentDay = itinerary?.days?.find((day) => day.dayNumber === selectedDay) || itinerary?.days?.[0];
  const activities = currentDay?.activities || [];

  const chooseMode = (mode) => {
    setLocalMode(mode);
    onModeChange?.(mode);
  };

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      if (!trip?._id) return;
      setLoading(true);
      try {
        const response = await mapService.getTripMapWorkspace(trip._id, selectedDay, activeMode);
        if (isMounted) {
          const nextTelemetry = response?.data || null;
          setTelemetry(nextTelemetry);
          onTelemetryChange?.(nextTelemetry);
          setMapError(response?.data?.unavailableReason || '');
        }
      } catch (error) {
        if (isMounted) setMapError('The map could not load right now. Try again after the trip has verified location data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadMap();
    return () => { isMounted = false; };
  }, [trip?._id, selectedDay, activeMode]);

  useEffect(() => {
    if (!mapContainerRef.current || !isValidCoordinate(telemetry?.mapCenter)) return undefined;
    if (leafletMapInstanceRef.current) leafletMapInstanceRef.current.remove();

    const map = L.map(mapContainerRef.current, { center: [telemetry.mapCenter.lat, telemetry.mapCenter.lng], zoom: 12, zoomControl: true });
    leafletMapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const waypoints = [];
    (telemetry.markers || []).filter((marker) => isValidCoordinate(marker.coordinates)).forEach((marker, index) => {
      const color = markerColor(marker);
      const icon = marker.category === 'hotel' ? 'H' : String(marker.sequenceOrder || index + 1);
      const markerIcon = L.divIcon({
        className: 'trippilot-map-marker',
        html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 3px 8px rgba(15,23,42,.28)">${icon}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const leafletMarker = L.marker([marker.coordinates.lat, marker.coordinates.lng], { icon: markerIcon }).addTo(map);
      leafletMarker.bindPopup(`<strong>${marker.name || 'Trip stop'}</strong><br>${marker.location || marker.address || marker.category || ''}`);
      waypoints.push([marker.coordinates.lat, marker.coordinates.lng]);
    });

      (telemetry.routeSegments || []).forEach((segment) => {
      const points = (segment.pathCoordinates || []).filter(isValidCoordinate).map((point) => [point.lat, point.lng]);
        if (points.length > 1) L.polyline(points, {
          color: routeColor(segment.mode || telemetry.activeMode),
          weight: 5,
          opacity: 0.95,
          dashArray: segment.mode === 'Walking' ? '7 8' : undefined,
        }).addTo(map);
    });

    if (waypoints.length > 1 && !(telemetry.routeSegments || []).length) map.fitBounds(L.latLngBounds(waypoints), { padding: [50, 50] });
    return () => {
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }
    };
  }, [telemetry]);

  const handleOptimizeRoute = async () => {
    const waypoints = activities.filter((activity) => isValidCoordinate(activity.coordinates)).map((activity) => ({ name: activity.activity, coordinates: activity.coordinates }));
    if (waypoints.length < 2) {
      setMapError('Route optimization needs at least two activities with verified coordinates.');
      return;
    }
    setLoading(true);
    try {
      await mapService.optimizeTripRoute(waypoints);
      setMapError('Route optimization preview calculated. The itinerary order was not saved by this endpoint.');
    } catch (error) {
      setMapError('Route optimization is unavailable for this trip right now.');
    } finally {
      setLoading(false);
    }
  };

  const hasMap = isValidCoordinate(telemetry?.mapCenter);
  return (
    <Card className="overflow-hidden border border-slate-200 p-0 dark:border-slate-800">
      <div className="flex flex-col gap-3 border-b-2 border-stone-900 bg-[#fffaf0] p-4 text-stone-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><Navigation className="h-4 w-4 text-secondary-600" /><div><span className="block text-xs font-bold">{destName} route map</span><span className="text-[10px] text-stone-500">Day {selectedDay} · verified stops only</span></div></div>
        <div role="group" aria-label="Choose transport mode" className="flex flex-wrap items-center gap-1 rounded-full border-2 border-stone-900 bg-white p-1">
          {TRANSPORT_MODES.map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => chooseMode(mode)}
              aria-pressed={activeMode === mode}
              title={`Recalculate route estimate by ${mode.toLowerCase()}`}
              className={`rounded-md border px-3 py-1.5 text-[11px] font-semibold transition ${activeMode === mode ? 'border-[#725e45] bg-[#f8df83] text-stone-900 shadow-[2px_2px_0_#9cc9b5]' : 'border-transparent bg-white text-stone-600 hover:bg-accent-50'}`}
            >
              <Icon className="h-3 w-3" />{mode}
            </button>
          ))}
        </div>
      </div>
      {mapError && <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{mapError}</span></div>}
      <div className="relative min-h-[440px] bg-slate-100 dark:bg-slate-950">
        {hasMap ? <div ref={mapContainerRef} className="h-[440px] w-full" /> : <div className="flex min-h-[440px] items-center justify-center px-8 text-center"><div className="max-w-sm space-y-3"><div className="mx-auto flex h-12 w-12 items-center justify-center bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Building2 className="h-5 w-5" /></div><h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Map data is not ready yet</h3><p className="text-sm leading-6 text-slate-600 dark:text-slate-400">TripPilot will show the route once this trip has verified destination and activity coordinates. No estimated markers are drawn here.</p></div></div>}
        {hasMap && <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2 border-2 border-stone-900 bg-[#fffaf0]/95 p-3 text-xs text-stone-700 shadow-[3px_3px_0_#191919] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="space-y-0.5">
            <span className="block font-bold text-stone-900">{loading ? `Updating ${activeMode.toLowerCase()} estimate...` : `${telemetry?.activeMode || activeMode} route estimate`}</span>
            {telemetry?.routeSegments?.length ? (
              <span className="block text-stone-600">
                {telemetry.tripIntelligence?.dailyDistanceKm} km · {telemetry.tripIntelligence?.dailyTravelTimeText}
              </span>
            ) : (
              <span className="block text-stone-600">No verified route segments for this day yet.</span>
            )}
          </div>
          <button onClick={handleOptimizeRoute} disabled={loading} className="scrapbook-button inline-flex items-center gap-1.5 bg-accent-200 px-4 py-1.5 text-xs font-bold text-stone-900 disabled:opacity-60"><Sparkles className="h-3.5 w-3.5" />Optimize verified stops</button><Badge variant="secondary" size="sm">OpenStreetMap</Badge>
        </div>}
      </div>
    </Card>
  );
};

export default MapView;
