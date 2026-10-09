import React from 'react';
import { Sparkles, Compass, ShieldCheck } from 'lucide-react';
import TripPilotChat from '../../components/chat/TripPilotChat';
import Card from '../../components/common/Card';

const PlanTrip = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/20 text-secondary-600 dark:text-secondary-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Conversational AI Travel Engineering</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          AI Trip Command Center
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Describe your travel plans naturally. TripPilot AI calculates optimal pacing, flight corridors, neighborhood stays, and budget distribution in real time.
        </p>
      </div>

      {/* Primary Chatbot Workspace */}
      <TripPilotChat
        title="Primary AI Trip Planner & Copilot"
        className="shadow-2xl border-slate-200/80 dark:border-slate-800"
      />

      {/* Architecture Information Banner */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white space-y-3 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-secondary-400" />
            <h3 className="font-bold text-sm text-white">Unified Trip Engine Guarantee</h3>
          </div>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Direct Single Source of Truth
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-light">
          Every prompt you send instantly synthesizes a complete trip blueprint in MongoDB. You can ask follow-up questions to adjust dates, replace hotel choices, optimize budget, or add destinations dynamically.
        </p>
      </Card>
    </div>
  );
};

export default PlanTrip;
