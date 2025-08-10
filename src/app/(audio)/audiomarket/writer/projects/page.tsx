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
  _id?: string;
  title: string;
  description?: string;
  status?: string;
  budget: string | number;
  deadline?: string | Date;
  requirements?: string[] | any;
  producer_name?: string;
  company_name?: string;
  cover_image?: string;
  genre?: string;
  type?: string;
  submissions?: number;
  submission_count?: number;
  // Additional UI fields
  studioName?: string;
  statusColor?: string;
  statusText?: string;
  deadlineFormatted?: string;
  budgetFormatted?: string;
  rating?: number;
  totalBounty?: string;
  aiPreferences?: {
    plotStrength: number;
    characterDevelopment: number;
    marketPotential: number;
    uniqueness: number;
  };
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch projects data from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Prepare headers with wallet address if available
        const headers: HeadersInit = { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        };
        
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (!walletAddress) {
          console.error('No wallet address available');
          setError('Authentication required. Please sign in.');
          setIsLoading(false);
          return;
        }
        
        headers['x-wallet-address'] = walletAddress.toLowerCase();
        
        // Fetch ALL projects without filtering by status (matching the dashboard approach)
        console.log('Fetching all available projects for writer');
        const response = await fetch('/api/projects', { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to load projects:', errorText);
          
          // Try to parse error response
          try {
            const errorData = JSON.parse(errorText);
            setError(`Failed to load projects: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch (parseError) {
            setError('Failed to load projects: Server error');
          }
          
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log('Projects data received:', data);
        
        if (!data.projects || !Array.isArray(data.projects)) {
          console.error('Invalid projects data format:', data);
          setProjects([]);
          setFilteredProjects([]);
          setIsLoading(false);
          return;
        }
        
        // Helper functions for formatting project data (matching dashboard)
        const getStatusColor = (status?: string) => {
          switch(status?.toLowerCase()) {
            case 'published': return 'bg-green-500/20 text-green-400';
            case 'open': return 'bg-blue-500/20 text-blue-400';
            case 'funded': return 'bg-purple-500/20 text-purple-400';
            case 'closed': return 'bg-gray-500/20 text-gray-400';
            case 'completed': return 'bg-emerald-500/20 text-emerald-400';
            default: return 'bg-gray-500/20 text-gray-400';
          }
        };
        
        const getStatusText = (status?: string) => {
          switch(status?.toLowerCase()) {
            case 'published': return 'Published';
            case 'open': return 'Open';
            case 'funded': return 'Funded';
            case 'closed': return 'Closed';
            case 'completed': return 'Completed';
            default: return 'Unknown';
          }
        };
        
        const formatDeadline = (deadline?: string | Date) => {
          if (!deadline) return 'No deadline';
          try {
            return new Date(deadline).toLocaleDateString();
          } catch (e) {
            return String(deadline);
          }
        };
        
        const formatBudget = (budget?: string | number) => {
          if (budget === undefined || budget === null) return 'Not specified';
          if (typeof budget === 'number') return `$${budget.toLocaleString()}`;
          return budget;
        };
        
        // Process and enhance project data to match dashboard's format
        const enhancedProjects = data.projects.map((project: any) => ({
          ...project,
          id: project.id || project._id,
          title: project.title || 'Untitled Project',
          description: project.description || 'No description provided',
          budget: project.budget || 'Not specified',
          deadline: project.deadline || 'No deadline',
          status: project.status || 'unknown',
          // Create studioName combining producer and company info
          studioName: project.producer_name || project.company_name || 'Unknown Studio',
          // Added fields for UI
          statusColor: getStatusColor(project.status),
          statusText: getStatusText(project.status),
          deadlineFormatted: formatDeadline(project.deadline),
          budgetFormatted: formatBudget(project.budget),
          submissions: project.submission_count || 0,
          requirements: project.requirements || project.genre || [],
          genre: project.genre || 'Uncategorized',
          type: project.type || 'Other',
          rating: project.rating || (Math.random() * 3 + 2).toFixed(1), // Placeholder for demo
          aiPreferences: project.aiPreferences || {
            plotStrength: 0,
            characterDevelopment: 0,
            marketPotential: 0,
            uniqueness: 0,
          },
        }));
        
        console.log(`Processed ${enhancedProjects.length} projects`);
        
        // Only show projects that are available for submissions
        const availableProjects = enhancedProjects.filter((project: any) => 
          ['published', 'open', 'funded'].includes(project.status?.toLowerCase() || '')
        );
        
        console.log(`Filtered to ${availableProjects.length} available projects`);
        setProjects(availableProjects);
        setFilteredProjects(availableProjects);
        
        if (availableProjects.length > 0) {
          setSelectedProject(availableProjects[0]);
        }
        
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
        (project.title || '').toLowerCase().includes(query) ||
        (project.description || '').toLowerCase().includes(query) ||
        (project.studioName || '').toLowerCase().includes(query)
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
      result = result.filter(project => (project.budgetFormatted || '').includes(filters.budgetRange));
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
        {/* Enhanced Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Browse Projects</h1>
            <p className="text-gray-400">Discover opportunities and submit your scripts</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <span className="text-gray-400 text-sm">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} available
            </span>
            {filters.searchQuery || filters.genre !== 'All' || filters.projectType !== 'All' || filters.budgetRange !== 'All' ? (
              <button
                onClick={() => setFilters({
                  searchQuery: '',
                  genre: 'All',
                  projectType: 'All',
                  budgetRange: 'All',
                })}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors flex items-center gap-1"
              >
                <span>Clear filters</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Improved Search and Filters */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, description, or studio..."
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent text-white"
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="absolute -top-2 left-2 px-1 text-xs text-gray-400 bg-black/80">Genre</label>
              <select
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent text-white appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
              >
                <option value="All">All Genres</option>
                <option value="Sci-Fi">Science Fiction</option>
                <option value="Drama">Drama</option>
                <option value="Thriller">Thriller</option>
                <option value="Comedy">Comedy</option>
                <option value="Horror">Horror</option>
                <option value="Action">Action</option>
                <option value="Romance">Romance</option>
              </select>
            </div>
            
            <div className="relative">
              <label className="absolute -top-2 left-2 px-1 text-xs text-gray-400 bg-black/80">Project Type</label>
              <select
                value={filters.projectType}
                onChange={(e) => handleFilterChange('projectType', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent text-white appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
              >
                <option value="All">All Types</option>
                <option value="Feature Film">Feature Film</option>
                <option value="TV Series">TV Series</option>
                <option value="TV Pilot">TV Pilot</option>
                <option value="Short Film">Short Film</option>
                <option value="Web Series">Web Series</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Available Projects</h3>
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400 text-sm">
                  {filters.searchQuery || filters.genre !== 'All' || filters.projectType !== 'All' || filters.budgetRange !== 'All'
                    ? 'Filtered'
                    : 'All Projects'}
                </span>
              </div>
            </div>
            
            {filteredProjects.length > 0 ? (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`card hover:border-[rgb(var(--accent-primary))]/30 transition-all duration-300 cursor-pointer group ${
                      selectedProject?.id === project.id ? 'border-[rgb(var(--accent-primary))]/70 bg-[rgb(var(--accent-primary))]/5' : ''
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="p-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white">{project.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${project.statusColor || 'bg-gray-500/20 text-gray-400'}`}>
                              {project.statusText || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-[rgb(var(--accent-primary))] mb-2">{project.studioName || 'Unknown Studio'}</p>
                          <p className="text-sm text-gray-400 line-clamp-2">{project.description || 'No description provided'}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 text-yellow-400 mb-2">
                            <StarIcon className="w-5 h-5" />
                            <span>{project.rating || "N/A"}</span>
                          </div>
                          <span className="text-xs text-gray-500">ID: {project.id}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <CurrencyDollarIcon className="w-5 h-5" />
                          <span className="font-medium">{project.budgetFormatted || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <ClockIcon className="w-5 h-5" />
                          <span className="font-medium">Due: {project.deadlineFormatted || 'No deadline'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <DocumentTextIcon className="w-5 h-5" />
                          <span>{project.submissions || 0} submissions</span>
                        </div>
                        {project.totalBounty && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <ArrowTrendingUpIcon className="w-5 h-5" />
                            <span>Bounty: {project.totalBounty}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Requirements tags */}
                      <div className="flex flex-wrap gap-2">
                        {project.requirements && (
                          <>
                            {Array.isArray(project.requirements) ? 
                              project.requirements.slice(0, 3).map((req, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300"
                                >
                                  {req}
                                </span>
                              )) 
                            : typeof project.requirements === 'string' ? (
                              <span className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300">
                                {project.requirements}
                              </span>
                            ) : null}
                            
                            {Array.isArray(project.requirements) && 
                              project.requirements.length > 3 && (
                                <span className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300">
                                  +{project.requirements.length - 3} more
                                </span>
                              )}
                          </>
                        )}
                      </div>
                      
                      {/* Quick action button */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <Link
                          href={`/audiomarket/writer/submit?project=${project.id}`}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          Submit Script
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-white/10 rounded-lg bg-black/20">
                <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  No projects match your current filter criteria. Try adjusting your filters or check back later for new opportunities.
                </p>
                <button
                  onClick={() => setFilters({
                    searchQuery: '',
                    genre: 'All',
                    projectType: 'All',
                    budgetRange: 'All',
                  })}
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors inline-flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Project Details - Enhanced UI */}
          <div className="lg:col-span-1 lg:sticky lg:top-6 self-start">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Project Details</h3>
              {selectedProject && (
                <span className={`px-2 py-1 rounded-full text-xs ${selectedProject.statusColor || 'bg-gray-500/20 text-gray-400'}`}>
                  {selectedProject.statusText || 'Unknown Status'}
                </span>
              )}
            </div>
            
            {selectedProject ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
                key={selectedProject.id} // Add key to ensure animation runs when switching projects
              >
                {/* Project Header */}
                <div className="card overflow-hidden">
                  {selectedProject.cover_image && (
                    <div className="h-48 bg-gradient-to-r from-purple-500/30 to-blue-500/30 relative overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-center bg-cover" 
                        style={{ 
                          backgroundImage: `url(${selectedProject.cover_image})`,
                          opacity: 0.6
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{selectedProject.title}</h2>
                        <p className="text-[rgb(var(--accent-primary))] drop-shadow-lg">
                          {selectedProject.studioName || 'Unknown Studio'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    {!selectedProject.cover_image && (
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold text-white">{selectedProject.title}</h2>
                        <p className="text-[rgb(var(--accent-primary))] mt-1">
                          {selectedProject.studioName || 'Unknown Studio'}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <h3 className="text-lg font-semibold text-white mb-3">Project Description</h3>
                      <p className="text-gray-300 whitespace-pre-line">
                        {selectedProject.description || 'No description provided for this project.'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Project Details */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Project Details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Studio</span>
                      <span className="text-white font-medium">{selectedProject.studioName || 'Unknown Studio'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Budget</span>
                      <span className="text-white font-medium">{selectedProject.budgetFormatted || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deadline</span>
                      <span className="text-white font-medium">{selectedProject.deadlineFormatted || 'No deadline'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Submissions</span>
                      <span className="text-white font-medium">{selectedProject.submissions || 0}</span>
                    </div>
                    {selectedProject.genre && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Genre</span>
                        <span className="text-white font-medium">{selectedProject.genre}</span>
                      </div>
                    )}
                    {selectedProject.type && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Project Type</span>
                        <span className="text-white font-medium">{selectedProject.type}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Project Requirements */}
                  {selectedProject.requirements && Array.isArray(selectedProject.requirements) && selectedProject.requirements.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-3">Requirements</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedProject.requirements) ? 
                          selectedProject.requirements.map((req, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300"
                            >
                              {req}
                            </span>
                          )) 
                        : typeof selectedProject.requirements === 'string' ? (
                          <span className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300">
                            {selectedProject.requirements}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* AI Preferences - if data exists and has values */}
                {selectedProject.aiPreferences && 
                 (selectedProject.aiPreferences.plotStrength > 0 || 
                  selectedProject.aiPreferences.characterDevelopment > 0 || 
                  selectedProject.aiPreferences.marketPotential > 0 || 
                  selectedProject.aiPreferences.uniqueness > 0) && (
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">AI Preferences</h3>
                    <p className="text-gray-400 mb-4">This project uses AI to assist in the selection process. Here are the focus areas:</p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Plot Strength</span>
                          <span className="text-white">{selectedProject.aiPreferences.plotStrength}/10</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" 
                            style={{ width: `${(selectedProject.aiPreferences.plotStrength || 0) * 10}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Character Development</span>
                          <span className="text-white">{selectedProject.aiPreferences.characterDevelopment}/10</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" 
                            style={{ width: `${(selectedProject.aiPreferences.characterDevelopment || 0) * 10}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Market Potential</span>
                          <span className="text-white">{selectedProject.aiPreferences.marketPotential}/10</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" 
                            style={{ width: `${(selectedProject.aiPreferences.marketPotential || 0) * 10}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Uniqueness</span>
                          <span className="text-white">{selectedProject.aiPreferences.uniqueness}/10</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" 
                            style={{ width: `${(selectedProject.aiPreferences.uniqueness || 0) * 10}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                  
                  <div className="space-y-4">
                    <Link
                      href={`/audiomarket/writer/submit?project=${selectedProject.id}`}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:opacity-90 transition-all hover:scale-105"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      Submit Script
                    </Link>
                    
                    <Link
                      href={`/audiomarket/writer/projects/${selectedProject.id}`}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      View Full Details
                    </Link>
                    
                    <button
                      onClick={() => window.open(`mailto:contact@blockcreative.io?subject=Question about "${selectedProject.title}"`, '_blank')}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Contact Producer
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card p-6 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-center">
                  Select a project to view its details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 