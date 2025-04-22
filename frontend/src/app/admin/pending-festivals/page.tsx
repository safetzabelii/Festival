'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
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
  createdBy: {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  };
  createdAt: string;
}

export default function PendingFestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const getImageUrl = (imageUrl: string) => {
    // If the imageUrl is already a full URL, return it as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // Otherwise, construct the full URL using the backend URL
    return `http://localhost:5000/${imageUrl}`;
  };

  useEffect(() => {
    const fetchPendingFestivals = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch('http://localhost:5000/api/admin/pending-festivals', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch pending festivals');
        }

        const data = await response.json();
        setFestivals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingFestivals();
  }, []);

  const handleApprove = async (festivalId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`http://localhost:5000/api/festivals/approve/${festivalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve festival');
      }

      // Remove the approved festival from the list
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
        <h1 style={{ 
          fontSize: '2.25rem',
          fontWeight: 'bold',
          color: 'var(--text-color)',
          marginBottom: '2rem'
        }}>
          Pending Festivals
        </h1>

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
        ) : festivals.length > 0 ? (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {festivals.map(festival => (
              <div key={festival._id} style={{ 
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                padding: '1.5rem'
              }}>
                {festival.imageUrl && (
                  <div style={{ 
                    position: 'relative',
                    height: '12rem',
                    width: '100%',
                    marginBottom: '1rem'
                  }}>
                    <img
                      src={getImageUrl(festival.imageUrl)}
                      alt={festival.name}
                      style={{ 
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%',
                        borderRadius: '0.375rem'
                      }}
                    />
                  </div>
                )}
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
                  marginBottom: '0.5rem'
                }}>
                  {new Date(festival.startDate).toLocaleDateString()} - {new Date(festival.endDate).toLocaleDateString()}
                </p>
                <p style={{ 
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem'
                }}>
                  Created by: {festival.createdBy.name} ({festival.createdBy.email})
                  {festival.createdBy.isAdmin && (
                    <span style={{ 
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.25rem',
                      marginLeft: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      Admin
                    </span>
                  )}
                </p>
                <button
                  onClick={() => handleApprove(festival._id)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Approve Festival
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              No pending festivals to review
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 