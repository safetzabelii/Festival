'use client';

import { useState, useEffect } from 'react';
import { getProxiedImageUrl } from '@/utils/imageUtils';
import ProxyImage from '@/components/ProxyImage';

export default function DebugPage() {
  const [testImageUrl, setTestImageUrl] = useState('');
  const [proxyStatus, setProxyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [imageProxyUrl, setImageProxyUrl] = useState('');
  
  // Test sample image URLs
  const sampleImageUrls = [
    'http://localhost:5000/uploads/festivals/jazz-festival.jpg',
    '/uploads/festivals/rock-festival.jpg',
    'uploads/festivals/electronic-festival.jpg'
  ];
  
  // Test connecting to API
  const testApiConnection = async () => {
    setApiStatus('loading');
    try {
      const response = await fetch('/api/proxy/festivals');
      const data = await response.json();
      setApiResponse(data);
      setApiStatus('success');
    } catch (error) {
      console.error('API test error:', error);
      setApiStatus('error');
    }
  };
  
  // Test image proxy
  const testImageProxy = async () => {
    if (!testImageUrl) return;
    
    setProxyStatus('loading');
    try {
      const proxiedUrl = getProxiedImageUrl(testImageUrl);
      setImageProxyUrl(proxiedUrl);
      
      // Try to fetch the image to verify it works
      const response = await fetch(proxiedUrl);
      if (response.ok) {
        setProxyStatus('success');
      } else {
        setProxyStatus('error');
      }
    } catch (error) {
      console.error('Image proxy test error:', error);
      setProxyStatus('error');
    }
  };
  
  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Debug Tools</h1>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Image Proxy Test</h2>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <label className="block text-lg">Enter an image URL to test:</label>
            <input 
              type="text" 
              value={testImageUrl}
              onChange={(e) => setTestImageUrl(e.target.value)}
              placeholder="e.g. http://localhost:5000/uploads/image.jpg"
              className="px-4 py-2 bg-gray-800 rounded w-full text-white"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={testImageProxy}
              disabled={proxyStatus === 'loading' || !testImageUrl}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Image Proxy
            </button>
            
            <button 
              onClick={() => setTestImageUrl(sampleImageUrls[Math.floor(Math.random() * sampleImageUrls.length)])}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
            >
              Use Sample URL
            </button>
          </div>
        </div>
        
        {proxyStatus !== 'idle' && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Results:</h3>
            <p className="mb-2">
              <strong>Status:</strong>{' '}
              {proxyStatus === 'loading' ? 'Testing...' : 
               proxyStatus === 'success' ? 'Success! Image loaded.' : 
               'Error: Image could not be loaded.'
              }
            </p>
            
            {imageProxyUrl && (
              <div>
                <p className="mb-2"><strong>Proxied URL:</strong> {imageProxyUrl}</p>
                
                <div className="mt-4 p-4 bg-gray-800 rounded">
                  <h4 className="text-lg font-semibold mb-4">Image Preview:</h4>
                  {proxyStatus === 'success' ? (
                    <div className="bg-gray-700 p-2 rounded">
                      <ProxyImage 
                        src={testImageUrl} 
                        alt="Test image" 
                        width={300}
                        height={200}
                        className="rounded"
                      />
                    </div>
                  ) : (
                    <div className="bg-red-900 p-4 rounded">
                      Image failed to load
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">API Proxy Test</h2>
        
        <button 
          onClick={testApiConnection}
          disabled={apiStatus === 'loading'}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test API Connection
        </button>
        
        {apiStatus !== 'idle' && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">API Response:</h3>
            {apiStatus === 'loading' ? (
              <p>Loading...</p>
            ) : apiStatus === 'success' ? (
              <div className="bg-gray-800 p-4 rounded">
                <pre className="whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-red-900 p-4 rounded">
                Error connecting to API
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 