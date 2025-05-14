'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/user';
import api from '@/services/api';

// Add interface for festival data
interface FestivalData {
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  startDate: string;
  endDate: string;
  genre: string;
  price: number;
  isFree: boolean;
  website: string;
  socialLinks: {
    instagram: string;
    twitter: string;
  };
  imageUrl: string;
  lineup: string[];
}

// Festival data based on the images
const festivalData: FestivalData[] = [
  {
    name: "Coachella",
    description: "The Coachella Valley Music and Arts Festival is an annual music and arts festival held at the Empire Polo Club in Indio, California. One of the largest, most famous, and most profitable music festivals in the United States and the world.",
    location: {
      city: "Indio",
      country: "United States",
      coordinates: {
        lat: 33.6823,
        lng: -116.2380
      }
    },
    startDate: "2024-04-12",
    endDate: "2024-04-21",
    genre: "Multi-Genre",
    price: 449,
    isFree: false,
    website: "https://www.coachella.com",
    socialLinks: {
      instagram: "coachella",
      twitter: "coachella"
    },
    imageUrl: "images/festivals/coachella.jpg",
    lineup: [
      "Bad Bunny",
      "BLACKPINK",
      "Frank Ocean",
      "Calvin Harris",
      "Gorillaz",
      "Rosalía"
    ]
  },
  {
    name: "Exit Festival",
    description: "EXIT is an award-winning summer music festival held at the Petrovaradin Fortress in Novi Sad, Serbia. It was founded in 2000 and has since grown to become one of the biggest music festivals in Southeast Europe.",
    location: {
      city: "Novi Sad",
      country: "Serbia",
      coordinates: {
        lat: 45.2517,
        lng: 19.8519
      }
    },
    startDate: "2024-07-11",
    endDate: "2024-07-14",
    genre: "Electronic/Rock",
    price: 129,
    isFree: false,
    website: "https://www.exitfest.org",
    socialLinks: {
      instagram: "exitfestival",
      twitter: "exitfestival"
    },
    imageUrl: "images/festivals/Exit.jpg",
    lineup: [
      "The Prodigy",
      "Skrillex",
      "Nike Romero",
      "Hot Since 82",
      "Paul Kalkbrenner"
    ]
  },
  {
    name: "Fuji Rock",
    description: "Fuji Rock Festival is Japan's largest outdoor music festival, held at the Naeba Ski Resort. Despite its name, the festival has been held at Naeba, Niigata Prefecture since 1997.",
    location: {
      city: "Yuzawa",
      country: "Japan",
      coordinates: {
        lat: 36.9261,
        lng: 138.7477
      }
    },
    startDate: "2024-07-26",
    endDate: "2024-07-28",
    genre: "Rock/Alternative",
    price: 299,
    isFree: false,
    website: "https://www.fujirockfestival.com",
    socialLinks: {
      instagram: "fujirock_jp",
      twitter: "fujirock_jp"
    },
    imageUrl: "images/festivals/fuji-rock-japan-times-scaled.jpeg",
    lineup: [
      "The Strokes",
      "Vampire Weekend",
      "Tame Impala",
      "FKA twigs",
      "Major Lazer"
    ]
  },
  {
    name: "Glastonbury",
    description: "Glastonbury Festival is one of the world's most famous music and performing arts festivals. Embracing each and every genre across the spectrum of contemporary performing arts.",
    location: {
      city: "Pilton",
      country: "United Kingdom",
      coordinates: {
        lat: 51.1788,
        lng: -2.7438
      }
    },
    startDate: "2024-06-26",
    endDate: "2024-06-30",
    genre: "Multi-Genre",
    price: 335,
    isFree: false,
    website: "https://www.glastonburyfestivals.co.uk",
    socialLinks: {
      instagram: "glastofest",
      twitter: "glastonbury"
    },
    imageUrl: "images/festivals/glastobury.jpg",
    lineup: [
      "Arctic Monkeys",
      "Guns N' Roses",
      "Elton John",
      "Lizzo",
      "Lana Del Rey"
    ]
  },
  {
    name: "Primavera Sound",
    description: "Primavera Sound is a music festival that takes place between the end of May and beginning of June in Barcelona, Spain. The festival is known for its eclectic lineup.",
    location: {
      city: "Barcelona",
      country: "Spain",
      coordinates: {
        lat: 41.4108,
        lng: 2.2247
      }
    },
    startDate: "2024-05-29",
    endDate: "2024-06-02",
    genre: "Alternative/Electronic",
    price: 245,
    isFree: false,
    website: "https://www.primaverasound.com",
    socialLinks: {
      instagram: "primavera_sound",
      twitter: "primavera_sound"
    },
    imageUrl: "images/festivals/primavera.jpg",
    lineup: [
      "Kendrick Lamar",
      "Depeche Mode",
      "Rosalía",
      "Calvin Harris",
      "Fred Again.."
    ]
  },
  {
    name: "Rock in Rio",
    description: "Rock in Rio is a recurring music festival originating in Rio de Janeiro, Brazil. It is one of the largest music festivals in the world.",
    location: {
      city: "Rio de Janeiro",
      country: "Brazil",
      coordinates: {
        lat: -22.9068,
        lng: -43.2096
      }
    },
    startDate: "2024-09-13",
    endDate: "2024-09-22",
    genre: "Rock/Pop",
    price: 199,
    isFree: false,
    website: "https://rockinrio.com",
    socialLinks: {
      instagram: "rockinrio",
      twitter: "rockinrio"
    },
    imageUrl: "images/festivals/rock-in-rio.jpg",
    lineup: [
      "Foo Fighters",
      "Iron Maiden",
      "Post Malone",
      "Justin Timberlake",
      "Alok"
    ]
  },
  {
    name: "Tomorrowland",
    description: "Tomorrowland is one of the world's largest and most notable electronic dance music festivals held in Boom, Belgium. It features many of the world's most prominent DJs.",
    location: {
      city: "Boom",
      country: "Belgium",
      coordinates: {
        lat: 51.0891,
        lng: 4.3661
      }
    },
    startDate: "2024-07-19",
    endDate: "2024-07-28",
    genre: "Electronic",
    price: 299,
    isFree: false,
    website: "https://www.tomorrowland.com",
    socialLinks: {
      instagram: "tomorrowland",
      twitter: "tomorrowland"
    },
    imageUrl: "images/festivals/tomorrowland.jpeg",
    lineup: [
      "Martin Garrix",
      "David Guetta",
      "Dimitri Vegas & Like Mike",
      "Armin van Buuren",
      "Charlotte de Witte"
    ]
  },
  {
    name: "Ultra Music Festival",
    description: "Ultra Music Festival is an annual outdoor electronic music festival that takes place in Miami, Florida. It was founded in 1999 and has since become one of the world's premier electronic music events.",
    location: {
      city: "Miami",
      country: "United States",
      coordinates: {
        lat: 25.7847,
        lng: -80.1853
      }
    },
    startDate: "2024-03-22",
    endDate: "2024-03-24",
    genre: "Electronic",
    price: 399,
    isFree: false,
    website: "https://ultramusicfestival.com",
    socialLinks: {
      instagram: "ultra",
      twitter: "ultra"
    },
    imageUrl: "images/festivals/ultra.jpg",
    lineup: [
      "Swedish House Mafia",
      "Hardwell",
      "Zedd",
      "Tiësto",
      "Kygo"
    ]
  },
  {
    name: "Sziget Festival",
    description: "Sziget is one of the largest music and cultural festivals in Europe. It is held every August in northern Budapest, Hungary, on Óbudai-sziget, a leafy 108-hectare island on the Danube.",
    location: {
      city: "Budapest",
      country: "Hungary",
      coordinates: {
        lat: 47.5508,
        lng: 19.0509
      }
    },
    startDate: "2024-08-07",
    endDate: "2024-08-13",
    genre: "Multi-Genre",
    price: 199,
    isFree: false,
    website: "https://szigetfestival.com",
    socialLinks: {
      instagram: "szigetofficial",
      twitter: "szigetofficial"
    },
    imageUrl: "images/festivals/sziget-2018.jpg",
    lineup: [
      "Dua Lipa",
      "Kings of Leon",
      "Arctic Monkeys",
      "Calvin Harris",
      "Stromae"
    ]
  }
];

export default function InsertFestivals() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const { user } = useAuth() as { user: User | null };
  const router = useRouter();

  // Check if user is admin, if not redirect
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

  const insertFestivals = async () => {
    setLoading(true);
    setStatus('Starting festival insertion...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      for (const festival of festivalData) {
        setStatus(`Inserting festival: ${festival.name}`);
        
        // Create FormData for the festival
        const formData = new FormData();

        // Prepare festival data without the imageUrl
        const { imageUrl, ...festivalDataWithoutImage } = festival;
        
        // Convert the festival data to a string
        formData.append('festivalData', JSON.stringify(festivalDataWithoutImage));

        // Get the image file name
        const imageName = imageUrl.split('/').pop();
        
        try {
          // Create a fetch request for the image file
          const imageResponse = await fetch(`/images/festivals/${imageName}`);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
          }
          const imageBlob = await imageResponse.blob();
          formData.append('image', imageBlob, imageName);
        } catch (error) {
          console.error(`Failed to fetch image for ${festival.name}:`, error);
          setStatus(`Warning: Failed to fetch image for ${festival.name}, continuing without image...`);
        }

        // Send the festival data to the backend
        const response = await fetch(getImageUrl(imageUrl), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = response.data;
          throw new Error(`Failed to insert ${festival.name}: ${errorData.message || response.statusText}`);
        }

        const result = response.data;
        setStatus(`Successfully inserted: ${festival.name}`);
      }

      setStatus('All festivals have been successfully inserted!');
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '80rem',
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
            marginBottom: '2rem'
          }}>
            Insert Festival Data
          </h1>
          
          <div style={{ marginBottom: '2rem' }}>
            <p>This will insert {festivalData.length} festivals with their corresponding images and information.</p>
          </div>

          <button
            onClick={insertFestivals}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9CA3AF' : 'var(--primary-color)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Inserting Festivals...' : 'Insert All Festivals'}
          </button>

          {status && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: status.includes('Error') ? '#FEE2E2' : '#ECFDF5',
              color: status.includes('Error') ? '#DC2626' : '#059669',
              borderRadius: '0.375rem'
            }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 