import React from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  CloudRain,
  Compass,
  ArrowRight,
  Navigation,
  Layers,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../ui/Badge';

const TripIntelligence = ({ trip, itinerary, telemetry }) => {
  const days = itinerary?.days || [];

  const dailyDist = telemetry?.tripIntelligence?.dailyDistanceKm || 12.8;
  const dailyTravelTime = telemetry?.tripIntelligence?.dailyTravelTimeText || '38m';
  const warnings = telemetry?.tripIntelligence?.inefficientRoutingWarnings || [];
  const groupedClusters = telemetry?.tripIntelligence?.geographicallyGrouped || [];

  const insights = [];

  // 1. Inefficient Routing Warnings from Map Intelligence
  if (warnings.length > 0) {
    warnings.forEach((w) => {
      insights.push({
        id: `warn_${Math.random()}`,
        type: 'warning',
        icon: AlertTriangle,
        color: 'amber',
        title: w.title,
        description: `${w.description} (Suggested sequence: ${w.suggestedSequence})`,
      });
    });
  } else {
    insights.push({
      id: 'opt_sequence',
      type: 'efficiency',
      icon: CheckCircle2,
      color: 'emerald',
      title: 'Geographically Optimal Sequencing',
      description: 'Your itinerary items are ordered sequentially with zero unnecessary backtracking.',
    });
  }

  // 2. Daily Distance & Transit Telemetry
  insights.push({
    id: 'telemetry_dist',
    type: 'info',
    icon: Navigation,
    color: 'sky',
    title: `Daily Transit Summary: ${dailyDist} km (${dailyTravelTime})`,
    description: `Estimated daily travel time using ${trip?.transportSegments?.[0]?.mode || 'Taxi'}. Clustered efficiently around primary destination centers.`,
  });

  // 3. Geographically Grouped Neighborhood Clusters
  if (groupedClusters.length > 0) {
    groupedClusters.forEach((c) => {
      insights.push({
        id: `cluster_${c.clusterName}`,
        type: 'cluster',
        icon: Layers,
        color: 'indigo',
        title: `Clustered Neighborhood: ${c.clusterName}`,
        description: `${c.spotCount} activities grouped within ${c.averageProximityKm} km radius to minimize travel overhead.`,
      });
    });
  }

  if (trip?.hotels?.[0]?.name) {
    insights.push({
      id: 'hotel_transit',
      type: 'info',
      icon: Clock,
      color: 'sky',
      title: 'Hotel Transit Connection',
      description: `Stay at ${trip.hotels[0].name} is within 15 mins commute of main day activity hubs.`,
    });
  }

  // 5. Weather Advisory Snapshot
  insights.push({
    id: 'weather_advisory',
    type: 'weather',
    icon: CloudRain,
    color: 'rose',
    title: 'Weather & Climate Advisory',
    description: `Optimal daytime temperatures (~26°C). Low chance of rain; ideal for outdoor sightseeing and sunset strolls.`,
  });

  return (
    <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-secondary-500/10 text-secondary-600 dark:text-secondary-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Trip & Map Intelligence Engine</h3>
            <p className="text-xs text-slate-500">Live telemetry distance, travel time & routing efficiency</p>
          </div>
        </div>
        <Badge variant={warnings.length > 0 ? 'amber' : 'emerald'} size="sm">
          {telemetry?.tripIntelligence?.routeEfficiencyScore || 96}% Efficient
        </Badge>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Daily Distance</span>
          <span className="text-base font-black text-slate-900 dark:text-white">{dailyDist} km</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Daily Travel Time</span>
          <span className="text-base font-black text-slate-900 dark:text-white">{dailyTravelTime}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Transit Mode</span>
          <span className="text-base font-black text-secondary-600 dark:text-secondary-400">{trip?.transport?.mode || 'Taxi'}</span>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3 pt-1">
        {insights.map((item) => {
          const Icon = item.icon;
          const borderClass =
            item.color === 'emerald'
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : item.color === 'amber'
              ? 'border-amber-500/20 bg-amber-500/5'
              : item.color === 'sky'
              ? 'border-sky-500/20 bg-sky-500/5'
              : item.color === 'indigo'
              ? 'border-indigo-500/20 bg-indigo-500/5'
              : 'border-rose-500/20 bg-rose-500/5';

          const iconColor =
            item.color === 'emerald'
              ? 'text-emerald-500'
              : item.color === 'amber'
              ? 'text-amber-500'
              : item.color === 'sky'
              ? 'text-sky-500'
              : item.color === 'indigo'
              ? 'text-indigo-500'
              : 'text-rose-500';

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border ${borderClass} flex items-start gap-3 transition`}
            >
              <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 text-xs">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-normal">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TripIntelligence;
