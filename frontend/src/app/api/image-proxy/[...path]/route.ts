import { NextRequest, NextResponse } from 'next/server';

// Your Render backend URL - replace with your actual URL
const BACKEND_URL = 'https://festivalsphere-backend.onrender.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/${path}`;
  
  console.log(`Proxying image request to: ${url}`);
  
  try {
    const response = await fetch(url);
    
    // If the response was not ok, throw an error
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Get the image data as an array buffer
    const imageData = await response.arrayBuffer();
    
    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Return the image with the correct content type
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    // Return a 404 response
    return new NextResponse('Image not found', { status: 404 });
  }
} 