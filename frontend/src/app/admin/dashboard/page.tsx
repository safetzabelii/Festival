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
      console.log('Admin stats data:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up event listeners for stats updates
    const handleLikeUpdate = (event: any) => {
      console.log('Like update event received:', event.detail);
      if (stats) {
        setStats({
          ...stats,
          totalLikes: event.detail.totalLikes
        });
      }
    };

    const handleGoingUpdate = (event: any) => {
      console.log('Going update event received:', event.detail);
      if (stats) {
        setStats({
          ...stats,
          totalGoingTo: event.detail.totalGoingTo
        });
      }
    };

    window.addEventListener('festivalLikeUpdate', handleLikeUpdate);
    window.addEventListener('festivalGoingUpdate', handleGoingUpdate);

    return () => {
      window.removeEventListener('festivalLikeUpdate', handleLikeUpdate);
      window.removeEventListener('festivalGoingUpdate', handleGoingUpdate);
    };
  }, []);

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '80rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '3rem 1rem'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.25rem',
            fontWeight: 'bold',
            color: 'var(--text-color)',
            marginBottom: '1rem'
          }}>
            Admin Dashboard
          </h1>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'overview' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'overview' ? 'white' : 'var(--text-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('festivals')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'festivals' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'festivals' ? 'white' : 'var(--text-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Festivals
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'tools' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'tools' ? 'white' : 'var(--text-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Admin Tools
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {activeTab === 'overview' && stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Total Festivals</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.totalFestivals}</p>
                </div>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Pending Approval</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{stats.pendingApproval}</p>
                </div>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Total Likes</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e11d48' }}>{stats.totalLikes}</p>
                </div>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Total Going</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{stats.totalGoingTo}</p>
                </div>
              </div>
            )}

            {activeTab === 'festivals' && (
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>All Festivals</h2>
                  <Link
                    href="/create-festival"
                    style={{
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      textDecoration: 'none'
                    }}
                  >
                    Create New Festival
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {festivals.map(festival => (
                    <div key={festival._id} style={{ 
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      padding: '1rem'
                    }}>
                      <h3 style={{ 
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem'
                      }}>
                        {festival.name}
                      </h3>
                      <p style={{ 
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem'
                      }}>
                        {festival.location.city}, {festival.location.country}
                      </p>
                      <p style={{ 
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem'
                      }}>
                        {new Date(festival.startDate).toLocaleDateString()} - {new Date(festival.endDate).toLocaleDateString()}
                      </p>
                      <div style={{ 
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ color: '#e11d48' }}>♥ {festival.likes || 0}</span>
                        <span style={{ color: '#059669' }}>👥 {festival.goingTo || 0}</span>
                      </div>
                      <div style={{ 
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <Link
                          href={`/festivals/${festival._id}/edit`}
                          style={{
                            flex: 1,
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            textAlign: 'center',
                            textDecoration: 'none'
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(festival._id)}
                          style={{
                            flex: 1,
                            backgroundColor: '#dc2626',
                            color: 'white',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer'
                          }}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <Link
                  href="/admin/pending-festivals"
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    textDecoration: 'none',
                    color: 'var(--text-color)'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Pending Festivals</h3>
                  <p>Review and approve festivals created by non-admin users</p>
                </Link>
                <Link
                  href="/admin/export-data"
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    textDecoration: 'none',
                    color: 'var(--text-color)'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Export Data</h3>
                  <p>Download festival and user data</p>
                </Link>
                <Link
                  href="/admin/analytics"
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    textDecoration: 'none',
                    color: 'var(--text-color)'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Analytics</h3>
                  <p>View detailed festival statistics and trends</p>
                </Link>
                <Link
                  href="/admin/user-management"
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    textDecoration: 'none',
                    color: 'var(--text-color)'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>User Management</h3>
                  <p>Manage user roles and permissions</p>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 