'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ProfileSettings from '@/components/ProfileSettings';

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
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'liked' | 'going' | 'settings'>('liked');

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

  useEffect(() => {
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

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    setLoading(true);
    await fetchProfile();
    setLoading(false);
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
              {profile?.avatar ? (
                <Image
                  src={getImageUrl(profile.avatar)}
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
                {profile?.name}
              </h2>
              <div className="flex gap-4 mt-2">
                {profile?.socialLinks?.instagram && (
                  <a
                    href={`https://instagram.com/${profile.socialLinks.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#FFB4A2] hover:text-[#FF7A00] font-bold"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>
                    @{profile.socialLinks.instagram}
                  </a>
                )}
                {profile?.socialLinks?.twitter && (
                  <a
                    href={`https://twitter.com/${profile.socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#FFB4A2] hover:text-[#FF7A00] font-bold"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.4.36a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03C7.69 5.4 4.07 3.7 1.64 1.15c-.38.65-.6 1.4-.6 2.2 0 1.52.77 2.86 1.94 3.65A4.48 4.48 0 0 1 .96 6v.06c0 2.13 1.52 3.91 3.54 4.31-.37.1-.76.16-1.16.16-.28 0-.55-.03-.81-.08.55 1.72 2.16 2.97 4.07 3A9.05 9.05 0 0 1 0 19.54a12.8 12.8 0 0 0 6.92 2.03c8.3 0 12.84-6.88 12.84-12.84 0-.2 0-.39-.01-.58A9.22 9.22 0 0 0 23 3z"/></svg>
                    @{profile.socialLinks.twitter}
                  </a>
                )}
                {profile?.socialLinks?.website && (
                  <a
                    href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#FFB4A2] hover:text-[#FF7A00] font-bold"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
                    Website
                  </a>
                )}
              </div>
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
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-4 text-lg font-black tracking-tighter transition-colors duration-300 ${
                activeTab === 'settings'
                  ? 'bg-[#FF7A00] text-black'
                  : 'text-[#FFB4A2] hover:text-[#FFD600]'
              }`}
            >
              Settings
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'settings' ? (
              profile && <ProfileSettings profile={profile} onUpdate={handleProfileUpdate} />
            ) : activeTab === 'liked' ? (
              profile?.liked.length > 0 ? (
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
                <div className="text-center text-[#FFB4A2] py-8">
                  No liked festivals yet
                </div>
              )
            ) : (
              profile?.goingTo.length > 0 ? (
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
                <div className="text-center text-[#FFB4A2] py-8">
                  Not going to any festivals yet
                </div>
              )
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
} 