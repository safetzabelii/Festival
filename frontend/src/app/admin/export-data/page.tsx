'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';

export default function ExportDataPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin, if not redirect
  useEffect(() => {
    if (user === null) {
      // User is still loading, do nothing
      return;
    }

    if (user && !user.isAdmin) {
      // Use window.location for immediate redirection
      window.location.href = '/';
      return;
    }
  }, [user]);

  // Redirect non-admin users immediately
  if (!user || !user.isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
      return null;
    }
    return null;
  }

  const handleExport = async (type: 'festivals' | 'users') => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get(`/api/admin/export/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          format: 'csv',
          dateRange: 'all'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to export ${type} data`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-black tracking-tighter text-white text-center mb-4">
          Export Data
        </h1>
        <p className="text-2xl text-[#FFB4A2] text-center mb-16 font-black tracking-tight lowercase">
          download festival and user data
        </p>

        {error && (
          <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF3366]/20 rounded-xl p-4 mb-8 text-[#FF3366] text-center">
            {error}
          </div>
        )}

        <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-8 max-w-3xl mx-auto">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tighter text-[#FFB4A2] mb-4">Export Options</h2>
              <p className="text-[#FFB4A2] mb-8">Choose the type of data you want to export</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleExport('festivals')}
                disabled={loading}
                className="p-6 bg-black/40 border-2 border-[#FF7A00]/20 rounded-xl hover:border-[#FF7A00] transition-all duration-300 group"
              >
                <div className="text-center">
                  <h3 className="text-xl font-black tracking-tighter text-[#FFB4A2] mb-2 group-hover:text-[#FF7A00] transition-colors duration-300">
                    Festival Data
                  </h3>
                  <p className="text-[#FFB4A2] text-sm">
                    Export all festival information including details, locations, and statistics
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleExport('users')}
                disabled={loading}
                className="p-6 bg-black/40 border-2 border-[#FF7A00]/20 rounded-xl hover:border-[#FF7A00] transition-all duration-300 group"
              >
                <div className="text-center">
                  <h3 className="text-xl font-black tracking-tighter text-[#FFB4A2] mb-2 group-hover:text-[#FF7A00] transition-colors duration-300">
                    User Data
                  </h3>
                  <p className="text-[#FFB4A2] text-sm">
                    Export user information including profiles, roles, and activity
                  </p>
                </div>
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-[#FFB4A2]">
                <LoadingSpinner />
                <span>Preparing export...</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 