import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  MapPin,
  Calendar,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Building2,
  Plane,
  Utensils,
  Car,
  Compass,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/common/Card';
import TripPilotChat from '../../components/chat/TripPilotChat';

const Home = () => {
  return (
    <div className="space-y-16 pb-20">
      {/* HERO SECTION: CONVERSATION-FIRST LANDING EXPERIENCE */}
      <section className="relative pt-8 pb-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 via-primary-950 to-slate-950 text-white rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#06b6d4_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-36 -left-36 w-96 h-96 bg-secondary-500/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 -right-36 w-96 h-96 bg-primary-600/25 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8 text-center">
          {/* Header Branding & Welcome */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-500/15 border border-secondary-400/30 text-secondary-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Your Next Adventure Starts Here · TripPilot AI</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white">
              Where will your next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-teal-300 to-amber-300">
                adventure take you?
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              Tell your AI travel copilot where you want to go. We research worldwide destinations, pair flight corridors, match neighborhood stays, and optimize your trip budget in seconds.
            </p>
          </div>

          {/* MAIN CONVERSATIONAL CHAT WORKSPACE */}
          <TripPilotChat
            title="Interactive Travel Copilot Workspace"
            className="shadow-2xl border-slate-200/80 dark:border-slate-800 text-left"
          />
        </div>
      </section>

      {/* FEATURED DESTINATIONS GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="secondary" size="md">Global Destinations</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Explore Worldwide Adventures
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Click any destination to launch instant AI itinerary synthesis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Tokyo, Japan',
              image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
              budget: '7 Days from ₹80,000',
              prompt: 'Plan a 7-day trip to Tokyo, Japan from Ahmedabad for 2 people with budget ₹80,000',
            },
            {
              title: 'Reykjavik, Iceland',
              image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=800&q=80',
              budget: '5 Days from ₹1,20,000',
              prompt: 'Plan a 5-day trip to Reykjavik, Iceland to see the Northern Lights',
            },
            {
              title: 'Goa, India',
              image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
              budget: '4 Days Road Trip from ₹35,000',
              prompt: 'Plan a road trip from Mumbai to Goa for 4 days with coastal stops',
            },
            {
              title: 'Delhi, India',
              image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
              budget: '5 Days Heritage & Street Food from ₹25,000',
              prompt: 'Plan a 5-day heritage and food trip to Delhi from Ahmedabad',
            },
          ].map((item, idx) => (
            <Card
              key={idx}
              className="overflow-hidden group hover:shadow-2xl transition duration-300 border border-slate-200/80 dark:border-slate-800"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-base">{item.title}</h3>
                  <span className="text-[11px] text-slate-300 font-medium">{item.budget}</span>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
                <Link to={`/plan-trip?prompt=${encodeURIComponent(item.prompt)}`}>
                  <Button variant="outline" size="sm" icon={Sparkles} className="text-xs">
                    Plan This Trip
                  </Button>
                </Link>
                <Compass className="w-4 h-4 text-slate-400 group-hover:text-secondary-500 transition" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* THREE INTELLIGENT PILLARS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="secondary" size="md">Intelligent Architecture</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Everything Belongs to the Same Trip Context
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            TripPilot AI unifies conversation, daily pacing, flight corridors, stays, and budget optimization into a single persistent trip object.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 hover:border-secondary-500/60 transition border border-slate-200/80 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">1. Conversational Agent</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Researches destinations dynamically. Takes natural instructions like "Make Day 3 cheaper" or "Add a beach day".
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-secondary-500/60 transition border border-slate-200/80 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">2. Spatial Itinerary Timeline</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clusters nearby attraction corridors to eliminate unnecessary daily travel backtracking across cities.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-secondary-500/60 transition border border-slate-200/80 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">3. Budget & Provider Handoff</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Provides real live provider handoffs for flights and hotels without losing your active itinerary context.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
