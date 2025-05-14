import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CommentForm from './CommentForm';
import { FaTag, FaTimes, FaSignInAlt } from 'react-icons/fa';
import { formatRelativeTime } from '../utils/dateUtils';
import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CommentProps {
  comment: {
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
    replies?: CommentProps['comment'][];
    festival: string;
    parentComment?: string;
    isDeleted?: boolean;
  };
  onVote: (commentId: string, updatedComment: any) => void;
  onReply: (comment: CommentProps['comment']) => void;
  onEdit: () => void;
  onDelete: (commentId: string) => void;
  onLoginRequired?: (message?: string) => void;
}

export default function Comment({ comment, onVote, onReply, onEdit, onDelete, onLoginRequired }: CommentProps) {
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');
  const loginPromptRef = useRef<HTMLDivElement>(null);
  const currentUserId = localStorage.getItem('userId');
  const isLoggedIn = !!localStorage.getItem('token');

  // Handle click outside login prompt
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle clicks outside if we're showing our own modal (not using parent's)
      if (showLoginPrompt && !onLoginRequired && loginPromptRef.current && !loginPromptRef.current.contains(event.target as Node)) {
        setShowLoginPrompt(false);
      }
    };

    if (showLoginPrompt && !onLoginRequired) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLoginPrompt, onLoginRequired]);

  const handleLogin = () => {
    router.push('/login');
  };

  const showLoginModal = (message?: string) => {
    if (onLoginRequired) {
      onLoginRequired(message);
      return;
    }
    
    setLoginPromptMessage(message || 'You need to be logged in to interact with discussions.');
    setShowLoginPrompt(true);
  };

  const handleEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showLoginModal('Please login to edit comments');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/comments/${comment._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editedContent })
      });

      if (!response.ok) {
        if (response.status === 401) {
          showLoginModal('Your session has expired. Please login again to edit this comment.');
          return;
        }
        throw new Error('Failed to edit comment');
      }
      onEdit();
      setIsEditing(false);
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showLoginModal('Please login to delete comments');
        return;
      }

      const hasReplies = comment.replies && comment.replies.length > 0;

      const response = await fetch(`http://localhost:5000/api/comments/${comment._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          softDelete: hasReplies // If there are replies, soft delete. Otherwise, hard delete
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          showLoginModal('Your session has expired. Please login again to delete this comment.');
          return;
        }
        throw new Error('Failed to delete comment');
      }
      const data = await response.json();

      // Notify parent component about the deletion, pass the updated comment
      if (data.comment) {
        onVote(data.comment._id, data.comment); // This will update the comment in state with new upvotes/downvotes/isDeleted
      } else {
        onDelete(comment._id); // For hard delete
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleVote = async (vote: 'up' | 'down') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showLoginModal('Please login to vote on comments');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/comments/${comment._id}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote })
      });

      if (!response.ok) {
        if (response.status === 401) {
          showLoginModal('Your session has expired. Please login again to vote.');
          return;
        }
        throw new Error('Failed to vote');
      }
      const updatedComment = await response.json();

      // Preserve user object if missing in updatedComment
      if (!updatedComment.user && comment.user) {
        updatedComment.user = comment.user;
      }

      // Preserve replies if missing in updatedComment
      if (!updatedComment.replies && comment.replies) {
        updatedComment.replies = comment.replies;
      }

      // Notify parent to update the comment in state
      onVote(comment._id, updatedComment);
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleReplyClick = () => {
    if (!isLoggedIn) {
      showLoginModal('Please login to reply to comments');
      return;
    }
    setIsReplying(!isReplying);
  };

  const userVote = comment.voters.find(v => v.user === currentUserId)?.vote;

  return (
    <motion.div 
      layout="position"
      className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/20 rounded-lg p-6 mb-6 lowercase"
    >
      {/* Login Prompt Modal - only render if not using parent's handler */}
      {showLoginPrompt && !onLoginRequired && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center px-4"
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
              {loginPromptMessage || 'You need to be logged in to interact with discussions.'}
            </p>
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300 flex items-center gap-2 w-full justify-center"
            >
              <FaSignInAlt className="w-4 h-4" />
              <span>login now</span>
            </button>
          </motion.div>
        </motion.div>,
        document.body
      )}

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[#FFD600] text-base">{comment.user.name.toLowerCase()}</span>
          <span className="text-xs text-[#FFB4A2]/70">{formatRelativeTime(comment.createdAt)}</span>
        </div>
      </div>
      {comment.isDeleted ? (
        <div className="italic text-[#FF7A00] text-lg mb-6 break-words opacity-70 py-2">comment deleted</div>
      ) : (
        <div className="text-[#FFB4A2] text-lg mb-6 break-words py-2 leading-relaxed">{comment.content}</div>
      )}
      {comment.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {comment.tags.map(tag => (
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
      <div className="flex flex-wrap justify-between items-center mb-2">
        <div className="flex flex-wrap gap-3 items-center">
          {!comment.isDeleted && (
            <>
              <button
                onClick={() => handleVote('up')}
                disabled={comment.isDeleted}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 text-sm font-bold shadow-sm focus:outline-none ${
                  userVote === 'up'
                    ? 'bg-[#FF7A00]/20 border-[#FF7A00] text-[#FF7A00]'
                    : 'bg-black/60 border-[#FF7A00]/30 text-[#FFB4A2] hover:border-[#FFD600] hover:text-[#FFD600]'
                } ${comment.isDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                {comment.upvotes}
              </button>
              <button
                onClick={() => handleVote('down')}
                disabled={comment.isDeleted}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 text-sm font-bold shadow-sm focus:outline-none ${
                  userVote === 'down'
                    ? 'bg-[#FF7A00]/20 border-[#FF7A00] text-[#FF7A00]'
                    : 'bg-black/60 border-[#FF7A00]/30 text-[#FFB4A2] hover:border-[#FFD600] hover:text-[#FFD600]'
                } ${comment.isDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                {comment.downvotes}
              </button>
            </>
          )}
          
          {/* Always show reply button regardless of deletion status */}
          <button
            onClick={handleReplyClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF7A00]/30 bg-black/60 text-[#FFB4A2] hover:border-[#FFD600] hover:text-[#FFD600] transition-all duration-200 text-sm font-bold shadow-sm focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0 4.556 4.694 8.25 10.5 8.25.993 0 1.956-.09 2.872-.26a.75.75 0 01.528.09l3.1 1.86a.75.75 0 001.15-.648v-2.212a.75.75 0 01.22-.53A7.5 7.5 0 0021.75 12c0-4.556-4.694-8.25-10.5-8.25S2.25 7.444 2.25 12z" /></svg>
            {comment.replies ? comment.replies.length : 0}
          </button>
        </div>
        
        {/* Delete button - positioned at the far right */}
        {!comment.isDeleted && isLoggedIn && currentUserId && comment.user && comment.user._id && 
         currentUserId.toString().trim() === comment.user._id.toString().trim() && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF3366]/30 bg-black/60 text-[#FF3366] hover:border-[#FF3366] hover:bg-[#FF3366]/10 transition-all duration-200 text-sm font-bold shadow-sm focus:outline-none ml-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M3 6h18" /><path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" /><path d="M19 6l-1.5 14a2 2 0 01-2 2H8.5a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
            delete
          </button>
        )}
      </div>
      {/* Reply form */}
      <AnimatePresence>
        {isReplying && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <CommentForm
              festivalId={comment.festival}
              parentComment={comment._id}
              onComment={(newComment) => {
                onReply(newComment);
                setIsReplying(false);
              }}
              onLoginRequired={showLoginModal}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF7A00]/30 bg-black/60 text-[#FFB4A2] hover:border-[#FFD600] hover:text-[#FFD600] transition-all duration-200 text-sm font-bold shadow-sm focus:outline-none mb-2"
          >
            {showReplies ? `hide ${comment.replies.length} replies` : `show ${comment.replies.length} replies`}
          </button>
          <AnimatePresence>
            {showReplies && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 pl-8 border-l-2 border-[#FF7A00]/20"
              >
                {comment.replies.map(reply => (
                  <Comment
                    key={reply._id}
                    comment={reply}
                    onVote={onVote}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onLoginRequired={onLoginRequired}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
} 