'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  FunnelIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import React from 'react';

// Define typings for our data
interface Submission {
  id: number | string;
  title: string;
  writer: string;
  score: number;
}

interface Project {
  id: number | string;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  totalSubmissions: number;
  status: string;
  topSubmissions: Submission[];
  requirements: string[] | string;
  genre: string;
  type: string;
  progress: number;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: 'all',
    searchQuery: '',
  });
  const router = useRouter();

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
        
        // Fetch projects from the API
        const response = await fetch('/api/projects?producer=true', { headers });
        
        if (!response.ok) {
          throw new Error(`Error fetching projects: ${response.statusText}`);
        }
        
        const data = await response.json();
        setProjects(data.projects || []);
        setFilteredProjects(data.projects || []);
        
        if (data.projects?.length > 0) {
          setSelectedProject(data.projects[0]);
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
    
    // Apply status filter
    if (filter.status !== 'all') {
      result = result.filter(project => 
        project.status.toLowerCase() === filter.status.toLowerCase()
      );
    }
    
    // Apply search filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      result = result.filter(project => 
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredProjects(result);
    
    // Update selected project if needed
    if (result.length > 0 && (!selectedProject || !result.find(p => p.id === selectedProject.id))) {
      setSelectedProject(result[0]);
    } else if (result.length === 0) {
      setSelectedProject(null);
    }
  }, [filter, projects, selectedProject]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(prev => ({ ...prev, searchQuery: e.target.value }));
  };
  
  const handleStatusFilterChange = (status: string) => {
    setFilter(prev => ({ ...prev, status }));
  };
  
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  // Update navItems to remove Budget and Analytics
  const navItems = [
    { name: 'All Projects', id: 'all' },
    { name: 'Active', id: 'active' },
    { name: 'Drafts', id: 'draft' },
    { name: 'Completed', id: 'completed' },
    { name: 'Archived', id: 'archived' }
  ];

  return (
    <DashboardLayout userType="producer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Active Projects</h1>
            <p className="text-gray-400">Manage your ongoing projects and review submissions</p>
          </div>
          <Link
            href="/producer/projects/new"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all hover:scale-105 shadow-lg"
          >
            <PlusIcon key="header-plus-icon" className="w-5 h-5" />
            <span key="new-project-text">New Project</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            key="status-filter-select"
            value={filter.status}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option key="all-status" value="all">All Status</option>
            <option key="active-status" value="active">Active</option>
            <option key="review-status" value="review">In Review</option>
            <option key="shortlisting-status" value="shortlisting">Shortlisting</option>
          </select>
          <input
            key="search-projects-input"
            type="text"
            value={filter.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search projects"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          />
        </div>

        {/* Filter tabs section */}
        <div className="flex items-center space-x-4 overflow-x-auto pb-2 mb-4">
          {navItems.map((item) => (
            <React.Fragment key={`nav-item-${item.id}`}>
              <button
                key={item.id}
                onClick={() => handleStatusFilterChange(item.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter.status === item.id || (item.id === 'all' && filter.status === 'all')
                    ? 'bg-[rgb(var(--accent-primary))]/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <React.Fragment key="loading-state">
              <div key="loading-spinner" className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
              </div>
            </React.Fragment>
          ) : filteredProjects.length === 0 ? (
            <React.Fragment key="empty-state">
              <div key="no-projects" className="text-center py-12">
                <DocumentTextIcon key="no-projects-icon" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 key="no-projects-title" className="text-xl font-semibold text-white mb-2">No projects found</h3>
                <p key="no-projects-message" className="text-gray-400 mb-6">
                  {filter.status !== 'all' || filter.searchQuery
                    ? "No projects match your current filters."
                    : "You haven't created any projects yet."}
                </p>
                <Link
                  href="/producer/projects/new"
                  className="inline-flex items-center px-4 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-secondary))] transition-colors"
                >
                  <PlusIcon key="create-project-icon" className="w-5 h-5 mr-2" />
                  <span key="create-new-project-text">Create New Project</span>
                </Link>
              </div>
            </React.Fragment>
          ) : (
            filteredProjects.map((project) => (
              <React.Fragment key={`project-fragment-${project.id}`}>
                <div
                  key={project.id}
                  className={`p-6 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20 ${
                    selectedProject?.id === project.id
                      ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => router.push(`/producer/projects/${project.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          key={`status-${project.id}`}
                          className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                            project.status === 'draft' ? 'bg-gray-700/50 text-gray-300 border border-gray-600' :
                            project.status === 'completed' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
                            'bg-gray-700/50 text-gray-300 border border-gray-600'
                          }`}
                        >
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                        {project.genre && (
                          <span key={`genre-${project.id}`} className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded-full">
                            {project.genre}
                          </span>
                        )}
                      </div>
                      <h3 key={`title-${project.id}`} className="text-xl font-bold text-white">{project.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div key={`budget-${project.id}`} className="px-3 py-1.5 rounded-lg bg-white/5 flex items-center gap-1">
                        <CurrencyDollarIcon key={`budget-icon-${project.id}`} className="w-4 h-4 text-[rgb(var(--accent-primary))]" />
                        <span key={`budget-text-${project.id}`} className="text-white font-medium">{project.budget}</span>
                      </div>
                      <div key={`deadline-${project.id}`} className="px-3 py-1.5 rounded-lg bg-white/5 flex items-center gap-1">
                        <ClockIcon key={`deadline-icon-${project.id}`} className="w-4 h-4 text-[rgb(var(--accent-secondary))]" />
                        <span key={`deadline-text-${project.id}`} className="text-white font-medium">{project.deadline}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p key={`description-${project.id}`} className="text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div key={`submissions-${project.id}`} className="flex items-center gap-1">
                        <DocumentTextIcon key={`submissions-icon-${project.id}`} className="w-4 h-4 text-gray-400" />
                        <span key={`submissions-text-${project.id}`} className="text-sm text-gray-400">{project.totalSubmissions} Submissions</span>
                      </div>
                      <div key={`progress-${project.id}`} className="flex items-center gap-1">
                        <ChartBarIcon key={`progress-icon-${project.id}`} className="w-4 h-4 text-gray-400" />
                        <span key={`progress-text-${project.id}`} className="text-sm text-gray-400">{project.progress}% Complete</span>
                      </div>
                    </div>
                    <div key={`view-details-container-${project.id}`}>
                      <Link
                        key={`view-details-link-${project.id}`}
                        href={`/producer/projects/${project.id}`}
                        className="text-[rgb(var(--accent-primary))] hover:underline text-sm flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span key={`view-details-text-${project.id}`}>View Details</span>
                        <ArrowRightIcon key={`arrow-${project.id}`} className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))
          )}
        </div>

        {/* Replace any AIAnalysisChart usage with message */}
        {selectedProject && (
          <div key={`analysis-${selectedProject.id}`} className="mt-6 w-full rounded-lg border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 key={`analysis-title-${selectedProject.id}`} className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Project Analysis
            </h3>
            <div className="flex items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <p key="analysis-message" className="text-gray-500 dark:text-gray-400">
                  AI-powered project analysis is currently unavailable. Our team is working on implementing this feature.
                </p>
              </div>
            </div>
            
            {/* If there are any requirements or submissions being rendered here, make sure they have keys */}
            {selectedProject.requirements && (
              <div key="requirements-section" className="mt-4">
                <h4 key={`requirements-title-${selectedProject.id}`} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Requirements</h4>
                {Array.isArray(selectedProject.requirements) ? (
                  <ul key={`requirements-list-${selectedProject.id}`} className="list-disc pl-5">
                    {selectedProject.requirements.map((requirement, index) => (
                      <li key={`requirement-${selectedProject.id}-${index}`} className="text-gray-500 dark:text-gray-400">
                        {requirement}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={`requirements-text-${selectedProject.id}`} className="text-gray-500 dark:text-gray-400">
                    {selectedProject.requirements}
                  </p>
                )}
              </div>
            )}
            
            {selectedProject.topSubmissions && selectedProject.topSubmissions.length > 0 && (
              <div key="submissions-section" className="mt-4">
                <h4 key={`submissions-title-${selectedProject.id}`} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Top Submissions</h4>
                <div key={`submissions-list-${selectedProject.id}`} className="space-y-2">
                  {selectedProject.topSubmissions.map((submission) => (
                    <div key={`submission-${submission.id}`} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p key={`submission-title-${submission.id}`} className="font-medium text-gray-900 dark:text-white">{submission.title}</p>
                      <p key={`submission-writer-${submission.id}`} className="text-sm text-gray-500 dark:text-gray-400">By {submission.writer}</p>
                      <p key={`submission-score-${submission.id}`} className="text-sm text-gray-500 dark:text-gray-400">Score: {submission.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}