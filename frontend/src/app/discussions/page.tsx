'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import TopicList from '@/components/TopicList';
import TopicForm from '@/components/TopicForm';
import FestivalSelector from '@/components/FestivalSelector';
import Navbar from '@/components/Navbar';

export default function Discussions() {
  const [selectedFestival, setSelectedFestival] = useState<string | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);

  const handleFestivalSelect = (festivalId: string) => {
    setSelectedFestival(festivalId);
    setShowTopicForm(false);
  };

  const handleNewTopic = () => {
    if (!selectedFestival) {
      alert('Please select a festival first');
      return;
    }
    setShowTopicForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#FF7A00]/20">
      <Navbar />
      <div className="fixed inset-0 bg-[#FF7A00]/5 backdrop-blur-3xl pointer-events-none" />
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-[#FFB4A2]">Festival Discussions</h1>
          <button
            onClick={handleNewTopic}
            className="px-6 py-3 bg-[#FF7A00] text-black font-black tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300"
          >
            Start New Topic
          </button>
        </div>

        <div className="mb-8">
          <FestivalSelector
            onSelect={handleFestivalSelect}
            selectedFestival={selectedFestival}
          />
        </div>

        {showTopicForm && selectedFestival && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <TopicForm
              festivalId={selectedFestival}
              onSuccess={() => {
                setShowTopicForm(false);
              }}
            />
          </motion.div>
        )}

        {selectedFestival ? (
          <TopicList festivalId={selectedFestival} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl text-[#FFB4A2] mb-4">Select a Festival</h2>
            <p className="text-[#FFB4A2]/60">
              Choose a festival to view and participate in its discussions
            </p>
          </div>
        )}
      </main>
    </div>
  );
} 