import React, { useEffect, useState } from 'react';
import { ExternalLink, Ticket } from 'lucide-react';
import Card from '../common/Card';
import affiliateLinksService from '../../services/affiliateLinksService';

const partnerSearches = [
  { name: 'GetYourGuide', provider: 'getyourguide' },
  { name: 'Klook', provider: 'klook' },
];

const ToursAndTickets = ({ destination }) => {
  const place = String(destination || '').trim();
  const [linkData, setLinkData] = useState({ links: [], affiliateDisclosure: false });

  useEffect(() => {
    if (!place) return;
    let active = true;
    affiliateLinksService.getTourLinks(place)
      .then((response) => {
        if (active) setLinkData(response?.data || { links: [], affiliateDisclosure: false });
      })
      .catch(() => {
        if (active) setLinkData({
          links: partnerSearches.map((partner) => ({ providerName: partner.name, url: affiliateLinksService.getTourRedirectUrl(partner.provider, place) })),
          affiliateDisclosure: false,
        });
      });
    return () => { active = false; };
  }, [place]);

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
        {(linkData.links.length ? linkData.links : partnerSearches.map((partner) => ({ providerName: partner.name, url: affiliateLinksService.getTourRedirectUrl(partner.provider, place) }))).map((partner) => (
          <a
            key={partner.providerName}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-secondary-500 hover:text-secondary-700 dark:border-slate-700 dark:text-slate-100 dark:hover:text-secondary-300"
          >
            Search {partner.providerName}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ))}
      </div>
      {linkData.affiliateDisclosure && <p className="text-xs text-slate-500 dark:text-slate-400">Some links may earn TripPilot a commission at no extra cost to you.</p>}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        These links open the partner site. Prices and availability are shown there, not here.
      </p>
    </Card>
  );
};

export default ToursAndTickets;
