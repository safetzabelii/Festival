'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';

interface AnalyticsData {
  totalFestivals: number;
  totalUsers: number;
  totalLikes: number;
  totalGoingTo: number;
  activeUsersThisMonth: number;
  newUsersThisMonth: number;
  pendingApproval: number;
  genreDistribution: {
    count: number;
    genre: string;
    popularity: number;
  }[];
  monthlyStats: {
    month: string;
    festivals: number;
    activeUsers: number;
    newUsers: number;
    likes: number;
    goingTo: number;
  }[];
  userEngagement: {
    averageLikesPerUser: number;
    averageGoingToPerUser: number;
    mostActiveUsers: {
      userId: string;
      name: string;
      totalActions: number;
    }[];
  };
  mostPopularFestivals: {
    _id: string;
    name: string;
    city: string;
    totalEngagement: number;
    likes: number;
    goingTo: number;
  }[];
  mostActiveCities: {
    city: string;
    count: number;
    totalLikes: number;
    totalGoingTo: number;
  }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check if user is not an admin and redirect
    if (user === null) {
      // User is still loading, do nothing
      return;
    }

    if (user && !user.isAdmin) {
      // Use window.location for immediate redirection
      window.location.href = '/';
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(getImageUrl(imageUrl), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = response.data;
          if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
          throw new Error(errorData.message || 'Failed to fetch analytics data');
        }

        const data = response.data;
        
        // Validate the response data structure
        if (!isValidAnalyticsData(data)) {
          throw new Error('Invalid analytics data received from server');
        }

        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Retry logic
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchAnalytics();
          }, 2000 * (retryCount + 1)); // Exponential backoff
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [retryCount, router, user]);

  // Helper function to validate analytics data structure
  const isValidAnalyticsData = (data: any): data is AnalyticsData => {
    return (
      data &&
      typeof data.totalFestivals === 'number' &&
      typeof data.totalUsers === 'number' &&
      typeof data.totalLikes === 'number' &&
      typeof data.totalGoingTo === 'number' &&
      typeof data.activeUsersThisMonth === 'number' &&
      typeof data.newUsersThisMonth === 'number' &&
      typeof data.pendingApproval === 'number' &&
      Array.isArray(data.genreDistribution) &&
      Array.isArray(data.monthlyStats) &&
      data.userEngagement &&
      typeof data.userEngagement.averageLikesPerUser === 'number' &&
      typeof data.userEngagement.averageGoingToPerUser === 'number' &&
      Array.isArray(data.userEngagement.mostActiveUsers) &&
      Array.isArray(data.mostPopularFestivals) &&
      Array.isArray(data.mostActiveCities)
    );
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
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <LoadingSpinner />
          {retryCount > 0 && (
            <p className="text-center text-[#FFB4A2] mt-4">
              Retrying... Attempt {retryCount} of 3
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-black tracking-tighter text-white text-center mb-4">
          Analytics
        </h1>
        <p className="text-lg text-[#FFB4A2] text-center mb-8 font-black tracking-tight lowercase">
          view detailed festival statistics
        </p>

        {error && (
          <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF3366]/20 rounded-xl p-4 mb-8 text-[#FF3366] text-center">
            {error}
          </div>
        )}

        {analytics && (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
                <h3 className="text-xl font-black tracking-tighter text-[#FFB4A2] mb-2">Total Festivals</h3>
                <p className="text-4xl font-black text-[#FF7A00]">{analytics.totalFestivals}</p>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
                <h3 className="text-xl font-black tracking-tighter text-[#FFB4A2] mb-2">Total Users</h3>
                <p className="text-4xl font-black text-[#FF7A00]">{analytics.totalUsers}</p>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
                <h3 className="text-xl font-black tracking-tighter text-[#FFB4A2] mb-2">Total Likes</h3>
                <p className="text-4xl font-black text-[#FF7A00]">{analytics.totalLikes}</p>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
                <h3 className="text-xl font-black tracking-tighter text-[#FFB4A2] mb-2">Total Going</h3>
                <p className="text-4xl font-black text-[#FF7A00]">{analytics.totalGoingTo}</p>
              </div>
            </div>

            {/* Genre Distribution */}
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
              <h2 className="text-2xl font-black tracking-tighter text-[#FFB4A2] mb-6">Genre Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.genreDistribution.map((genre, index) => (
                  <div key={index} className="bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg p-4">
                    <p className="text-[#FFB4A2] font-black tracking-tighter">{genre.genre}</p>
                    <p className="text-2xl font-black text-[#FF7A00]">{genre.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
              <h2 className="text-2xl font-black tracking-tighter text-[#FFB4A2] mb-6">Monthly Statistics</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[#FFB4A2] font-black tracking-tighter">
                      <th className="p-4 text-left">Month</th>
                      <th className="p-4 text-left">Festivals</th>
                      <th className="p-4 text-left">Active Users</th>
                      <th className="p-4 text-left">New Users</th>
                      <th className="p-4 text-left">Likes</th>
                      <th className="p-4 text-left">Going</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.monthlyStats.map((stat, index) => (
                      <tr key={index} className="border-t border-[#FF7A00]/20">
                        <td className="p-4 text-[#FFB4A2]">{stat.month}</td>
                        <td className="p-4 text-[#FF7A00]">{stat.festivals}</td>
                        <td className="p-4 text-[#FF7A00]">{stat.activeUsers}</td>
                        <td className="p-4 text-[#FF7A00]">{stat.newUsers}</td>
                        <td className="p-4 text-[#FF7A00]">{stat.likes}</td>
                        <td className="p-4 text-[#FF7A00]">{stat.goingTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Festivals */}
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
              <h2 className="text-2xl font-black tracking-tighter text-[#FFB4A2] mb-6">Top Festivals</h2>
              <div className="space-y-4">
                {analytics.mostPopularFestivals.map((festival, index) => (
                  <div key={festival._id} className="bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[#FFB4A2] font-black tracking-tighter">{festival.name}</p>
                        <div className="flex gap-4 mt-2">
                          <span className="text-[#FF7A00]">Likes: {festival.likes}</span>
                          <span className="text-[#FF7A00]">Going: {festival.goingTo}</span>
                        </div>
                      </div>
                      <span className="text-4xl font-black text-[#FF7A00]">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Activity */}
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
              <h2 className="text-2xl font-black tracking-tighter text-[#FFB4A2] mb-6">User Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg p-4">
                  <p className="text-[#FFB4A2] font-black tracking-tighter">Active Users</p>
                  <p className="text-2xl font-black text-[#FF7A00]">{analytics.activeUsersThisMonth}</p>
                </div>
                <div className="bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg p-4">
                  <p className="text-[#FFB4A2] font-black tracking-tighter">New Users (This Month)</p>
                  <p className="text-2xl font-black text-[#FF7A00]">{analytics.newUsersThisMonth}</p>
                </div>
                <div className="bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg p-4">
                  <p className="text-[#FFB4A2] font-black tracking-tighter">Avg. Likes per User</p>
                  <p className="text-2xl font-black text-[#FF7A00]">{analytics.userEngagement.averageLikesPerUser}</p>
                </div>
                <div className="bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg p-4">
                  <p className="text-[#FFB4A2] font-black tracking-tighter">Avg. Going per User</p>
                  <p className="text-2xl font-black text-[#FF7A00]">{analytics.userEngagement.averageGoingToPerUser}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 