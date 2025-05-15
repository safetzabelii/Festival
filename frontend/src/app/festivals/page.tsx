'use client';

import { useEffect, useState, useRef } from 'react';
import FestivalCard from '@/components/FestivalCard';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import { FaSignInAlt, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

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
  imageUrl?: string;
  likes: number;
  goingTo: number;
}

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:5000/${url}`;
};

export default function FestivalsPage() {
  const router = useRouter();
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [likedFestivals, setLikedFestivals] = useState<Set<string>>(new Set());
  const [goingToFestivals, setGoingToFestivals] = useState<Set<string>>(new Set());
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');
  const loginPromptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/festivals');
        if (!response.ok) {
          throw new Error('Failed to fetch festivals');
        }
        const data = await response.json();
        
        const processedData = data.map((festival: any) => ({
          ...festival,
          location: {
            city: festival.location?.city || '',
            country: festival.location?.country || ''
          }
        }));
        
        setFestivals(processedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        const likedFestivals = data.liked.map((item: any) => 
          typeof item === 'object' ? item._id : item
        );
        const goingToFestivals = data.goingTo.map((item: any) => 
          typeof item === 'object' ? item._id : item
        );

        setLikedFestivals(new Set(likedFestivals));
        setGoingToFestivals(new Set(goingToFestivals));
      } catch (err) {
        setError('Failed to load user preferences');
      }
    };

    fetchFestivals();
    fetchUserData();
  }, []);

  // Handle clicks outside the login prompt
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

  const handleAction = async (festivalId: string, type: 'like' | 'going') => {
    setIsActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoginPromptMessage(`You need to be logged in to ${type === 'like' ? 'like' : 'attend'} festivals.`);
        setShowLoginPrompt(true);
        setIsActionLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/me/${type === 'like' ? 'liked' : 'going'}/${festivalId}`, {
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

      const data = await response.json();
      
      if (type === 'like') {
        setLikedFestivals(prev => {
          const newSet = new Set(prev);
          if (newSet.has(festivalId)) {
            newSet.delete(festivalId);
          } else {
            newSet.add(festivalId);
          }
          return newSet;
        });
        setFestivals(prev => prev.map(festival => 
          festival._id === festivalId 
            ? { ...festival, likes: data.festivalLikes }
            : festival
        ));
      } else {
        setGoingToFestivals(prev => {
          const newSet = new Set(prev);
          if (newSet.has(festivalId)) {
            newSet.delete(festivalId);
          } else {
            newSet.add(festivalId);
          }
          return newSet;
        });
        setFestivals(prev => prev.map(festival => 
          festival._id === festivalId 
            ? { ...festival, goingTo: data.festivalGoingTo }
            : festival
        ));
      }
    } catch (err) {
      setError('Action failed. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center p-8 bg-black/40 backdrop-blur-sm border border-[#FF3366]/30 rounded-lg">
            <h2 className="text-3xl font-black tracking-tighter lowercase text-[#FF3366] mb-4">
              error
            </h2>
            <p className="text-[#FFB4A2]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300"
            >
              try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-black via-black to-[#FF7A00]/20">
      <Navbar />
      
      <div className="fixed inset-0 bg-[#FF7A00]/5 backdrop-blur-3xl pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-8xl font-black tracking-tighter lowercase text-center mb-4 bg-gradient-to-r from-[#FF7A00] via-[#FFD600] to-[#FF3366] text-transparent bg-clip-text">
            festivals
          </h1>
          <p className="text-2xl text-[#FFB4A2] text-center mb-16 font-black tracking-tight lowercase">
            discover your next adventure
          </p>
        </motion.div>

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
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
          </motion.div>
        )}

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {festivals.map((festival, index) => (
            <motion.div
              key={festival._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FestivalCard
                id={festival._id}
                name={festival.name}
                description={festival.description}
                location={festival.location}
                startDate={festival.startDate}
                endDate={festival.endDate}
                imageUrl={festival.imageUrl}
                likes={festival.likes}
                goingTo={festival.goingTo}
                onLike={() => handleAction(festival._id, 'like')}
                onGoing={() => handleAction(festival._id, 'going')}
                isLiked={likedFestivals.has(festival._id)}
                isGoing={goingToFestivals.has(festival._id)}
                isActionLoading={isActionLoading}
              >
                {festival.imageUrl && (
                  <div className="relative w-full h-[250px]">
                    <Image
                      src={getImageUrl(festival.imageUrl)}
                      alt={festival.name}
                      fill
                      className="object-cover"
                      onError={() => {
                        setImageErrors(prev => ({ ...prev, [festival._id]: true }));
                      }}
                      unoptimized
                    />
                  </div>
                )}
              </FestivalCard>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
} 