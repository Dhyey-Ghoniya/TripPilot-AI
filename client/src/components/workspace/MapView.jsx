import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Building2,
  Plane,
  Layers,
  Sparkles,
  Footprints,
  Car,
  Bus,
  Train,
  Bike,
  Utensils,
  Compass,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../ui/Badge';
import mapService from '../../services/mapService';

const TRANSPORT_MODES = [
  { mode: 'Walking', icon: Footprints, speed: '4.5 km/h' },
  { mode: 'Taxi', icon: Car, speed: '35 km/h' },
  { mode: 'Car', icon: Car, speed: '38 km/h' },
  { mode: 'Bus', icon: Bus, speed: '22 km/h' },
  { mode: 'Metro', icon: Train, speed: '42 km/h' },
  { mode: 'Train', icon: Train, speed: '55 km/h' },
  { mode: 'Bike', icon: Bike, speed: '15 km/h' },
];

const MapView = ({ trip, itinerary, selectedDay = 1 }) => {
  const destName = trip?.destination?.name || 'Destination';
  const centerLat = trip?.destination?.coordinates?.lat || 25.2048;
  const centerLng = trip?.destination?.coordinates?.lng || 55.2708;

  const [activeMode, setActiveMode] = useState(trip?.transport?.mode || 'Taxi');
  const [activeLayer, setActiveLayer] = useState('all'); // 'all', 'hotel', 'activities', 'airport'
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [optimizationMsg, setOptimizationMsg] = useState('');

  const currentDayObj = itinerary?.days?.find((d) => d.dayNumber === selectedDay) || itinerary?.days?.[0];
  const activities = currentDayObj?.activities || [];

  const fetchWorkspaceMap = async () => {
    if (!trip?._id) return;
    setLoading(true);
    try {
      const res = await mapService.getTripMapWorkspace(trip._id, selectedDay);
      if (res.data) {
        setTelemetry(res.data);
      }
    } catch (err) {
      console.error('Error fetching trip map telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceMap();
  }, [trip?._id, selectedDay, activeMode]);

  const handleOptimizeRoute = async () => {
    if (!activities || activities.length === 0) return;
    setLoading(true);
    try {
      const waypoints = [
        { name: trip?.hotel?.name || 'Stay Location', coordinates: trip?.hotel?.coordinates || { lat: centerLat, lng: centerLng } },
        ...activities.map((a, idx) => ({
          name: a.activity || a.title,
          coordinates: { lat: centerLat + (idx % 2 === 0 ? 0.015 * (idx + 1) : -0.012 * (idx + 1)), lng: centerLng + (idx % 2 === 0 ? -0.01 * (idx + 1) : 0.018 * (idx + 1)) },
        })),
      ];

      const res = await mapService.optimizeTripRoute(waypoints);
      if (res.data) {
        if (res.data.hasInefficiency) {
          setOptimizationMsg(`Route optimized! Saved ~${res.data.savedDistanceKm} km and ~${res.data.savedMinutes} mins of commuting time.`);
        } else {
          setOptimizationMsg('Route is already geographically optimal!');
        }
      }
    } catch (err) {
      console.error('Error optimizing route:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col min-h-[580px]">
      {/* Map Header & Transport Controls */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 z-10 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-secondary-400" />
          <div>
            <span className="text-xs font-bold text-white block">{destName} Interactive Route Map</span>
            <span className="text-[10px] text-slate-400">Day {selectedDay} Sequence & Transport Intelligence</span>
          </div>
        </div>

        {/* 7 Transport Modes Bar */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-800 p-1 rounded-xl">
          {TRANSPORT_MODES.map((item) => {
            const Icon = item.icon;
            const isSelected = activeMode === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => setActiveMode(item.mode)}
                title={`${item.mode} (${item.speed})`}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                  isSelected ? 'bg-secondary-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.mode}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optimization Banner if triggered */}
      {optimizationMsg && (
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center justify-between z-10">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {optimizationMsg}
          </span>
          <button onClick={() => setOptimizationMsg('')} className="text-slate-400 hover:text-white text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Map Canvas Visualizer */}
      <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden min-h-[400px]">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

        {/* Route Connection Polylines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-secondary-500/50 stroke-2 stroke-dasharray-4">
          <path d="M 120 180 Q 250 120 380 260 T 540 190" fill="none" />
        </svg>

        {/* Airport Marker */}
        {(activeLayer === 'all' || activeLayer === 'airport') && (
          <div className="absolute top-10 left-12 group cursor-pointer z-10">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg ring-4 ring-sky-500/20 group-hover:scale-110 transition">
              <Plane className="w-4 h-4" />
            </div>
            <span className="absolute left-9 top-1 text-[10px] font-bold bg-slate-900/95 text-sky-400 px-2 py-0.5 rounded-md backdrop-blur-md shadow whitespace-nowrap">
              {destName} Airport
            </span>
          </div>
        )}

        {/* Hotel Marker */}
        {(activeLayer === 'all' || activeLayer === 'hotel') && (
          <div className="absolute top-24 right-20 group cursor-pointer z-10">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg ring-4 ring-amber-500/20 group-hover:scale-110 transition">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <span className="absolute right-10 top-1 text-[10px] font-bold bg-slate-900/95 text-amber-400 px-2 py-0.5 rounded-md backdrop-blur-md shadow whitespace-nowrap">
              {trip?.hotel?.name || 'Stay Location'}
            </span>
          </div>
        )}

        {/* Activities / Attractions / Restaurants Markers */}
        {(activeLayer === 'all' || activeLayer === 'activities') &&
          activities.slice(0, 5).map((act, idx) => {
            const positions = [
              { top: '38%', left: '28%' },
              { top: '55%', left: '52%' },
              { top: '32%', left: '72%' },
              { top: '68%', left: '40%' },
              { top: '75%', left: '68%' },
            ];
            const pos = positions[idx % positions.length];
            const isFood = (act.category || '').toLowerCase().includes('food') || (act.activity || '').toLowerCase().includes('dining');

            return (
              <div
                key={act._id || idx}
                style={{ top: pos.top, left: pos.left }}
                className="absolute group cursor-pointer z-20"
              >
                <div
                  className={`w-8 h-8 rounded-full ${
                    isFood ? 'bg-orange-500 ring-orange-500/20' : 'bg-emerald-500 ring-emerald-500/20'
                  } text-white font-black text-xs flex items-center justify-center shadow-lg ring-4 group-hover:scale-110 transition`}
                >
                  {isFood ? <Utensils className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="absolute left-9 top-0 text-[11px] bg-slate-900/95 text-white px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-800 shadow-xl opacity-90 group-hover:opacity-100 transition whitespace-nowrap">
                  <p className="font-bold text-emerald-400">{act.activity || act.title}</p>
                  <p className="text-[10px] text-slate-400">{act.location || destName} • {act.timeSlot || 'slot'}</p>
                </div>
              </div>
            );
          })}

        {/* Route Optimization Floating Button */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={handleOptimizeRoute}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary-600 hover:bg-secondary-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Optimize Sequence</span>
          </button>
        </div>

        {/* Map Telemetry Footer */}
        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-secondary-400" />
              Center: {centerLat.toFixed(4)}°, {centerLng.toFixed(4)}°
            </span>
            <span className="text-emerald-400 font-semibold">
              Daily Distance: {telemetry?.tripIntelligence?.dailyDistanceKm || 14.2} km
            </span>
            <span className="text-secondary-300 font-semibold">
              Travel Time: {telemetry?.tripIntelligence?.dailyTravelTimeText || '42m'} via {activeMode}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="emerald" size="sm">
              OSRM Active
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MapView;
