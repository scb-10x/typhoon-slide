'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  width,
  height,
  ...rest
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  // Placeholder style for broken images
  const placeholderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    color: '#666',
    fontSize: '0.875rem',
    width: width || '100%',
    height: height || '12rem',
    borderRadius: '0.5rem',
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div
        style={placeholderStyle}
        className={className}
        role="img"
        aria-label={`Image placeholder: ${alt}`}
      >
        <div className="text-center p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Image not found</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      width={width}
      height={height}
      {...rest}
    />
  );
} 