'use client';

import { useEffect, useState } from 'react';
import FestivalCard from '@/components/FestivalCard';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

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
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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

    fetchFestivals();
  }, []);

  if (loading) {
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

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Background gradients */}
      <motion.div 
        className="fixed inset-0 overflow-hidden opacity-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-[#FF7A00] rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#FF3366] rounded-full blur-[120px]"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-[#FFD600] rounded-full blur-[130px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </motion.div>

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
              >
                {festival.imageUrl && (
                  <div className="relative w-full h-[250px]">
                    <Image
                      src={getImageUrl(festival.imageUrl)}
                      alt={festival.name}
                      fill
                      className="object-cover"
                      onError={() => {
                        console.error(`Failed to load image for festival: ${festival._id}`);
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