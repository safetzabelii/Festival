'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-8xl font-black tracking-tighter lowercase text-center mb-12 pb-4 leading-none bg-gradient-to-r from-[#FF7A00] via-[#FFD600] to-[#FF3366] text-transparent bg-clip-text">
            register
          </h1>
          <p className="text-2xl text-[#FFB4A2] text-center mb-16 font-black tracking-tight lowercase -mt-8">
            join the festival journey
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-8">
            {error && (
              <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF3366]/20 rounded-xl p-4 mb-8 text-[#FF3366] text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="peer w-full bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-4 font-black tracking-tighter lowercase focus:border-[#FF7A00] focus:outline-none transition-colors text-white [appearance:textfield] [&::-webkit-credentials-auto-fill-button]:hidden [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_rgb(0,0,0)_inset] [&:-webkit-autofill]:[background-clip:content-box] [&:-webkit-autofill]:peer-[.peer-autofilled]"
                  placeholder=" "
                />
                <label
                  htmlFor="name"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB4A2]/60 font-black tracking-tighter lowercase transition-all duration-300 ease-out peer-focus:text-[#FFB4A2] peer-focus:-translate-y-[2.2rem] peer-focus:text-xs peer-[:not(:placeholder-shown)]:text-[#FFB4A2] peer-[:not(:placeholder-shown)]:-translate-y-[2.2rem] peer-[:not(:placeholder-shown)]:text-xs cursor-text bg-black px-1 peer-focus:bg-black peer-[:not(:placeholder-shown)]:bg-black peer-[.peer-autofilled]:-translate-y-[2.2rem] peer-[.peer-autofilled]:text-xs"
                >
                  name
                </label>
              </div>

              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                  className="peer w-full bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-4 font-black tracking-tighter lowercase focus:border-[#FF7A00] focus:outline-none transition-colors text-white [appearance:textfield] [&::-webkit-credentials-auto-fill-button]:hidden [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_rgb(0,0,0)_inset] [&:-webkit-autofill]:[background-clip:content-box] [&:-webkit-autofill]:peer-[.peer-autofilled]"
                  autoComplete="new-email"
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB4A2]/60 font-black tracking-tighter lowercase transition-all duration-300 ease-out peer-focus:text-[#FFB4A2] peer-focus:-translate-y-[2.2rem] peer-focus:text-xs peer-[:not(:placeholder-shown)]:text-[#FFB4A2] peer-[:not(:placeholder-shown)]:-translate-y-[2.2rem] peer-[:not(:placeholder-shown)]:text-xs cursor-text bg-black px-1 peer-focus:bg-black peer-[:not(:placeholder-shown)]:bg-black peer-[.peer-autofilled]:-translate-y-[2.2rem] peer-[.peer-autofilled]:text-xs"
                >
                  email
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="peer w-full bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-4 font-black tracking-tighter lowercase focus:border-[#FF7A00] focus:outline-none transition-colors text-white [appearance:textfield] [&::-webkit-credentials-auto-fill-button]:hidden [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_rgb(0,0,0)_inset] [&:-webkit-autofill]:[background-clip:content-box] [&:-webkit-autofill]:peer-[.peer-autofilled]"
                  autoComplete="new-password"
                  placeholder=" "
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB4A2]/60 font-black tracking-tighter lowercase transition-all duration-300 ease-out peer-focus:text-[#FFB4A2] peer-focus:-translate-y-[2.2rem] peer-focus:text-xs peer-[:not(:placeholder-shown)]:text-[#FFB4A2] peer-[:not(:placeholder-shown)]:-translate-y-[2.2rem] peer-[:not(:placeholder-shown)]:text-xs cursor-text bg-black px-1 peer-focus:bg-black peer-[:not(:placeholder-shown)]:bg-black peer-[.peer-autofilled]:-translate-y-[2.2rem] peer-[.peer-autofilled]:text-xs"
                >
                  password
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="peer w-full bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-4 font-black tracking-tighter lowercase focus:border-[#FF7A00] focus:outline-none transition-colors text-white [appearance:textfield] [&::-webkit-credentials-auto-fill-button]:hidden [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_rgb(0,0,0)_inset] [&:-webkit-autofill]:[background-clip:content-box] [&:-webkit-autofill]:peer-[.peer-autofilled]"
                  autoComplete="new-password"
                  placeholder=" "
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB4A2]/60 font-black tracking-tighter lowercase transition-all duration-300 ease-out peer-focus:text-[#FFB4A2] peer-focus:-translate-y-[2.2rem] peer-focus:text-xs peer-[:not(:placeholder-shown)]:text-[#FFB4A2] peer-[:not(:placeholder-shown)]:-translate-y-[2.2rem] peer-[:not(:placeholder-shown)]:text-xs cursor-text bg-black px-1 peer-focus:bg-black peer-[:not(:placeholder-shown)]:bg-black peer-[.peer-autofilled]:-translate-y-[2.2rem] peer-[.peer-autofilled]:text-xs"
                >
                  confirm password
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF7A00] text-black font-black tracking-tighter lowercase py-4 rounded-xl hover:bg-[#FF9500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5">
                      <LoadingSpinner />
                    </div>
                    registering...
                  </>
                ) : (
                  'register'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[#FFB4A2] text-sm font-black tracking-tighter lowercase">
              already have an account?{' '}
              <Link
                href="/login"
                className="text-[#FF7A00] hover:text-[#FF9500] transition-colors"
              >
                login here
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 