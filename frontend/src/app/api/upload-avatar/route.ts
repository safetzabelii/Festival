import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/api';

export async function POST(request: NextRequest) {
  console.log('[Avatar Upload] Processing avatar upload request');
  
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('[Avatar Upload] Missing authorization header');
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    // Clone the request to get the content
    const clonedRequest = request.clone();
    const formData = await clonedRequest.formData();
    
    // Extract the avatar file
    const avatar = formData.get('avatar') as File | null;
    if (!avatar) {
      console.error('[Avatar Upload] No avatar file found in request');
      return NextResponse.json(
        { error: 'No avatar file provided' },
        { status: 400 }
      );
    }
    
    console.log(`[Avatar Upload] File info: name=${avatar.name}, size=${avatar.size}, type=${avatar.type}`);
    
    // Create new FormData to send to backend
    const backendFormData = new FormData();
    backendFormData.append('avatar', avatar);
    
    // Add other form fields if present
    for (const [key, value] of formData.entries()) {
      if (key !== 'avatar') {
        backendFormData.append(key, value);
      }
    }
    
    // Send to backend
    console.log('[Avatar Upload] Sending request to backend');
    const response = await fetch(`${BACKEND_URL}/api/users/me/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: backendFormData
    });
    
    console.log(`[Avatar Upload] Backend response status: ${response.status}`);
    
    // Handle backend response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Avatar Upload] Backend error: ${errorText}`);
      return NextResponse.json(
        { error: `Failed to upload avatar: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    // Return success response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Avatar Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process avatar upload', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 