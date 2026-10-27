import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

const Footer = () => (
  <footer className="border-t border-[#bca987] bg-[#f4ead9] text-stone-700">
    <div className="page-shell py-12 sm:py-14">
      <div className="grid gap-10 border-b border-dashed border-[#bca987] pb-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <BrandLogo size="md" />
          <p className="mt-4 text-sm leading-6 text-stone-600">
            Plan day-by-day itineraries, compare travel options, and keep trip details together in one workspace.
          </p>
          <Link to="/plan-trip" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#954440] transition-colors hover:text-stone-900">
            Start planning <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div>
          <h2 className="font-scrap-note text-2xl font-bold text-stone-900">Plan</h2>
          <ul className="mt-4 space-y-3 text-sm text-stone-600">
            <li><Link to="/plan-trip" className="transition-colors hover:text-secondary-800">Plan a trip</Link></li>
            <li><Link to="/my-trips" className="transition-colors hover:text-secondary-800">My trips</Link></li>
            <li><Link to="/flights" className="transition-colors hover:text-secondary-800">Flights</Link></li>
            <li><Link to="/hotels" className="transition-colors hover:text-secondary-800">Stays</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-scrap-note text-2xl font-bold text-stone-900">Discover</h2>
          <ul className="mt-4 space-y-3 text-sm text-stone-600">
            <li><Link to="/explore" className="transition-colors hover:text-secondary-800">Destinations</Link></li>
            <li><Link to="/explore/attractions" className="transition-colors hover:text-secondary-800">Attractions</Link></li>
            <li><Link to="/about" className="transition-colors hover:text-secondary-800">About TripPilot</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-secondary-800">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-scrap-note text-2xl font-bold text-stone-900">Policies</h2>
          <ul className="mt-4 space-y-3 text-sm text-stone-600">
            <li><Link to="/privacy" className="transition-colors hover:text-secondary-800">Privacy policy</Link></li>
            <li><Link to="/terms" className="transition-colors hover:text-secondary-800">Terms of service</Link></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-6 text-xs text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} TripPilot. All rights reserved.</p>
        <p>Plan with the details that matter to you.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
