'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center text-[#FF3366]">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center text-[#FFB4A2]">Profile not found</div>
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
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#FF7A00]/20">
      <Navbar />
      
      <div className="fixed inset-0 bg-[#FF7A00]/5 backdrop-blur-3xl pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-8xl font-black tracking-tighter lowercase text-center mb-4 bg-gradient-to-r from-[#FF7A00] via-[#FFD600] to-[#FF3366] text-transparent bg-clip-text">
            profile
          </h1>
          <p className="text-2xl text-[#FFB4A2] text-center mb-16 font-black tracking-tight lowercase">
            your festival journey
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-8 mb-8"
        >
          <div className="flex items-center gap-8">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF7A00]">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#FF7A00]/20 flex items-center justify-center">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="w-12 h-12 text-[#FF7A00]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-white mb-2">
                {profile.name}
              </h2>
              <p className="text-[#FFB4A2] text-lg">{profile.email}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl overflow-hidden"
        >
          <div className="flex border-b border-[#FF7A00]/20">
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex-1 py-4 text-lg font-black tracking-tighter transition-colors duration-300 ${
                activeTab === 'liked'
                  ? 'bg-[#FF7A00] text-black'
                  : 'text-[#FFB4A2] hover:text-[#FFD600]'
              }`}
            >
              Liked Festivals
            </button>
            <button
              onClick={() => setActiveTab('going')}
              className={`flex-1 py-4 text-lg font-black tracking-tighter transition-colors duration-300 ${
                activeTab === 'going'
                  ? 'bg-[#FF7A00] text-black'
                  : 'text-[#FFB4A2] hover:text-[#FFD600]'
              }`}
            >
              Going To
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'liked' ? (
              profile.liked.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.liked.map((festival) => (
                    <motion.div
                      key={festival._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="group relative overflow-hidden bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl"
                    >
                      {festival.imageUrl && (
                        <div className="relative w-full h-48">
                          <Image
                            src={getImageUrl(festival.imageUrl)}
                            alt={festival.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <h3 className="text-2xl font-black tracking-tighter text-white mb-2 group-hover:text-[#FFD600] transition-colors duration-300">
                          {festival.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-4 text-[#FFB4A2]">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="text-sm">{formatLocation(festival.location)}</span>
                        </div>
                        <Link
                          href={`/festivals/${festival._id}`}
                          className="inline-block px-6 py-2 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF3366] hover:text-white transition-all duration-300"
                        >
                          View Details
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#FFB4A2] py-8">
                  No liked festivals yet
                </p>
              )
            ) : (
              profile.goingTo.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.goingTo.map((festival) => (
                    <motion.div
                      key={festival._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="group relative overflow-hidden bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl"
                    >
                      {festival.imageUrl && (
                        <div className="relative w-full h-48">
                          <Image
                            src={getImageUrl(festival.imageUrl)}
                            alt={festival.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <h3 className="text-2xl font-black tracking-tighter text-white mb-2 group-hover:text-[#FFD600] transition-colors duration-300">
                          {festival.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-4 text-[#FFB4A2]">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="text-sm">{formatLocation(festival.location)}</span>
                        </div>
                        <Link
                          href={`/festivals/${festival._id}`}
                          className="inline-block px-6 py-2 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF3366] hover:text-white transition-all duration-300"
                        >
                          View Details
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#FFB4A2] py-8">
                  No festivals you're going to yet
                </p>
              )
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
} 