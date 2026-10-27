import React from 'react';
import { Compass, Map, MessageCircle, Wallet } from 'lucide-react';
import TripPilotChat from '../../components/chat/TripPilotChat';

const PlanTrip = () => (
  <div className="min-h-screen bg-[#fffaf4] py-10 pb-20 dark:bg-slate-950 sm:py-14">
    <div className="page-shell space-y-10">
      <div className="max-w-3xl space-y-4"><div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#bd5734] dark:text-orange-300"><span className="h-px w-8 bg-[#ef8354]" />Your trip starts here</div><h1 className="font-display text-4xl font-bold leading-tight tracking-[-0.04em] text-slate-950 dark:text-white sm:text-6xl">Tell us the kind of trip you want to take.</h1><p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">Start with a sentence. TripPilot will ask for only the details needed to shape a useful route, then keep the conversation connected to the saved trip.</p></div>
      <TripPilotChat title="TripPilot travel desk" className="max-w-5xl rounded-2xl border-[#eadfd3] bg-white p-5 shadow-xl sm:p-7" />
      <div className="grid gap-4 md:grid-cols-3">{[
        { icon: MessageCircle, title: 'Plan in plain language', text: 'Say where you want to go, what you care about, and what needs to stay within budget.' },
        { icon: Map, title: 'Review the route visually', text: 'Move from the conversation to the saved itinerary, map, stays, transport, and day details.' },
        { icon: Wallet, title: 'Keep refining', text: 'Ask to make the trip cheaper, add a city, change a hotel, or slow down a day.' },
      ].map(({ icon: Icon, title, text }) => <div key={title} className="border-t border-[#eadfd3] pt-5"><Icon className="h-5 w-5 text-[#bd5734]" /><h2 className="mt-3 font-display text-xl font-bold text-slate-950 dark:text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p></div>)}</div>
    </div>
  </div>
);

export default PlanTrip;
