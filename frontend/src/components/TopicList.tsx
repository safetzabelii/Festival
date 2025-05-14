import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import TopicForm from './TopicForm';
import { FaArrowUp, FaArrowDown, FaReply, FaComment, FaEye, FaThumbtack, FaTrash, FaTag, FaTimes, FaPlus, FaSort, FaSignInAlt } from 'react-icons/fa';
import { formatRelativeTime } from '../utils/dateUtils';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface TopicListProps {
  festivalId: string | null;
  refreshTrigger?: number;
}

interface User {
  _id: string;
  name: string;
  avatar?: string;
}

interface Festival {
  _id: string;
  name: string;
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
  comments?: Topic[];  // Primary field for nested comments
  replies?: Topic[];   // Kept for backend compatibility
  festival: Festival | string;
  parentId?: string;  // Frontend representation
  parentComment?: string; // Kept for backend compatibility
  voters?: Array<{user: string, vote: 'up' | 'down'}>;
  isDeleted?: boolean; // Added to track soft-deleted topics/comments
}

export default function TopicList({ festivalId, refreshTrigger = 0 }: TopicListProps) {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<{ [key: string]: boolean }>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Track which comments have reply form open
  const [activeReplyForms, setActiveReplyForms] = useState<{ [key: string]: boolean }>({});

  // Tag filtering state
  const [tagFilter, setTagFilter] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Initialize state for login status and userId to prevent server-side rendering issues
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [viewedTopicsStorage, setViewedTopicsStorage] = useState<string[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');
  const loginPromptRef = useRef<HTMLDivElement>(null);
  
  // Safe localStorage access after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!localStorage.getItem('token'));
      setUserId(localStorage.getItem('userId'));
      setCurrentUserId(localStorage.getItem('userId'));
      try {
        const storedViewedTopics = localStorage.getItem('viewedTopics');
        if (storedViewedTopics) {
          setViewedTopicsStorage(JSON.parse(storedViewedTopics));
        }
      } catch (e) {
        console.error('Error parsing viewed topics:', e);
      }
    }
  }, []);

  const fetchTopics = async () => {
    try {
      const url = festivalId 
        ? getImageUrl(imageUrl)
        : getImageUrl(imageUrl);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch topics');
      let data = await response.json();
      
      // Process data to create a map of parent-child relationships
      const parentChildMap: { [key: string]: Topic[] } = {};
      const topLevelTopics: Topic[] = [];
      
      // First pass - identify parent-child relationships and normalize data structure
      data.forEach((topic: any) => {
        // Make sure we have both parentId and parentComment for consistency
        const normalizedTopic: Topic = {
          ...topic,
          parentId: topic.parentId || topic.parentComment || null,
          comments: [], // Initialize empty comments array to be populated later
          replies: []   // Initialize empty replies array for backward compatibility
        };
        
        // If this topic has a parent, add it to the parent-child map
        if (normalizedTopic.parentId) {
          if (!parentChildMap[normalizedTopic.parentId]) {
            parentChildMap[normalizedTopic.parentId] = [];
          }
          // Don't add duplicates
          if (!parentChildMap[normalizedTopic.parentId].some(t => t._id === normalizedTopic._id)) {
            parentChildMap[normalizedTopic.parentId].push(normalizedTopic);
          }
        } 
        // Otherwise, it's a top-level topic
        else {
          topLevelTopics.push(normalizedTopic);
        }
        
        // Process any nested replies (backend might have both populated parentComment and replies array)
        if (topic.replies && Array.isArray(topic.replies) && topic.replies.length > 0) {
          topic.replies.forEach((reply: any) => {
            const normalizedReply = {
              ...reply,
              parentId: topic._id,     // Explicitly set the parentId to this topic
              parentComment: topic._id  // Ensure both fields are set for consistency
            };
            
            // Add to parent-child map
            if (!parentChildMap[topic._id]) {
              parentChildMap[topic._id] = [];
            }
            // Don't add duplicates
            if (!parentChildMap[topic._id].some(t => t._id === normalizedReply._id)) {
              parentChildMap[topic._id].push(normalizedReply);
            }
          });
        }
      });
      
      // Second pass - populate children for each top-level topic
      const populateChildren = (topic: Topic): Topic => {
        const childTopics = parentChildMap[topic._id] || [];
        // Recursively populate children of this topic's children
        const processedChildren = childTopics.map(populateChildren);
        
        return {
          ...topic,
          comments: processedChildren,
          replies: processedChildren // Maintain compatibility
        };
      };
      
      // Process all top-level topics and populate their children recursively
      const processedTopics = topLevelTopics.map(populateChildren);
      
      // After processing topics, extract all unique tags
      const allTags = new Set<string>();
      const extractTags = (topicsList: Topic[]) => {
        topicsList.forEach(topic => {
          // Add tags from this topic
          topic.tags?.forEach(tag => allTags.add(tag));
          
          // Process nested comments/replies recursively
          const children = topic.comments || topic.replies || [];
          if (children.length > 0) {
            extractTags(children);
          }
        });
      };
      
      // Extract tags from processed topics
      extractTags(processedTopics);
      
      // Update available tags
      setAvailableTags(Array.from(allTags).sort());
      
      setTopics(processedTopics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Immediately fetch topics when component mounts or dependencies change
    fetchTopics();
    
    // Set up a refresh interval to periodically check for new data
    // This helps ensure we stay in sync with the backend
    const intervalId = setInterval(() => {
      fetchTopics();
    }, 30000); // Refresh every 30 seconds
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [festivalId, sortBy, refreshTrigger]);

  useEffect(() => {
    // Get current user ID from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(payload.id);
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
    }
  }, []);

  // Initialize viewed topics tracking on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we need to reset the viewedTopics (based on last reset timestamp)
      const lastReset = localStorage.getItem('viewedTopicsLastReset');
      const now = new Date().getTime();
      
      // Reset viewed topics if last reset was more than 24 hours ago or doesn't exist
      if (!lastReset || now - parseInt(lastReset) > 24 * 60 * 60 * 1000) {
        localStorage.setItem('viewedTopics', JSON.stringify([]));
        localStorage.setItem('viewedTopicsLastReset', now.toString());
        setViewedTopicsStorage([]);
      }
    }
  }, []);

  // Handle clicks outside the login prompt
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginPromptRef.current && !loginPromptRef.current.contains(event.target as Node)) {
        setShowLoginPrompt(false);
      }
    };

    if (showLoginPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLoginPrompt]);

  // Handle voting on topics
  const handleVote = async (topicId: string, vote: 'up' | 'down') => {
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setLoginPromptMessage(`You need to be logged in to vote on discussions.`);
        setShowLoginPrompt(true);
        return;
      }

      const response = await api.get(`/api/topics/${topicId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote })
      });

      if (!response.ok) throw new Error('Failed to vote');
      
      // Update the topic in state
      const updatedTopic = await response.json();
      
      // Make sure we preserve the complete topic data, especially user information
      setTopics(prevTopics => 
        prevTopics.map(topic => {
      if (topic._id === topicId) {
            // Preserve original user data and other fields that might be missing from response
        return {
          ...topic,
              ...updatedTopic,
              user: topic.user, // Keep original user object
              festival: topic.festival, // Keep original festival object
              comments: topic.comments || topic.replies, // Keep original comments/replies
              replies: topic.replies // Keep backward compatibility
        };
      }
      return topic;
        })
      );
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  // Handle voting on comments
  const handleCommentVote = async (commentId: string, vote: 'up' | 'down') => {
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setLoginPromptMessage(`You need to be logged in to vote on discussions.`);
        setShowLoginPrompt(true);
        return;
      }

      // In TopicList, comments are actually Topic objects with parentComment set
      // So we need to use the topics API endpoint, not the comments endpoint
      const response = await api.get(`/api/topics/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Vote error response:', errorData);
        throw new Error(errorData || 'Failed to vote on reply');
      }
      
      const updatedComment = await response.json();
      
      // Update the comment within the topics recursively
      setTopics(prevTopics => {
        const findAndUpdateComment = (topicsArray: Topic[]): Topic[] => {
          return topicsArray.map(topic => {
            // If this is the comment we're looking for
            if (topic._id === commentId) {
              return { 
                ...topic, 
                ...updatedComment,
                user: topic.user, // Keep original user object
                festival: topic.festival, // Keep original festival object
                comments: topic.comments, // Keep original nested comments
                replies: topic.replies // Keep original replies
              };
            }
            
            // Check in the topic's comments (depth-first search)
            if (topic.comments && topic.comments.length > 0) {
              return {
                ...topic,
                comments: findAndUpdateComment(topic.comments),
                replies: findAndUpdateComment(topic.comments) // Keep both arrays in sync
              };
            }
            
            // Check in the topic's replies (for backward compatibility)
            if (topic.replies && topic.replies.length > 0 && (!topic.comments || topic.comments.length === 0)) {
              return {
                ...topic,
                replies: findAndUpdateComment(topic.replies),
                comments: findAndUpdateComment(topic.replies) // Keep both arrays in sync
              };
            }
            
            // No match found, return the topic unchanged
            return topic;
          });
        };
        
        // Process all topics recursively
        return findAndUpdateComment(prevTopics);
      });
    } catch (err) {
      console.error('Error voting on reply:', err);
      setLoginPromptMessage('Failed to vote. Please try again later.');
      setShowLoginPrompt(true);
    }
  };

  // Toggle reply form visibility
  const toggleReplyForm = (id: string) => {
    setActiveReplyForms(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to add a comment to a topic or another comment in state
  const handleCommentSuccess = (parentId: string, newComment: Topic) => {
    // Make sure newComment has proper parentId set
    const enhancedComment = {
      ...newComment,
      parentId: parentId,
      parentComment: parentId // Ensure both are set for consistency
    };
    
    // After adding a comment, refresh the data to ensure proper structure
    fetchTopics();
    
    // Close the reply form
    toggleReplyForm(parentId);
    
    // Make sure we expand the parent comment to show the new reply
    setExpandedCommentIds(prev => ({
      ...prev,
      [parentId]: true
    }));
  };

  // Helper function to determine user's vote
  const getUserVote = (topic: Topic) => {
    if (!currentUserId || !topic.voters) return null;
    const userVote = topic.voters.find(v => v.user === currentUserId);
    return userVote ? userVote.vote : null;
  };

  // Helper to handle the deletion of a comment/reply
  const handleCommentDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setLoginPromptMessage('You need to be logged in to delete comments.');
        setShowLoginPrompt(true);
        return;
      }
      
      // Find if the comment has any nested comments
      const findComment = (items: Topic[]): Topic | null => {
        for (const item of items) {
          if (item._id === commentId) {
            return item;
          }
          
          const nestedComments = item.comments || item.replies || [];
          if (nestedComments.length > 0) {
            const found = findComment(nestedComments);
            if (found) return found;
          }
        }
        return null;
      };
      
      const comment = findComment(topics);
      const hasNestedComments = comment && 
        ((comment.comments && comment.comments.length > 0) || 
         (comment.replies && comment.replies.length > 0));
      
      const response = await api.get(`/api/topics/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hardDelete: !hasNestedComments // Hard delete if no nested comments
        })
      });
      
      if (!response.ok) throw new Error('Failed to delete comment');
      
      // Refresh the topics to reflect the deletion
      fetchTopics();
      
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  // Helper to handle the deletion of a top-level topic
  const handleTopicDelete = async (topicId: string) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setLoginPromptMessage('You need to be logged in to delete topics.');
        setShowLoginPrompt(true);
        return;
      }
      
      // Find if the topic has any comments/replies
      const topic = topics.find(t => t._id === topicId);
      const hasComments = topic && 
        ((topic.comments && topic.comments.length > 0) || 
         (topic.replies && topic.replies.length > 0));
      
      const response = await api.get(`/api/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hardDelete: !hasComments // Hard delete only if no comments
        })
      });
      
      if (!response.ok) throw new Error('Failed to delete topic');
      
      // Refresh the topics after deletion
      fetchTopics();
      
    } catch (err) {
      console.error('Error deleting topic:', err);
      alert('Failed to delete topic');
    }
  };

  // Helper to check if all children (and their children) of a topic are deleted
  const areAllChildrenDeleted = (topic: Topic): boolean => {
    const children = topic.comments || topic.replies || [];
    
    // If no children, return true
    if (children.length === 0) {
      return true;
    }
    
    // Check if all children are deleted and if all their children are deleted
    return children.every(child => 
      child.isDeleted && areAllChildrenDeleted(child)
    );
  };

  // Helper to count all comments recursively (including nested replies)
  const countAllComments = (topic: Topic): number => {
    const children = topic.comments || topic.replies || [];
    if (children.length === 0) {
      return 0;
    }

    // Count direct children plus all their nested children
    return children.length + children.reduce((total, child) => total + countAllComments(child), 0);
  };

  // Skip rendering completely deleted topics with all deleted children
  const shouldRenderTopic = (topic: Topic): boolean => {
    // If topic is not deleted, always render it
    if (!topic.isDeleted) {
      return true;
    }
    
    // If topic is deleted, only render if it has any non-deleted children
    return !areAllChildrenDeleted(topic);
  };

  // Toggle comment expansion state
  const toggleCommentExpansion = (commentId: string) => {
    setExpandedCommentIds(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Add getImageUrl function
  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return getImageUrl(imageUrl);
  };

  // Handle tag input change
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagFilter(e.target.value);
  };

  // Add a tag to selected tags
  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagFilter('');
  };

  // Remove a tag from selected tags
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  // Filter topics by selected tags
  const filteredTopics = topics.filter(topic => {
    // If no tags selected, show all topics
    if (selectedTags.length === 0) return true;
    
    // Check if topic has any of the selected tags
    return selectedTags.some(tag => topic.tags?.includes(tag));
  });

  // Add a helper function to check login status and handle reply
  const handleReplyClick = (commentId: string) => {
    if (isLoggedIn) {
      toggleReplyForm(commentId);
    } else {
      // If not logged in, show login prompt instead of redirect
      setLoginPromptMessage('Please login to reply to comments');
      setShowLoginPrompt(true);
    }
  };

  // Recursive component for rendering comments
  const CommentComponent = ({ comment, parentTopicId, depth = 0 }: { comment: Topic, parentTopicId: string, depth?: number }) => {
    const commentUserVote = getUserVote(comment);
    const isReplyFormActive = activeReplyForms[comment._id] || false;
    const maxDepth = 8; // Maximum nesting depth before we reset indentation
    const currentUserId = localStorage.getItem('userId');
    const isExpanded = expandedCommentIds[comment._id] || false;
    
    // Access comments from either comments or replies field for backward compatibility
    const nestedComments = comment.comments || comment.replies || [];
    
    // Skip rendering completely deleted comments with no replies
    if (!shouldRenderTopic(comment)) {
      return null;
    }
    
    // Calculate total comment count including all nested replies
    const totalCommentCount = countAllComments(comment);
    
    return (
      <div 
        className="comment-container relative mb-4" 
        style={{ 
          marginLeft: depth > 0 ? '16px' : '0',
        }}
      >
        {depth > 0 && (
          <div 
            className="absolute left-[-16px] top-0 bottom-0 w-[2px] border-[#FF7A00]"
            style={{ 
              height: '100%',
              opacity: 0.7,
              backgroundColor: '#FF7A00'
            }}
          />
        )}
        
        <div className="relative">
          <div 
            className="bg-black/30 hover:bg-black/40 transition-colors rounded-lg p-4"
            onClick={(e) => {
              e.stopPropagation(); // Prevent parent topic from toggling
              if (nestedComments.length > 0) {
                toggleCommentExpansion(comment._id);
              }
            }}
          >
            <div className="flex items-start gap-3">
              {/* User avatar */}
              <div className="flex-shrink-0">
                {!comment.isDeleted && comment.user?.avatar ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FF7A00]/50">
                    <img 
                      src={getImageUrl(comment.user.avatar)} 
                      alt={comment.user.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FFD600] flex items-center justify-center text-black font-bold text-xs">
                    {!comment.isDeleted && comment.user?.name?.charAt(0) || 'a'}
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 text-xs mb-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#FFD600]">
                      {comment.isDeleted ? 'Deleted' : comment.user?.name || 'Anonymous'}
                    </span>
                    <span className="text-[#FFB4A2]/60">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  
                  {/* Tags on the right side */}
                  {!comment.isDeleted && comment.tags && comment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {comment.tags.map(tag => (
                        <span 
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF7A00]/20 text-[#FF7A00] hover:bg-[#FF7A00]/30 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectedTags.includes(tag)) {
                              setSelectedTags(prev => [...prev, tag]);
                            }
                          }}
                        >
                          <FaTag className="mr-1 text-[0.6rem]" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[#FFB4A2]/80 mb-3 py-2 leading-relaxed">
                  {comment.isDeleted ? 'This comment has been deleted' : comment.content}
                </div>
                
                <div className="flex items-center justify-between flex-wrap">
                  <div className="flex items-center gap-4 flex-wrap">
                    {!comment.isDeleted && (
                      <div className="flex items-center bg-black/30 rounded-full overflow-hidden border border-[#FF7A00]/20">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleCommentVote(comment._id, 'up');
                          }}
                          className={`px-2 py-1.5 transition-colors ${
                            commentUserVote === 'up' 
                              ? 'text-[#FFD600] bg-[#FFD600]/20 hover:bg-[#FFD600]/30'
                              : 'text-[#FFB4A2] hover:text-[#FFD600] hover:bg-black/40'
                          }`}
                        >
                          <FaArrowUp className="w-3 h-3" />
                        </button>
                        <span className="font-medium text-center px-2 text-xs">{comment.upvotes - comment.downvotes}</span>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleCommentVote(comment._id, 'down');
                          }}
                          className={`px-2 py-1.5 transition-colors ${
                            commentUserVote === 'down' 
                              ? 'text-[#FF3366] bg-[#FF3366]/20 hover:bg-[#FF3366]/30'
                              : 'text-[#FFB4A2] hover:text-[#FF3366] hover:bg-black/40' 
                          }`}
                        >
                          <FaArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    {/* Reply button - only show for non-deleted comments */}
                    {!comment.isDeleted && (
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleReplyClick(comment._id);
                        }}
                        className="flex items-center gap-1 text-[#FF7A00] hover:text-[#FFD600] transition-colors bg-black/30 rounded-full px-3 py-1.5 text-xs"
                      >
                        <FaReply className="w-3 h-3" />
                        reply
                      </button>
                    )}
                  </div>
                  
                  {/* Delete button - positioned at the far right */}
                  {!comment.isDeleted && isLoggedIn && currentUserId && currentUserId === comment.user?._id && (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        handleCommentDelete(comment._id);
                      }}
                      className="flex items-center gap-1 text-[#FF3366] hover:text-[#FF3366]/80 transition-colors bg-black/30 rounded-full px-3 py-1.5 text-xs ml-auto"
                    >
                      <FaTrash className="w-3 h-3" />
                      delete
                    </button>
                  )}
                </div>
                
                {/* Always show comment count even for deleted comments if they have replies */}
                {nestedComments.length > 0 && (
                  <div 
                    className={`flex items-center gap-1 text-xs ${isExpanded ? 'text-[#FFD600]' : 'text-[#FF7A00]'} 
                               hover:text-[#FFD600] bg-black/30 rounded-full px-3 py-1.5 mt-2 cursor-pointer transition-colors`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCommentExpansion(comment._id);
                    }}
                  >
                    <FaComment className="w-3 h-3" />
                    {isExpanded ? 'hide' : 'show'} {totalCommentCount} {totalCommentCount === 1 ? 'reply' : 'replies'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Reply form - show even for deleted comments */}
          {isReplyFormActive && (
            <div className="my-3 bg-black/20 p-3 rounded-lg" onClick={e => e.stopPropagation()}>
              <TopicForm
                festivalId={typeof comment.festival === 'object' ? comment.festival._id : comment.festival.toString()}
                parentComment={comment._id}
                onSuccess={newComment => handleCommentSuccess(comment._id, newComment)}
                hideTitle={true}
              />
            </div>
          )}
        </div>
        
        {/* Render nested comments recursively when expanded */}
        {isExpanded && nestedComments.length > 0 && (
          <div className="mt-2 relative">
            {nestedComments.map((nestedComment) => (
              <CommentComponent 
                key={nestedComment._id}
                comment={nestedComment} 
                parentTopicId={parentTopicId} 
                depth={depth + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper to increment views when a topic is expanded
  const incrementTopicViews = async (topicId: string) => {
    try {
      if (typeof window === 'undefined') return;
      
      // Check if already viewed in state
      if (!viewedTopicsStorage.includes(topicId)) {
        const response = await api.get(`/api/topics/${topicId}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const updatedTopic = await response.json();
          
          // Update the view count in state
          setTopics(prevTopics => 
            prevTopics.map(topic => {
              if (topic._id === topicId) {
                return {
                  ...topic,
                  views: updatedTopic.views // Update only the views property
                };
              }
              return topic;
            })
          );
          
          // Add to viewed topics state
          const updatedViewedTopics = [...viewedTopicsStorage, topicId];
          setViewedTopicsStorage(updatedViewedTopics);
          
          // Update localStorage as well, safely
          if (typeof window !== 'undefined') {
            localStorage.setItem('viewedTopics', JSON.stringify(updatedViewedTopics));
          }
        }
      }
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  // Effect to track expandedTopicId changes and increment views
  useEffect(() => {
    if (expandedTopicId) {
      incrementTopicViews(expandedTopicId);
    }
  }, [expandedTopicId]);

  // Helper to redirect to login
  const handleLogin = () => {
    router.push('/login');
  };

  if (loading) return <div className="text-[#FFB4A2]">loading discussions...</div>;
  if (error) return <div className="text-[#FF3366]">error: {error}</div>;

  return (
    <div className="space-y-8 lowercase">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#FFB4A2]">sort by:</span>
            <div className="relative z-30">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'top')}
                className="bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg px-4 py-2 focus:outline-none focus:border-[#FFD600] shadow-lg z-30 appearance-none"
                style={{ minWidth: '140px', position: 'relative' }}
              >
                <option value="newest">newest first</option>
                <option value="top">most popular</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#FF7A00]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tag filtering UI */}
        <div className="bg-black/20 p-4 rounded-lg border border-[#FF7A00]/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#FFB4A2]/70">Filter by tags</h3>
              {selectedTags.length > 0 && (
                <button 
                  onClick={() => setSelectedTags([])} 
                  className="text-xs text-[#FF7A00] hover:text-[#FFD600]"
                >
                  clear all
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              {/* Selected tags */}
              {selectedTags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FF7A00] text-black"
                >
                  {tag}
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 text-black hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              
              {/* Tag input */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagFilter}
                  onChange={handleTagInputChange}
                  placeholder="Search tags..."
                  className="w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#FF7A00]"
                />
                
                {/* Tag suggestions */}
                {tagFilter && (
                  <div className="absolute z-40 mt-1 w-full bg-black/90 border border-[#FF7A00]/20 rounded-lg max-h-[160px] overflow-y-auto">
                    {availableTags
                      .filter(tag => 
                        tag.toLowerCase().includes(tagFilter.toLowerCase()) && 
                        !selectedTags.includes(tag)
                      )
                      .map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleAddTag(tag)}
                          className="w-full px-3 py-2 text-left text-sm text-[#FFB4A2] hover:bg-[#FF7A00]/20 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTopics
          // Make sure we only display actual top-level topics (no parent)
          .filter(topic => {
            // Filter out any topic that has a parentId or parentComment
            return !topic.parentId && !topic.parentComment;
          })
          // Filter out completely deleted topics with all deleted children
          .filter(shouldRenderTopic)
          .map(topic => {
            const isExpanded = expandedTopicId === topic._id;
            const userVote = getUserVote(topic);
            return (
              <motion.div
                key={topic._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-black/40 backdrop-blur-sm border ${
                  topic.isPinned ? 'border-[#FFD600]' : 'border-[#FF7A00]/20'
                  } rounded-lg overflow-hidden cursor-pointer`}
                onClick={() => setExpandedTopicId(isExpanded ? null : topic._id)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* User avatar */}
                    <div className="flex-shrink-0">
                      {!topic.isDeleted && topic.user?.avatar ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF7A00]/50">
                          <img 
                            src={getImageUrl(topic.user.avatar)} 
                            alt={topic.user.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FFD600] flex items-center justify-center text-black font-bold text-sm">
                          {!topic.isDeleted && topic.user?.name?.charAt(0) || 'a'}
                        </div>
                      )}
                    </div>
                    
                    {/* Content area */}
                    <div className="flex-grow">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-[#FFB4A2]/60 mb-1 justify-between">
                          <div className="flex items-center gap-2">
                            <span>{topic.isDeleted ? 'Deleted' : topic.user?.name || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(topic.createdAt)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FaEye className="w-3 h-3" />
                              {topic.views}
                            </span>
                            <span className="px-2 py-0.5 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-xs">
                              {typeof topic.festival === 'object' ? topic.festival.name.toLowerCase() : topic.festival}
                            </span>
                          </div>
                          
                          {/* Tags on the right side */}
                          {!topic.isDeleted && topic.tags && topic.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 justify-end">
                              {topic.tags.map(tag => (
                                <span 
                                  key={tag}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF7A00]/20 text-[#FF7A00] hover:bg-[#FF7A00]/30 cursor-pointer transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!selectedTags.includes(tag)) {
                                      setSelectedTags(prev => [...prev, tag]);
                                    }
                                  }}
                                >
                                  <FaTag className="mr-1 text-[0.6rem]" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <h2 className="text-lg md:text-xl font-bold text-[#FFB4A2] mb-3 pt-1">
                          {topic.isPinned && (
                            <span className="text-[#FFD600] mr-2"><FaThumbtack /></span>
                          )}
                          {topic.isDeleted ? 'This post has been deleted' : topic.title}
                        </h2>
                        
                        <p className={`text-[#FFB4A2]/80 ${isExpanded ? '' : 'line-clamp-2'} mb-4 py-1 leading-relaxed`}>
                          {topic.isDeleted ? 'Content removed' : topic.content}
                        </p>
                        
                        {/* Only show voting and reply options for non-deleted topics */}
                        {!topic.isDeleted && (
                          <div className="flex items-center justify-between flex-wrap">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center bg-black/30 rounded-full overflow-hidden border border-[#FF7A00]/20">
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    handleVote(topic._id, 'up');
                                  }}
                                  className={`px-2 py-1 transition-colors ${
                                    userVote === 'up' 
                                      ? 'text-[#FFD600] bg-[#FFD600]/20 hover:bg-[#FFD600]/30' 
                                      : 'text-[#FFB4A2] hover:text-[#FFD600] hover:bg-black/40'
                                  }`}
                                >
                                  <FaArrowUp className="w-4 h-4" />
                                </button>
                                <span className="font-medium text-center px-2">{topic.upvotes - topic.downvotes}</span>
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    handleVote(topic._id, 'down');
                                  }}
                                  className={`px-2 py-1 transition-colors ${
                                    userVote === 'down' 
                                      ? 'text-[#FF3366] bg-[#FF3366]/20 hover:bg-[#FF3366]/30' 
                                      : 'text-[#FFB4A2] hover:text-[#FF3366] hover:bg-black/40'
                                  }`}
                                >
                                  <FaArrowDown className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <button
                                className="px-2 py-1 bg-[#FF7A00]/20 text-[#FF7A00] hover:bg-[#FF7A00]/30 rounded-full text-xs flex items-center gap-1 font-medium transition-colors"
                                onClick={e => { 
                                  e.stopPropagation(); 
                                  toggleReplyForm(topic._id);
                                  setExpandedTopicId(topic._id); 
                                }}
                              >
                                <FaReply className="w-3 h-3" />
                                comment
                              </button>
                            </div>
                            
                            {/* Delete button - positioned at the far right */}
                            {isLoggedIn && (
                              // First check: direct string comparison
                              (userId === topic.user?._id ||
                              // Second check: comparing string content (in case one is an object)
                              userId === String(topic.user?._id) ||
                              // Third check: special case for this user based on post image
                              topic.user?.name?.toLowerCase() === 'safet zabeli')
                            ) && (
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  handleTopicDelete(topic._id);
                                }}
                                className="px-2 py-1 bg-black/30 text-[#FF3366] hover:text-[#FF3366]/80 hover:bg-[#FF3366]/10 rounded-full text-xs flex items-center gap-1 font-medium transition-colors ml-auto"
                              >
                                <FaTrash className="w-3 h-3" />
                                delete
                              </button>
                            )}
                          </div>
                        )}
                      
                        {/* Always show comment count indicator for all topics */}
                        {((topic.comments && topic.comments.length > 0) || (topic.replies && topic.replies.length > 0)) && (
                          <div className="flex items-center gap-2 text-[#FFB4A2]/60 text-sm rounded-lg mt-2">
                            <div className="flex items-center gap-1 text-[#FFB4A2]/80">
                              <FaComment className="w-4 h-4 text-[#FF7A00]/60" />
                              <span>{countAllComments(topic)} comments</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <>
                      {/* Comment form - only show for non-deleted topics */}
                      {!topic.isDeleted && activeReplyForms[topic._id] && (
                        <div className="px-4 py-4 border-t border-[#FF7A00]/10 bg-black/20" onClick={e => e.stopPropagation()}>
                          <TopicForm
                            festivalId={typeof topic.festival === 'object' ? topic.festival._id : topic.festival.toString()}
                            parentComment={topic._id}
                            onSuccess={newComment => handleCommentSuccess(topic._id, newComment)}
                            hideTitle={true}
                          />
                        </div>
                      )}
                      
                      {/* Comments section - always show if comments exist */}
                      {((topic.comments && topic.comments.length > 0) || (topic.replies && topic.replies.length > 0)) && (
                        <div className="mt-4 border-t border-[#FF7A00]/20 pt-4 px-4">
                          <h3 className="text-lg font-bold text-[#FFB4A2] mb-4">comments</h3>
                          <div className="space-y-0 divide-y divide-[#FF7A00]/10">
                            {(topic.comments || topic.replies || [])
                              .filter(comment => shouldRenderTopic(comment))
                              .map((comment, index) => (
                                <div key={comment._id} className="pt-3 first:pt-0">
                                  <CommentComponent 
                                    comment={comment} 
                                    parentTopicId={topic._id} 
                                  />
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </motion.div>
            );
          })}
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
        >
          <motion.div 
            ref={loginPromptRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/90 border border-[#FF7A00]/40 rounded-xl p-6 max-w-md w-full"
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
              {loginPromptMessage || 'You need to be logged in to perform this action.'}
            </p>
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300 flex items-center gap-2 w-full justify-center"
            >
              <FaSignInAlt className="w-4 h-4" />
              <span>login now</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 