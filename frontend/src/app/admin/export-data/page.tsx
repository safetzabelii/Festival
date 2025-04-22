'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ExportDataPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'week'>('all');
  const { user } = useAuth();
  const router = useRouter();

  const handleExport = async (type: 'festivals' | 'users' | 'all') => {
    try {
      setLoading(type);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`http://localhost:5000/api/admin/export/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          format,
          dateRange,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        if (response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('Server error: Please check if the backend server is running');
        }
        const errorData = await response.json().catch(() => ({ message: `Failed to export ${type}` }));
        throw new Error(errorData.message || `Failed to export ${type}`);
      }

      const contentType = response.headers.get('Content-Type');
      let blob;
      
      try {
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid data received from server');
          }
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        } else if (contentType?.includes('text/csv')) {
          const text = await response.text();
          if (!text.trim()) {
            throw new Error('Empty CSV data received from server');
          }
          blob = new Blob([text], { type: 'text/csv' });
        } else {
          throw new Error('Unsupported export format');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = format === 'json' ? 'json' : 'csv';
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `${type}_export_${dateRange}_${timestamp}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Export processing error:', err);
        throw new Error('Failed to process export data');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while exporting data');
    } finally {
      setLoading(null);
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
        maxWidth: '48rem',
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
          Export Data
        </h1>

        <div style={{ 
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            Export Settings
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Format</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setFormat('json')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: format === 'json' ? 'var(--primary-color)' : 'white',
                    color: format === 'json' ? 'white' : 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  JSON
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: format === 'csv' ? 'var(--primary-color)' : 'white',
                    color: format === 'csv' ? 'white' : 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  CSV
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date Range</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setDateRange('all')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: dateRange === 'all' ? 'var(--primary-color)' : 'white',
                    color: dateRange === 'all' ? 'white' : 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: dateRange === 'month' ? 'var(--primary-color)' : 'white',
                    color: dateRange === 'month' ? 'white' : 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  Last Month
                </button>
                <button
                  onClick={() => setDateRange('week')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: dateRange === 'week' ? 'var(--primary-color)' : 'white',
                    color: dateRange === 'week' ? 'white' : 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  Last Week
                </button>
              </div>
            </div>
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

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              Festival Data
            </h2>
            <p style={{ 
              color: 'var(--text-secondary)',
              marginBottom: '1rem'
            }}>
              Export festival data including:
            </p>
            <ul style={{ 
              listStyle: 'disc',
              marginLeft: '1.5rem',
              marginBottom: '1.5rem',
              color: 'var(--text-secondary)'
            }}>
              <li>Basic festival information (name, date, location)</li>
              <li>Attendance and likes statistics</li>
              <li>Genre and category distribution</li>
              <li>User interactions and engagement</li>
            </ul>
            <button
              onClick={() => handleExport('festivals')}
              disabled={loading === 'festivals'}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading === 'festivals' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%'
              }}
            >
              {loading === 'festivals' ? (
                <>
                  <div style={{ width: '20px', height: '20px' }}>
                    <LoadingSpinner />
                  </div>
                  <span>Exporting...</span>
                </>
              ) : (
                'Export Festivals'
              )}
            </button>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              User Data
            </h2>
            <p style={{ 
              color: 'var(--text-secondary)',
              marginBottom: '1rem'
            }}>
              Export user data including:
            </p>
            <ul style={{ 
              listStyle: 'disc',
              marginLeft: '1.5rem',
              marginBottom: '1.5rem',
              color: 'var(--text-secondary)'
            }}>
              <li>User profiles and preferences</li>
              <li>Activity history and engagement metrics</li>
              <li>Festival interactions (likes, going to)</li>
              <li>Account status and roles</li>
            </ul>
            <button
              onClick={() => handleExport('users')}
              disabled={loading === 'users'}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading === 'users' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%'
              }}
            >
              {loading === 'users' ? (
                <>
                  <div style={{ width: '20px', height: '20px' }}>
                    <LoadingSpinner />
                  </div>
                  <span>Exporting...</span>
                </>
              ) : (
                'Export Users'
              )}
            </button>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              Complete Export
            </h2>
            <p style={{ 
              color: 'var(--text-secondary)',
              marginBottom: '1rem'
            }}>
              Export all platform data including:
            </p>
            <ul style={{ 
              listStyle: 'disc',
              marginLeft: '1.5rem',
              marginBottom: '1.5rem',
              color: 'var(--text-secondary)'
            }}>
              <li>All festival and user data</li>
              <li>Relationship mappings and interactions</li>
              <li>System configurations and settings</li>
              <li>Analytics and statistics</li>
            </ul>
            <button
              onClick={() => handleExport('all')}
              disabled={loading === 'all'}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading === 'all' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%'
              }}
            >
              {loading === 'all' ? (
                <>
                  <div style={{ width: '20px', height: '20px' }}>
                    <LoadingSpinner />
                  </div>
                  <span>Exporting...</span>
                </>
              ) : (
                'Export All Data'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 