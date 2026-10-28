import React, { useState } from 'react';

const DestinationPhoto = ({ destination, src }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="flex h-full w-full items-center justify-center bg-[#e3dac8] text-xs text-stone-600">Photo unavailable</div>;
  }

  return (
    <img
      src={src}
      alt={`${destination} travel destination`}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export default DestinationPhoto;
