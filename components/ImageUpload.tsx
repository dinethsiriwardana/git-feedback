'use client';

import React, { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
  onImageSelected: (file: File | null) => void;
  selectedImage: File | null;
  onError: (msg: string) => void;
}

export function ImageUpload({ onImageSelected, selectedImage, onError }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    const MAX_RAW_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_RAW_SIZE) {
      onError('Image is too large! Maximum raw select limit is 5MB.');
      return;
    }

    setCompressing(true);
    setCompressionProgress(0);

    const options = {
      maxSizeMB: 1, // Compress client-side to max 1MB
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      onProgress: (progress: number) => {
        setCompressionProgress(progress);
      }
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
      // Safety: build preview object URL
      const objectUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(objectUrl);
      onImageSelected(compressedFile);
    } catch (err) {
      console.error(err);
      onError('Failed to compress image on client.');
    } finally {
      setCompressing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeSelectedImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        accept="image/*"
        className="hidden"
      />

      {!selectedImage && !compressing && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="border-2 border-dashed border-gray-700 hover:border-violet-500/50 hover:bg-violet-950/10 cursor-pointer rounded-xl p-6 transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 group"
        >
          <div className="p-3 rounded-full bg-gray-800 text-gray-400 group-hover:text-violet-400 group-hover:bg-violet-950/30 transition-all duration-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-300">Click to upload or drag & drop</p>
            <p className="text-xs text-gray-500 mt-1">Image files under 5MB (Will be compressed to &lt; 1MB)</p>
          </div>
        </div>
      )}

      {compressing && (
        <div className="border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-gray-900/30">
          <div className="w-8 h-8 rounded-full border-2 border-t-violet-500 border-gray-800 animate-spin" />
          <div className="text-center">
            <p className="text-sm text-gray-300 font-medium">Compressing Image...</p>
            <p className="text-xs text-gray-500 mt-0.5">{compressionProgress}%</p>
          </div>
        </div>
      )}

      {selectedImage && previewUrl && !compressing && (
        <div className="relative border border-gray-800 rounded-xl p-2 bg-gray-900/20 flex items-center gap-4 group">
          <img
            src={previewUrl}
            alt="Upload Preview"
            className="w-16 h-16 object-cover rounded-lg border border-gray-800"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{selectedImage.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Compressed: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={removeSelectedImage}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 border border-gray-700 hover:border-rose-500/20 transition-all duration-150 mr-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
