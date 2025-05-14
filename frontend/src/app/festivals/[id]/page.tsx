'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import Discussion from '@/components/Discussion';
import { FaTimes, FaSignInAlt } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import api from '@/services/api';

interface Location {
  city: string;
  country: string;
}

interface Festival {
  _id: string;
  name: string;
  description: string;
  location: Location;
  startDate: string;
  endDate: string;
  genre: string;
  price: number;
  isFree: boolean;
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
  };
  imageUrl?: string;
  lineup?: string[];
  likes: number;
  goingTo: number;
}

export default function FestivalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isGoing, setIsGoing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');
  const loginPromptRef = useRef<HTMLDivElement>(null);

  const formatLocation = (loc: Location | undefined) => {
    if (!loc) return 'Location not specified';
    if (!loc.city && !loc.country) return 'Location not specified';
    if (!loc.city) return loc.country;
    if (!loc.country) return loc.city;
    return `${loc.city}, ${loc.country}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAction = async (type: 'like' | 'going') => {
    if (!festival) return;
    
    setIsActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoginPromptMessage('You need to be logged in to interact with festivals.');
        setShowLoginPrompt(true);
        setIsActionLoading(false);
        return;
      }

      const response = await api.get(`/api/users/me/${type === 'like' ? 'liked' : 'going'}/${festival._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          setLoginPromptMessage('Your session has expired. Please login again.');
          setShowLoginPrompt(true);
          return;
        }
        throw new Error(errorData.message || 'Failed to perform action');
      }

      const data = response.data;
      
      if (type === 'like') {
        setIsLiked(!isLiked);
        setFestival(prev => prev ? {
          ...prev,
          likes: data.festivalLikes
        } : null);
      } else {
        setIsGoing(!isGoing);
        setFestival(prev => prev ? {
          ...prev,
          goingTo: data.festivalGoingTo
        } : null);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginPromptRef.current && !loginPromptRef.current.contains(event.target as Node)) {
        setShowLoginPrompt(false);
      }
    };

    if (showLoginPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLoginPrompt]);

  useEffect(() => {
    const fetchFestival = async () => {
      try {
        if (!params || !params.id) return;
        
        const response = await api.get(`/api/festivals/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch festival');
        }
        const data = response.data;
        setFestival(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      if (!params || !params.id) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(getImageUrl(imageUrl), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = response.data;
        const likedFestivals = data.liked.map((item: any) => 
          typeof item === 'object' ? item._id : item
        );
        const goingToFestivals = data.goingTo.map((item: any) => 
          typeof item === 'object' ? item._id : item
        );

        const festivalId = params.id as string;
        setIsLiked(likedFestivals.includes(festivalId));
        setIsGoing(goingToFestivals.includes(festivalId));
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchFestival();
    fetchUserData();
  }, [params]);

  const handleLogin = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#FF7A00]/20">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <motion.div
              className="inline-block w-16 h-16 border-4 border-[#FF7A00] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !festival) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#FF7A00]/20">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center text-[#FF3366]">
            Error: {error || 'Festival not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#FF7A00]/20">
      <Navbar />
      
      <div className="fixed inset-0 bg-[#FF7A00]/5 backdrop-blur-3xl pointer-events-none" />

      {/* Login Prompt Modal */}
      {showLoginPrompt && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center px-4"
        >
          <motion.div 
            ref={loginPromptRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/90 border border-[#FF7A00]/40 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#FFB4A2]">login required</h2>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="text-[#FFB4A2] hover:text-[#FF3366] transition-colors rounded-full w-8 h-8 flex items-center justify-center bg-black/30"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[#FFB4A2] mb-6">
              {loginPromptMessage || 'You need to be logged in to interact with festivals.'}
            </p>
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300 flex items-center gap-2 w-full justify-center"
            >
              <FaSignInAlt className="w-4 h-4" />
              <span>login now</span>
            </button>
          </motion.div>
        </motion.div>,
        document.body
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl"
        >
          {festival.imageUrl && (
            <div className="relative h-[400px] w-full">
              <motion.img
                src={getImageUrl(imageUrl)}
                alt={festival.name}
                className="w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
          )}

          <div className="p-10 md:p-10">
            <motion.h1 
              className="text-4xl md:text-8xl font-black tracking-tighter lowercase leading-normal mb-10 py-3 bg-gradient-to-r from-[#FF7A00] via-[#FFD600] to-[#FF3366] text-transparent bg-clip-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {festival.name}
            </motion.h1>

            <motion.div 
              className="flex flex-wrap gap-6 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleAction('like')}
                  disabled={isActionLoading}
                  className={`px-5 py-3 rounded-lg font-black tracking-tight text-lg transition-all duration-300 ${
                    isLiked 
                      ? 'bg-[#FF3366] text-white hover:bg-[#FF3366]/80' 
                      : 'bg-[#FF7A00] text-black hover:bg-[#FF3366]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    {isLiked ? 'Liked' : 'Like'}
                  </span>
                </button>
                <span className="text-[#FFB4A2] text-lg">
                  {festival.likes} {festival.likes === 1 ? 'Like' : 'Likes'}
                </span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleAction('going')}
                  disabled={isActionLoading}
                  className={`px-6 py-3 rounded-lg font-black tracking-tight text-lg transition-all duration-300 ${
                    isGoing 
                      ? 'bg-[#FFD600] text-black hover:bg-[#FFD600]/80' 
                      : 'bg-[#FF7A00] text-black hover:bg-[#FFD600]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    {isGoing ? 'Going' : 'Attend'}
                  </span>
                </button>
                <span className="text-[#FFB4A2] text-lg">
                  {festival.goingTo} {festival.goingTo === 1 ? 'Attendee' : 'Attendees'}
                </span>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h2 className="text-3xl font-black tracking-tighter text-[#FFD600] mb-4 lowercase">
                  About
                </h2>
                <p className="text-[#FFB4A2] text-lg leading-relaxed mb-8">
                  {festival.description}
                </p>

                <div className="space-y-4 text-[#FFB4A2]">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#FF7A00]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="text-lg">{formatLocation(festival.location)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#FF7A00]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span className="text-lg">{formatDate(festival.startDate)} - {formatDate(festival.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#FF7A00]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                    <span className="text-lg">{festival.genre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#FF7A00]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                    <span className="text-lg">{festival.isFree ? 'Free Entry' : `$${festival.price}`}</span>
                  </div>
                </div>
              </motion.div>

              {festival.lineup && festival.lineup.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <h2 className="text-3xl font-black tracking-tighter text-[#FFD600] mb-6 lowercase">
                    Lineup
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {festival.lineup.map((artist, index) => (
                      <motion.div
                        key={index}
                        className="bg-[#FF7A00]/10 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-4 text-[#FFB4A2]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        {artist}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {festival.website && (
              <motion.div
                className="mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <a 
                  href={festival.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#FFD600] hover:text-[#FF7A00] transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  <span className="text-lg font-black tracking-tight">Visit Website</span>
                </a>
              </motion.div>
            )}

            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Discussion festivalId={festival._id} />
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 