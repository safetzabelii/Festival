'use client';

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Immediate redirection for non-admins
  useEffect(() => {
    // For non-logged-in users or non-admin users, redirect immediately
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // When still loading auth state, show spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If we know the user is not an admin, redirect without rendering anything
  if (!user || !user.isAdmin) {
    // Use window.location for immediate redirection instead of showing spinner
    if (typeof window !== 'undefined') {
      window.location.href = '/';
      return null;
    }
    return null;
  }

  // If user is admin, render the children
  return <>{children}</>;
} 