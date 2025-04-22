'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AnalyticsData {
  totalUsers: number;
  totalFestivals: number;
  totalLikes: number;
  totalGoingTo: number;
  activeUsersThisMonth: number;
  newUsersThisMonth: number;
  mostPopularFestivals: {
    _id: string;
    name: string;
    likes: number;
    goingTo: number;
    city: string;
    date: string;
  }[];
  mostActiveCities: {
    city: string;
    count: number;
    totalLikes: number;
    totalGoingTo: number;
  }[];
  genreDistribution: {
    genre: string;
    count: number;
    popularity: number;
  }[];
  monthlyStats: {
    month: string;
    festivals: number;
    likes: number;
    goingTo: number;
    newUsers: number;
    activeUsers: number;
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
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch('http://localhost:5000/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.headers.get('content-type')?.includes('text/html')) {
            throw new Error('Server error: Please check if the backend server is running');
          }
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch analytics' }));
          throw new Error(errorData.message || 'Failed to fetch analytics');
        }

        const data = await response.json().catch(() => {
          throw new Error('Invalid response format from server');
        });

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from server');
        }

        setAnalytics(data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (!user || !user.isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '80rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '3rem 1rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#dc2626' }}>Access Denied: Admin privileges required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '80rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '3rem 1rem'
        }}>
          <div style={{ textAlign: 'center', color: '#dc2626' }}>Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '80rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '3rem 1rem'
      }}>
        <h1 style={{ 
          fontSize: '2.25rem',
          fontWeight: 'bold',
          color: 'var(--text-color)',
          marginBottom: '2rem'
        }}>
          Analytics Dashboard
        </h1>

        {analytics && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* Overview Cards */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ 
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Users</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {analytics.totalUsers}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  +{analytics.newUsersThisMonth} this month
                </p>
              </div>
              <div style={{ 
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Festivals</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {analytics.totalFestivals}
                </p>
              </div>
              <div style={{ 
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Likes</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e11d48' }}>
                  {analytics.totalLikes}
                </p>
              </div>
              <div style={{ 
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Going</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                  {analytics.totalGoingTo}
                </p>
              </div>
              <div style={{ 
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Active Users</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {analytics.activeUsersThisMonth}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  This month
                </p>
              </div>
            </div>

            {/* User Engagement */}
            <div style={{ 
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                User Engagement
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: '0.375rem' }}>
                  <span>Average Likes per User</span>
                  <span style={{ fontWeight: '500' }}>{analytics.userEngagement.averageLikesPerUser.toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: '0.375rem' }}>
                  <span>Average Going To per User</span>
                  <span style={{ fontWeight: '500' }}>{analytics.userEngagement.averageGoingToPerUser.toFixed(1)}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginTop: '1rem' }}>Most Active Users</h3>
                {analytics.userEngagement.mostActiveUsers.map(user => (
                  <div key={user.userId} style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    backgroundColor: 'var(--background-color)',
                    borderRadius: '0.375rem'
                  }}>
                    <span>{user.name}</span>
                    <span style={{ fontWeight: '500' }}>{user.totalActions} actions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Festivals with enhanced info */}
            <div style={{ 
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Most Popular Festivals
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {analytics.mostPopularFestivals.map(festival => (
                  <div key={festival._id} style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--background-color)',
                    borderRadius: '0.375rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{festival.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {festival.city} • {new Date(festival.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ color: '#e11d48' }}>♥ {festival.likes}</span>
                      <span style={{ color: '#059669' }}>👥 {festival.goingTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced City Stats */}
            <div style={{ 
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Most Active Cities
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {analytics.mostActiveCities.map(city => (
                  <div key={city.city} style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--background-color)',
                    borderRadius: '0.375rem',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '500' }}>{city.city}</span>
                    <span>Festivals: {city.count}</span>
                    <span style={{ color: '#e11d48' }}>Likes: {city.totalLikes}</span>
                    <span style={{ color: '#059669' }}>Going: {city.totalGoingTo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Genre Distribution */}
            <div style={{ 
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Genre Distribution
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {analytics.genreDistribution.map(genre => (
                  <div key={genre.genre} style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--background-color)',
                    borderRadius: '0.375rem',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '500' }}>{genre.genre}</span>
                    <span>Festivals: {genre.count}</span>
                    <div style={{ 
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}>
                      {(genre.popularity * 100).toFixed(1)}% popularity
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Monthly Stats */}
            <div style={{ 
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Monthly Statistics
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {analytics.monthlyStats.map(stat => (
                  <div key={stat.month} style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--background-color)',
                    borderRadius: '0.375rem'
                  }}>
                    <span style={{ fontWeight: '500' }}>{stat.month}</span>
                    <span>Festivals: {stat.festivals}</span>
                    <span style={{ color: '#e11d48' }}>Likes: {stat.likes}</span>
                    <span style={{ color: '#059669' }}>Going: {stat.goingTo}</span>
                    <span>New Users: {stat.newUsers}</span>
                    <span>Active: {stat.activeUsers}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 