import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Topic {
  _id: string;
  title: string;
  content: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  upvotes: number;
  downvotes: number;
  views: number;
  createdAt: string;
  tags: string[];
  isPinned: boolean;
  replies?: Topic[];
}

interface TopicListProps {
  festivalId: string;
}

export default function TopicList({ festivalId }: TopicListProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'top' | 'views'>('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const fetchTopics = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/topics/${festivalId}?sort=${sortBy}`);
      if (!response.ok) throw new Error('Failed to fetch topics');
      const data = await response.json();
      setTopics(data);
      
      // Extract unique tags
      const tags = new Set<string>();
      data.forEach((topic: Topic) => {
        topic.tags.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [festivalId, sortBy]);

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredTopics = topics.filter(topic => {
    if (selectedTags.length === 0) return true;
    return selectedTags.some(tag => topic.tags.includes(tag));
  });

  if (loading) return <div className="text-[#FFB4A2]">Loading topics...</div>;
  if (error) return <div className="text-[#FF3366]">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('newest')}
            className={`px-4 py-2 rounded-lg ${
              sortBy === 'newest'
                ? 'bg-[#FF7A00] text-black'
                : 'bg-black/40 text-[#FFB4A2] hover:bg-black/60'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy('top')}
            className={`px-4 py-2 rounded-lg ${
              sortBy === 'top'
                ? 'bg-[#FF7A00] text-black'
                : 'bg-black/40 text-[#FFB4A2] hover:bg-black/60'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setSortBy('views')}
            className={`px-4 py-2 rounded-lg ${
              sortBy === 'views'
                ? 'bg-[#FF7A00] text-black'
                : 'bg-black/40 text-[#FFB4A2] hover:bg-black/60'
            }`}
          >
            Most Viewed
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag)
                  ? 'bg-[#FF7A00] text-black'
                  : 'bg-black/40 text-[#FFB4A2] hover:bg-black/60'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredTopics.map(topic => (
          <motion.div
            key={topic._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-black/40 backdrop-blur-sm border ${
              topic.isPinned ? 'border-[#FFD600]' : 'border-[#FF7A00]/20'
            } rounded-lg p-6`}
          >
            <Link href={`/discussions/topic/${topic._id}`} className="block">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#FFB4A2] mb-2">
                    {topic.isPinned && (
                      <span className="text-[#FFD600] mr-2">📌</span>
                    )}
                    {topic.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-[#FFB4A2]/60">
                    <span>Posted by {topic.user.name}</span>
                    <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                    <span>{topic.views} views</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-[#FFB4A2] font-bold">{topic.upvotes}</div>
                    <div className="text-[#FFB4A2]/60 text-sm">upvotes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#FFB4A2] font-bold">{topic.replies?.length || 0}</div>
                    <div className="text-[#FFB4A2]/60 text-sm">replies</div>
                  </div>
                </div>
              </div>
              <p className="text-[#FFB4A2]/80 line-clamp-2">{topic.content}</p>
              {topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {topic.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 