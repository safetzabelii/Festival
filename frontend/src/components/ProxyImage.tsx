'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type ProxyImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
};

export default function ProxyImage({ src, alt, width = 300, height = 200, className = '' }: ProxyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  
  useEffect(() => {
    // If the image URL is a localhost URL, proxy it
    if (src.includes('http://localhost:5000/')) {
      // Handle non-API image paths
      if (!src.includes('/api/')) {
        const newSrc = src.replace('http://localhost:5000/', '/api/image-proxy/');
        setImageSrc(newSrc);
      }
    } else {
      // Use the original source
      setImageSrc(src);
    }
  }, [src]);
  
  if (!imageSrc) {
    return <div className={`bg-gray-300 animate-pulse ${className}`} style={{ width, height }} />;
  }
  
  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      width={width} 
      height={height} 
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
} 