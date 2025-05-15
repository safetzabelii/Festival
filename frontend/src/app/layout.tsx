'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';
import { useEffect } from 'react';

const inter = Inter({ subsets: ["latin"] });

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
  
  // Also fix image URLs in the DOM
  setTimeout(() => {
    // Select all images on the page
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
  }, 1000); // Wait for images to be loaded
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Set up API redirection when component mounts
    setupApiRedirect();
  }, []);
  
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
