'use client';

import { useState } from 'react';
import { insertFestivals } from '@/scripts/insertFestivals';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function InsertFestivalsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleInsert = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await insertFestivals();
      setMessage('Festivals inserted successfully!');
    } catch (error) {
      setMessage('Error inserting festivals. Please check the console for details.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '48rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '3rem 1rem'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: 'var(--text-color)',
            marginBottom: '2rem'
          }}>
            Insert Sample Festivals
          </h1>
          
          {message && (
            <div style={{ 
              backgroundColor: message.includes('Error') ? '#fef2f2' : '#f0fdf4',
              color: message.includes('Error') ? '#dc2626' : '#16a34a',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              {message}
            </div>
          )}

          <button
            onClick={handleInsert}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9CA3AF' : 'var(--primary-color)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '20px', height: '20px' }}>
                  <LoadingSpinner />
                </div>
                Inserting Festivals...
              </>
            ) : (
              'Insert All Festivals'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 