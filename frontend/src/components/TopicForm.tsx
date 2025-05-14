import { useState, useEffect } from 'react';
import { FaTag, FaSignInAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface Topic {
  _id: string;
  title: string;
  content: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  festival: string;
  upvotes: number;
  downvotes: number;
  views: number;
  createdAt: string;
  isPinned: boolean;
  comments?: Topic[];
  parentId?: string;
}

interface TopicFormProps {
  festivalId: string;
  parentComment?: string;
  onSuccess: (topic: Topic) => void;
  hideTitle?: boolean;
}

export default function TopicForm({ festivalId, parentComment, onSuccess, hideTitle }: TopicFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status after component mounts (client-side only)
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!parentComment && !title.trim()) || !content.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to create a topic or comment');
        return;
      }

      const requestData = {
        title: title.trim() || `Re: ${parentComment ? 'Comment' : 'Topic'}`,
        content,
        parentComment,
        tags
      };

      const response = await fetch(`http://localhost:5000/api/topics/${festivalId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.status === 401) {
        // Handle expired token
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setError('Your session has expired. Please login again.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create topic');
      }
      
      const newTopic = await response.json();
      
      // Ensure the new topic has proper parentId field
      const enhancedTopic = {
        ...newTopic,
        parentId: parentComment
      };
      
      onSuccess(enhancedTopic);
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setShowTagInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
      console.error('Error creating topic:', err);
    }
  };

  const handleLogin = () => {
    router.push('/login');
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

  // Show login button if not logged in and there's an error
  if (error && !isLoggedIn && error.toLowerCase().includes('login')) {
    return (
      <div className="p-4 bg-black/30 rounded-lg border border-[#FF3366]/20">
        <p className="text-[#FFB4A2] mb-4">{error.toLowerCase()}</p>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300 flex items-center gap-2"
        >
          <FaSignInAlt className="w-3.5 h-3.5" />
          <span>login now</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lowercase">
      {error && (
        <div className="text-[#FF3366] text-sm">{error.toLowerCase()}</div>
      )}
      
      {!hideTitle && (
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="topic title..."
            className="w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00] leading-relaxed"
          />
        </div>
      )}

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentComment ? "write your comment..." : "write your topic content..."}
          className={`w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg py-4 px-4 focus:outline-none focus:border-[#FF7A00] resize-none leading-relaxed ${
            parentComment ? 'min-h-[100px]' : 'min-h-[200px]'
          } ${!parentComment ? 'pr-[90px]' : 'pr-[80px]'}`}
          rows={parentComment ? 4 : 8}
        />
        {!parentComment && (
          <button
            type="button"
            onClick={handleAddTag}
            className="absolute top-2 right-2 px-3 py-1.5 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-sm font-medium hover:bg-[#FF7A00]/30 transition-colors z-10"
          >
            add tag
          </button>
        )}
        {parentComment && (
          <button
            type="button"
            onClick={handleAddTag}
            className="absolute bottom-3 right-3 px-3 py-1 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-xs font-medium hover:bg-[#FF7A00]/30 transition-colors z-10"
          >
            add tag
          </button>
        )}
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
              className="inline-flex items-center px-3 py-1 bg-[#FF7A00]/20 text-[#FF7A00] rounded-full text-sm font-medium"
            >
              <FaTag className="text-[#FF7A00] mr-1.5 text-[0.7rem]" />
              {tag.toLowerCase()}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 hover:text-[#FF3366] transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-start">
        <button
          type="submit"
          className={`${
            parentComment 
              ? 'px-4 py-2 text-sm' 
              : 'px-6 py-3'
          } bg-[#FF7A00] text-black font-bold tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300`}
        >
          {parentComment ? 'post comment' : 'create topic'}
        </button>
      </div>
    </form>
  );
} 