import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopicForm from './TopicForm';

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
  festival: string;
  parentComment?: string;
}

export default function TopicDetail() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchTopic = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/topics/${topicId}`);
      if (!response.ok) throw new Error('Failed to fetch topic');
      const data = await response.json();
      setTopic(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const handleVote = async (vote: 'up' | 'down') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to vote');

      const response = await fetch(`http://localhost:5000/api/topics/${topicId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote })
      });

      if (!response.ok) throw new Error('Failed to vote');
      const updatedTopic = await response.json();
      setTopic(updatedTopic);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setIsReplying(true);
  };

  const handleNewReply = (newReply: Topic) => {
    if (!topic) return;

    const updateReplies = (replies: Topic[] | undefined, parentId: string): Topic[] => {
      if (!replies) return [newReply];
      
      return replies.map(reply => {
        if (reply._id === parentId) {
          return {
            ...reply,
            replies: [...(reply.replies || []), newReply]
          };
        }
        if (reply.replies) {
          return {
            ...reply,
            replies: updateReplies(reply.replies, parentId)
          };
        }
        return reply;
      });
    };

    setTopic({
      ...topic,
      replies: updateReplies(topic.replies, newReply.parentComment!)
    });
    setIsReplying(false);
    setReplyingTo(null);
  };

  const renderReplies = (replies: Topic[] | undefined, depth = 0) => {
    if (!replies || replies.length === 0) return null;

    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-8 border-l-2 border-[#FF7A00]/20 pl-4' : ''}`}>
        {replies.map(reply => (
          <div key={reply._id} className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-[#FFB4A2]/60">
                  <span>{reply.user.name}</span>
                  <span>•</span>
                  <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[#FFB4A2] mt-2">{reply.content}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleVote('up')}
                  className="text-[#FFB4A2] hover:text-[#FFD600] transition-colors"
                >
                  ↑ {reply.upvotes}
                </button>
                <button
                  onClick={() => handleVote('down')}
                  className="text-[#FFB4A2] hover:text-[#FF3366] transition-colors"
                >
                  ↓ {reply.downvotes}
                </button>
              </div>
            </div>

            <button
              onClick={() => handleReply(reply._id)}
              className="text-sm text-[#FF7A00] hover:text-[#FFD600] transition-colors"
            >
              Reply
            </button>

            {replyingTo === reply._id && isReplying && (
              <div className="mt-4">
                <TopicForm
                  festivalId={topic!.festival}
                  parentComment={reply._id}
                  onSuccess={handleNewReply}
                />
              </div>
            )}

            {renderReplies(reply.replies, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="text-[#FFB4A2]">Loading topic...</div>;
  if (error) return <div className="text-[#FF3366]">Error: {error}</div>;
  if (!topic) return <div className="text-[#FFB4A2]">Topic not found</div>;

  return (
    <div className="space-y-8">
      <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#FFB4A2] mb-2">
              {topic.isPinned && (
                <span className="text-[#FFD600] mr-2">📌</span>
              )}
              {topic.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#FFB4A2]/60">
              <span>Posted by {topic.user.name}</span>
              <span>•</span>
              <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{topic.views} views</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleVote('up')}
              className="text-[#FFB4A2] hover:text-[#FFD600] transition-colors"
            >
              ↑ {topic.upvotes}
            </button>
            <button
              onClick={() => handleVote('down')}
              className="text-[#FFB4A2] hover:text-[#FF3366] transition-colors"
            >
              ↓ {topic.downvotes}
            </button>
          </div>
        </div>

        <p className="text-[#FFB4A2] mb-4">{topic.content}</p>

        {topic.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
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

        <button
          onClick={() => handleReply(topic._id)}
          className="text-[#FF7A00] hover:text-[#FFD600] transition-colors"
        >
          Reply to Topic
        </button>
      </div>

      {isReplying && !replyingTo && (
        <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-6">
          <TopicForm
            festivalId={topic.festival}
            parentComment={topic._id}
            onSuccess={handleNewReply}
          />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#FFB4A2]">
          Replies ({topic.replies?.length || 0})
        </h2>
        {renderReplies(topic.replies)}
      </div>
    </div>
  );
} 