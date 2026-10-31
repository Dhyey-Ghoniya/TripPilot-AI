import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, ExternalLink, MapPin, Search } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import hotelService from '../../services/hotelService';

const Hotels = () => {
  const [destination, setDestination] = useState('Dubai');
  const [propertyType, setPropertyType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [affiliateDisclosure, setAffiliateDisclosure] = useState(false);

  const handleSearch = async () => {
    if (!destination.trim()) return;
    setLoading(true);
    setSearchError('');
    try {
      const response = await hotelService.searchHotels({
        destination: destination.trim(),
        accommodationType: propertyType === 'all' ? null : propertyType,
      });
      setHotels(response?.data?.results || []);
      setAffiliateDisclosure(Boolean(response?.data?.affiliateDisclosure));
    } catch (error) {
      console.error('Hotel directory search error:', error);
      setHotels([]);
      setAffiliateDisclosure(false);
      setSearchError(error.response?.data?.message || 'Could not load hotel listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="page-shell space-y-8 pb-16 pt-8">
      <section className="scrapbook-paper rounded-xl px-4 py-10 text-stone-900 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-700">Hotels and stays</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-5xl">Find places to stay</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-stone-700 sm:text-base">
            Browse real hotel names and mapped locations from OpenStreetMap. Matching, licensed photos are shown when available. Rates and room availability need a booking provider.
          </p>

          <div className="mx-auto mt-6 grid max-w-4xl gap-4 rounded-xl border border-[#bca987] bg-[#fffaf1] p-5 text-left text-stone-900 shadow-card sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-7">
            <Input
              label="Destination"
              placeholder="e.g. Dubai, Goa, Paris"
              icon={MapPin}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            />
            <Select
              label="Property type"
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value)}
              options={[
                { value: 'all', label: 'All stay types' },
                { value: 'hotel', label: 'Hotels' },
                { value: 'guest_house', label: 'Guest houses' },
                { value: 'hostel', label: 'Hostels' },
                { value: 'motel', label: 'Motels' },
                { value: 'apartment', label: 'Apartments' },
              ]}
            />
            <Button variant="primary" size="md" icon={Search} isLoading={loading} onClick={handleSearch}>
              Find stays
            </Button>
          </div>
          <p className="text-xs text-stone-600">OpenStreetMap is a community directory, not a hotel availability service.</p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Places to stay in {destination || 'your destination'}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Listings are attributed to <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Photos link to their source and license.
          </p>
          {affiliateDisclosure && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Some links may earn TripPilot a commission at no extra cost to you.</p>}
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary-600 border-t-transparent" />
            Searching current map listings and matching licensed photos...
          </div>
        ) : searchError ? (
          <Card className="p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-amber-500" />
            <h3 className="mt-3 font-bold text-slate-900 dark:text-white">Stay search unavailable</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{searchError}</p>
          </Card>
        ) : hotels.length === 0 ? (
          <Card className="p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 font-bold text-slate-900 dark:text-white">No named hotels found nearby</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">OpenStreetMap coverage varies by area. Try a nearby city or a broader destination name.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {hotels.map((hotel) => (
              <Card key={hotel.hotelId} className="overflow-hidden border border-slate-200/80 transition-shadow hover:shadow-xl dark:border-slate-800">
                <div className="relative h-56 bg-[#efe7dc] dark:bg-slate-800">
                  {hotel.coverImage ? (
                    <img src={hotel.coverImage} alt={`${hotel.name}, ${hotel.address}`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <Building2 className="h-8 w-8" aria-hidden="true" />
                      <span className="mt-2 text-xs font-medium">No verified photo available</span>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-md bg-slate-950/85 px-3 py-1 text-xs font-semibold text-white">OpenStreetMap listing</span>
                  {hotel.photo && (
                    <a href={hotel.photo.sourceUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 max-w-[90%] truncate rounded bg-slate-950/85 px-2 py-1 text-[10px] text-white underline">
                      Photo: {hotel.photo.attribution || hotel.photo.title} · {hotel.photo.licenseName}
                    </a>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">{hotel.name}</h3>
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary-600" />
                      {hotel.address || destination}
                    </p>
                    <p className="mt-2 text-xs capitalize text-slate-500 dark:text-slate-400">{hotel.accommodationType?.replace(/_/g, ' ')}{hotel.neighborhood ? ` · ${hotel.neighborhood}` : ''}</p>
                    {hotel.sourceUpdatedAt && <p className="mt-1 text-[10px] text-slate-400">Map data snapshot: {new Date(hotel.sourceUpdatedAt).toLocaleString()}</p>}
                  </div>

                  <p className="border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    Average nightly price is not available from this directory. Provider search can show current rates, which may vary by date.
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {hotel.bookingUrl && (
                      <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
                        <ExternalLink className="h-3.5 w-3.5" /> Compare current rates
                      </a>
                    )}
                    {hotel.mapUrl && (
                      <a href={hotel.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800">
                        <ExternalLink className="h-3.5 w-3.5" /> View mapped location
                      </a>
                    )}
                    <Link to={`/plan-trip?stay=${encodeURIComponent(hotel.name)}`}>
                      <Button variant="primary" size="sm" icon={ArrowRight}>Add to trip</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Hotels;
