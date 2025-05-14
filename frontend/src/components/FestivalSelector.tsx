import { useState, useEffect } from 'react';
import api from '@/services/api';

interface Festival {
  _id: string;
  name: string;
  image?: string;
}

interface FestivalSelectorProps {
  onSelect: (festivalId: string) => void;
  selectedFestival: string | null;
}

export default function FestivalSelector({ onSelect, selectedFestival }: FestivalSelectorProps) {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const response = await fetch(getImageUrl(imageUrl));
        if (!response.ok) throw new Error('Failed to fetch festivals');
        const data = response.data;
        setFestivals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch festivals');
      } finally {
        setLoading(false);
      }
    };

    fetchFestivals();
  }, []);

  const filteredFestivals = festivals.filter(festival =>
    festival.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-[#FFB4A2]">Loading festivals...</div>;
  if (error) return <div className="text-[#FF3366]">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search festivals..."
          className="w-full bg-black/40 text-[#FFB4A2] border border-[#FF7A00]/20 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-[#FF7A00]"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFB4A2]/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFestivals.map(festival => (
          <button
            key={festival._id}
            onClick={() => onSelect(festival._id)}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              selectedFestival === festival._id
                ? 'border-[#FFD600] bg-[#FFD600]/10'
                : 'border-[#FF7A00]/20 bg-black/40 hover:border-[#FF7A00] hover:bg-black/60'
            }`}
          >
            <div className="flex items-center gap-4">
              {festival.image && (
                <img
                  src={festival.image}
                  alt={festival.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <span className="text-[#FFB4A2] font-medium">{festival.name}</span>
            </div>
          </button>
        ))}
      </div>

      {filteredFestivals.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[#FFB4A2]/60">No festivals found</p>
        </div>
      )}
    </div>
  );
} 