'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    discover: false,
    create: false,
    connect: false
  });
  const router = useRouter();

  useEffect(() => {
    setShowLoginButton(!loading && !user);
  }, [loading, user]);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const handleNavigation = (path: string, card: 'discover' | 'create' | 'connect') => {
    setLoadingStates(prev => ({ ...prev, [card]: true }));
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background noise effect */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.08] mix-blend-overlay pointer-events-none" />
        
        {/* Animated gradients */}
        <motion.div 
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1 }}
        >
          {/* Sunset gradient */}
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
          {/* Summer pink accent */}
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
          {/* Yellow sun glow */}
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

        <div className="relative z-10 max-w-7xl w-full px-4 py-20">
          <motion.div 
            className="text-center mb-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-[180px] font-black tracking-tighter">
              <motion.span 
                className="block text-[#FF7A00] mix-blend-difference lowercase"
                animate={{ 
                  opacity: [1, 0.9, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                festival
              </motion.span>
              <motion.span 
                className="block -mt-32 mb-8 lowercase bg-gradient-to-r from-[#FF3366] via-[#FFD600] to-[#FF7A00] text-transparent bg-clip-text relative z-10"
                animate={{ 
                  opacity: [1, 0.9, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2
                }}
              >
                sphere
              </motion.span>
            </h1>
            <p className="text-3xl text-[#FFB4A2] lowercase tracking-tight font-black -mt-10">
              your ultimate festival experience
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Discover Card */}
            <motion.div 
              className="group relative"
              variants={fadeIn}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A00] to-[#FFD600] opacity-0 group-hover:opacity-100 mix-blend-overlay transition-all duration-500" />
              <div className="border-2 border-[#FF7A00]/30 bg-black/50 backdrop-blur-sm p-8 h-full transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">
                <h2 className="text-4xl font-black mb-4 lowercase tracking-tighter text-[#FF7A00]">discover</h2>
                <p className="text-[#FFB4A2] mb-8 lowercase tracking-tight text-lg">find the best festivals around the world</p>
                <button 
                  onClick={() => handleNavigation('/festivals', 'discover')}
                  disabled={loadingStates.discover}
                  className="inline-block border-[3px] border-[#FF7A00] text-[#FF7A00] px-8 py-3 hover:bg-[#FF7A00] hover:text-black transition-all duration-300 lowercase tracking-tight text-xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingStates.discover ? (
                    <div className="w-6 h-6 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : 'browse'}
                </button>
              </div>
            </motion.div>

            {/* Create Card */}
            <motion.div 
              className="group relative"
              variants={fadeIn}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF3366] to-[#FF7A00] opacity-0 group-hover:opacity-100 mix-blend-overlay transition-all duration-500" />
              <div className="border-2 border-[#FF3366]/30 bg-black/50 backdrop-blur-sm p-8 h-full transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">
                <h2 className="text-4xl font-black mb-4 lowercase tracking-tighter text-[#FF3366]">create</h2>
                <p className="text-[#FFB4A2] mb-8 lowercase tracking-tight text-lg">share your festival with the world</p>
                <button 
                  onClick={() => handleNavigation('/create-festival', 'create')}
                  disabled={loadingStates.create}
                  className="inline-block border-[3px] border-[#FF3366] text-[#FF3366] px-8 py-3 hover:bg-[#FF3366] hover:text-black transition-all duration-300 lowercase tracking-tight text-xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingStates.create ? (
                    <div className="w-6 h-6 border-2 border-[#FF3366] border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : 'start'}
                </button>
              </div>
            </motion.div>

            {/* Connect Card */}
            <motion.div 
              className="group relative"
              variants={fadeIn}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD600] to-[#FF7A00] opacity-0 group-hover:opacity-100 mix-blend-overlay transition-all duration-500" />
              <div className="border-2 border-[#FFD600]/30 bg-black/50 backdrop-blur-sm p-8 h-full transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">
                <h2 className="text-4xl font-black mb-4 lowercase tracking-tighter text-[#FFD600]">connect</h2>
                <p className="text-[#FFB4A2] mb-8 lowercase tracking-tight text-lg">meet fellow festival-goers</p>
                {showLoginButton && (
                  <button 
                    onClick={() => handleNavigation('/login', 'connect')}
                    disabled={loadingStates.connect}
                    className="inline-block border-[3px] border-[#FFD600] text-[#FFD600] px-8 py-3 hover:bg-[#FFD600] hover:text-black transition-all duration-300 lowercase tracking-tight text-xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStates.connect ? (
                      <div className="w-6 h-6 border-2 border-[#FFD600] border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : 'join'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
