import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopicForm from './TopicForm';
import { FaArrowUp, FaArrowDown, FaReply, FaComment, FaEye, FaThumbtack, FaTrash } from 'react-icons/fa';

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

  const fetchTopics = async () => {
    try {
      const url = festivalId 
        ? `http://localhost:5000/api/topics/${festivalId}?sort=${sortBy}`
        : `http://localhost:5000/api/topics?sort=${sortBy}`;
      
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
      
      // Log the processed structure for debugging
      console.log('Processed topics structure:', processedTopics);
      
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

  // Handle voting on topics
  const handleVote = async (topicId: string, vote: 'up' | 'down') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to vote');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/topics/${topicId}/vote`, {
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
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to vote');
        return;
      }

      console.log('Attempting to vote on topic reply:', commentId);
      
      // In TopicList, comments are actually Topic objects with parentComment set
      // So we need to use the topics API endpoint, not the comments endpoint
      const response = await fetch(`http://localhost:5000/api/topics/${commentId}/vote`, {
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
      console.log('Successfully voted on reply, received:', updatedComment);
      
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
      alert('Failed to vote. Please try again later.');
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
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to delete');
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
      
      const response = await fetch(`http://localhost:5000/api/topics/${commentId}`, {
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
    if (!window.confirm('Are you sure you want to delete this topic and all its comments?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to delete');
        return;
      }
      
      // Find if the topic has any comments/replies
      const topic = topics.find(t => t._id === topicId);
      const hasComments = topic && 
        ((topic.comments && topic.comments.length > 0) || 
         (topic.replies && topic.replies.length > 0));
      
      const response = await fetch(`http://localhost:5000/api/topics/${topicId}`, {
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FFD600] flex items-center justify-center text-black font-bold text-xs">
                  {!comment.isDeleted && comment.user?.name?.charAt(0) || 'a'}
                </div>
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 text-xs mb-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#FFD600]">
                      {comment.isDeleted ? 'Deleted' : comment.user?.name || 'Anonymous'}
                    </span>
                    <span className="text-[#FFB4A2]/60">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Delete button - only show for the author and if not deleted */}
                  {!comment.isDeleted && currentUserId && currentUserId === comment.user?._id && (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        handleCommentDelete(comment._id);
                      }}
                      className="text-[#FF3366] hover:text-[#FF3366]/80 transition-colors text-xs flex items-center gap-1"
                    >
                      <FaTrash className="w-3 h-3" />
                      delete
                    </button>
                  )}
                </div>
                <div className="text-[#FFB4A2]/80 mb-3">
                  {comment.isDeleted ? 'This comment has been deleted' : comment.content}
                </div>
                
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
                        toggleReplyForm(comment._id);
                      }}
                      className="flex items-center gap-1 text-[#FF7A00] hover:text-[#FFD600] transition-colors bg-black/30 rounded-full px-3 py-1.5 text-xs"
                    >
                      <FaReply className="w-3 h-3" />
                      reply
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
      </div>

      <div className="space-y-4">
        {topics
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FFD600] flex items-center justify-center text-black font-bold text-sm">
                        {!topic.isDeleted && topic.user?.name?.charAt(0) || 'a'}
                      </div>
                    </div>
                    
                    {/* Content area */}
                    <div className="flex-grow">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-[#FFB4A2]/60 mb-1 justify-between">
                          <div className="flex items-center gap-2">
                            <span>{topic.isDeleted ? 'Deleted' : topic.user?.name || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FaEye className="w-3 h-3" />
                              {topic.views}
                            </span>
                            <span className="px-2 py-0.5 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-xs">
                              {typeof topic.festival === 'object' ? topic.festival.name.toLowerCase() : topic.festival}
                            </span>
                          </div>
                          
                          {/* Delete button - only show for the author and if not deleted */}
                          {!topic.isDeleted && localStorage.getItem('userId') === topic.user?._id && (
                            <button
                              onClick={(e) => { 
                                e.stopPropagation();
                                handleTopicDelete(topic._id);
                              }}
                              className="text-[#FF3366] hover:text-[#FF3366]/80 transition-colors text-xs flex items-center gap-1"
                            >
                              <FaTrash className="w-3 h-3" />
                              delete
                            </button>
                          )}
                        </div>
                        
                        <h2 className="text-lg md:text-xl font-bold text-[#FFB4A2] mb-2">
                      {topic.isPinned && (
                        <span className="text-[#FFD600] mr-2"><FaThumbtack /></span>
                      )}
                      {topic.isDeleted ? 'This post has been deleted' : topic.title}
                    </h2>
                        
                        <p className={`text-[#FFB4A2]/80 ${isExpanded ? '' : 'line-clamp-2'} mb-3`}>
                          {topic.isDeleted ? 'Content removed' : topic.content}
                        </p>
                        
                        {/* Only show voting and reply options for non-deleted topics */}
                        {!topic.isDeleted && (
                          <div className="flex items-center gap-4 flex-wrap">
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
    </div>
  );
} 