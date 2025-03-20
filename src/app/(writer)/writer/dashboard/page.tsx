'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';
import { useSession } from 'next-auth/react';
import { useUser } from '@/lib/hooks/useUser';
import Upload from '../../../upload';

// Define types for our data
interface Submission {
  id: number;
  title: string;
  project: string;
  studio: string;
  submitted: string;
  status: string;
  rank: number;
  score: number;
}

interface Project {
  id: number;
  title: string;
  studio: string;
  budget: string;
  deadline: string;
  submissions: number;
  requirements: string[];
}

// Define allowed color combinations
type GradientColor = 
  | 'from-purple-500 to-indigo-500' 
  | 'from-emerald-500 to-teal-500' 
  | 'from-amber-500 to-orange-500' 
  | 'from-pink-500 to-rose-500'
  | 'from-blue-500 to-cyan-500'
  | 'from-gray-500 to-gray-700';

// Define allowed icon types
type IconType = 'document' | 'chart' | 'currency' | 'star';

interface StatItem {
  id: string;
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  iconType: IconType;
  color: GradientColor;
}

// Default empty data structure
const emptyStats: StatItem[] = [
  {
    id: 'submissions',
    name: 'Active Submissions',
    value: '0',
    change: '0 this week',
    trend: 'neutral',
    iconType: 'document',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'score',
    name: 'Average AI Score',
    value: '0',
    change: '0 points',
    trend: 'neutral',
    iconType: 'chart',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'earnings',
    name: 'Total Earnings',
    value: '$0',
    change: '$0 this month',
    trend: 'neutral',
    iconType: 'currency',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'success',
    name: 'Success Rate',
    value: '0%',
    change: '0% change',
    trend: 'neutral',
    iconType: 'star',
    color: 'from-pink-500 to-rose-500',
  },
];

export default function WriterDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<StatItem[]>(emptyStats);
  const [activeSubmissions, setActiveSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const { user, isLoading: isUserLoading } = useUser();

  // Helper function to render the correct icon based on type
  const renderIcon = (iconType: IconType) => {
    switch (iconType) {
      case 'document':
        return <DocumentTextIcon className="w-6 h-6 text-white" />;
      case 'chart':
        return <ChartBarIcon className="w-6 h-6 text-white" />;
      case 'currency':
        return <CurrencyDollarIcon className="w-6 h-6 text-white" />;
      case 'star':
        return <StarIcon className="w-6 h-6 text-white" />;
      default:
        return <DocumentTextIcon className="w-6 h-6 text-white" />;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Use data from the custom hook if available
        if (user) {
          console.log('Using cached user data for dashboard:', user);
          setUserData(user);
          setUserName(user.profile_data?.name || 'Writer');
        }
        
        // Fetch projects
        const projectsResponse = await fetch('/api/projects', {
          cache: 'no-store'
        });
        
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          if (projectsData.projects && Array.isArray(projectsData.projects)) {
            setAvailableProjects(projectsData.projects.slice(0, 5));
          }
        }
        
        // Fetch submissions
        const submissionsResponse = await fetch('/api/submissions', {
          cache: 'no-store'
        });
        
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          if (submissionsData.submissions && Array.isArray(submissionsData.submissions)) {
            setActiveSubmissions(submissionsData.submissions.slice(0, 5));
            if (submissionsData.submissions.length > 0) {
              setSelectedSubmission(submissionsData.submissions[0]);
            }
          }
        }
        
        // Generate stats from the data we have
        setStats(emptyStats);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout userType="writer">
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="writer">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
            >
              Welcome back, <span className="gradient-text">{userName}</span> 👋
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-base text-gray-400"
            >
              Your creative journey continues. Let's make something amazing today.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/writer/submit"
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105 shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Submit a Script</span>
            </Link>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card group hover:scale-105 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                    {renderIcon(stat.iconType)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.name}</p>
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowTrendingUpIcon className={`w-4 h-4 ${
                    stat.trend === 'up' ? 'text-emerald-500' : 
                    stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                  } mr-1`} />
                  <span className={
                    stat.trend === 'up' ? 'text-emerald-500' : 
                    stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                  }>{stat.change}</span>
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`} />
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card lg:col-span-2"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Active Submissions</h2>
              
              {activeSubmissions.length > 0 ? (
                <div className="space-y-6">
                  {activeSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`p-4 ${selectedSubmission && selectedSubmission.id === submission.id ? 
                        'bg-white/10' : 'bg-white/5'} rounded-lg hover:bg-white/10 transition-colors cursor-pointer`}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-white text-sm sm:text-base">{submission.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-400">{submission.project}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            submission.rank <= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            Rank #{submission.rank}
                          </span>
                          <span className="px-2 py-1 bg-[rgb(var(--accent-primary))]/20 text-[rgb(var(--accent-primary))] rounded-full text-xs">
                            {submission.score}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span>{submission.studio}</span>
                          <span>•</span>
                          <span>Submitted {submission.submitted}</span>
                        </div>
                        <span className={`mt-2 sm:mt-0 px-2 py-1 rounded-full ${
                          submission.status === 'Shortlisted' ? 'bg-amber-500/20 text-amber-400' :
                          submission.status === 'Under Review' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <Link
                    href="/writer/submissions"
                    className="flex items-center justify-center p-4 border border-dashed border-white/10 rounded-lg hover:border-white/20 transition-colors text-sm text-gray-400 hover:text-white"
                  >
                    View all submissions
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-white/10 rounded-lg">
                  <p className="text-gray-400 mb-4">You don't have any active submissions yet.</p>
                  
                  <div className="space-y-4">
                    <Upload />
                    <div className="mt-4">
                      <Link
                        href="/writer/submit"
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors inline-flex items-center"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        View submission guidelines
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Analysis Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Script Analysis</h2>
              
              {selectedSubmission ? (
                <div>
                  <div className="mb-6">
                    <h3 className="font-semibold text-white mb-1">{selectedSubmission.title}</h3>
                    <p className="text-sm text-gray-400">AI Evaluation Score: {selectedSubmission.score}%</p>
                  </div>
                  
                  <AIAnalysisChart />
                  
                  <div className="mt-6">
                    <Link
                      href={`/writer/submissions/${selectedSubmission.id}`}
                      className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                    >
                      View detailed analysis
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-white/10 rounded-lg">
                  <p className="text-gray-400">Select a submission to view its analysis</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Available Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Available Projects</h2>
              <Link
                href="/writer/projects"
                className="flex items-center text-sm text-[rgb(var(--accent-primary))] hover:underline"
              >
                View all
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {availableProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <h3 className="font-semibold text-white mb-2">{project.title}</h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Studio:</span>
                        <span className="text-white">{project.studio}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-white">{project.budget}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Deadline:</span>
                        <span className="text-white">{project.deadline}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Submissions:</span>
                        <span className="text-white">{project.submissions}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.requirements.map((req, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/writer/projects/${project.id}`}
                      className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                    >
                      View project
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-white/10 rounded-lg">
                <p className="text-gray-400 mb-4">No projects available at this time.</p>
                <Link
                  href="/writer/projects"
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors inline-flex items-center"
                >
                  Browse all projects
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}