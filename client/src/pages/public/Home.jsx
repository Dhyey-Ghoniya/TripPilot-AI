import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Hotel,
  Map,
  MapPin,
  Plane,
  Route,
  Wallet,
} from 'lucide-react';
import TripPilotChat from '../../components/chat/TripPilotChat';
import { getG8TripDestinationPhoto } from '../../utils/g8TripDestinationPhotos';
import ScrapbookDoodles from '../../components/common/ScrapbookDoodles';

const FEATURED_PHOTOS = ['Japan', 'Rome', 'Phuket'];

const DESTINATIONS = [
  {
    name: 'Japan',
    detail: 'City neighbourhoods and rail journeys',
    tone: 'bg-[#e7e9df]',
    accent: 'text-[#315d4e]',
    art: 'japan',
  },
  {
    name: 'Ladakh',
    detail: 'High roads and mountain villages',
    tone: 'bg-[#e9e2d5]',
    accent: 'text-[#865b37]',
    art: 'ladakh',
  },
  {
    name: 'Amalfi Coast',
    detail: 'Coastal towns and ferry routes',
    tone: 'bg-[#dce9e5]',
    accent: 'text-[#28756f]',
    art: 'coast',
  },
  {
    name: 'Bali',
    detail: 'Temples, rice terraces and beaches',
    tone: 'bg-[#e6eadb]',
    accent: 'text-[#4e6949]',
    art: 'bali',
  },
];

const START_LINKS = [
  { label: 'Search flights', detail: 'Compare routes and dates', icon: Plane, to: '/flights' },
  { label: 'Find a stay', detail: 'Search by dates and guests', icon: Hotel, to: '/hotels' },
  { label: 'Explore places', detail: 'Browse destinations and ideas', icon: MapPin, to: '/explore' },
];

const DESTINATION_ART = {
  japan: (
    <>
      <circle cx="230" cy="54" r="25" fill="#d77c5d" opacity=".88" />
      <path d="M0 180 55 116l41 43 50-72 61 93Z" fill="#87957b" />
      <path d="M0 193 82 145l43 29 48-45 67 64Z" fill="#506d60" />
      <path d="M0 197h240" stroke="#f4f2e8" strokeWidth="2" opacity=".8" />
      <path d="M34 200v-36m-8 8 8-10 8 10m-8 9-7-7m7 14 8-9" stroke="#f4f2e8" strokeWidth="2" fill="none" />
    </>
  ),
  ladakh: (
    <>
      <circle cx="196" cy="45" r="20" fill="#dda36e" opacity=".9" />
      <path d="m0 193 62-100 26 36 34-61 71 125Z" fill="#8d7965" />
      <path d="m60 193 60-91 20 27 32-54 68 118Z" fill="#5e6459" />
      <path d="m111 119 9-17 9 16m40-28 11-18 10 18" fill="none" stroke="#f5f1e7" strokeWidth="3" />
      <path d="M0 194c48-21 77-9 113 2 43 14 79-13 127-4" fill="none" stroke="#d1b28c" strokeWidth="5" />
    </>
  ),
  coast: (
    <>
      <path d="M0 138c43-12 57-44 92-37 29 6 44 39 75 32 29-7 37-35 73-32v99H0Z" fill="#748b70" />
      <path d="M0 175c35-16 55-6 79 6 28 14 47 1 68-7 28-12 55-3 93 13v18H0Z" fill="#c7a57c" />
      <path d="M0 199c40-8 68-8 108-2 44 6 79-6 132-2v25H0Z" fill="#77a8a2" />
      <path d="M0 209c38-5 64-3 97 1m43 1c30-5 61-4 94 0" stroke="#edf4ef" strokeWidth="2" fill="none" opacity=".8" />
      <path d="m148 124 18-29 18 29m-22-2h8v20h-8Z" fill="#e8dfcb" />
    </>
  ),
  bali: (
    <>
      <circle cx="55" cy="47" r="21" fill="#d5a26d" opacity=".9" />
      <path d="M0 150c47-28 82-32 121-4 39-31 76-29 119-8v85H0Z" fill="#8b9870" />
      <path d="M0 174c41-19 77-12 112 4 35-19 77-21 128 0v45H0Z" fill="#587960" />
      <path d="M0 190c39-16 74-12 106 2 40-17 82-17 134 0" stroke="#d5d4a8" strokeWidth="3" fill="none" />
      <path d="M110 147v-30l14-18 14 18v30m-22-4v-15h16v15" fill="#e8dfcb" />
    </>
  ),
};

const DestinationArtwork = ({ art }) => (
  <svg viewBox="0 0 240 220" className="h-full w-full" role="img" aria-label="Decorative landscape illustration">
    <rect width="240" height="220" fill="currentColor" opacity=".06" />
    {DESTINATION_ART[art]}
  </svg>
);

const Home = () => (
  <div className="overflow-hidden bg-[#E9DCC4] text-stone-900 dark:bg-stone-950 dark:text-white">
    <section className="relative border-b border-[#bca987] bg-[#e9dcc4] dark:border-stone-700 dark:bg-stone-900">
      <div className="page-shell relative grid gap-10 py-10 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-14 lg:py-16">
        <div className="scrapbook-torn relative z-10 max-w-xl px-6 py-7 shadow-[3px_4px_0_rgba(92,69,43,.2)]">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-secondary-800 dark:text-secondary-300">
            <Compass className="h-4 w-4" /> Plan with TripPilot
          </p>
          <h1 className="home-hero-title mt-5 max-w-xl text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-stone-950 dark:text-white sm:text-6xl lg:text-[4.15rem]">
            Plan your next trip from one clear brief.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-stone-700 dark:text-stone-300 sm:text-lg">
            Share your destination, dates, travel style, and budget. TripPilot turns the details into a day-by-day plan you can edit.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 border-y border-dashed border-[#bca987] py-4 dark:border-stone-700">
            {[
              { icon: Route, label: 'Routes' },
              { icon: Map, label: 'Daily plans' },
              { icon: Wallet, label: 'Budgets' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-200">
                <Icon className="h-4 w-4 text-accent-700 dark:text-accent-300" /> {label}
              </div>
            ))}
          </div>
          <Link to="/explore" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-secondary-800 transition-colors hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-secondary-200">
            Browse places to start with <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative z-10">
          <div className="relative mb-4 flex items-center justify-center gap-3 py-3 sm:justify-end sm:pr-10">
            <ScrapbookDoodles className="right-0 top-0 h-full w-52 opacity-60" />
            {FEATURED_PHOTOS.map((destination, index) => (
              <figure key={destination} className={`scrapbook-polaroid scrapbook-wiggle relative z-10 w-[29%] max-w-36 ${['-rotate-6', 'rotate-2', 'rotate-[8deg]'][index]}`}>
                <img src={getG8TripDestinationPhoto(destination)} alt={`${destination} travel photo`} className="h-20 w-full object-cover sm:h-24" loading="lazy" />
                <figcaption className="font-scrap-note mt-1 text-center text-base font-bold text-stone-800">{destination}</figcaption>
              </figure>
            ))}
          </div>
          <TripPilotChat
            variant="landing"
            title="Start planning"
            className="scrapbook-paper max-w-none p-4 shadow-[3px_4px_0_rgba(92,69,43,.2)] sm:p-6 dark:border-stone-700 dark:bg-stone-950"
          />
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {START_LINKS.map(({ label, detail, icon: Icon, to }) => (
              <Link key={label} to={to} className="group border border-[#e4e2da] bg-white px-3 py-3 transition-colors duration-200 hover:border-teal-700/40 hover:bg-[#f4f7f3] dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:px-4">
                <Icon className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                <span className="mt-2 block text-xs font-bold text-slate-900 dark:text-white sm:text-sm">{label}</span>
                <span className="mt-1 hidden text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:block">{detail}</span>
                <ArrowUpRight className="mt-2 h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="page-shell py-14 sm:py-20">
      <div className="flex flex-col justify-between gap-5 border-b border-dashed border-[#bca987] pb-6 dark:border-stone-800 sm:flex-row sm:items-end">
        <div>
          <p className="font-scrap-note text-xl font-bold text-secondary-800 dark:text-secondary-300">A starting point</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-[-0.04em] text-stone-950 dark:text-white sm:text-4xl">Choose a place. Build the days around it.</h2>
        </div>
        <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-bold text-secondary-800 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-secondary-200">Explore all destinations <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DESTINATIONS.map((destination, index) => (
          <Link key={destination.name} to={`/explore?destination=${encodeURIComponent(destination.name)}`} className="scrapbook-paper scrapbook-wiggle group overflow-hidden transition-transform duration-200 dark:bg-stone-900">
            <div className={`relative h-40 overflow-hidden ${destination.tone}`}>
              <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-white/70 bg-white/60 ${destination.accent}`}><MapPin className="h-4 w-4" /></div>
              <div className={`absolute inset-0 ${destination.accent}`}><DestinationArtwork art={destination.art} /></div>
              <span className="absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-800/70">Destination idea {String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div><h3 className="font-serif text-xl font-bold text-slate-950 dark:text-white">{destination.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{destination.detail}</p></div>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-teal-700 dark:group-hover:text-teal-300" />
            </div>
          </Link>
        ))}
      </div>
    </section>

    <section className="border-y border-[#e5e3da] bg-[#eeeee7] dark:border-slate-800 dark:bg-slate-900/70">
      <div className="page-shell grid gap-8 py-14 sm:py-16 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-teal-800 dark:text-teal-300">Keep the trip together</p>
          <h2 className="mt-3 max-w-md font-serif text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">From the first idea to the saved itinerary.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Refine the route as you go, then keep maps, day plans, stays, and estimated costs in the same trip workspace.</p>
          <Link to="/plan-trip" className="mt-6 inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-700 dark:hover:bg-teal-600">Open the trip planner <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-px border border-[#dcddd5] bg-[#dcddd5] dark:border-slate-700 dark:bg-slate-700 sm:grid-cols-3">
          {[
            { icon: Route, title: 'Shape the route', text: 'Arrange stops with distance and daily pacing in view.' },
            { icon: Map, title: 'Review each day', text: 'Keep places and travel details beside the itinerary.' },
            { icon: Wallet, title: 'Track estimated spend', text: 'See budget estimates as the plan changes.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="min-h-44 bg-[#f8f7f2] p-5 dark:bg-slate-900">
              <Icon className="h-5 w-5 text-teal-700 dark:text-teal-300" />
              <h3 className="mt-7 text-base font-bold text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Home;
