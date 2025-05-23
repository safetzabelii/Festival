import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/api/${path}${request.nextUrl.search}`;
  
  console.log(`[Proxy] GET request to: ${url}`);
  
  try {
    const authHeader = request.headers.get('authorization');
    console.log(`[Proxy] Has Auth: ${Boolean(authHeader)}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
    });

    console.log(`[Proxy] Response status: ${response.status}`);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Backend returned error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }
    
    // Try to parse JSON response
    try {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (e) {
      console.error('[Proxy] Error parsing response JSON:', e);
      // If we can't parse JSON, return the raw text
      const text = await response.text();
      return new NextResponse(text, { 
        status: response.status,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (error) {
    console.error('[Proxy] Critical error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/api/${path}`;
  
  console.log(`[Proxy] POST request to: ${url}`);
  
  try {
    // Check content type to see if it's a form-data request
    const contentType = request.headers.get('content-type') || '';
    const authHeader = request.headers.get('authorization');
    
    console.log(`[Proxy] Content-Type: ${contentType}`);
    console.log(`[Proxy] Has Auth: ${Boolean(authHeader)}`);
    
    let response;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      console.log('[Proxy] Handling multipart/form-data POST request');
      
      // Clone the request to forward it as-is
      const clonedRequest = request.clone();
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          // Don't manually set content-type for multipart/form-data
          // to preserve the boundary parameter
          ...(authHeader ? { 'Authorization': authHeader } : {})
        },
        body: await clonedRequest.arrayBuffer()
      });
    } else {
      // Handle JSON
      let body;
      try {
        body = await request.json();
        console.log(`[Proxy] Request body: ${JSON.stringify(body)}`);
      } catch (e) {
        console.error('[Proxy] Error parsing JSON body:', e);
        // Try to get the body as text instead
        const textBody = await request.text();
        console.log(`[Proxy] Request body as text: ${textBody}`);
        
        // If the body is empty, pass empty object
        body = textBody ? JSON.parse(textBody) : {};
      }
      
      // For the /liked and /going endpoints, we don't need a body
      if (path.includes('/liked/') || path.includes('/going/')) {
        console.log('[Proxy] Like/Going endpoint detected, sending empty body');
        body = {};
      }
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {})
        },
        body: JSON.stringify(body),
      });
    }

    console.log(`[Proxy] Response status: ${response.status}`);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Backend returned error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }
    
    // Try to parse JSON response
    try {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (e) {
      console.error('[Proxy] Error parsing response JSON:', e);
      // If we can't parse JSON, return the raw text
      const text = await response.text();
      return new NextResponse(text, { 
        status: response.status,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (error) {
    console.error('[Proxy] Critical error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/api/${path}`;
  
  console.log(`[Proxy] PUT request to: ${url}`);
  
  try {
    // Check content type to see if it's a form-data request
    const contentType = request.headers.get('content-type') || '';
    const authHeader = request.headers.get('authorization');
    
    console.log(`[Proxy] Content-Type: ${contentType}`);
    console.log(`[Proxy] Has Auth: ${Boolean(authHeader)}`);
    
    let response;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      console.log('[Proxy] Handling multipart/form-data PUT request');
      
      try {
        // Clone the request to forward it as-is
        const clonedRequest = request.clone();
        const buffer = await clonedRequest.arrayBuffer();
        
        console.log(`[Proxy] Form data size: ${buffer.byteLength} bytes`);
        
        // Check the headers being sent to the backend
        const headers: Record<string, string> = {
          // Don't manually set content-type for multipart/form-data
          // to preserve the boundary parameter
          ...(authHeader ? { 'Authorization': authHeader } : {})
        };
        
        // Get the actual Content-Type header from the request to preserve the boundary
        const requestContentType = request.headers.get('content-type');
        if (requestContentType) {
          console.log(`[Proxy] Using original Content-Type: ${requestContentType}`);
          headers['Content-Type'] = requestContentType;
        }
        
        console.log('[Proxy] Forwarding multipart request to backend with headers:', headers);
        
        response = await fetch(url, {
          method: 'PUT',
          headers,
          body: buffer
        });
        
        console.log(`[Proxy] Backend response received: ${response.status}`);
        
        // If the response indicates an error, try to get more details
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[Proxy] Backend error details for PUT multipart request: ${errorBody}`);
        }
      } catch (formError) {
        console.error('[Proxy] Error processing form data:', formError);
        throw formError;
      }
    } else {
      // Handle JSON
      let body;
      try {
        body = await request.json();
        console.log(`[Proxy] Request body: ${JSON.stringify(body)}`);
      } catch (e) {
        console.error('[Proxy] Error parsing JSON body:', e);
        // Try to get the body as text instead
        const textBody = await request.text();
        console.log(`[Proxy] Request body as text: ${textBody}`);
        
        // If the body is empty, pass empty object
        body = textBody ? JSON.parse(textBody) : {};
      }
      
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {})
        },
        body: JSON.stringify(body),
      });
    }

    console.log(`[Proxy] Response status: ${response.status}`);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Backend returned error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }
    
    // Try to parse JSON response
    try {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (e) {
      console.error('[Proxy] Error parsing response JSON:', e);
      // If we can't parse JSON, return the raw text
      const text = await response.text();
      return new NextResponse(text, { 
        status: response.status,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (error) {
    console.error('[Proxy] Critical error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/api/${path}${request.nextUrl.search}`;
  
  console.log(`[Proxy] DELETE request to: ${url}`);
  
  try {
    const authHeader = request.headers.get('authorization');
    console.log(`[Proxy] Has Auth: ${Boolean(authHeader)}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
    });

    console.log(`[Proxy] Response status: ${response.status}`);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Backend returned error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }
    
    // Try to parse JSON response
    try {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (e) {
      console.error('[Proxy] Error parsing response JSON:', e);
      // If we can't parse JSON, return the raw text
      const text = await response.text();
      return new NextResponse(text, { 
        status: response.status,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (error) {
    console.error('[Proxy] Critical error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 