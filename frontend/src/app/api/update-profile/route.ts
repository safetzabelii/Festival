import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/api';

export async function PUT(request: NextRequest) {
  console.log('[Profile Update] Processing profile update request');
  
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('[Profile Update] Missing authorization header');
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    // Clone the request to get the content
    const clonedRequest = request.clone();
    
    // Get the original content type
    const contentType = request.headers.get('content-type') || '';
    console.log(`[Profile Update] Request content type: ${contentType}`);
    
    let response;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data
      console.log('[Profile Update] Handling multipart/form-data request');
      
      try {
        const arrayBuffer = await clonedRequest.arrayBuffer();
        console.log(`[Profile Update] Form data size: ${arrayBuffer.byteLength} bytes`);
        
        // Forward to backend
        response = await fetch(`${BACKEND_URL}/api/users/me`, {
          method: 'PUT',
          headers: {
            'Authorization': authHeader,
            'Content-Type': contentType,
          },
          body: arrayBuffer
        });
      } catch (formError) {
        console.error('[Profile Update] Error processing form data:', formError);
        return NextResponse.json(
          { error: 'Failed to process form data', details: formError instanceof Error ? formError.message : String(formError) },
          { status: 500 }
        );
      }
    } else {
      // Handle JSON data
      console.log('[Profile Update] Handling JSON request');
      
      const body = await clonedRequest.json();
      response = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }
    
    console.log(`[Profile Update] Backend response status: ${response.status}`);
    
    // Handle backend response
    if (!response.ok) {
      let errorDetail = '';
      try {
        // Try to get error details as JSON
        const errorData = await response.json();
        errorDetail = errorData.message || errorData.error || '';
      } catch (e) {
        // If not JSON, try to get as text
        try {
          errorDetail = await response.text();
        } catch (e2) {
          // If text fails too, just use status
          errorDetail = `Status: ${response.status}`;
        }
      }
      
      console.error(`[Profile Update] Backend error: ${errorDetail}`);
      return NextResponse.json(
        { error: 'Failed to update profile', details: errorDetail },
        { status: response.status }
      );
    }
    
    // Return success response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Profile Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 