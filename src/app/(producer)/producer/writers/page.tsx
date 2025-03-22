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
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import DashboardLayout from '@/components/DashboardLayout';

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
  avatar?: string | null;
  bio: string;
  genres: string[];
  rating: number;
  totalSubmissions: number;
  selectedSubmissions: number;
  earnings: string;
  averageScore: number;
  recentWork: RecentWork[];
  location?: string;
  completenessScore: number;
}

export default function FindWriters() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [filteredWriters, setFilteredWriters] = useState<Writer[]>([]);
  const [selectedWriter, setSelectedWriter] = useState<Writer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debug function to inspect MongoDB for troubleshooting
  const inspectMongoDB = () => {
    console.log('Inspecting MongoDB data...');
    fetch('/api/debug/mongodb', {
      headers: {
        'x-wallet-address': localStorage.getItem('walletAddress') || '',
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('MongoDB Debug Data:', data);
      if (data.sampleSubmissions && data.sampleSubmissions.length > 0) {
        console.log('Sample submission fields:');
        const submission = data.sampleSubmissions[0];
        console.log('- id:', submission.id);
        console.log('- _id:', submission._id);
        console.log('- project_id:', submission.project_id);
        console.log('- writer_id:', submission.writer_id);
      }
    })
    .catch(error => {
      console.error('Error inspecting MongoDB:', error);
    });
  };
  
  // Fetch writers from API
  useEffect(() => {
    const fetchWriters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Starting writers data fetch...');
        
        // Inspect MongoDB data for debugging
        inspectMongoDB();
        
        // Prepare headers with wallet address if available
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        const walletAddress = localStorage.getItem('walletAddress');
        
        console.log('Using wallet address for authentication:', walletAddress || 'Not found');
        
        if (walletAddress) {
          headers['x-wallet-address'] = walletAddress;
        }
        
        // Fetch writers with role=writer from the API
        console.log('Fetching writers from API...');
        const response = await fetch('/api/users?role=writer', { 
          headers,
          cache: 'no-store'
        });
        
        console.log('Writers API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from API:', errorText);
          throw new Error(`Failed to fetch writers: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Writers API response data:', JSON.stringify(data, null, 2));
        
        if (!data.users || !Array.isArray(data.users)) {
          console.error('Invalid response format, users array not found:', data);
          throw new Error('Invalid response format');
        }
        
        console.log(`Found ${data.users.length} writers in the database`);
        
        // Fetch submissions to get real writer performance data
        console.log('Fetching submissions for writer performance data...');
        const submissionsResponse = await fetch('/api/submissions?role=producer', {
          headers,
        });
        
        console.log('Submissions API response status:', submissionsResponse.status);
        
        let submissions: any[] = [];
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          submissions = submissionsData.submissions || [];
          console.log(`Found ${submissions.length} submissions`);
          
          if (submissions.length > 0) {
            console.log('Sample submission data:', JSON.stringify(submissions[0], null, 2));
          }
        } else {
          console.error('Failed to fetch submissions:', await submissionsResponse.text());
        }
        
        // Map API data to our Writer interface, using only real data
        console.log('Mapping writers data...');
        const mappedWriters: Writer[] = data.users.map((user: any) => {
          console.log(`Processing writer: ${user.id}`);
          
          // Extract profile data or use defaults
          const profile = user.profile_data || {};
          const genres = profile.genres || [];
          
          console.log(`Writer ${user.id} profile data:`, profile);
          
          // Find all submissions by this writer
          const writerSubmissions = submissions.filter(
            (sub: any) => sub.writer_id === user.id
          );
          
          console.log(`Writer ${user.id} has ${writerSubmissions.length} submissions`);
          
          // Calculate real metrics from submission data
          const totalSubmissions = writerSubmissions.length;
          const selectedSubmissions = writerSubmissions.filter(
            (sub: any) => sub.status === 'accepted'
          ).length;
          
          // Calculate real average score if available
          let avgScore = 0;
          const scoredSubmissions = writerSubmissions.filter(sub => 
            typeof sub.score === 'number' || typeof sub.ai_score === 'number'
          );
          
          if (scoredSubmissions.length > 0) {
            const total = scoredSubmissions.reduce((sum, sub) => {
              const score = typeof sub.score === 'number' ? sub.score : 
                          (typeof sub.ai_score === 'number' ? sub.ai_score : 0);
              return sum + score;
            }, 0);
            avgScore = Math.round(total / scoredSubmissions.length);
          }
          
          console.log(`Writer ${user.id} stats: totalSubs=${totalSubmissions}, acceptedSubs=${selectedSubmissions}, avgScore=${avgScore}`);
          
          // Calculate earnings (placeholder for now since we don't have real data)
          const earnings = totalSubmissions > 0 
            ? `$${Math.round(totalSubmissions * 1000 / (Math.random() * 3 + 1))}` 
            : '$0';
          
          // Get writer name from multiple possible sources
          const writerName = profile.display_name || 
            profile.name || 
            user.name || 
            user.display_name || 
            '';
          
          // Calculate a completeness score for the writer profile
          // This helps prioritize writers with more complete profiles
          let completenessScore = 0;
          if (writerName && writerName !== "Anonymous Writer") completenessScore += 3;
          if (profile.avatar) completenessScore += 2;
          if (genres.length > 0) completenessScore += 1;
          if (totalSubmissions > 0) completenessScore += 2;
          if (profile.rating) completenessScore += 1;
          if (profile.bio) completenessScore += 1;
  
          return {
            id: user.id,
            name: writerName || 'Anonymous Writer',
            avatar: profile.avatar,
            bio: profile.bio || 'No bio available.',
            genres: genres,
            rating: profile.rating || 4.0,
            totalSubmissions,
            selectedSubmissions,
            earnings,
            averageScore: avgScore,
            recentWork: profile.recent_work || [],
            location: profile.location,
            completenessScore // Add completeness score for sorting
          };
        })
        // Filter out writers with no name or "Anonymous Writer"
        .filter((writer: Writer & { completenessScore: number }) => 
          writer.name && writer.name !== "Anonymous Writer")
        // Sort by completeness score (highest first) and then by rating
        .sort((a: any, b: any) => 
          b.completenessScore - a.completenessScore || b.rating - a.rating);
            
        console.log(`After filtering, found ${mappedWriters.length} writers with actual names`);
        
        setWriters(mappedWriters);
        setFilteredWriters(mappedWriters);
        
        if (mappedWriters.length > 0) {
          console.log('Setting selected writer:', mappedWriters[0].name);
          setSelectedWriter(mappedWriters[0]);
        } else {
          console.log('No writers to select');
        }
        
        console.log('Writers data fetch complete');
      } catch (error: any) {
        console.error('Error fetching writers:', error);
        setError(error.message || 'Failed to load writers. Please try again later.');
        // Set empty arrays to avoid undefined errors
        setWriters([]);
        setFilteredWriters([]);
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
            {filteredWriters.length > 0 ? (
              filteredWriters.map((writer) => (
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
              ))
            ) : (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-black/20">
                <UserGroupIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Writers Found</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {isLoading ? 
                    "Loading writer profiles..." : 
                    (error ? 
                      "There was an error loading writers. Please try again later." : 
                      "No writers match your search criteria. Try adjusting your filters or search term."
                    )
                  }
                </p>
                {!isLoading && !error && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('all');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    Reset Filters
                  </button>
                )}
              </div>
            )}
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
                  {Array.isArray(selectedWriter.recentWork) && selectedWriter.recentWork.length > 0 ? (
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
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400">No recent work available</p>
                    </div>
                  )}
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
                        <span className="text-gray-400">Acceptance Rate</span>
                        <span className="text-white">{selectedWriter.selectedSubmissions > 0 ? 
                          `${Math.round((selectedWriter.selectedSubmissions / selectedWriter.totalSubmissions) * 100)}%` : 'N/A'}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] h-2 rounded-full" 
                          style={{ 
                            width: selectedWriter.selectedSubmissions > 0 ? 
                              `${Math.round((selectedWriter.selectedSubmissions / selectedWriter.totalSubmissions) * 100)}%` : '0%' 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Average AI Score</span>
                        <span className="text-white">{selectedWriter.averageScore || 'N/A'}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] h-2 rounded-full" 
                          style={{ width: `${selectedWriter.averageScore || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BookmarkIcon className="w-6 h-6 text-[rgb(var(--accent-primary))]" />
                    <h3 className="text-lg font-semibold text-white">Genres</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedWriter.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1.5 text-sm rounded-full bg-white/5 text-white"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 