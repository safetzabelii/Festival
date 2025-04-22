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
  imageUrl?: string;
}

// Add getImageUrl function
const getImageUrl = (url: string | undefined) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:5000/${url}`;
};

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  liked: Festival[];
  goingTo: Festival[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'liked' | 'going'>('liked');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && !user) {
      router.push('/login');
    } else {
      fetchProfile();
    }
  }, [authLoading, user, router]);

  if (loading || authLoading) {
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

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '80rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '3rem 1rem'
        }}>
          <div style={{ textAlign: 'center' }}>Profile not found</div>
        </div>
      </div>
    );
  }

  const formatLocation = (location: { city: string; country: string }) => {
    if (!location.city && !location.country) return 'Location not specified';
    if (!location.city) return location.country;
    if (!location.country) return location.city;
    return `${location.city}, ${location.country}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '80rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '3rem 1rem'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '6rem',
              height: '6rem',
              borderRadius: '50%',
              backgroundColor: '#E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ width: '3rem', height: '3rem', color: '#9CA3AF' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
            <div>
              <h1 style={{ 
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: 'var(--text-color)',
                marginBottom: '0.5rem'
              }}>
                {profile.name}
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>{profile.email}</p>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'flex',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setActiveTab('liked')}
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: activeTab === 'liked' ? 'var(--primary-color)' : 'white',
                color: activeTab === 'liked' ? 'white' : 'var(--text-color)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Liked Festivals
            </button>
            <button
              onClick={() => setActiveTab('going')}
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: activeTab === 'going' ? 'var(--primary-color)' : 'white',
                color: activeTab === 'going' ? 'white' : 'var(--text-color)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Going To
            </button>
          </div>

          <div style={{ padding: '2rem' }}>
            {activeTab === 'liked' ? (
              profile.liked.length > 0 ? (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '2rem'
                }}>
                  {profile.liked.map((festival) => (
                    <div
                      key={festival._id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden'
                      }}
                    >
                      {festival.imageUrl && (
                        <div style={{ position: 'relative', height: '12rem', width: '100%' }}>
                          <img
                            src={getImageUrl(festival.imageUrl)}
                            alt={festival.name}
                            style={{ 
                              objectFit: 'cover',
                              width: '100%',
                              height: '100%'
                            }}
                          />
                        </div>
                      )}
                      <div style={{ padding: '1.5rem' }}>
                        <h3 style={{ 
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          marginBottom: '0.5rem'
                        }}>
                          {festival.name}
                        </h3>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--text-secondary)',
                          marginBottom: '1rem'
                        }}>
                          <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{formatLocation(festival.location)}</span>
                        </div>
                        <Link
                          href={`/festivals/${festival._id}`}
                          className="btn btn-primary"
                          style={{ display: 'inline-block' }}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No liked festivals yet
                </p>
              )
            ) : (
              profile.goingTo.length > 0 ? (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '2rem'
                }}>
                  {profile.goingTo.map((festival) => (
                    <div
                      key={festival._id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden'
                      }}
                    >
                      {festival.imageUrl && (
                        <div style={{ position: 'relative', height: '12rem', width: '100%' }}>
                          <img
                            src={getImageUrl(festival.imageUrl)}
                            alt={festival.name}
                            style={{ 
                              objectFit: 'cover',
                              width: '100%',
                              height: '100%'
                            }}
                          />
                        </div>
                      )}
                      <div style={{ padding: '1.5rem' }}>
                        <h3 style={{ 
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          marginBottom: '0.5rem'
                        }}>
                          {festival.name}
                        </h3>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--text-secondary)',
                          marginBottom: '1rem'
                        }}>
                          <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{formatLocation(festival.location)}</span>
                        </div>
                        <Link
                          href={`/festivals/${festival._id}`}
                          className="btn btn-primary"
                          style={{ display: 'inline-block' }}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No festivals you're going to yet
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 