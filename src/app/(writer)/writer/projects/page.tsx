'use client';

import { useState, useEffect } from 'react';
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

// Define typings for our data
interface Project {
  id: number | string;
  title: string;
  studio: string;
  description: string;
  budget: string;
  deadline: string;
  submissions: number;
  status: string;
  requirements: string[];
  genre: string;
  type: string;
  aiPreferences?: {
    plotStrength: number;
    characterDevelopment: number;
    marketPotential: number;
    uniqueness: number;
  };
  rating?: number;
  totalBounty?: string;
}

export default function BrowseProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    searchQuery: '',
    genre: 'All',
    projectType: 'All',
    budgetRange: 'All',
  });

  // Fetch projects data from API
  useEffect(() => {
    const fetchProjects = async () => {
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
        // For now, we'll just set an empty array
        // const response = await fetch('/api/writer/projects', { headers });
        // if (response.ok) {
        //   const data = await response.json();
        //   setProjects(data.projects);
        //   setFilteredProjects(data.projects);
        // } else {
        //   setError('Failed to load projects');
        // }
        
        // Temporary empty data until the API is implemented
        setProjects([]);
        setFilteredProjects([]);
        
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Filter projects when filters change
  useEffect(() => {
    if (projects.length === 0) {
      setFilteredProjects([]);
      return;
    }
    
    let result = [...projects];
    
    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(project => 
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.studio.toLowerCase().includes(query)
      );
    }
    
    // Apply genre filter
    if (filters.genre !== 'All') {
      result = result.filter(project => project.genre === filters.genre);
    }
    
    // Apply project type filter
    if (filters.projectType !== 'All') {
      result = result.filter(project => project.type === filters.projectType);
    }
    
    // Apply budget range filter
    if (filters.budgetRange !== 'All') {
      // This would need custom logic based on how budget ranges are stored
      // For now, we'll just do a simple string match
      result = result.filter(project => project.budget.includes(filters.budgetRange));
    }
    
    setFilteredProjects(result);
  }, [filters, projects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };
  
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

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
                value={filters.searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
              />
            </div>
          </div>
          <select
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option value="All">All Genres</option>
            <option value="Sci-Fi">Science Fiction</option>
            <option value="Drama">Drama</option>
            <option value="Thriller">Thriller</option>
          </select>
          <select
            value={filters.projectType}
            onChange={(e) => handleFilterChange('projectType', e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option value="All">All Types</option>
            <option value="Feature Film">Feature Film</option>
            <option value="TV Series">TV Series</option>
            <option value="TV Pilot">TV Pilot</option>
          </select>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects List */}
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card cursor-pointer"
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
          {filteredProjects.length > 0 && (
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
                    {filteredProjects[0].requirements.map((requirement, index) => (
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
                    {filteredProjects[0].aiPreferences && Object.entries(filteredProjects[0].aiPreferences).map(([key, value]) => (
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
                  href={`/writer/submit?project=${filteredProjects[0].id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105"
                >
                  Submit Script
                </Link>
                <Link
                  href={`/writer/projects/${filteredProjects[0].id}`}
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