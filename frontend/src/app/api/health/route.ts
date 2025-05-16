import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/api';

export async function GET() {
  try {
    // Try to connect to backend
    const response = await fetch(`${BACKEND_URL}/api/festivals?limit=1`, {
      method: 'GET',
      cache: 'no-store',
    });
    
    const isBackendReachable = response.ok;
    const backendStatus = response.status;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      backend: {
        url: BACKEND_URL,
        reachable: isBackendReachable,
        status: backendStatus,
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      backend: {
        url: BACKEND_URL,
        reachable: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
} 