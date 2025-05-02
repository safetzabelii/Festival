import { useState } from 'react';

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
}

export default function CommentForm({ festivalId, parentComment, onComment }: CommentFormProps) {
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
      if (!token) throw new Error('Please login to comment');

      const response = await fetch(`http://localhost:5000/api/comments/${festivalId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          parentComment,
          tags
        })
      });

      if (!response.ok) throw new Error('Failed to post comment');
      const newComment = await response.json();
      onComment(newComment);
      setContent('');
      setTags([]);
      setTagInput('');
      setShowTagInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-[#FF3366] text-sm">{error}</div>
      )}
      
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your comment..."
          className="w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg p-4 focus:outline-none focus:border-[#FF7A00] min-h-[100px] resize-none"
          rows={4}
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="absolute top-2 right-2 px-3 py-1.5 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-sm font-medium hover:bg-[#FF7A00]/30 transition-colors"
        >
          Add Tag
        </button>
      </div>

      {showTagInput && (
        <div className="relative">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Type tag and press Enter"
            className="w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg px-4 py-2 focus:outline-none focus:border-[#FF7A00]"
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
              {tag}
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
        {parentComment ? 'Reply' : 'Post Comment'}
      </button>
    </form>
  );
} 