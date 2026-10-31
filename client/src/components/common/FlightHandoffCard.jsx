import React from 'react';
import { CalendarDays, ExternalLink, Plane, Users } from 'lucide-react';
import Card from './Card';

const displayDate = (value) => {
  if (!value) return 'Not set';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const cabinLabel = (value) => String(value || 'economy').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function FlightHandoffCard({ searchParams = {}, handoffLinks = [], className = '' }) {
  const origin = searchParams.origin || searchParams.originAirport || 'Not set';
  const destination = searchParams.destination || searchParams.destinationAirport || 'Not set';
  const travelers = searchParams.travelersCount || searchParams.passengers?.adults || 1;

  return (
    <Card className={`space-y-5 border border-slate-200 p-5 dark:border-slate-700 ${className}`}>
      <div>
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Plane className="h-5 w-5 text-secondary-600 dark:text-secondary-400" aria-hidden="true" />
          <h3 className="text-lg font-bold">Compare flight prices on provider sites</h3>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          TripPilot does not show live fares. Open a site to see real prices and availability.
        </p>
      </div>

      <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800/70 sm:grid-cols-2">
        <div><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Route</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{origin} to {destination}</dd></div>
        <div><dt className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Dates</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">Depart {displayDate(searchParams.departureDate)}{searchParams.returnDate ? ` · Return ${displayDate(searchParams.returnDate)}` : ' · One way'}</dd></div>
        <div><dt className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400"><Users className="h-3.5 w-3.5" aria-hidden="true" /> Travelers</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{travelers} {Number(travelers) === 1 ? 'traveler' : 'travelers'}</dd></div>
        <div><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cabin</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{cabinLabel(searchParams.cabinClass)}</dd></div>
      </dl>

      {handoffLinks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {handoffLinks.map((provider) => (
            <a key={provider.providerName} href={provider.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:border-secondary-500 hover:text-secondary-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-secondary-300">
              {provider.providerName}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="ml-1 border-l border-current/20 pl-2 text-[11px] font-medium">{provider.prefilled ? 'Prefilled search' : 'Opens site'}</span>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Search links are not available yet.</p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">Each button is labeled by provider. {handoffLinks.some((provider) => provider.prefilled) ? 'Prefilled links include your search details.' : 'These links open the provider site. Enter your route, dates, travelers, and cabin there.'}</p>
    </Card>
  );
}
