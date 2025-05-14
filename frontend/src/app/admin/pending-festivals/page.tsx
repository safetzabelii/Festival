'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';


import api from '@/services/api';interface Festival {
  _id: string;
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
  };
  startDate: string;
  endDate: string;
  imageUrl?: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function PendingFestivals() {
  const [pendingFestivals, setPendingFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const fetchPendingFestivals = async () => {
    try {
      if (!user) return;

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(getImageUrl(imageUrl), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending festivals');
      }

      const data = response.data;
      setPendingFestivals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is not admin and redirect
    if (user === null) {
      // User is still loading, do nothing
      return;
    }

    if (user && !user.isAdmin) {
      // Use window.location for immediate redirection
      window.location.href = '/';
      return;
    }

    fetchPendingFestivals();
  }, [user]);

  // Redirect non-admin users immediately
  if (!user || !user.isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
      return null;
    }
    return null;
  }

  const handleAction = async (festivalId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get(`/api/admin/festivals/${festivalId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} festival`);
      }

      // Refresh the pending festivals list
      fetchPendingFestivals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="bg-black min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <h1 className="text-6xl font-black tracking-tighter mb-4 text-center text-[#FFB4A2] lowercase">
            pending festivals
          </h1>
          <p className="text-center text-[#FF7A00] text-xl lowercase mb-12">
            review and approve user-submitted festivals
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#FFB4A2]">loading pending festivals...</p>
            </div>
          ) : error ? (
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF3366]/30 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-[#FF3366] mb-4">Error</h2>
              <p className="text-[#FFB4A2]">{error}</p>
            </div>
          ) : pendingFestivals.length === 0 ? (
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-[#FFB4A2] mb-4">No Pending Festivals</h2>
              <p className="text-[#FFB4A2]">There are no festivals waiting for approval at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingFestivals.map(festival => (
                <div key={festival._id} className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#FFB4A2] mb-2">{festival.name}</h2>
                      <p className="text-[#FFB4A2]/80 mb-4">{festival.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-[#FFB4A2]/70">
                        <span>{festival.location.city}, {festival.location.country}</span>
                        <span>{new Date(festival.startDate).toLocaleDateString()} - {new Date(festival.endDate).toLocaleDateString()}</span>
                        <span>By: {festival.user.name}</span>
                        <span>Submitted: {new Date(festival.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      <button
                        onClick={() => handleAction(festival._id, 'approve')}
                        className="px-6 py-3 bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(festival._id, 'reject')}
                        className="px-6 py-3 bg-[#FF3366] text-black font-bold tracking-tight rounded-lg hover:bg-[#FF3366]/80 transition-all duration-300"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminProtectedRoute>
  );
} 