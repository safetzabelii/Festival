'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, loading: authLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.nav 
      className="h-16 border-b-[3px] border-[#FF7A00]/30 bg-black/90 backdrop-blur-sm fixed w-full z-50"
      initial={false}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link 
          href="/" 
          prefetch={true}
          className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#FF7A00] via-[#FFD600] to-[#FF3366] text-transparent bg-clip-text hover:opacity-80 transition-opacity lowercase"
        >
          festivalsphere
        </Link>

        <div className="flex items-center gap-8">
          <Link 
            href="/festivals" 
            prefetch={true}
            className="text-lg font-black tracking-tighter lowercase text-white hover:text-[#FFD600] transition-colors"
          >
            festivals
          </Link>
          
          <Link 
            href="/discussions" 
            prefetch={true}
            className="text-lg font-black tracking-tighter lowercase text-white hover:text-[#FFD600] transition-colors"
          >
            discussions
          </Link>
          
          {mounted && !authLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-8">
                  {user.isAdmin && (
                    <Link 
                      href="/admin/dashboard" 
                      prefetch={true}
                      className="text-lg font-black tracking-tighter lowercase text-white hover:text-[#FFD600] transition-colors"
                    >
                      admin
                    </Link>
                  )}
                  <Link 
                    href="/profile" 
                    prefetch={true}
                    className="text-lg font-black tracking-tighter lowercase text-white hover:text-[#FF3366] transition-colors"
                  >
                    profile
                  </Link>
                  <button
                    onClick={logout}
                    className="text-lg font-black tracking-tighter lowercase text-[#FF7A00] border-[3px] border-[#FF7A00] px-6 py-2 hover:bg-[#FF7A00] hover:text-black transition-all duration-300"
                  >
                    logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <Link 
                    href="/login"
                    prefetch={true}
                    className="text-lg font-black tracking-tighter lowercase text-[#FFD600] hover:text-[#FF7A00] transition-colors"
                  >
                    login
                  </Link>
                  <Link 
                    href="/register"
                    prefetch={true}
                    className="text-lg font-black tracking-tighter lowercase text-[#FF3366] border-[3px] border-[#FF3366] px-6 py-2 hover:bg-[#FF3366] hover:text-black transition-all duration-300"
                  >
                    register
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
} 