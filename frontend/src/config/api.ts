// Backend URL configuration

// Production backend URL
export const BACKEND_URL = 'https://festivalsphere-backend.onrender.com';

// Development backend URL
export const DEV_BACKEND_URL = 'http://localhost:5000';

// Helper function to get API URL - use proxy in production, localhost in development
export const getApiUrl = (path: string) => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Use the proxy in production
    if (process.env.NODE_ENV === 'production') {
      return `/api/proxy/${path}`;
    }
  }
  // Fallback to direct URL (for development)
  return `${DEV_BACKEND_URL}/api/${path}`;
};

// Helper function to get image URL
export const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // In production, use the image proxy
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return `/api/image-proxy/${url}`;
  }
  
  // In development, use direct URL
  return `${DEV_BACKEND_URL}/${url}`;
}; 