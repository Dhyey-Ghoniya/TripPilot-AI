import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import activityPhotoService from '../../services/activityPhotoService';

const ActivityPhoto = ({ activity, destination, tripId = '', activityKey = '', className = '' }) => {
  const [photo, setPhoto] = useState(null);
  const title = activity?.activity || activity?.title || 'Activity';
  const location = activity?.location || '';

  useEffect(() => {
    let active = true;
    setPhoto(null);

    activityPhotoService.findPhoto({ activity: title, location, destination, tripId, activityKey })
      .then((result) => {
        if (active) setPhoto(result);
      })
      .catch((error) => {
        console.warn('[ActivityPhoto] Could not load a sourced photo:', error.message);
        if (active) setPhoto(null);
      });

    return () => {
      active = false;
    };
  }, [title, location, destination, tripId, activityKey]);

  if (!photo?.url) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 ${className}`} aria-label="No verified photo available">
        <ImageIcon className="h-5 w-5" aria-hidden="true" />
        <span className="mt-1 text-center text-[8px] leading-3">No verified photo</span>
      </div>
    );
  }

  return (
    <div className="shrink-0">
      <img src={photo.url} alt={title} className={className} loading="lazy" />
      <p className="mt-1 max-w-36 break-words text-[9px] leading-3 text-slate-500 dark:text-slate-400">
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-slate-400/50">
          {photo.matchType === 'reference' ? 'Reference photo' : 'Photo'}: {photo.title}
        </a>
        {photo.attribution && <span> by {photo.attribution}</span>}
        {photo.licenseName && (
          <>
            {' · '}
            {photo.licenseUrl ? (
              <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline decoration-slate-400/50">
                {photo.licenseName}
              </a>
            ) : photo.licenseName}
          </>
        )}
      </p>
    </div>
  );
};

export default ActivityPhoto;
