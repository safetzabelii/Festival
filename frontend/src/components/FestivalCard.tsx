'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDate } from '@/utils/dateUtils';

interface Location {
  city: string;
  country: string;
}

interface FestivalCardProps {
  id: string;
  name: string;
  description: string;
  location: Location;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  likes?: number;
  goingTo?: number;
  children?: React.ReactNode;
}

const FestivalCard: React.FC<FestivalCardProps> = ({
  id,
  name,
  description,
  location,
  startDate,
  endDate,
  imageUrl,
  likes = 0,
  goingTo = 0,
  children
}) => {
  // Safely format location with fallback
  const formatLocation = (loc: Location | undefined) => {
    if (!loc) return 'Location not specified';
    if (!loc.city && !loc.country) return 'Location not specified';
    if (!loc.city) return loc.country;
    if (!loc.country) return loc.city;
    return `${loc.city}, ${loc.country}`;
  };

  return (
    <motion.div 
      className="group relative overflow-hidden bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl"
      whileHover={{ translateY: -5 }}
      transition={{ duration: 0.2 }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A00]/0 to-[#FF3366]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Image container */}
      <div className="relative w-full overflow-hidden">
        {children}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative p-6">
        <h2 className="text-2xl font-black tracking-tighter text-white mb-2 group-hover:text-[#FFD600] transition-colors duration-300">
          {name}
        </h2>
        
        <p className="text-[#FFB4A2] text-base mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-2 mb-3 text-[#FFB4A2]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="text-sm">{formatLocation(location)}</span>
        </div>

        <div className="flex items-center gap-2 mb-6 text-[#FFB4A2]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-sm">{formatDate(startDate)} - {formatDate(endDate)}</span>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="flex items-center gap-1 text-[#FF3366]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            {likes}
          </span>
          <span className="flex items-center gap-1 text-[#FFD600]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.745 6.745 0 011.019-4.381z" clipRule="evenodd" />
              <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
            </svg>
            {goingTo}
          </span>
        </div>

        <Link 
          href={`/festivals/${id}`}
          className="block w-full text-center py-3 px-6 bg-[#FF7A00] hover:bg-[#FF3366] text-black font-black tracking-tight transition-colors duration-300 rounded-lg"
        >
          view details
        </Link>
      </div>
    </motion.div>
  );
};

export default FestivalCard; 