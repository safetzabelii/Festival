import { useState } from 'react';
import api from '@/services/api';

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
}

interface CommentFormProps {
  festivalId: string;
  parentComment?: string;
  onComment: (comment: Comment) => void;
  onLoginRequired?: (message?: string) => void;
}

export default function CommentForm({ festivalId, parentComment, onComment, onLoginRequired }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (onLoginRequired) {
          onLoginRequired('Please login to comment');
          return;
        } else {
          throw new Error('Please login to comment');
        }
      }

      const requestData = {
        content,
        parentComment,
        tags
      };

      const response = await api.get(`/api/comments/${festivalId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = response.data;
        
        // Handle authorization errors with login prompt
        if (response.status === 401 && onLoginRequired) {
          onLoginRequired('Your session has expired. Please login again to comment.');
          return;
        }
        
        throw new Error(errorData.message || 'Failed to post comment');
      }
      
      const newComment = await response.json();
      
      onComment(newComment);
      setContent('');
      setTags([]);
      setTagInput('');
      setShowTagInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
      console.error('Error posting comment:', err);
    }
  };

  const handleAddTag = () => {
    setShowTagInput(true);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
      setShowTagInput(false);
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lowercase">
      {error && (
        <div className="text-[#FF3366] text-sm">{error.toLowerCase()}</div>
      )}
      
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="write your comment..."
          className="w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg py-4 px-4 pr-[80px] focus:outline-none focus:border-[#FF7A00] min-h-[100px] resize-none leading-relaxed"
          rows={4}
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="absolute top-2 right-2 px-3 py-1.5 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-sm font-medium hover:bg-[#FF7A00]/30 transition-colors"
        >
          add tag
        </button>
      </div>

      {showTagInput && (
        <div className="relative">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="type tag and press enter"
            className="w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00] leading-relaxed"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setShowTagInput(false);
              setTagInput('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#FFB4A2] hover:text-[#FF3366] transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-sm flex items-center gap-1"
            >
              {tag.toLowerCase()}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-[#FF3366] transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="submit"
        className="px-6 py-3 bg-[#FF7A00] text-black font-black tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300"
      >
        {parentComment ? 'reply' : 'post comment'}
      </button>
    </form>
  );
} 