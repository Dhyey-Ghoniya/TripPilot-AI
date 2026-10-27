import React from 'react';
import {
  Calendar,
  Users,
  Wallet,
  Plane,
  Share2,
  Clock,
  AlertCircle,
  Printer,
  Bookmark,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getG8TripDestinationPhoto } from '../../utils/g8TripDestinationPhotos';
import ActivityPhoto from '../common/ActivityPhoto';
import ScrapbookDoodles from '../common/ScrapbookDoodles';

const TripHeader = ({ trip, itinerary, onBookFlights, onShareTrip, onExportTrip, onSaveTrip }) => {
  if (!trip) return null;

  const originName = trip.origin?.name || trip.origin?.city || 'Ahmedabad';
  const destName = trip.destinations?.[0]?.name || trip.destination?.name || 'Destination';
  const destinationPhoto = getG8TripDestinationPhoto(destName);
  const scrapbookPhotos = [
    { activity: `${destName} coastline and beaches`, location: destName, caption: `${destName} coastline` },
    { activity: `${destName} historic landmarks and architecture`, location: destName, caption: `${destName} historic sites` },
    { activity: `${destName} local cuisine and food`, location: destName, caption: `${destName} local food` },
  ].slice(0, destinationPhoto ? 2 : 3);
  const duration = trip.dates?.durationDays || itinerary?.days?.length || 1;
  const travelersCount = trip.travelers?.count || 2;
  const totalBudget = trip.budget?.total || 50000;
  const currency = trip.budget?.currency === 'INR' ? '₹' : (trip.budget?.currency || '₹');

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const startDateFormatted = formatDate(trip.dates?.startDate);
  const endDateFormatted = formatDate(trip.dates?.endDate);
  const hasDates = Boolean(startDateFormatted && endDateFormatted);

  return (
    <Card className="relative overflow-hidden scrapbook-paper p-6 text-stone-900 space-y-5">
      <ScrapbookDoodles className="right-0 top-0 h-32 w-56 opacity-70" />
      {/* Top Row: Meta Badges & Quick Action Buttons */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-dashed border-[#bca987]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent" size="sm" className="font-bold">
            {trip.status?.toUpperCase() || 'PLANNING'}
          </Badge>
          <span className="scrapbook-stamp px-3 py-1 text-xs text-stone-800 font-typewriter">ID: {trip.shareSettings?.shareCode || trip._id?.slice(-6) || 'TPS-882'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSaveTrip && (
            <Button
              variant="outline"
              size="sm"
              icon={Bookmark}
              className="border-[#bca987] text-stone-700 hover:bg-[#f4ead9] hover:text-stone-900"
              onClick={onSaveTrip}
            >
              Save Itinerary
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            className="border-[#bca987] text-stone-700 hover:bg-[#f4ead9] hover:text-stone-900"
            onClick={onExportTrip || (() => window.print())}
          >
            Export / Print
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Share2}
            className="border-[#bca987] text-stone-700 hover:bg-[#f4ead9] hover:text-stone-900"
            onClick={onShareTrip || (() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Trip link copied to clipboard!');
            })}
          >
            Share
          </Button>

          {onBookFlights && (
            <Button
              variant="primary"
              size="sm"
              icon={Plane}
              className="bg-[#f2a7a0] hover:bg-[#e78b84] text-stone-900 font-bold"
              onClick={onBookFlights}
            >
              Flight Corridors
            </Button>
          )}
        </div>
      </div>

      {(scrapbookPhotos.length > 0 || destinationPhoto) && (
        <div className="relative z-10 flex min-h-40 items-center justify-center gap-3 py-3 sm:min-h-48 sm:justify-end sm:pr-8">
      {destinationPhoto && (
            <figure className="scrapbook-polaroid scrapbook-wiggle w-[30%] max-w-40 rotate-[-6deg]">
              <img src={destinationPhoto} alt={`${destName} destination`} className="h-24 w-full object-cover sm:h-32" loading="lazy" />
              <figcaption className="font-scrap-note mt-2 text-center text-base font-bold leading-tight text-stone-800">
                {destName} <a href="https://g8trip.com/" target="_blank" rel="noreferrer" className="text-xs underline">G8Trip</a>
              </figcaption>
            </figure>
          )}
          {scrapbookPhotos.map((activity, index) => (
            <figure key={activity.caption} className={`scrapbook-polaroid scrapbook-wiggle w-[30%] max-w-40 ${['rotate-[2deg]', 'rotate-[8deg]', '-rotate-[3deg]'][index]}`}>
              <ActivityPhoto
                activity={activity}
                destination={destName}
                activityKey={`scrapbook-${destName}-${activity.caption}`}
                className="h-24 w-full object-cover sm:h-32"
              />
              <figcaption className="font-scrap-note mt-2 line-clamp-2 text-center text-base font-bold leading-tight text-stone-800">
                {activity.caption}
              </figcaption>
            </figure>
          ))}
          <span className="scrapbook-stamp absolute bottom-0 left-2 rotate-[-5deg] px-2 py-1 text-[9px] font-semibold text-stone-800">TRIP NOTES · {destName.toUpperCase()}</span>
        </div>
      )}

      {/* Main Title & Route Row */}
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-center gap-2 text-[#954440] text-xs font-bold uppercase tracking-wider">
          <span>{originName}</span>
          <span className="text-stone-400">→</span>
          <span>{destName}</span>
        </div>

        <h1 className="relative z-10 text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
          {trip.title || `${duration}-Day Journey to ${destName}`}
        </h1>
      </div>

      {/* Structured Info Bar */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-dashed border-[#bca987] text-xs">
        {/* Dates */}
        <div className="space-y-1">
          <span className="text-stone-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#4b7d67]" />
            Travel Dates
          </span>
          {hasDates ? (
            <p className="font-bold text-stone-900 text-sm">
              {startDateFormatted} to {endDateFormatted}
            </p>
          ) : (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Dates to be confirmed
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <span className="text-stone-500 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#4b7d67]" />
            Total Duration
          </span>
          <p className="font-bold text-stone-900 text-sm">{duration} Days ({Math.max(1, duration - 1)} Nights)</p>
        </div>

        {/* Travelers */}
        <div className="space-y-1">
          <span className="text-stone-500 font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#4b7d67]" />
            Travelers
          </span>
          <p className="font-bold text-stone-900 text-sm">{travelersCount} Traveler(s)</p>
        </div>

        {/* Total Budget */}
        <div className="space-y-1">
          <span className="text-stone-500 font-medium flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-[#4b7d67]" />
            Estimated Budget
          </span>
          <p className="font-bold text-[#954440] text-sm">
            {currency}{totalBudget.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TripHeader;
