import React, { useState, useRef, useCallback } from 'react';

const ImageDropZone = ({
  images = [],
  onImagesChange = () => {},
  maxImages = 6,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed (JPG, PNG, WebP)';
    }
    if (file.size > maxFileSize) {
      const maxMB = Math.round(maxFileSize / (1024 * 1024));
      return `File size must be less than ${maxMB}MB`;
    }
    return null;
  }, [maxFileSize]);

  const processFiles = useCallback(async (files) => {
    setError(null);
    const newImages = [];

    for (const file of Array.from(files)) {
      if (images.length + newImages.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        break;
      }

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        newImages.push(dataUrl);
      } catch (err) {
        setError('Failed to read file');
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  }, [images, maxImages, validateFile, onImagesChange]);

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setError(null);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={`w-full ${className}`}>
      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed p-6
            transition-all duration-200 ease-in-out
            ${isDragging
              ? 'border-[#00D2FF] bg-[#00D2FF]/10 scale-[1.02]'
              : 'border-gray-600 hover:border-gray-500 hover:bg-white/5'
            }
            ${!canAddMore ? 'hidden' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              ${isDragging ? 'bg-[#00D2FF]/20' : 'bg-white/10'}
            `}>
              <svg
                className={`w-6 h-6 ${isDragging ? 'text-[#00D2FF]' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div>
              <p className={`text-sm font-medium ${isDragging ? 'text-[#00D2FF]' : 'text-gray-300'}`}>
                {isDragging ? 'Drop images here' : 'Drop images here or click to browse'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, WebP · Max 5MB each · Up to {maxImages} images
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group w-20 h-20 rounded-lg overflow-hidden border border-white/10"
            >
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                className="
                  absolute top-1 right-1 w-5 h-5 rounded-full
                  bg-black/60 hover:bg-red-500
                  flex items-center justify-center
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                "
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                <p className="text-[10px] text-white text-center truncate">
                  {index + 1}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          {images.length} of {maxImages} images selected
        </p>
      )}
    </div>
  );
};

export default ImageDropZone;