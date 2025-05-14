'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

export default function CreateFestivalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: {
      city: '',
      country: '',
      coordinates: {
        lat: '',
        lng: ''
      }
    },
    startDate: '',
    endDate: '',
    genre: '',
    price: '',
    isFree: false,
    website: '',
    socialLinks: {
      instagram: '',
      twitter: ''
    },
    imageFile: null as File | null,
    lineup: [''] // Start with one empty artist
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  // Redirect non-admin users back to the homepage
  useEffect(() => {
    if (user === null) {
      // User is still loading, do nothing
      return;
    }

    if (user && !user.isAdmin) {
      // Use window.location for immediate redirection
      window.location.href = '/';
      return;
    }
  }, [user]);

  // Redirect non-admin users immediately
  if (!user || !user.isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
      return null;
    }
    return null;
  }

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Create a type-safe copy we can modify
        const updatedData = { ...prev };
        
        // Update the nested field safely
        if (parent === 'location') {
          updatedData.location = {
            ...updatedData.location,
            [child]: value
          };
        } else if (parent === 'socialLinks') {
          updatedData.socialLinks = {
            ...updatedData.socialLinks,
            [child]: value
          };
        }
        
        return updatedData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle checkbox input
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle location input
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  };

  // Handle social links input
  const handleSocialLinksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value
      }
    }));
  };

  // Handle lineup additions and changes
  const handleLineupChange = (index: number, value: string) => {
    const newLineup = [...formData.lineup];
    newLineup[index] = value;
    setFormData(prev => ({
      ...prev,
      lineup: newLineup
    }));
  };

  const addLineupMember = () => {
    setFormData(prev => ({
      ...prev,
      lineup: [...prev.lineup, '']
    }));
  };

  const removeLineupMember = (index: number) => {
    const newLineup = [...formData.lineup];
    newLineup.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      lineup: newLineup
    }));
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      imageFile: file
    }));
    
    // Create a preview URL for the selected image
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
    } else {
      setPreviewURL(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create a festival');
        setIsSubmitting(false);
        return;
      }
      
      // Create form data for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location[city]', formData.location.city);
      formDataToSend.append('location[country]', formData.location.country);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('genre', formData.genre);
      formDataToSend.append('isFree', formData.isFree.toString());
      
      if (!formData.isFree && formData.price) {
        formDataToSend.append('price', formData.price);
      }
      
      if (formData.website) {
        formDataToSend.append('website', formData.website);
      }
      
      formDataToSend.append('socialLinks[instagram]', formData.socialLinks.instagram);
      formDataToSend.append('socialLinks[twitter]', formData.socialLinks.twitter);
      
      // Add lineup members
      formData.lineup.forEach((artist, index) => {
        if (artist.trim()) {
          formDataToSend.append(`lineup[${index}]`, artist);
        }
      });
      
      // Add image file if present
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }
      
      const response = await fetch('http://localhost:5000/api/festivals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create festival');
      }
      
      // Redirect to festivals page
      router.push('/festivals');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="bg-black min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <h1 className="text-6xl font-black tracking-tighter mb-4 text-center text-[#FFB4A2] lowercase">
            create festival
          </h1>
          <p className="text-center text-[#FF7A00] text-xl lowercase mb-12">
            share your event with the community
          </p>

          {error && (
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF3366]/30 rounded-lg p-4 mb-8 text-center">
              <p className="text-[#FF3366]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Festival Details */}
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-[#FFB4A2] mb-6">Festival Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#FFB4A2] mb-2" htmlFor="name">
                    Festival Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                    placeholder="Enter festival name"
                  />
                </div>
                <div>
                  <label className="block text-[#FFB4A2] mb-2" htmlFor="description">
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                    placeholder="Describe the festival"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#FFB4A2] mb-2" htmlFor="city">
                      City*
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.location.city}
                      onChange={handleLocationChange}
                      required
                      className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-[#FFB4A2] mb-2" htmlFor="country">
                      Country*
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.location.country}
                      onChange={handleLocationChange}
                      required
                      className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                      placeholder="Country"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#FFB4A2] mb-2" htmlFor="startDate">
                      Start Date*
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#FFB4A2] mb-2" htmlFor="endDate">
                      End Date*
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#FFB4A2] mb-2" htmlFor="genre">
                    Genre*
                  </label>
                  <input
                    type="text"
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                    placeholder="e.g., Electronic, Rock, Jazz"
                  />
                </div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isFree"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-[#FF7A00] bg-black/50 border-[#FF7A00]/40 rounded focus:ring-[#FF7A00]"
                  />
                  <label htmlFor="isFree" className="ml-2 text-[#FFB4A2]">
                    This festival is free
                  </label>
                </div>
                {!formData.isFree && (
                  <div>
                    <label className="block text-[#FFB4A2] mb-2" htmlFor="price">
                      Price*
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required={!formData.isFree}
                      min="0"
                      step="0.01"
                      className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                      placeholder="Price in USD"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Festival Image */}
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-[#FFB4A2] mb-6">Festival Image</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#FFB4A2] mb-2" htmlFor="image">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
                {previewURL && (
                  <div className="mt-4">
                    <p className="text-[#FFB4A2] mb-2">Preview:</p>
                    <img
                      src={previewURL}
                      alt="Preview"
                      className="max-w-full h-auto max-h-60 rounded-lg border border-[#FF7A00]/40"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-[#FFB4A2] mb-6">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#FFB4A2] mb-2" htmlFor="website">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                    placeholder="https://yourfestival.com"
                  />
                </div>
                <div>
                  <label className="block text-[#FFB4A2] mb-2" htmlFor="instagram">
                    Instagram
                  </label>
                  <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    value={formData.socialLinks.instagram}
                    onChange={handleSocialLinksChange}
                    className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                    placeholder="@festivalhandle"
                  />
                </div>
                <div>
                  <label className="block text-[#FFB4A2] mb-2" htmlFor="twitter">
                    Twitter
                  </label>
                  <input
                    type="text"
                    id="twitter"
                    name="twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleSocialLinksChange}
                    className="w-full bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                    placeholder="@festivalhandle"
                  />
                </div>
              </div>
            </div>

            {/* Lineup */}
            <div className="bg-black/40 backdrop-blur-sm border border-[#FF7A00]/30 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#FFB4A2]">Lineup</h2>
                <button
                  type="button"
                  onClick={addLineupMember}
                  className="px-4 py-2 bg-[#FF7A00]/20 text-[#FF7A00] rounded-lg hover:bg-[#FF7A00]/30 transition-colors"
                >
                  Add Artist
                </button>
              </div>
              <div className="space-y-4">
                {formData.lineup.map((artist, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => handleLineupChange(index, e.target.value)}
                      className="flex-1 bg-black/50 text-[#FFB4A2] border border-[#FF7A00]/40 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF7A00]"
                      placeholder={`Artist ${index + 1}`}
                    />
                    {formData.lineup.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineupMember(index)}
                        className="p-3 bg-[#FF3366]/20 text-[#FF3366] rounded-lg hover:bg-[#FF3366]/30 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-[#FF7A00] text-black font-bold text-lg tracking-tight rounded-lg hover:bg-[#FFD600] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Festival'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtectedRoute>
  );
} 