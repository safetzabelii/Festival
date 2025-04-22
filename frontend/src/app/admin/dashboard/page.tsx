'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Festival {
  _id: string;
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
  };
  startDate: string;
  endDate: string;
  genre: string;
  price: number;
  isFree: boolean;
  imageUrl?: string;
  approved: boolean;
  likes?: number;
  goingTo?: number;
  createdAt: string;
}

interface Stats {
  totalFestivals: number;
  pendingApproval: number;
  totalLikes: number;
  totalGoingTo: number;
  upcomingFestivals: number;
  pastFestivals: number;
  mostPopularGenres: { genre: string; count: number }[];
  mostPopularCities: { city: string; count: number }[];
}

export default function AdminDashboard() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'festivals' | 'tools'>('overview');
  const { user } = useAuth();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Fetch festivals
      const festivalsResponse = await fetch('http://localhost:5000/api/festivals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!festivalsResponse.ok) throw new Error('Failed to fetch festivals');
      const festivalsData = await festivalsResponse.json();
      setFestivals(festivalsData);

      // Fetch statistics
      const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json();
        throw new Error(errorData.message || 'Failed to fetch statistics');
      }
      
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user === null) {
      // User is still loading, do nothing
      return;
    }
    
    if (user && !user.isAdmin) {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
      return;
    }
    
    fetchData();
  }, [user, router]);

  const handleDelete = async (festivalId: string) => {
    if (!confirm('Are you sure you want to delete this festival?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to perform this action');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/festivals/${festivalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete festival');
      }

      setFestivals(festivals.filter(festival => festival._id !== festivalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center text-[#FF3366]">Access Denied: Admin privileges required</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-8xl font-black tracking-tighter lowercase text-center mb-4 bg-gradient-to-r from-[#FF7A00] via-[#FFD600] to-[#FF3366] text-transparent bg-clip-text">
          admin
        </h1>
        <p className="text-2xl text-[#FFB4A2] text-center mb-16 font-black tracking-tight lowercase">
          manage your festival platform
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 text-lg font-black tracking-tighter transition-colors duration-300 ${
              activeTab === 'overview'
                ? 'bg-[#FF7A00] text-black'
                : 'text-[#FFB4A2] hover:text-[#FFD600]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('festivals')}
            className={`px-6 py-2 text-lg font-black tracking-tighter transition-colors duration-300 ${
              activeTab === 'festivals'
                ? 'bg-[#FF7A00] text-black'
                : 'text-[#FFB4A2] hover:text-[#FFD600]'
            }`}
          >
            Festivals
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-6 py-2 text-lg font-black tracking-tighter transition-colors duration-300 ${
              activeTab === 'tools'
                ? 'bg-[#FF7A00] text-black'
                : 'text-[#FFB4A2] hover:text-[#FFD600]'
            }`}
          >
            Admin Tools
          </button>
        </div>

        {error && (
          <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF3366]/20 rounded-xl p-4 mb-8 text-[#FF3366] text-center">
            {error}
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
              <h3 className="text-lg font-black tracking-tighter text-[#FFB4A2] mb-2">Total Festivals</h3>
              <p className="text-3xl font-black text-[#FF7A00]">{stats.totalFestivals}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF3366]/20 rounded-xl p-6">
              <h3 className="text-lg font-black tracking-tighter text-[#FFB4A2] mb-2">Pending Approval</h3>
              <p className="text-3xl font-black text-[#FF3366]">{stats.pendingApproval}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FFD600]/20 rounded-xl p-6">
              <h3 className="text-lg font-black tracking-tighter text-[#FFB4A2] mb-2">Total Likes</h3>
              <p className="text-3xl font-black text-[#FFD600]">{stats.totalLikes}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
              <h3 className="text-lg font-black tracking-tighter text-[#FFB4A2] mb-2">Total Going</h3>
              <p className="text-3xl font-black text-[#FF7A00]">{stats.totalGoingTo}</p>
            </div>
          </div>
        )}

        {activeTab === 'festivals' && (
          <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tighter text-white">All Festivals</h2>
              <Link
                href="/create-festival"
                className="px-6 py-2 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF3366] hover:text-white transition-all duration-300"
              >
                Create New Festival
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {festivals.map(festival => (
                <div
                  key={festival._id}
                  className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6"
                >
                  <h3 className="text-xl font-black tracking-tighter text-white mb-2">
                    {festival.name}
                  </h3>
                  <p className="text-[#FFB4A2] mb-2">
                    {festival.location.city}, {festival.location.country}
                  </p>
                  <p className="text-[#FFB4A2] mb-4">
                    {new Date(festival.startDate).toLocaleDateString()} - {new Date(festival.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 bg-[#FF3366]/10 border border-[#FF3366]/30 rounded-lg px-4 py-2">
                      <span className="text-2xl text-[#FF3366]">♥</span>
                      <span className="text-[#FFB4A2] font-black tracking-tighter">{festival.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#FFD600]/10 border border-[#FFD600]/30 rounded-lg px-4 py-2">
                      <span className="text-2xl text-[#FFD600]">👤</span>
                      <span className="text-[#FFB4A2] font-black tracking-tighter">{festival.goingTo || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Link
                      href={`/festivals/${festival._id}/edit`}
                      className="flex-1 px-6 py-2 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF3366] hover:text-white transition-all duration-300 text-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(festival._id)}
                      className="flex-1 px-6 py-2 bg-[#FF3366] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF7A00] hover:text-white transition-all duration-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/pending-festivals"
              className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6 hover:border-[#FF3366]/20 transition-colors duration-300"
            >
              <h3 className="text-xl font-black tracking-tighter text-white mb-2">Pending Festivals</h3>
              <p className="text-[#FFB4A2]">Review and approve festivals created by non-admin users</p>
            </Link>
            <Link
              href="/admin/export-data"
              className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6 hover:border-[#FF3366]/20 transition-colors duration-300"
            >
              <h3 className="text-xl font-black tracking-tighter text-white mb-2">Export Data</h3>
              <p className="text-[#FFB4A2]">Download festival and user data</p>
            </Link>
            <Link
              href="/admin/analytics"
              className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6 hover:border-[#FF3366]/20 transition-colors duration-300"
            >
              <h3 className="text-xl font-black tracking-tighter text-white mb-2">Analytics</h3>
              <p className="text-[#FFB4A2]">View detailed festival statistics and trends</p>
            </Link>
            <Link
              href="/admin/user-management"
              className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6 hover:border-[#FF3366]/20 transition-colors duration-300"
            >
              <h3 className="text-xl font-black tracking-tighter text-white mb-2">User Management</h3>
              <p className="text-[#FFB4A2]">Manage user roles and permissions</p>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
} 