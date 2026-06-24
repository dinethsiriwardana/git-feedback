'use client';

import React from 'react';

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-all duration-150"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div 
        className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={src} 
          alt="Full Screen View" 
          className="max-w-full max-h-[85vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
}
