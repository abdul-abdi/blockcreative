'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  StarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

// Define interfaces for data types
interface Analysis {
  plotStrength: number;
  characterDevelopment: number;
  marketPotential: number;
  uniqueness: number;
  pacing: number;
  dialogue: number;
  structure: number;
  theme: number;
}

interface RecentWork {
  title: string;
  studio: string;
  score: number;
  analysis?: Analysis;
}

interface Writer {
  id: number | string;
  name: string;
  avatar?: string;
  bio: string;
  genres: string[];
  rating: number;
  totalSubmissions: number;
  selectedSubmissions: number;
  earnings: string;
  averageScore: number;
  recentWork: RecentWork[];
  location?: string;
}

export default function FindWriters() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [filteredWriters, setFilteredWriters] = useState<Writer[]>([]);
  const [selectedWriter, setSelectedWriter] = useState<Writer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch writers from API
  useEffect(() => {
    const fetchWriters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Prepare headers with wallet address if available
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (walletAddress) {
          headers['x-wallet-address'] = walletAddress;
        }
        
        // TODO: Replace with actual API endpoint once available
        // const response = await fetch('/api/producer/writers', { headers });
        // if (response.ok) {
        //   const data = await response.json();
        //   setWriters(data.writers);
        //   setFilteredWriters(data.writers);
        //   if (data.writers.length > 0) {
        //     setSelectedWriter(data.writers[0]);
        //   }
        // } else {
        //   setError('Failed to load writers');
        // }
        
        // Temporary empty data until the API is implemented
        setWriters([]);
        setFilteredWriters([]);
        setSelectedWriter(null);
        
      } catch (error) {
        console.error('Error fetching writers:', error);
        setError('Failed to load writers. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWriters();
  }, []);
  
  // Filter writers based on search query and genre
  useEffect(() => {
    if (writers.length === 0) {
      setFilteredWriters([]);
      return;
    }
    
    let result = [...writers];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(writer => 
        writer.name.toLowerCase().includes(query) ||
        writer.bio.toLowerCase().includes(query)
      );
    }
    
    // Apply genre filter
    if (selectedGenre !== 'all') {
      result = result.filter(writer => 
        writer.genres.some(genre => genre.toLowerCase() === selectedGenre.toLowerCase())
      );
    }
    
    setFilteredWriters(result);
    
    // Update selected writer if needed
    if (result.length > 0 && (!selectedWriter || !result.find(w => w.id === selectedWriter.id))) {
      setSelectedWriter(result[0]);
    } else if (result.length === 0) {
      setSelectedWriter(null);
    }
  }, [searchQuery, selectedGenre, writers, selectedWriter]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
  };
  
  const handleWriterSelect = (writer: Writer) => {
    setSelectedWriter(writer);
  };
  
  if (isLoading) {
    return (
      <DashboardLayout userType="producer">
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="producer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Find Writers</h1>
          <p className="text-gray-400">Discover and connect with talented screenwriters</p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search writers by name, genre, or location..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
              />
            </div>
            <button
              onClick={() => setSelectedGenre('all')}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              Filters
            </button>
          </div>

          {selectedGenre !== 'all' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex flex-wrap gap-2">
                {['All Genres', 'Science Fiction', 'Drama', 'Thriller', 'Horror', 'Comedy', 'Crime', 'Mystery'].map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreChange(genre)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedGenre === genre
                        ? 'bg-[rgb(var(--accent-primary))] text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Writers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Writers List */}
          <div className="space-y-4">
            {filteredWriters.map((writer) => (
              <motion.div
                key={writer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card cursor-pointer ${
                  selectedWriter?.id === writer.id ? 'border-[rgb(var(--accent-primary))]' : ''
                }`}
                onClick={() => handleWriterSelect(writer)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                      {writer.avatar ? (
                        <Image
                          src={writer.avatar}
                          alt={writer.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                          {writer.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-white">{writer.name}</h3>
                          <p className="text-sm text-gray-400">{writer.location || 'Unknown location'}</p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <StarIconSolid className="w-5 h-5" />
                          <span>{writer.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">{writer.bio}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {writer.genres.map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-1 text-xs rounded-full bg-white/5 text-gray-300"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{writer.averageScore}</div>
                      <div className="text-xs text-gray-400">AI Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{writer.selectedSubmissions}/{writer.totalSubmissions}</div>
                      <div className="text-xs text-gray-400">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{writer.earnings}</div>
                      <div className="text-xs text-gray-400">Total Earnings</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Writer Details */}
          {selectedWriter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Recent Work Analysis */}
              <div className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Recent Work Analysis</h3>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{selectedWriter.recentWork[0].title}</h4>
                        <p className="text-sm text-gray-400">{selectedWriter.recentWork[0].studio}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <StarIcon className="w-5 h-5" />
                        <span>{selectedWriter.recentWork[0].score}</span>
                      </div>
                    </div>
                    <AIAnalysisChart analysisData={selectedWriter.recentWork[0].analysis} className="mt-4" />
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ChartBarIcon className="w-6 h-6 text-[rgb(var(--accent-primary))]" />
                    <h3 className="text-lg font-semibold text-white">Performance</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Success Rate</span>
                        <span className="text-white">{(selectedWriter.selectedSubmissions / selectedWriter.totalSubmissions * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]"
                          style={{ width: `${(selectedWriter.selectedSubmissions / selectedWriter.totalSubmissions * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Average AI Score</span>
                        <span className="text-white">{selectedWriter.averageScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]"
                          style={{ width: `${selectedWriter.averageScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <DocumentTextIcon className="w-6 h-6 text-[rgb(var(--accent-primary))]" />
                    <h3 className="text-lg font-semibold text-white">Activity</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Submissions</span>
                      <span className="text-white">{selectedWriter.totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Selected Scripts</span>
                      <span className="text-white">{selectedWriter.selectedSubmissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Earnings</span>
                      <span className="text-white">{selectedWriter.earnings}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Link
                  href={`/producer/messages/writer/${selectedWriter.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-semibold hover:from-[rgb(var(--accent-primary))]/90 hover:to-[rgb(var(--accent-secondary))]/90 transition-all"
                >
                  Contact Writer
                </Link>
                <button
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  <BookmarkIcon className="w-5 h-5" />
                  Save Profile
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 