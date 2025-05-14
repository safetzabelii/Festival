'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TopicForm from '@/components/TopicForm';
import Navbar from '@/components/Navbar';
import { formatRelativeTime } from '@/utils/dateUtils';
import { FaTag } from 'react-icons/fa';
import api from '@/services/api';

interface User {
  _id: string;
  name: string;
  avatar?: string;
}

interface Topic {
  _id: string;
  title: string;
  content: string;
  user: User;
  upvotes: number;
  downvotes: number;
  views: number;
  createdAt: string;
  tags: string[];
  isPinned: boolean;
  replies?: Topic[];
  festival: string;
  parentComment?: string;
  voters?: Array<{user: string, vote: 'up' | 'down'}>;
}

export default function TopicDetail() {
  const params = useParams();
  const topicId = params?.topicId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
  }, []);

  const fetchTopic = async () => {
    try {
      const response = await api.get(`/api/topics/single/${topicId}`);
      if (!response.ok) throw new Error('Failed to fetch topic');
      const data = response.data;
      
      // Process the topic data to properly organize replies
      if (data.replies && data.replies.length > 0) {
        // Filter out direct replies only (where parentComment is the current topic)
        // This ensures replies to replies are not at the top level
        data.replies = data.replies.filter((reply: Topic) => 
          reply.parentComment === data._id
        );
      }
      
      setTopic(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (topicId) {
      fetchTopic();
    }
  }, [topicId]);

  const handleVote = async (vote: 'up' | 'down', commentId?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to vote');
        return;
      }

      // If commentId is provided, we're voting on a reply
      const voteUrl = commentId 
        ? getImageUrl(imageUrl) 
        : getImageUrl(imageUrl);

      const response = await fetch(voteUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to vote');
      }
      
      if (commentId) {
        // Handle reply vote, update the reply in the nested structure
        const updatedReply = await response.json();
        
        const updateReplyInTree = (replies: Topic[] | undefined, targetId: string): Topic[] => {
          if (!replies) return [];
          
          return replies.map(reply => {
            if (reply._id === targetId) {
              return {
                ...reply,
                ...updatedReply,
                user: reply.user, // Keep the original user data
                festival: reply.festival, // Keep the original festival data
                replies: reply.replies // Preserve existing replies
              };
            }
            
            if (reply.replies && reply.replies.length > 0) {
              return {
                ...reply,
                replies: updateReplyInTree(reply.replies, targetId)
              };
            }
            
            return reply;
          });
        };
        
        setTopic(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            replies: updateReplyInTree(prev.replies, commentId)
          };
        });
      } else {
        // Handle main topic vote
        const updatedTopic = await response.json();
        setTopic(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            ...updatedTopic,
            user: prev.user, // Keep the original user data
            festival: prev.festival, // Keep the original festival data
            replies: prev.replies // Preserve existing replies
          };
        });
      }
    } catch (err) {
      console.error('Voting error:', err);
      alert(err instanceof Error ? err.message : 'Failed to vote');
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setIsReplying(true);
  };

  const handleNewReply = (newReply: Topic) => {
    if (!topic) return;

    // Case 1: replying directly to the main topic
    if (newReply.parentComment === topic._id) {
      setTopic(prev => {
        if (!prev) return prev;
        
        // Add new reply to main topic's replies, ensuring proper sorting
        const updatedReplies = [...(prev.replies || []), newReply];
        updatedReplies.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        return {
          ...prev,
          replies: updatedReplies
        };
      });
      setIsReplying(false);
      setReplyingTo(null);
      return;
    }

    // Case 2: replying to a reply (nested comment)
    const updateReplies = (replies: Topic[] | undefined, parentId: string): Topic[] => {
      if (!replies) return [];
      
      return replies.map(reply => {
        if (reply._id === parentId) {
          // Add new reply to the parent reply's replies, ensuring proper sorting
          const updatedReplies = [...(reply.replies || []), newReply];
          updatedReplies.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          return {
            ...reply,
            replies: updatedReplies
          };
        }
        if (reply.replies && reply.replies.length > 0) {
          return {
            ...reply,
            replies: updateReplies(reply.replies, parentId)
          };
        }
        return reply;
      });
    };

    setTopic(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        replies: updateReplies(prev.replies, newReply.parentComment!)
      };
    });
    setIsReplying(false);
    setReplyingTo(null);
  };

  // Helper function to determine user's vote
  const getUserVote = (item: Topic) => {
    if (!currentUserId || !item.voters) return null;
    const userVote = item.voters.find(v => v.user === currentUserId);
    return userVote ? userVote.vote : null;
  };

  const renderReplies = (replies: Topic[] | undefined, depth = 0, parentId?: string) => {
    if (!replies || replies.length === 0) return null;
    
    // Filter replies that belong to this parent
    const filteredReplies = parentId 
      ? replies.filter(reply => reply.parentComment === parentId)
      : replies.filter(reply => reply.parentComment === topic?._id);
    
    if (filteredReplies.length === 0) return null;
    
    // Sort replies chronologically (oldest first) to keep them in order
    const sortedReplies = [...filteredReplies].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-0 md:ml-12 border-l-2 border-[#FF7A00]/20 pl-4' : ''}`}>
        {sortedReplies.map(reply => {
          const replyUserVote = getUserVote(reply);
          return (
          <div key={reply._id} className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {/* User avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FF7A00]/50">
                {reply.user?.avatar ? (
                  <img 
                    src={reply.user.avatar} 
                    alt={reply.user.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF7A00] to-[#FFD600] flex items-center justify-center text-black font-bold text-xs">
                    {reply.user?.name?.charAt(0) || 'a'}
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 text-xs mb-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#FFD600]">
                      {reply.user?.name || 'Anonymous'}
                    </span>
                    <span className="text-[#FFB4A2]/60">{formatRelativeTime(reply.createdAt)}</span>
                  </div>
                  
                  {/* Display tags for replies as well */}
                  {reply.tags && reply.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {reply.tags.map(tag => (
                        <span 
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF7A00]/20 text-[#FF7A00]"
                        >
                          <FaTag className="mr-1 text-[0.6rem]" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-[#FFB4A2] mt-2 mb-3">{reply.content}</p>
                
                {/* Action buttons */}
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center bg-black/30 rounded-full overflow-hidden border border-[#FF7A00]/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote('up', reply._id);
                      }}
                      className={`px-2 py-1 transition-colors ${
                        replyUserVote === 'up' 
                          ? 'text-[#FFD600] bg-[#FFD600]/20 hover:bg-[#FFD600]/30' 
                          : 'text-[#FFB4A2] hover:text-[#FFD600] hover:bg-black/40' 
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M12 19V5M12 5l7 7M12 5l-7 7" />
                      </svg>
                    </button>
                    <span className="font-medium text-center px-2">{reply.upvotes - reply.downvotes}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote('down', reply._id);
                      }}
                      className={`px-2 py-1 transition-colors ${
                        replyUserVote === 'down' 
                          ? 'text-[#FF3366] bg-[#FF3366]/20 hover:bg-[#FF3366]/30' 
                          : 'text-[#FFB4A2] hover:text-[#FF3366] hover:bg-black/40' 
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M12 5v14M12 19l7-7M12 19L5 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReply(reply._id);
                    }}
                    className="flex items-center gap-1 text-[#FF7A00] hover:text-[#FFD600] transition-colors bg-black/30 rounded-full px-3 py-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M3 10h10a8 8 0 008-8M3 10l5 5M3 10l5-5" />
                    </svg>
                    reply
                  </button>
                </div>
              </div>
            </div>
            
            {replyingTo === reply._id && isReplying && (
              <div className="mt-4 ml-12" onClick={(e) => e.stopPropagation()}>
                <TopicForm
                  festivalId={topic!.festival}
                  parentComment={reply._id}
                  onSuccess={handleNewReply}
                  hideTitle={true}
                />
              </div>
            )}

            {/* Render nested replies using ALL replies but filtering for this parent */}
            {renderReplies(topic?.replies, depth + 1, reply._id)}
          </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="text-[#FFB4A2]">loading topic...</div>;
  if (error) return <div className="text-[#FF3366]">error: {error}</div>;
  if (!topic) return <div className="text-[#FFB4A2]">topic not found</div>;

  const topicUserVote = getUserVote(topic);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 lowercase">
        <div className="space-y-8">
          {/* Main Topic Card */}
          <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              {/* Content area */}
              <div className="flex-grow">
                <div className="flex items-start mb-4">
                  <div className="flex items-center gap-3">
                    {/* User avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FFD600] flex items-center justify-center text-black font-bold">
                      {topic.user?.name?.charAt(0) || 'a'}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-sm text-[#FFB4A2]/80">
                        <span className="font-medium text-[#FFD600]">{topic.user?.name || 'anonymous'}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">{formatRelativeTime(topic.createdAt)}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">{topic.views} views</span>
                      </div>
                      
                      <h1 className="text-xl md:text-2xl font-bold text-[#FFB4A2] mt-1">
                        {topic.isPinned && (
                          <span className="text-[#FFD600] mr-2">📌</span>
                        )}
                        {topic.title}
                      </h1>
                    </div>
                  </div>
                </div>

                <div className="border-b border-[#FF7A00]/20 pb-4 mb-4">
                  <p className="text-[#FFB4A2] whitespace-pre-line">{topic.content}</p>
                </div>

                {topic.tags && topic.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {topic.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-sm font-medium"
                      >
                        <FaTag className="mr-1.5 text-[0.7rem]" />
                        {tag.toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center bg-black/30 rounded-full overflow-hidden border border-[#FF7A00]/20">
                    <button
                      onClick={() => handleVote('up')}
                      className={`px-2 py-1 transition-colors ${
                        topicUserVote === 'up' 
                          ? 'text-[#FFD600] bg-[#FFD600]/20 hover:bg-[#FFD600]/30' 
                          : 'text-[#FFB4A2] hover:text-[#FFD600] hover:bg-black/40' 
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M12 19V5M12 5l7 7M12 5l-7 7" />
                      </svg>
                    </button>
                    <span className="font-medium text-center px-2">{topic.upvotes - topic.downvotes}</span>
                    <button
                      onClick={() => handleVote('down')}
                      className={`px-2 py-1 transition-colors ${
                        topicUserVote === 'down' 
                          ? 'text-[#FF3366] bg-[#FF3366]/20 hover:bg-[#FF3366]/30' 
                          : 'text-[#FFB4A2] hover:text-[#FF3366] hover:bg-black/40' 
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M12 5v14M12 19l7-7M12 19L5 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[#FFB4A2]/60 text-sm bg-black/30 rounded-full px-3 py-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
                    {topic.replies?.filter(r => r.parentComment === topic._id).length || 0} comments
                  </div>
                  
                  <button
                    onClick={() => handleReply(topic._id)}
                    className="flex items-center gap-2 text-[#FF7A00] hover:text-[#FFD600] transition-colors bg-black/30 px-4 py-2 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <path d="M3 10h10a8 8 0 008-8M3 10l5 5M3 10l5-5" />
                    </svg>
                    reply to topic
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reply Form */}
          {isReplying && !replyingTo && (
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-6">
              <TopicForm
                festivalId={topic.festival}
                parentComment={topic._id}
                onSuccess={handleNewReply}
              />
            </div>
          )}

          {/* Replies Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#FFB4A2]">
                {topic.replies?.filter(r => r.parentComment === topic._id).length || 0} comments
              </h2>
              <div className="relative inline-block text-left">
                <select
                  className="bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg py-2 px-4 appearance-none cursor-pointer"
                >
                  <option>best</option>
                  <option>new</option>
                  <option>old</option>
                  <option>controversial</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#FF7A00]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
            {renderReplies(topic.replies, 0)}
          </div>
        </div>
      </div>
    </>
  );
} 