'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';

interface Festival {
  _id: string;
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startDate: string;
  endDate: string;
  genre: string;
  price: number;
  isFree: boolean;
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
  };
  imageUrl?: string;
  lineup?: string[];
}

export default function EditFestivalPage() {
  const router = useRouter();
  const params = useParams();
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
    lineup: [''] // Start with one empty artist input
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchFestival = async () => {
      try {
        const response = await api.get(`/api/festivals/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch festival');
        }
        const festival = await response.json();
        
        // Format dates to YYYY-MM-DD for input fields
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        setFormData({
          ...festival,
          startDate: formatDate(festival.startDate),
          endDate: formatDate(festival.endDate),
          price: festival.isFree ? '' : festival.price.toString(),
          imageFile: null,
          location: {
            ...festival.location,
            coordinates: {
              lat: festival.location?.coordinates?.lat?.toString() || '',
              lng: festival.location?.coordinates?.lng?.toString() || ''
            }
          },
          lineup: festival.lineup?.length > 0 ? festival.lineup : ['']
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchFestival();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'city' || name === 'country') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }));
    } else if (name === 'lat' || name === 'lng') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: {
            ...prev.location.coordinates,
            [name]: value
          }
        }
      }));
    } else if (name === 'instagram' || name === 'twitter') {
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [name]: value
        }
      }));
    } else if (name === 'isFree') {
      setFormData(prev => ({
        ...prev,
        isFree: (e.target as HTMLInputElement).checked,
        price: (e.target as HTMLInputElement).checked ? '' : prev.price
      }));
    } else if (name.startsWith('lineup-')) {
      const index = parseInt(name.split('-')[1]);
      const newLineup = [...formData.lineup];
      newLineup[index] = value;
      setFormData(prev => ({
        ...prev,
        lineup: newLineup
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addLineupArtist = () => {
    setFormData(prev => ({
      ...prev,
      lineup: [...prev.lineup, '']
    }));
  };

  const removeLineupArtist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineup: prev.lineup.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        imageFile: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to update the festival');
      setLoading(false);
      return;
    }

    try {
      // Format dates to ISO string and clean up the data
      const formattedData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        price: formData.isFree ? 0 : parseFloat(formData.price),
        location: {
          ...formData.location,
          coordinates: formData.location.coordinates.lat && formData.location.coordinates.lng
            ? {
                lat: parseFloat(formData.location.coordinates.lat),
                lng: parseFloat(formData.location.coordinates.lng)
              }
            : undefined
        },
        lineup: formData.lineup.filter(artist => artist.trim() !== '')
      };

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('festivalData', JSON.stringify(formattedData));
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const response = await api.get(`/api/festivals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = response.data;
        throw new Error(errorData.message || 'Failed to update festival');
      }

      router.push('/festivals');
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center text-[#FF3366]">Please log in to edit the festival</div>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center text-[#FF3366]">Access Denied: Admin privileges required to edit festivals</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-8xl font-black tracking-tighter lowercase text-center mb-4 bg-gradient-to-r from-[#FF7A00] via-[#FFD600] to-[#FF3366] text-transparent bg-clip-text">
          edit festival
        </h1>
        <p className="text-2xl text-[#FFB4A2] text-center mb-16 font-black tracking-tight lowercase">
          update your festival details
        </p>

        <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF7A00]/20 rounded-xl p-8 max-w-3xl mx-auto">
          {error && (
            <div className="bg-black/40 backdrop-blur-sm border-2 border-[#FF3366]/20 rounded-xl p-4 mb-8 text-[#FF3366] text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                Festival Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter festival name"
                className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your festival"
                className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="city" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  required
                  value={formData.location.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="genre" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                Genre *
              </label>
              <input
                type="text"
                id="genre"
                name="genre"
                required
                value={formData.genre}
                onChange={handleChange}
                placeholder="Enter festival genre"
                className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-[#FFB4A2] font-black tracking-tighter">
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                    className="w-4 h-4 bg-black/40 border-2 border-[#FF7A00]/20 rounded focus:outline-none focus:border-[#FF7A00]"
                  />
                  This is a free festival
                </label>
              </div>

              {!formData.isFree && (
                <div>
                  <label htmlFor="price" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required={!formData.isFree}
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter ticket price"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Enter festival website"
                className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="instagram" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                  Instagram
                </label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={formData.socialLinks.instagram}
                  onChange={handleChange}
                  placeholder="Instagram handle"
                  className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
              <div>
                <label htmlFor="twitter" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                  Twitter
                </label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleChange}
                  placeholder="Twitter handle"
                  className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="imageFile" className="block text-[#FFB4A2] font-black tracking-tighter mb-2">
                Festival Image
              </label>
              <input
                type="file"
                id="imageFile"
                name="imageFile"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-[#FFB4A2] font-black tracking-tighter">Lineup</label>
                <button
                  type="button"
                  onClick={addLineupArtist}
                  className="px-4 py-2 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF3366] hover:text-white transition-all duration-300"
                >
                  Add Artist
                </button>
              </div>
              {formData.lineup.map((artist, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    name={`lineup-${index}`}
                    value={artist}
                    onChange={handleChange}
                    placeholder={`Artist ${index + 1}`}
                    className="flex-1 px-4 py-2 bg-black/40 border-2 border-[#FF7A00]/20 rounded-lg text-white placeholder-[#FFB4A2] focus:outline-none focus:border-[#FF7A00]"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeLineupArtist(index)}
                      className="px-4 py-2 bg-[#FF3366] text-white font-black tracking-tighter rounded-lg hover:bg-[#FF7A00] hover:text-black transition-all duration-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#FF7A00] text-black font-black tracking-tighter rounded-lg hover:bg-[#FF3366] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  <span>Updating Festival...</span>
                </div>
              ) : (
                'Update Festival'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
} 