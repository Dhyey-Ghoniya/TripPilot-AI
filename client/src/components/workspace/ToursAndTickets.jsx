import React from 'react';
import { ExternalLink, Ticket } from 'lucide-react';
import Card from '../common/Card';

const partnerSearches = [
  {
    name: 'GetYourGuide',
    href: (destination) => `https://www.getyourguide.com/s/?q=${encodeURIComponent(destination)}`,
  },
  {
    name: 'Klook',
    href: (destination) => `https://www.klook.com/search/result/?query=${encodeURIComponent(destination)}`,
  },
];

const ToursAndTickets = ({ destination }) => {
  const place = String(destination || '').trim();
  if (!place) return null;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-secondary-600" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tours and tickets</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Browse activities and attraction tickets in {place} on a booking partner.
      </p>
      <div className="flex flex-wrap gap-3">
        {partnerSearches.map((partner) => (
          <a
            key={partner.name}
            href={partner.href(place)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-secondary-500 hover:text-secondary-700 dark:border-slate-700 dark:text-slate-100 dark:hover:text-secondary-300"
          >
            Search {partner.name}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        These links open the partner site. Prices and availability are shown there, not here.
      </p>
    </Card>
  );
};

export default ToursAndTickets;
