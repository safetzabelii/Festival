'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

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
  totalUsers: number;
  totalFestivals: number;
  totalTopics: number;
  pendingFestivals: number;
  registrationsLast7Days: number;
  activitiesLast24Hours: number;
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
      // Use window.location for immediate redirection
      window.location.href = '/';
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

  // Redirect non-admin users immediately
  if (!user || !user.isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
      return null;
    }
    return null;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AdminProtectedRoute>
      <div className="bg-black min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-12">
            <motion.h1 
              className="text-6xl font-black tracking-tighter mb-4 text-center text-[#FFB4A2] lowercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              admin dashboard
            </motion.h1>
            <motion.p 
              className="text-center text-[#FF7A00] text-xl lowercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              manage your festival platform
            </motion.p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#FFB4A2]">loading statistics...</p>
            </div>
          ) : error ? (
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF3366]/30 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-[#FF3366] mb-4">Error Loading Dashboard</h2>
              <p className="text-[#FFB4A2]">{error}</p>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
                  <h3 className="text-sm uppercase tracking-wider text-[#FFB4A2]/60 mb-2">Total Users</h3>
                  <p className="text-4xl font-black text-[#FF7A00]">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
                  <h3 className="text-sm uppercase tracking-wider text-[#FFB4A2]/60 mb-2">Total Festivals</h3>
                  <p className="text-4xl font-black text-[#FFD600]">{stats?.totalFestivals || 0}</p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
                  <h3 className="text-sm uppercase tracking-wider text-[#FFB4A2]/60 mb-2">Topics & Comments</h3>
                  <p className="text-4xl font-black text-[#FF3366]">{stats?.totalTopics || 0}</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
                  <h3 className="text-sm uppercase tracking-wider text-[#FFB4A2]/60 mb-2">Pending Approvals</h3>
                  <p className="text-4xl font-black text-[#FF7A00]">{stats?.pendingFestivals || 0}</p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
                  <h3 className="text-sm uppercase tracking-wider text-[#FFB4A2]/60 mb-2">Recent Signups (7 days)</h3>
                  <p className="text-4xl font-black text-[#FFD600]">{stats?.registrationsLast7Days || 0}</p>
                </div>
              </motion.div>
              
              {/* Admin Tools */}
              <motion.h2 
                className="text-3xl font-black tracking-tighter mb-6 text-[#FFB4A2]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Admin Tools
              </motion.h2>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Link 
                  href="/admin/pending-festivals"
                  className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6 hover:border-[#FF7A00] transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-[#FF7A00] mb-2">Festival Approvals</h3>
                  <p className="text-[#FFB4A2]">Review and approve festivals created by non-admin users</p>
                </Link>
                <Link 
                  href="/admin/export-data"
                  className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6 hover:border-[#FF7A00] transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-[#FF7A00] mb-2">Export Data</h3>
                  <p className="text-[#FFB4A2]">Export user, festival, and discussion data</p>
                </Link>
                <Link 
                  href="/admin/analytics"
                  className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6 hover:border-[#FF7A00] transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-[#FF7A00] mb-2">Analytics</h3>
                  <p className="text-[#FFB4A2]">View detailed platform analytics and statistics</p>
                </Link>
                <Link 
                  href="/admin/user-management"
                  className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6 hover:border-[#FF7A00] transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-[#FF7A00] mb-2">User Management</h3>
                  <p className="text-[#FFB4A2]">Manage users, roles, and permissions</p>
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </AdminProtectedRoute>
  );
} 