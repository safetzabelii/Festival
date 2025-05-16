import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProfileSettingsProps {
  profile: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    socialLinks?: {
      instagram?: string;
      twitter?: string;
      website?: string;
    };
  };
  onUpdate: (updatedProfile: any) => void;
}

// Helper function to get API URL - use proxy in production, localhost in development
const getApiUrl = (path: string) => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Use the proxy in production
    if (process.env.NODE_ENV === 'production') {
      return `/api/proxy/${path}`;
    }
  }
  // Fallback to direct URL (for development)
  return `http://localhost:5000/api/${path}`;
};

// Helper function to get image URL
const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // In production, use the image proxy
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return `/api/image-proxy/${url}`;
  }
  
  // In development, use direct URL
  return `http://localhost:5000${url}`;
};

export default function ProfileSettings({ profile, onUpdate }: ProfileSettingsProps) {
  const [name, setName] = useState(profile.name);
  const [socialLinks, setSocialLinks] = useState(profile.socialLinks || {});
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('Image size must be 5MB or less.');
        setAvatar(null);
        setPreviewUrl(profile.avatar || null);
        return;
      }
      setError(null);
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('socialLinks', JSON.stringify(socialLinks));
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      let updatedProfile;
      
      // Step 1: Update profile information first
      if (avatar) {
        console.log(`Uploading file: ${avatar.name}, size: ${Math.round(avatar.size / 1024)}KB, type: ${avatar.type}`);
        // Add the avatar to formData
        formData.append('avatar', avatar);
      }
      
      // Use the dedicated update-profile endpoint
      console.log('Sending profile update request');
      const updateUrl = '/api/update-profile';
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Content-Type is automatically set by the browser when using FormData
        },
        body: formData
      });
      
      console.log(`Update response status: ${response.status}`);
      
      if (!response.ok) {
        // Try to get error details
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.message || errorData.error || errorData.details || '';
        } catch (e) {
          try {
            errorDetail = await response.text();
          } catch (e2) {
            // Ignore error in getting text
          }
        }
        
        if (response.status === 413) {
          setError('Image size must be 5MB or less.');
        } else {
          setError(`Failed to update profile: ${response.status} ${errorDetail ? '- ' + errorDetail : ''}`);
        }
        return;
      }

      updatedProfile = await response.json();
      console.log('Profile updated successfully');
      onUpdate(updatedProfile);
      setPreviewUrl(updatedProfile.avatar ? getImageUrl(updatedProfile.avatar) : null);
      setAvatar(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatLocation = (location: { city: string; country: string } | undefined) => {
    if (!location) return 'Location not specified';
    if (!location.city && !location.country) return 'Location not specified';
    if (!location.city) return location.country;
    if (!location.country) return location.city;
    return `${location.city}, ${location.country}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-8"
    >
      <h2 className="text-3xl font-black tracking-tighter text-white mb-6">Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[#FFB4A2] mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-[#FFB4A2] opacity-60 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[#FFB4A2] mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="px-4 py-2 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg cursor-pointer hover:bg-[#FF7A00]/80 transition-colors"
              >
                Change Photo
              </label>
            </div>
            {avatar && (
              <div className="mt-2 text-[#FFB4A2] text-sm">
                Image selected: {avatar.name}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[#FFB4A2] mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
            />
          </div>

          <div>
            <label className="block text-[#FFB4A2] mb-2">Social Usernames</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Instagram Username"
                value={socialLinks.instagram || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
              />
              <input
                type="text"
                placeholder="Twitter Username"
                value={socialLinks.twitter || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
              />
              <input
                type="text"
                placeholder="Website (optional)"
                value={socialLinks.website || ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="text-[#FF3366] text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF7A00]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </motion.div>
  );
} 