import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Comment from './Comment';
import CommentForm from './CommentForm';

interface DiscussionProps {
  festivalId: string;
}

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  upvotes: number;
  downvotes: number;
  voters: {
    user: string;
    vote: 'up' | 'down';
  }[];
  tags: string[];
  isEdited: boolean;
  createdAt: string;
  festival: string;
  replies?: Comment[];
  isDeleted?: boolean;
  parentComment?: string;
}

export default function Discussion({ festivalId }: DiscussionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{left: number, top: number, width: number} | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${festivalId}?sort=${sortBy}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(data);
      
      // Extract unique tags from all comments
      const tags = new Set<string>();
      data.forEach((comment: Comment) => {
        comment.tags.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [festivalId, sortBy]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          tagInputRef.current && !tagInputRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate dropdown position on scroll/resize when open
  useEffect(() => {
    if (!showTagDropdown) return;
    const updateDropdownPos = () => {
      if (tagInputRef.current) {
        const rect = tagInputRef.current.getBoundingClientRect();
        setDropdownPos({ left: rect.left, top: rect.bottom, width: rect.width });
      }
    };
    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    updateDropdownPos();
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [showTagDropdown]);

  // Recursively update a comment in the tree
  function updateCommentTree(comments: Comment[], updatedId: string, updates: Partial<Comment>): Comment[] {
    return comments.map(comment => {
      if (comment._id === updatedId) {
        return { ...comment, ...updates };
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: updateCommentTree(comment.replies, updatedId, updates) };
      }
      return comment;
    });
  }

  // Recursively remove a comment from the tree
  function removeCommentFromTree(comments: Comment[], commentId: string): Comment[] {
    return comments.filter(comment => {
      if (comment._id === commentId) {
        return false; // Remove this comment
      }
      if (comment.replies && comment.replies.length > 0) {
        comment.replies = removeCommentFromTree(comment.replies, commentId);
        // If this was a deleted parent comment and now has no replies, and has no votes, remove it
        if (comment.isDeleted && comment.replies.length === 0 && comment.upvotes === 0 && comment.downvotes === 0) {
          // Also delete from backend
          deleteFromBackend(comment._id);
          return false;
        }
      }
      return true;
    });
  }

  // Helper function to delete from backend
  const deleteFromBackend = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          hardDelete: true // Force hard delete since we're cleaning up
        })
      });
    } catch (err) {
      console.error('Error cleaning up deleted comment:', err);
    }
  };

  const handleVote = async (commentId: string, updatedComment: any) => {
    setComments(prev => updateCommentTree(prev, commentId, updatedComment));
  };

  const handleNewComment = (newComment: Comment) => {
    if (newComment.parentComment) {
      // If it's a reply, update the parent comment's replies
      setComments(prev => {
        const parentComment = prev.find(c => c._id === newComment.parentComment);
        if (!parentComment || !newComment.parentComment) return prev;
        
        return updateCommentTree(prev, newComment.parentComment, {
          replies: [...(parentComment.replies || []), newComment]
        });
      });
    } else {
      // If it's a top-level comment, add it to the beginning
      setComments(prev => [newComment, ...prev]);
    }
  };

  const handleDelete = (commentId: string) => {
    // Find the comment in the tree
    const findComment = (comments: Comment[]): Comment | null => {
      for (const comment of comments) {
        if (comment._id === commentId) {
          return comment;
        }
        if (comment.replies && comment.replies.length > 0) {
          const found = findComment(comment.replies);
          if (found) return found;
        }
      }
      return null;
    };

    const comment = findComment(comments);
    const hasReplies = comment?.replies && comment.replies.length > 0;

    if (hasReplies) {
      // If the comment has replies, update it to show as deleted
      setComments(prev => updateCommentTree(prev, commentId, { isDeleted: true, content: 'Comment deleted' }));
    } else {
      // If the comment has no replies, remove it completely
      // This will also check if it was the last child of a deleted parent with no votes
      setComments(prev => removeCommentFromTree(prev, commentId));
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    setShowTagDropdown(true);
    if (tagInputRef.current) {
      const rect = tagInputRef.current.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.bottom, width: rect.width });
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!selectedTags.includes(tagInput.trim())) {
        setSelectedTags(prev => [...prev, tagInput.trim()]);
      }
      setTagInput('');
      setShowTagDropdown(false);
    }
  };

  const handleTagInputFocus = () => {
    setShowTagDropdown(true);
    if (tagInputRef.current) {
      const rect = tagInputRef.current.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.bottom, width: rect.width });
    }
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.includes(tag)
  );

  const filteredComments = comments.filter(comment => {
    if (selectedTags.length === 0) return true;
    return selectedTags.some(tag => comment.tags.includes(tag));
  });

  if (loading) return <div className="text-[#FFB4A2]">Loading discussions...</div>;
  if (error) return <div className="text-[#FF3366]">Error: {error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-black tracking-tighter text-[#FFB4A2]">Discussions</h2>

        <div className="flex flex-col gap-4 bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-[#FFB4A2]">Sort by:</span>
              <div className="relative z-30">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'top')}
                  className="bg-black/90 text-[#FFB4A2] border border-[#FF7A00] rounded-lg px-4 py-2 focus:outline-none focus:border-[#FFD600] shadow-lg z-30 appearance-none"
                  style={{ minWidth: '140px', position: 'relative' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="top">Most Popular</option>
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF7A00]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[#FFB4A2]">Filter by tags:</span>
                <div className="relative flex-1 z-40">
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagInputKeyDown}
                    onFocus={handleTagInputFocus}
                    placeholder="Type to add tags..."
                    className="w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg px-4 py-2 focus:outline-none focus:border-[#FF7A00]"
                  />
                  {showTagDropdown && filteredTags.length > 0 && dropdownPos && createPortal(
                    <div
                      ref={dropdownRef}
                      className="fixed z-[9999] bg-black/90 backdrop-blur-sm rounded-lg shadow-2xl"
                      style={{
                        left: dropdownPos.left,
                        top: dropdownPos.top,
                        width: dropdownPos.width,
                        marginTop: 4,
                      }}
                    >
                      {filteredTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          className="w-full px-4 py-2 text-left text-[#FFB4A2] hover:bg-[#FF7A00]/20 transition-colors border-0"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>, document.body
                  )}
                </div>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-[#FF7A00] text-black rounded-full text-sm font-medium flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-[#FF3366] transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-6">
          <CommentForm festivalId={festivalId} onComment={handleNewComment} />
        </div>
      </div>

      <div className="space-y-6">
        {filteredComments.map(comment => (
          <motion.div
            key={comment._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Comment
              comment={comment}
              onVote={handleVote}
              onReply={handleNewComment}
              onEdit={fetchComments}
              onDelete={handleDelete}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
} 