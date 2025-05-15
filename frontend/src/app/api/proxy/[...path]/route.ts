import { NextRequest, NextResponse } from 'next/server';

// Your Render backend URL - replace with your actual URL
const BACKEND_URL = 'https://festivalsphere-backend.onrender.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/api/${path}${request.nextUrl.search}`;
  
  console.log(`Proxying GET request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') 
            ? { 'Authorization': request.headers.get('authorization') as string } 
            : {})
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
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
  
  console.log(`Proxying POST request to: ${url}`);
  
  try {
    // Check content type to see if it's a form-data request
    const contentType = request.headers.get('content-type') || '';
    let response;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      console.log('Handling multipart/form-data POST request');
      
      // Clone the request to forward it as-is
      const clonedRequest = request.clone();
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          // Don't manually set content-type for multipart/form-data
          // to preserve the boundary parameter
          'Authorization': request.headers.get('authorization') || ''
        },
        body: await clonedRequest.arrayBuffer()
      });
    } else {
      // Handle JSON
      const body = await request.json();
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(request.headers.get('authorization') 
              ? { 'Authorization': request.headers.get('authorization') as string } 
              : {})
        },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
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
  
  console.log(`Proxying PUT request to: ${url}`);
  
  try {
    // Check content type to see if it's a form-data request
    const contentType = request.headers.get('content-type') || '';
    let response;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      console.log('Handling multipart/form-data request');
      
      // Clone the request to forward it as-is
      const clonedRequest = request.clone();
      
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          // Don't manually set content-type for multipart/form-data
          // to preserve the boundary parameter
          'Authorization': request.headers.get('authorization') || ''
        },
        body: await clonedRequest.arrayBuffer()
      });
    } else {
      // Handle JSON
      const body = await request.json();
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(request.headers.get('authorization') 
              ? { 'Authorization': request.headers.get('authorization') as string } 
              : {})
        },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
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
  
  console.log(`Proxying DELETE request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') 
            ? { 'Authorization': request.headers.get('authorization') as string } 
            : {})
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
} 