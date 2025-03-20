'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  FolderIcon,
  PlusIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';
import { useSession } from 'next-auth/react';
import { useUser } from '@/lib/hooks/useUser';

// Define interfaces for typed data
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

interface Submission {
  id: number | string;
  title: string;
  writer: string;
  score: number;
  analysis?: Analysis;
}

interface Project {
  id: number | string;
  title: string;
  budget: string;
  submissions: number;
  status: string;
  deadline: string;
  topScore?: number;
  recentSubmissions: Submission[];
}

interface Writer {
  id: number | string;
  name: string;
  avatar?: string;
  genre?: string;
  rating: number;
  submissions: number;
  acceptanceRate: string;
  earnings: string;
}

interface Stat {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any; // Icon component type
  color: string;
}

export default function ProducerDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [topWriters, setTopWriters] = useState<Writer[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const { data: session, status } = useSession();
  const [companyName, setCompanyName] = useState('Your Studio');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);

  const { user, isLoading: isUserLoading } = useUser();

  // Safe way to read from localStorage that handles potential errors
  const safeGetFromStorage = (key: string, defaultValue: string = ''): string => {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (err) {
      console.error(`Error reading ${key} from localStorage:`, err);
      return defaultValue;
    }
  };

  // Force a hard reload of the page
  const forceReload = () => {
    window.location.reload();
  };

  // Handle refresh button click - either refresh data or force page reload
  const handleRefresh = () => {
    // First try to refresh data by incrementing counter
    setDataRefreshCounter(prev => prev + 1);
    
    // If company name is not showing correctly, we might need a hard reload
    const storedCompanyName = safeGetFromStorage('companyName');
    if (storedCompanyName && storedCompanyName !== companyName) {
      console.log('Company name mismatch, forcing page reload');
      setTimeout(forceReload, 500); // Give a small delay to show loading state
    }
  };

  // Check for company name in localStorage first for faster initial render
  useEffect(() => {
    const storedCompanyName = safeGetFromStorage('companyName');
    if (storedCompanyName) {
      console.log('Using company name from localStorage for initial render:', storedCompanyName);
      setCompanyName(storedCompanyName);
    }
  }, []);
  
  // Check if settings were just updated when navigating back to dashboard
  useEffect(() => {
    const checkSettingsUpdated = () => {
      const settingsUpdated = safeGetFromStorage('settingsUpdated');
      if (settingsUpdated) {
        console.log('Settings were updated, refreshing dashboard data');
        // Trigger a data refresh by incrementing the counter
        setDataRefreshCounter(prev => prev + 1);
        // Remove the flag after processing it
        localStorage.removeItem('settingsUpdated');
      }
    };
    
    // Check when component mounts
    checkSettingsUpdated();
    
    // Also check when window becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSettingsUpdated();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Use data from the custom hook if available
        if (user) {
          console.log('Using cached user data for dashboard:', user);
          setUserData(user);
          setCompanyName(user.profile_data?.company_settings?.name || user.profile_data?.company || 'Your Studio');
          
          // Update localStorage with user data
          if (user.profile_data?.name) {
            localStorage.setItem('userName', user.profile_data.name);
          }
          
          if (user.profile_data?.company && user.profile_data.company !== 'Your Studio') {
            localStorage.setItem('companyName', user.profile_data.company);
            console.log('Updated companyName in localStorage:', user.profile_data.company);
          }
          
          // Double-check localStorage again to make sure we're using the most recent value
          // This handles the case where the user just updated their settings but the API hasn't caught up yet
          const storedCompanyName = safeGetFromStorage('companyName');
          if (storedCompanyName && storedCompanyName !== user.profile_data.company) {
            console.log('Using more recent company name from localStorage:', storedCompanyName);
            setCompanyName(storedCompanyName);
          }
          
          if (user.address) {
            localStorage.setItem('walletAddress', user.address);
          }
          
          // Initialize with empty data or default values
          const initialStats: Stat[] = [
            {
              name: 'Active Projects',
              value: '0',
              change: '0 this week',
              trend: 'neutral' as 'up' | 'down' | 'neutral',
              icon: FolderIcon,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              name: 'Total Submissions',
              value: '0',
              change: '0 new',
              trend: 'neutral' as 'up' | 'down' | 'neutral',
              icon: DocumentTextIcon,
              color: 'from-violet-500 to-purple-500',
            },
            {
              name: 'Average AI Score',
              value: '0',
              change: '0 points',
              trend: 'neutral' as 'up' | 'down' | 'neutral',
              icon: ChartBarIcon,
              color: 'from-emerald-500 to-teal-500',
            },
            {
              name: 'Total Investment',
              value: '$0',
              change: '$0 this month',
              trend: 'neutral' as 'up' | 'down' | 'neutral',
              icon: CurrencyDollarIcon,
              color: 'from-amber-500 to-orange-500',
            },
          ];
          
          setStats(initialStats);
          setActiveProjects([]);
          setTopWriters([]);
        }
        
        // Fetch projects
        const projectsResponse = await fetch('/api/projects', {
          cache: 'no-store'
        });
        
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          if (projectsData.projects && Array.isArray(projectsData.projects)) {
            setActiveProjects(projectsData.projects);
          }
        }
        
        // Fetch submissions
        const submissionsResponse = await fetch('/api/submissions', {
          cache: 'no-store'
        });
        
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          if (submissionsData.submissions && Array.isArray(submissionsData.submissions)) {
            setSelectedSubmission(submissionsData.submissions[0]);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Update selected submission when project changes
  useEffect(() => {
    if (selectedProject && selectedProject.recentSubmissions?.length > 0) {
      setSelectedSubmission(selectedProject.recentSubmissions[0]);
    } else {
      setSelectedSubmission(null);
    }
  }, [selectedProject]);

  return (
    <DashboardLayout userType="producer">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
            >
              Welcome back, <span className="gradient-text">{companyName}</span> 👋
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-base text-gray-400"
            >
              Your project hub awaits. Discover top talent and breakthrough stories.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full sm:w-auto flex items-center gap-4"
          >
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Refresh dashboard data"
              disabled={isLoading}
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only md:not-sr-only">Refresh</span>
            </button>
            <Link
              href="/producer/projects/new"
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105 shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create New Project</span>
            </Link>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card group hover:scale-105 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.name}</p>
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowRightIcon className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500">{stat.change}</span>
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`} />
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card lg:col-span-2"
          >
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Active Projects</h2>
                <Link
                  href="/producer/projects"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105"
                >
                  View All
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-6">
                {activeProjects.length > 0 ? (
                  activeProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => {
                        setSelectedProject(project);
                        if (project.recentSubmissions && project.recentSubmissions.length > 0) {
                          setSelectedSubmission(project.recentSubmissions[0]);
                        }
                      }}
                      className={`p-4 rounded-lg border ${
                        selectedProject?.id === project.id
                          ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/5'
                          : 'border-white/10 hover:border-white/20'
                      } cursor-pointer transition-all`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                          <p className="text-gray-400 text-sm">Budget: {project.budget}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[rgb(var(--accent-primary))] font-semibold">{project.status}</p>
                          <p className="text-sm text-gray-400">Due: {project.deadline}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400">Submissions</p>
                          <p className="text-base sm:text-lg font-semibold text-white">{project.submissions}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400">Top Score</p>
                          <p className="text-base sm:text-lg font-semibold text-white">{project.topScore || 'N/A'}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xs sm:text-sm text-gray-400">Top Scripts</p>
                          <p className="text-base sm:text-lg font-semibold text-white">{project.recentSubmissions?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No active projects found</p>
                    <Link
                      href="/producer/projects/new"
                      className="inline-flex items-center gap-1 px-4 py-2 mt-4 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Create Your First Project</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Top Writer Talent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Top Writers</h2>
                <Link
                  href="/producer/writers"
                  className="text-[rgb(var(--accent-primary))] hover:underline flex items-center gap-1"
                >
                  View All
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-6">
                {topWriters.length > 0 ? (
                  topWriters.map((writer) => (
                    <div key={writer.id} className="flex items-center gap-4 group hover:bg-white/5 p-3 rounded-lg transition-colors">
                      <div className="relative w-12 h-12">
                        {writer.avatar ? (
                          <Image
                            src={writer.avatar}
                            alt={writer.name}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-gray-200">
                            {writer.name.charAt(0)}
                          </div>
                        )}
                        {writer.rating >= 4.8 && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                            <SparklesIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold group-hover:text-[rgb(var(--accent-primary))] transition-colors">
                          {writer.name}
                        </h3>
                        <p className="text-sm text-gray-400">{writer.genre || 'Various'} Specialist</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[rgb(var(--accent-primary))] font-semibold">{writer.acceptanceRate}</p>
                        <p className="text-sm text-gray-400">{writer.earnings} earned</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No top writers available yet</p>
                    <Link
                      href="/producer/writers"
                      className="inline-flex items-center gap-1 px-4 py-2 mt-4 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <UserGroupIcon className="w-5 h-5" />
                      <span>Browse Writers</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Submissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card lg:col-span-2"
          >
            <div className="card p-6">
              {selectedProject && selectedSubmission ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        Top Submissions for {selectedProject.title}
                      </h2>
                      <p className="text-gray-400">
                        Review and select the winning script from the top-ranked submissions.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      {selectedProject.recentSubmissions && selectedProject.recentSubmissions.map((submission, index) => (
                        <button
                          key={submission.id}
                          onClick={() => setSelectedSubmission(submission)}
                          className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
                            selectedSubmission.id === submission.id
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          #{index + 1} ({submission.score})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    <div className="lg:col-span-2 overflow-x-auto">
                      {selectedSubmission.analysis ? (
                        <AIAnalysisChart analysisData={selectedSubmission.analysis} />
                      ) : (
                        <div className="flex items-center justify-center h-40 bg-white/5 rounded-lg">
                          <p className="text-gray-400">No analysis data available</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                          {selectedSubmission.title}
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400">Writer</p>
                            <p className="text-sm sm:text-base text-white">{selectedSubmission.writer}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400">Overall Score</p>
                            <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--accent-primary))]">
                              {selectedSubmission.score}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                        <button className="w-full px-4 sm:px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all hover:scale-105 shadow-lg text-sm sm:text-base">
                          Select as Winner
                        </button>
                        <button className="w-full px-4 sm:px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-all text-sm sm:text-base">
                          View Full Script
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <h2 className="text-xl font-bold text-white mb-2">No Submissions Selected</h2>
                  <p className="text-gray-400 mb-6">
                    {activeProjects.length > 0 
                      ? "Select a project to view its top submissions."
                      : "Create a project to start receiving submissions."}
                  </p>
                  
                  <Link
                    href="/producer/projects/new"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Create New Project</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Analysis Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card"
          >
            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">AI Analysis Summary</h2>
              
              {selectedSubmission?.analysis ? (
                <div className="space-y-4">
                  <p className="text-gray-400">
                    AI analysis scores for {selectedSubmission.title}
                  </p>
                  
                  <div className="space-y-3">
                    {selectedSubmission.analysis && Object.entries(selectedSubmission.analysis).map(([key, value]) => (
                      <div key={key} className="relative pt-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400 capitalize mb-1">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-xs text-white font-semibold">{value}</div>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-white/10">
                          <div
                            style={{ width: `${value}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">Select a submission to view its AI analysis</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}