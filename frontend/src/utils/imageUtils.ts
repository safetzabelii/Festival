'use client';

/**
 * Fixes image URLs to work with our proxy
 * @param url The original image URL
 * @returns The fixed image URL that will work in production
 */
export function getProxiedImageUrl(url?: string): string {
  if (!url) return '';
  
  // Already a fully qualified URL (not localhost)
  if (url.startsWith('http') && !url.includes('localhost')) {
    return url;
  }
  
  // Localhost URL that needs fixing
  if (url.includes('http://localhost:5000/')) {
    return url.replace('http://localhost:5000/', '/api/image-proxy/');
  }
  
  // Relative URL (e.g. /uploads/image.jpg)
  if (url.startsWith('/')) {
    return `/api/image-proxy${url}`;
  }
  
  // Path without leading slash
  return `/api/image-proxy/${url}`;
} 