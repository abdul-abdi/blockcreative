'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

// Mock data for available projects
const projects = [
  {
    id: 1,
    title: 'Sci-Fi Feature Film',
    studio: 'Paramount Pictures',
    description: 'Looking for an original sci-fi concept that explores the intersection of artificial intelligence and human consciousness.',
    budget: '$100K-200K',
    deadline: '2024-04-15',
    submissions: 24,
    status: 'Active',
    requirements: [
      'Original concept',
      'High-concept premise',
      'Commercial appeal',
      'Strong character arcs',
    ],
    genre: 'Science Fiction',
    type: 'Feature Film',
    aiPreferences: {
      plotStrength: 85,
      characterDevelopment: 90,
      marketPotential: 80,
      uniqueness: 85,
    },
    rating: 4.8,
    totalBounty: '$150K',
  },
  {
    id: 2,
    title: 'Drama Series Pilot',
    studio: 'HBO Max',
    description: 'Seeking a compelling drama series pilot that explores contemporary social issues through a unique lens.',
    budget: '$50K-100K',
    deadline: '2024-04-20',
    submissions: 18,
    status: 'Active',
    requirements: [
      'Character-driven',
      'Social relevance',
      'Series potential',
      'Diverse perspectives',
    ],
    genre: 'Drama',
    type: 'TV Pilot',
    aiPreferences: {
      plotStrength: 90,
      characterDevelopment: 95,
      marketPotential: 85,
      uniqueness: 90,
    },
    rating: 4.9,
    totalBounty: '$75K',
  },
  {
    id: 3,
    title: 'Thriller Feature',
    studio: 'A24',
    description: 'Looking for a unique psychological thriller that pushes genre boundaries and delivers unexpected twists.',
    budget: '$75K-150K',
    deadline: '2024-04-25',
    submissions: 15,
    status: 'Active',
    requirements: [
      'Unique perspective',
      'Plot twists',
      'Genre innovation',
      'Psychological elements',
    ],
    genre: 'Thriller',
    type: 'Feature Film',
    aiPreferences: {
      plotStrength: 88,
      characterDevelopment: 85,
      marketPotential: 92,
      uniqueness: 95,
    },
    rating: 4.7,
    totalBounty: '$100K',
  },
];

export default function BrowseProjects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProject, setSelectedProject] = useState(projects[0]);

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Browse Projects</h1>
          <p className="text-gray-400">Discover opportunities and submit your scripts</p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
              />
            </div>
          </div>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option value="all">All Genres</option>
            <option value="scifi">Science Fiction</option>
            <option value="drama">Drama</option>
            <option value="thriller">Thriller</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option value="all">All Types</option>
            <option value="feature">Feature Film</option>
            <option value="series">TV Series</option>
            <option value="pilot">TV Pilot</option>
          </select>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects List */}
          <div className="space-y-4">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card cursor-pointer ${
                  selectedProject.id === project.id ? 'border-[rgb(var(--accent-primary))]' : ''
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
                      <p className="text-sm text-[rgb(var(--accent-primary))] mb-2">{project.studio}</p>
                      <p className="text-sm text-gray-400">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <StarIcon className="w-5 h-5" />
                      <span>{project.rating}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CurrencyDollarIcon className="w-5 h-5" />
                      <span>{project.budget}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <ClockIcon className="w-5 h-5" />
                      <span>Due: {project.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <DocumentTextIcon className="w-5 h-5" />
                      <span>{project.submissions} submissions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                      <span>Bounty: {project.totalBounty}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Project Details */}
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Requirements */}
              <div className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Project Requirements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProject.requirements.map((requirement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-white/5 rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-[rgb(var(--accent-primary))]" />
                        <span className="text-gray-300">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Preferences */}
              <div className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6">AI Scoring Criteria</h3>
                  <div className="space-y-4">
                    {Object.entries(selectedProject.aiPreferences).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-white">{value}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Link
                  href={`/writer/submit?project=${selectedProject.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105"
                >
                  Submit Script
                </Link>
                <Link
                  href={`/writer/projects/${selectedProject.id}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 