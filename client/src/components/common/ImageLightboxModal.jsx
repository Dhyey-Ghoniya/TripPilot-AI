import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageLightboxModal = ({ isOpen, onClose, images = [], currentIndex = 0, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Top Close Bar */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4 text-white">
        <span className="text-xs font-semibold">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Prev Button */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 z-50 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Main Enlarged Image */}
      <div className="relative z-40 max-w-5xl max-h-[85vh] p-2">
        <img
          src={images[currentIndex]}
          alt={`Destination image ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl mx-auto"
        />
      </div>

      {/* Next Button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 z-50 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ImageLightboxModal;
