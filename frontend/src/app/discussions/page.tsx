'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import TopicList from '@/components/TopicList';
import TopicForm from '@/components/TopicForm';
import Navbar from '@/components/Navbar';
import { FaPlus, FaTimes, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Festival {
  _id: string;
  name: string;
}

export default function Discussions() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFestival, setSelectedFestival] = useState<string | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);
  const loginPromptRef = useRef<HTMLDivElement>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/festivals');
        if (!response.ok) throw new Error('Failed to fetch festivals');
        const data = await response.json();
        setFestivals(data);
      } catch (err) {
        console.error('Error fetching festivals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFestivals();
  }, []);

  // Handle clicks outside the topic form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowTopicForm(false);
      }
      if (loginPromptRef.current && !loginPromptRef.current.contains(event.target as Node)) {
        setShowLoginPrompt(false);
      }
    };

    if (showTopicForm || showLoginPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTopicForm, showLoginPrompt]);

  const handleFestivalSelect = (festivalId: string) => {
    setSelectedFestival(festivalId === selectedFestival ? null : festivalId);
  };

  const handleNewTopic = () => {
    if (user) {
      setShowTopicForm(true);
    } else {
      setShowLoginPrompt(true);
    }
  };
  
  const handleTopicCreated = () => {
    // Close the topic form
    setShowTopicForm(false);
    
    // Trigger a refresh of the TopicList component
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="bg-gradient-to-br from-black via-black to-[#FF7A00]/20">
      <div className="fixed inset-0 -z-10 bg-[#FF7A00]/5 backdrop-blur-xl" />
      <Navbar />
      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-20 lowercase">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h1 className="text-4xl font-black text-[#FFB4A2]">festival discussions</h1>
            
            <button
              onClick={handleNewTopic}
              className="px-5 py-2.5 bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300 flex items-center gap-2 self-start"
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span>start new topic</span>
            </button>
          </div>
        </div>

        {/* Festival Filters */}
        <div className="mb-8 bg-black/30 p-4 rounded-lg border border-[#FF7A00]/10">
          <h2 className="text-sm font-medium text-[#FFB4A2]/70 mb-3">Filter by festival:</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFestival(null)}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                selectedFestival === null
                  ? 'bg-[#FF7A00] text-black font-medium'
                  : 'bg-black/40 text-[#FFB4A2] hover:bg-[#FF7A00]/20'
              }`}
            >
              show all
            </button>
            {festivals.map(festival => (
              <button
                key={festival._id}
                onClick={() => handleFestivalSelect(festival._id)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  selectedFestival === festival._id
                    ? 'bg-[#FF7A00] text-black font-medium'
                    : 'bg-black/40 text-[#FFB4A2] hover:bg-[#FF7A00]/20'
                }`}
              >
                {festival.name.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Login Prompt */}
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <div 
              ref={loginPromptRef}
              className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-6 relative"
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
                you need to be logged in to create a new topic or comment on discussions.
              </p>
              <button
                onClick={handleLogin}
                className="px-6 py-3 bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300 flex items-center gap-2"
              >
                <FaSignInAlt className="w-4 h-4" />
                <span>login now</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* New Topic Form */}
        {showTopicForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <div 
              ref={formRef}
              className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-6 relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#FFB4A2]">create new discussion</h2>
                <button
                  onClick={() => setShowTopicForm(false)}
                  className="text-[#FFB4A2] hover:text-[#FF3366] transition-colors rounded-full w-8 h-8 flex items-center justify-center bg-black/30"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-[#FFB4A2] mb-2">select festival</label>
                <select
                  value={selectedFestival || ''}
                  onChange={(e) => setSelectedFestival(e.target.value)}
                  className="w-full bg-black/90 text-[#FFB4A2] border border-[#FF7A00] rounded-lg px-4 py-2 focus:outline-none focus:border-[#FFD600]"
                >
                  <option value="">select a festival</option>
                  {festivals.map(festival => (
                    <option key={festival._id} value={festival._id}>
                      {festival.name.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              {selectedFestival && (
                <TopicForm
                  festivalId={selectedFestival}
                  onSuccess={handleTopicCreated}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Topic List */}
        <div className="bg-black/30 p-4 sm:p-6 rounded-lg border border-[#FF7A00]/10">
          <TopicList festivalId={selectedFestival} refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
} 