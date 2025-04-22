'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PendingFestival {
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
  createdBy: {
    _id: string;
    username: string;
  };
  status: 'pending' | 'approved' | 'rejected';
}

export default function PendingFestivalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [festivals, setFestivals] = useState<PendingFestival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingFestivals = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/admin/pending-festivals', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch pending festivals');
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

  const handleApproval = async (festivalId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/admin/festivals/${festivalId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} festival`);
      }

      // Update the local state to remove the processed festival
      setFestivals(prev => prev.filter(festival => festival._id !== festivalId));
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
        <h1 className="text-4xl font-black tracking-tighter text-white text-center mb-4">
          Pending Festivals
        </h1>
        <p className="text-lg text-[#FFB4A2] text-center mb-8 font-black tracking-tight lowercase">
          review and approve festivals
        </p>

        {error && (
          <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF3366]/20 rounded-xl p-4 mb-8 text-[#FF3366] text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {festivals.length === 0 ? (
            <div className="text-center text-[#FFB4A2] text-xl">No pending festivals to review</div>
          ) : (
            festivals.map(festival => (
              <div key={festival._id} className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter text-[#FFB4A2] mb-2">{festival.name}</h2>
                    <p className="text-[#FFB4A2]">Submitted by: {festival.createdBy.username}</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApproval(festival._id, 'approve')}
                      className="px-6 py-2 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FFD600] transition-all duration-300"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(festival._id, 'reject')}
                      className="px-6 py-2 bg-[#FF3366] text-white font-black tracking-tighter rounded-lg hover:bg-[#FF7A00] hover:text-black transition-all duration-300"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[#FFB4A2] mb-4">{festival.description}</p>
                    <div className="space-y-2">
                      <p className="text-[#FFB4A2]">
                        <span className="font-black">Location:</span> {festival.location.city}, {festival.location.country}
                      </p>
                      <p className="text-[#FFB4A2]">
                        <span className="font-black">Dates:</span> {new Date(festival.startDate).toLocaleDateString()} - {new Date(festival.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-[#FFB4A2]">
                        <span className="font-black">Genre:</span> {festival.genre}
                      </p>
                      <p className="text-[#FFB4A2]">
                        <span className="font-black">Price:</span> {festival.isFree ? 'Free' : `$${festival.price}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
} 