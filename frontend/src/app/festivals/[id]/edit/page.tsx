'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

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
        const response = await fetch(`http://localhost:5000/api/festivals/${params.id}`);
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

      console.log('Submitting festival data:', formattedData);
      console.log('Image file:', formData.imageFile);

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('festivalData', JSON.stringify(formattedData));
      
      if (formData.imageFile) {
        console.log('Appending image file:', {
          name: formData.imageFile.name,
          type: formData.imageFile.type,
          size: formData.imageFile.size
        });
        formDataToSend.append('image', formData.imageFile);
      }

      // Log the FormData contents
      console.log('FormData entries:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1]);
      }

      console.log('Sending request to server...');
      const response = await fetch(`http://localhost:5000/api/festivals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update festival');
      }

      const responseData = await response.json();
      console.log('Server response:', responseData);

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
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '80rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '3rem 1rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#dc2626' }}>Please log in to edit the festival</p>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '80rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '3rem 1rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#dc2626' }}>Access Denied: Admin privileges required to edit festivals</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '48rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '3rem 1rem'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ 
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: 'var(--text-color)',
            marginBottom: '2rem'
          }}>
            Edit Festival
          </h1>
          
          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
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
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
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
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="city" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
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
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div>
                <label htmlFor="country" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
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
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="lat" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                  Latitude
                </label>
                <input
                  type="number"
                  id="lat"
                  name="lat"
                  step="any"
                  value={formData.location.coordinates.lat}
                  onChange={handleChange}
                  placeholder="Enter latitude"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div>
                <label htmlFor="lng" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                  Longitude
                </label>
                <input
                  type="number"
                  id="lng"
                  name="lng"
                  step="any"
                  value={formData.location.coordinates.lng}
                  onChange={handleChange}
                  placeholder="Enter longitude"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="startDate" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div>
                <label htmlFor="endDate" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="genre" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
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
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)' }}>
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                  />
                  This is a free festival
                </label>
              </div>

              {!formData.isFree && (
                <div>
                  <label htmlFor="price" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
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
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="website" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Enter festival website"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="instagram" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                  Instagram
                </label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={formData.socialLinks.instagram}
                  onChange={handleChange}
                  placeholder="Instagram handle"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div>
                <label htmlFor="twitter" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                  Twitter
                </label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleChange}
                  placeholder="Twitter handle"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="imageFile" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                Festival Image
              </label>
              <input
                type="file"
                id="imageFile"
                name="imageFile"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <label style={{ color: 'var(--text-color)' }}>Lineup</label>
                <button
                  type="button"
                  onClick={addLineupArtist}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Add Artist
                </button>
              </div>
              {formData.lineup.map((artist, index) => (
                <div key={index} style={{ 
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <input
                    type="text"
                    name={`lineup-${index}`}
                    value={artist}
                    onChange={handleChange}
                    placeholder={`Artist ${index + 1}`}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem'
                    }}
                  />
                  {formData.lineup.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineupArtist(index)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '20px', height: '20px' }}>
                    <LoadingSpinner />
                  </div>
                  Updating Festival...
                </>
              ) : (
                'Update Festival'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 