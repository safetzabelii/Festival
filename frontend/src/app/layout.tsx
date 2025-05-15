'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';
import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

// Function to fix image URLs in the DOM
const fixImagesInDOM = () => {
  if (typeof window === 'undefined') return;
  
  console.log('Fixing image URLs in DOM...');
  
  // Fix regular img tags
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.includes('http://localhost:5000/')) {
      // Handle non-API image paths
      if (!src.includes('/api/')) {
        const newSrc = src.replace('http://localhost:5000/', '/api/image-proxy/');
        console.log(`Fixing image src from ${src} to ${newSrc}`);
        img.setAttribute('src', newSrc);
      }
    }
  });
  
  // Fix background images in inline styles
  const elementsWithBgStyle = document.querySelectorAll('[style*="background"]');
  elementsWithBgStyle.forEach(el => {
    const style = el.getAttribute('style');
    if (style && style.includes('http://localhost:5000/')) {
      const newStyle = style.replace(/http:\/\/localhost:5000\//g, '/api/image-proxy/');
      console.log(`Fixing background style from ${style} to ${newStyle}`);
      el.setAttribute('style', newStyle);
    }
  });
};

// Function to redirect API calls through our proxy
const setupApiRedirect = () => {
  if (typeof window === 'undefined') return; // Skip if not in browser
  
  // Store the original fetch
  const originalFetch = window.fetch;
  
  // Replace fetch with our version
  window.fetch = function(url, options) {
    // Handle API calls to localhost:5000
    if (typeof url === 'string' && url.includes('http://localhost:5000/api/')) {
      // Extract the API path
      const apiPath = url.replace('http://localhost:5000/api/', '');
      // Redirect to our proxy
      const newUrl = `/api/proxy/${apiPath}`;
      console.log(`Redirecting API call from ${url} to ${newUrl}`);
      return originalFetch.call(this, newUrl, options);
    } 
    // Handle image URLs from localhost:5000 (but not API calls)
    else if (typeof url === 'string' && url.includes('http://localhost:5000/') && !url.includes('/api/')) {
      // Extract the path after localhost:5000
      const imagePath = url.replace('http://localhost:5000/', '');
      // Redirect to our image proxy
      const newUrl = `/api/image-proxy/${imagePath}`;
      console.log(`Redirecting image request from ${url} to ${newUrl}`);
      return originalFetch.call(this, newUrl, options);
    }
    
    // Not an API call or not to localhost, proceed normally
    return originalFetch.call(this, url, options);
  };
};

// Create a global observer to watch for DOM changes
const setupMutationObserver = (callback: () => void) => {
  if (typeof window === 'undefined' || !window.MutationObserver) return;
  
  // Create a throttled version of the callback
  let timeout: NodeJS.Timeout | null = null;
  const throttledCallback = () => {
    if (timeout) return;
    timeout = setTimeout(() => {
      callback();
      timeout = null;
    }, 500);
  };
  
  // Create a mutation observer to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    // Check if any images were added
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            // If an img was added or an element that might contain images
            if (node.tagName === 'IMG' || node.querySelector('img')) {
              throttledCallback();
              return;
            }
          }
        }
      }
    }
  });
  
  // Start observing the document body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'style']
  });
  
  return observer;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  // Memoize the fix images function to avoid recreating it on each render
  const fixImages = useCallback(() => {
    // Wait a bit for the DOM to be updated with images
    setTimeout(fixImagesInDOM, 500);
  }, []);
  
  useEffect(() => {
    // Setup API redirection when component mounts
    setupApiRedirect();
    
    // Setup mutation observer to fix images when DOM changes
    const observer = setupMutationObserver(fixImages);
    
    return () => {
      // Clean up observer on unmount
      if (observer) observer.disconnect();
    };
  }, [fixImages]);
  
  // Fix images when the route changes
  useEffect(() => {
    fixImages();
  }, [pathname, fixImages]);
  
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-black`}>
        <AuthProvider>
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
