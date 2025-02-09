'use client';

import { useState } from 'react';
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

// Mock data for writers
const writers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    bio: 'Award-winning screenwriter specializing in sci-fi and drama. Former finalist in the Academy Nicholl Fellowships.',
    genres: ['Science Fiction', 'Drama', 'Thriller'],
    rating: 4.9,
    totalSubmissions: 24,
    selectedSubmissions: 18,
    earnings: '$125K',
    averageScore: 92,
    recentWork: [
      {
        title: 'The Last Frontier',
        studio: 'Paramount Pictures',
        score: 94,
        analysis: {
          plotStrength: 95,
          characterDevelopment: 92,
          marketPotential: 94,
          uniqueness: 93,
          pacing: 91,
          dialogue: 95,
          structure: 92,
          theme: 94
        }
      }
    ],
    availability: 'Available',
    location: 'Los Angeles, CA',
  },
  {
    id: 2,
    name: 'Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    bio: 'Experienced TV writer with credits on multiple streaming series. Specializes in character-driven narratives.',
    genres: ['Drama', 'Comedy', 'Crime'],
    rating: 4.8,
    totalSubmissions: 32,
    selectedSubmissions: 22,
    earnings: '$180K',
    averageScore: 90,
    recentWork: [
      {
        title: 'City Lights',
        studio: 'Netflix',
        score: 91,
        analysis: {
          plotStrength: 90,
          characterDevelopment: 94,
          marketPotential: 89,
          uniqueness: 88,
          pacing: 90,
          dialogue: 93,
          structure: 89,
          theme: 91
        }
      }
    ],
    availability: 'Available',
    location: 'New York, NY',
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    bio: 'Rising talent in thriller and horror genres. Known for unique plot twists and compelling character arcs.',
    genres: ['Thriller', 'Horror', 'Mystery'],
    rating: 4.7,
    totalSubmissions: 18,
    selectedSubmissions: 12,
    earnings: '$85K',
    averageScore: 88,
    recentWork: [
      {
        title: 'Dark Corridors',
        studio: 'A24',
        score: 89,
        analysis: {
          plotStrength: 88,
          characterDevelopment: 87,
          marketPotential: 86,
          uniqueness: 91,
          pacing: 89,
          dialogue: 86,
          structure: 88,
          theme: 87
        }
      }
    ],
    availability: 'In Discussion',
    location: 'Austin, TX',
  },
];

const genres = [
  'All Genres',
  'Science Fiction',
  'Drama',
  'Thriller',
  'Horror',
  'Comedy',
  'Crime',
  'Mystery',
];

export default function FindWriters() {
  const [selectedWriter, setSelectedWriter] = useState(writers[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [showFilters, setShowFilters] = useState(false);

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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
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
            {writers.map((writer) => (
              <motion.div
                key={writer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card cursor-pointer ${
                  selectedWriter.id === writer.id ? 'border-[rgb(var(--accent-primary))]' : ''
                }`}
                onClick={() => setSelectedWriter(writer)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                      <Image
                        src={writer.avatar}
                        alt={writer.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-white">{writer.name}</h3>
                          <p className="text-sm text-gray-400">{writer.location}</p>
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