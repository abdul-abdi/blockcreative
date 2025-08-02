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
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ScrollVelocity from '@/components/ScrollVelocity';

// Add genreOptions array for the genre scroller
const genreOptions = [
  'Drama', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 
  'Fantasy', 'Animation', 'Documentary', 'Action', 'Romance'
];
// Define types for our data
interface Submission {
  id: string | number;
  title: string;
  project?: string;
  project_id?: string | number;
  score: number;
  rank?: number;
  status?: string;
  submitted?: string;
  studioName?: string;
  writer_name?: string;
  writer_id?: string;
  writer_avatar?: string;
  ai_score?: number | { overall_score?: number; analysis?: any };
  content?: string;
  created_at?: string;
  _id?: string | number;
}

interface Project {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  status?: string;
  budget: string | number;
  deadline?: string | Date;
  requirements?: string[] | any;
  producer_name?: string;
  company_name?: string;
  cover_image?: string;
  // Added UI fields
  studioName?: string;
  statusColor?: string;
  statusText?: string;
  deadlineFormatted?: string;
  budgetFormatted?: string;
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
    id: 'completed',
    name: 'Completed Submissions',
    value: '0',
    change: '0 this month',
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

// Helper function to clear authentication data
const clearAuthData = () => {
  try {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('companyName');
    localStorage.removeItem('signupDate');
    console.log('Cleared auth data from localStorage due to authentication failure');
  } catch (err) {
    console.error('Error clearing localStorage:', err);
  }
};

// Function to register a new writer user
async function registerWriterUser(walletAddress: string) {
  console.log('Attempting to register new writer user with wallet address:', walletAddress);
  try {
    // The server expects walletAddress to be passed as 'address' according to the POST handler
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress, // The server expects this property name
        role: 'writer',
        profile_data: {
          name: 'New Writer', // Give a default name
          bio: '',
          genres: []
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to register writer user:', response.status, errorText);
      try {
        const errorData = JSON.parse(errorText);
        console.error('Registration error details:', errorData);
      } catch {
        // Just log the text if it's not JSON
      }
      return null;
    }

    const data = await response.json();
    console.log('Successfully registered writer user:', data);
    
    // Add debug logging to verify the response structure
    console.log('Writer user registration response structure:', {
      hasUser: !!data.user,
      userData: data.user,
      messageFromServer: data.message
    });
    
    return data.user;
  } catch (error) {
    console.error('Error registering writer user:', error);
    return null;
  }
}

export default function WriterDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<StatItem[]>(emptyStats);
  const [activeSubmissions, setActiveSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0);

  const { user, isLoading: isUserLoading, mutate } = useUser();
  const router = useRouter();

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

  // Helper function to update stats
  const updateStats = (submissions: Submission[]) => {
    if (!submissions || submissions.length === 0) {
      setStats(emptyStats);
      return;
    }
    
    const activeCount = submissions.filter(sub => sub.status !== 'rejected').length;
    
    // Calculate average score from submissions with a score property
    const submissionsWithScore = submissions.filter(sub => sub.score !== undefined);
    const averageScore = submissionsWithScore.length > 0
      ? Math.round(submissionsWithScore.reduce((acc, sub) => acc + sub.score, 0) / submissionsWithScore.length)
      : 0;
    
    // Calculate completed submissions instead of earnings
    const completedCount = submissions.filter(sub => sub.status === 'accepted').length;
    
    // Calculate success rate
    const successRate = submissions.length > 0
      ? Math.round((submissions.filter(sub => sub.status === 'accepted').length / submissions.length) * 100)
      : 0;
    
    const newStats: StatItem[] = [
      {
        id: 'submissions',
        name: 'Active Submissions',
        value: activeCount.toString(),
        change: `${activeCount > 0 ? '+' + activeCount : '0'} this week`,
        trend: activeCount > 0 ? 'up' : 'neutral',
        iconType: 'document',
        color: 'from-purple-500 to-indigo-500'
      },
      {
        id: 'score',
        name: 'Average AI Score',
        value: averageScore.toString(),
        change: `${averageScore > 0 ? '+' + averageScore : '0'} points`,
        trend: averageScore > 50 ? 'up' : (averageScore > 0 ? 'neutral' : 'down'),
        iconType: 'chart',
        color: 'from-emerald-500 to-teal-500'
      },
      {
        id: 'completed',
        name: 'Completed Submissions',
        value: completedCount.toString(),
        change: `${completedCount > 0 ? '+' + completedCount : '0'} this month`,
        trend: completedCount > 0 ? 'up' : 'neutral',
        iconType: 'currency',
        color: 'from-amber-500 to-orange-500'
      },
      {
        id: 'success',
        name: 'Success Rate',
        value: `${successRate}%`,
        change: `${successRate > 0 ? '+' + successRate : '0'}% change`,
        trend: successRate > 50 ? 'up' : (successRate > 0 ? 'neutral' : 'down'),
        iconType: 'star',
        color: 'from-pink-500 to-rose-500'
      }
    ];
    
    setStats(newStats);
  };

  // Fetch data for the dashboard
  useEffect(() => {
    // Add debug logging for user data
    console.log('Writer dashboard: Current user data from SWR:', user);
    
    // Prevent duplicate fetches within short time periods
    const now = Date.now();
    if (now - lastFetchTimestamp < 2000) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }
    
    const fetchData = async () => {
      // Set timestamp immediately to prevent race conditions
      setLastFetchTimestamp(Date.now());
      setIsLoading(true);
      setError(null);
      
      try {
        // Get wallet address from localStorage or from connected wallet
        const walletAddress = localStorage.getItem('walletAddress') || (user && user.address);
        
        if (!walletAddress) {
          console.error('No wallet address available');
          setError('Authentication required. Please sign in.');
          setIsLoading(false);
          router.push('/signin');
          return;
        }
        
        console.log('Writer Dashboard: Fetching data with wallet address:', walletAddress);
        const normalizedWalletAddress = walletAddress.toLowerCase();
        
        // Step 1: Fetch user data
        console.log('Step 1: Fetching user data');
        const userResponse = await fetch('/api/users/me', {
          headers: {
            'x-wallet-address': normalizedWalletAddress,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('User API response status:', userResponse.status);
        
        // If user is not found, handle it by clearing localStorage and redirecting
        if (userResponse.status === 404) {
          console.error('User not found in database');
          clearAuthData();
          router.push('/signup');
          return;
        }
        
        if (!userResponse.ok) {
            const errorText = await userResponse.text();
          console.error('Error fetching user data:', errorText);
          setError('Failed to fetch user data');
          setIsLoading(false);
          return;
        }
        
        const userData = await userResponse.json();
          console.log('User data received:', userData);
          
          if (!userData.user) {
            console.error('Invalid user data returned');
            setError('Invalid user data');
          setIsLoading(false);
          return;
        }
        
        // Set user data
        setUserData(userData.user);
        setUserName(userData.user.profile_data?.name || 'Writer');
        
        // Check if user is a writer
        if (userData.user.role !== 'writer') {
          console.error('User is not a writer, redirecting to appropriate dashboard');
          router.push(`/${userData.user.role}/dashboard`);
          return;
        }
        
        // Check if onboarding is completed
        if (!userData.user.onboarding_completed) {
          console.log('Onboarding not completed, redirecting');
          router.push('/writer/onboarding');
          return;
        }
        
        // Fetch ALL projects without filtering by status
        console.log('Step 2: Fetching all available projects');
        const projectsResponse = await fetch('/api/projects', {
            headers: {
              'x-wallet-address': normalizedWalletAddress,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          console.log('Projects API response status:', projectsResponse.status);
          
          if (!projectsResponse.ok) {
            const errorText = await projectsResponse.text();
            console.error('Error fetching projects:', errorText);
          setError('Failed to fetch available projects');
          // Continue with submissions fetch even if projects failed
          } else {
              const projectsData = await projectsResponse.json();
              console.log('Projects data received:', projectsData);
          
          // Process all projects regardless of status
          if (projectsData && Array.isArray(projectsData.projects)) {
            const allProjects = projectsData.projects;
            console.log(`Fetched ${allProjects.length} total projects`);
            
            // Log all project statuses to diagnose issues
            console.log('Project statuses:', allProjects.map((p: Project) => p.status));
            
            // Enhance projects with additional info
            const enhancedProjects = allProjects.map((project: Project) => ({
              ...project,
              // Default fields if missing
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
              budgetFormatted: formatBudget(project.budget)
            }));
            
            // Set all projects for display, don't filter by status
            setAvailableProjects(enhancedProjects);
            console.log(`Set ${enhancedProjects.length} projects for display`);
          } else {
            console.error('Invalid projects data format or empty array:', projectsData);
              setAvailableProjects([]);
            }
        }
        
        // Fetch writer's submissions
        console.log('Step 3: Fetching writer submissions');
        try {
          const submissionsResponse = await fetch('/api/submissions?writer=true', {
              method: 'GET',
              headers: {
                'x-wallet-address': normalizedWalletAddress,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            console.log('Submissions API response status:', submissionsResponse.status);
            
          if (!submissionsResponse.ok) {
            console.error('Failed to fetch submissions:', submissionsResponse.statusText);
            setActiveSubmissions([]);
            updateStats([]);
          } else {
            const submissionsData = await submissionsResponse.json();
                console.log('Submissions data received:', submissionsData);
                
            // Enhanced mapping of submission data
            const enhancedSubmissions = (submissionsData.submissions || []).map((submission: any, index: number) => {
              // Get project details if available
              const project = availableProjects.find((p: Project) => 
                p.id === submission.project_id || p._id === submission.project_id
              );
              
              // Use project's studio information if available
              const studioName = submission.producer_name || 
                                (project ? (project.producer_name || project.company_name) : 'Unknown Studio');
              
              return {
                ...submission,
                id: submission.id || submission._id,
                title: submission.title || 'Untitled Submission',
                score: typeof submission.score === 'number' ? submission.score : 
                       (typeof submission.ai_score === 'number' ? submission.ai_score : 
                       (typeof submission.ai_score === 'object' && submission.ai_score?.overall_score ? submission.ai_score.overall_score : 75)),
                rank: index + 1,
                status: submission.status || 'Under Review',
                producer_name: submission.producer_name,
                studioName: studioName,
                submitted: submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'Recently',
                submittedDate: submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'Recently'
              };
            });
            
            setActiveSubmissions(enhancedSubmissions);
            
            // Select the first submission if available
            if (enhancedSubmissions.length > 0) {
              setSelectedSubmission(enhancedSubmissions[0]);
            }
            
            // Update statistics
            updateStats(enhancedSubmissions);
            }
          } catch (submissionError) {
          console.error('Error fetching submissions:', submissionError);
              setActiveSubmissions([]);
              updateStats([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Dashboard data fetching error:', error);
        setError('Error loading dashboard data');
        setIsLoading(false);
      }
    };

    if (!isUserLoading && (user?.address || localStorage.getItem('walletAddress'))) {
      fetchData();
    } else if (!isUserLoading && !user?.address && !localStorage.getItem('walletAddress')) {
      setIsLoading(false);
      router.push('/signin');
    }
  }, [user, isUserLoading, router, dataRefreshCounter]);
  
  // Add a refresh function to manually trigger data refresh
  const handleRefresh = () => {
    setDataRefreshCounter(prev => prev + 1);
  };

  // Add the viewProjectDetails function inside the component
  const viewProjectDetails = (project: Project) => {
    if (project.id) {
      router.push(`/writer/projects/${project.id}`);
    } else if (project._id) {
      router.push(`/writer/projects/${project._id}`);
    } else {
      console.error('Cannot view project details - project id is missing', project);
      setError('Unable to view project details - missing project ID');
    }
  };

  // Define the renderAvailableProjects function here inside the component 
  const renderAvailableProjects = () => {
    if (availableProjects.length === 0) {
      return (
        <div className="text-center p-8 bg-black/30 backdrop-blur-sm rounded-xl border border-white/10">
          <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Available Projects</h3>
          <p className="text-gray-400 mb-4">
            There are currently no open projects. Check back later for opportunities.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {availableProjects.map((project: Project, index: number) => (
          <motion.div
            key={project.id || project._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + index * 0.05,
              duration: 0.3
            }}
            className="bg-gray-900/70 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden hover:border-[rgb(var(--accent-primary))]/30 transition-colors duration-300"
          >
            {/* Project Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-white truncate">{project.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${project.statusColor}`}>
                  {project.statusText}
                </span>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2">{project.description}</p>
            </div>
            
            {/* Producer/Company name */}
            <div className="px-4 py-2 border-b border-white/10">
              <p className="text-xs text-gray-400">From Studio:</p>
              <p className="text-sm font-medium text-white">
                {project.studioName}
              </p>
            </div>
            
            {/* Project Details */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-xs text-gray-400 mb-1">Budget</p>
                  <p className="text-sm font-semibold text-white flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-1 text-green-400" />
                    {project.budgetFormatted}
                  </p>
                </div>
                
                <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-xs text-gray-400 mb-1">Deadline</p>
                  <p className="text-sm font-semibold text-white flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1 text-cyan-400" />
                    {typeof project.deadlineFormatted === 'string' ? project.deadlineFormatted : 'No deadline'}
                  </p>
                </div>
              </div>
              
              {/* Requirements preview */}
              {project.requirements && (
                <div className="mb-4">
                  <div className="mb-2 text-xs text-gray-500 uppercase">Requirements:</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(project.requirements) ? 
                      project.requirements.slice(0, 3).map((req: any, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300"
                        >
                          {typeof req === 'string' ? req : 'Requirement'}
                        </span>
                      )) : (
                        <span className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300">
                          See details
                        </span>
                      )
                    }
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <button
                onClick={() => viewProjectDetails(project)}
                className="w-full py-2 px-3 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                View Project
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };
  
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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
            className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4"
          >
            <Link
              href="/audiomarket/writer/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold hover:opacity-90 transition-all w-full sm:w-auto"
              title="Switch to Audio Marketplace"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Switch to Audio Marketplace</span>
            </Link>
            <Link
              href="/writer/submit"
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Submit Script</span>
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
              <h2 className="text-xl font-bold text-white mb-6">Your Submissions</h2>
              
              {activeSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {activeSubmissions.slice(0, 3).map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() => setSelectedSubmission(submission)}
                      className={`p-4 border ${
                        selectedSubmission?.id === submission.id
                          ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/5'
                          : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
                      } rounded-lg cursor-pointer transition-all hover:scale-[1.02]`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">{submission.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            submission.rank && submission.rank <= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            Rank #{submission.rank || '?'}
                          </span>
                          <span className="px-2 py-1 bg-[rgb(var(--accent-primary))]/20 text-[rgb(var(--accent-primary))] rounded-full text-xs">
                            {submission.score}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span>{submission.studioName}</span>
                          <span>•</span>
                          <span>Submitted {submission.submitted}</span>
                        </div>
                        <span className={`mt-2 sm:mt-0 px-2 py-1 rounded-full ${
                          submission.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                          submission.status === 'Shortlisted' ? 'bg-amber-500/20 text-amber-400' :
                          submission.status === 'Under Review' || submission.status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {submission.status ? submission.status.charAt(0).toUpperCase() + submission.status.slice(1) : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <Link
                    href="/writer/submissions"
                    className="flex items-center justify-center p-4 border border-dashed border-white/10 rounded-lg hover:border-white/20 transition-colors text-sm text-gray-400 hover:text-white"
                  >
                    {activeSubmissions.length > 3 ? `View all ${activeSubmissions.length} submissions` : 'View all submissions'}
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-black/20">
                  <DocumentTextIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    You haven't submitted any scripts yet. Browse available projects and submit your
                    creative work to start your journey.
                  </p>
                  
                      <Link
                    href="/writer/projects"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
                      >
                    <SparklesIcon className="w-5 h-5" />
                    Explore Projects
                      </Link>
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
                  
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 mb-6">
                    <h3 className="text-lg font-medium text-gray-200 mb-2">Script Analysis</h3>
                    <p className="text-gray-400">AI-powered script analysis is currently unavailable.</p>
                  </div>
                  
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

        {/* Available Projects */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <DocumentTextIcon className="w-6 h-6 text-[rgb(var(--accent-primary))] mr-2" />
            Featured Projects
          </h2>
          <Link 
            href="/writer/projects" 
            className="text-[rgb(var(--accent-primary))] hover:text-[rgb(var(--accent-primary))]/80 transition-colors text-sm flex items-center gap-1"
          >
            View all projects
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {availableProjects.slice(0, 3).map((project, index) => (
            <motion.div
              key={project.id || project._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1 + index * 0.05,
                duration: 0.3
              }}
              className="bg-gray-900/70 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden hover:border-[rgb(var(--accent-primary))]/30 hover:shadow-lg hover:shadow-[rgb(var(--accent-primary))]/10 transition-all duration-300"
            >
              {/* Project Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">{project.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${project.statusColor}`}>
                    {project.statusText}
                  </span>
                  </div>
                <p className="text-gray-400 text-sm line-clamp-2">{project.description}</p>
                  </div>
              
              {/* Producer/Company name */}
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-xs text-gray-400">From Studio:</p>
                <p className="text-sm font-medium text-white">
                  {project.studioName}
                </p>
                </div>
                
              {/* Project Details */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Budget</p>
                    <p className="text-sm font-semibold text-white flex items-center">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1 text-green-400" />
                      {project.budgetFormatted}
                    </p>
                  </div>
                  
                  <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Deadline</p>
                    <p className="text-sm font-semibold text-white flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1 text-cyan-400" />
                      {typeof project.deadlineFormatted === 'string' ? project.deadlineFormatted : 'No deadline'}
                    </p>
                  </div>
                </div>
                
                {/* Requirements preview */}
                {project.requirements && (
                  <div className="mb-4">
                    <div className="mb-2 text-xs text-gray-500 uppercase">Requirements:</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(project.requirements) ? 
                        project.requirements.slice(0, 3).map((req: any, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300"
                          >
                            {typeof req === 'string' ? req : 'Requirement'}
                          </span>
                        )) : (
                        <span className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-300">
                            See details
                        </span>
                        )
                      }
                    </div>
                  </div>
                )}
                
                {/* Action Button */}
                <button
                  onClick={() => viewProjectDetails(project)}
                  className="w-full py-2 px-3 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  View Project
                </button>
              </div>
            </motion.div>
          ))}
          
          {availableProjects.length === 0 && (
            <div className="col-span-3 text-center p-8 bg-black/30 backdrop-blur-sm rounded-xl border border-white/10">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Available Projects</h3>
              <p className="text-gray-400 mb-4">
                There are currently no open projects. Check back later for opportunities.
              </p>
            </div>
          )}
        </div>
        
        {/* Add prominent Browse All Projects button */}
        {availableProjects.length > 0 && (
          <div className="flex justify-center mt-10">
              <Link 
                href="/writer/projects" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-[rgb(var(--accent-primary))]/20 hover:scale-105 duration-300"
              >
              <SparklesIcon className="w-5 h-5" />
                Browse All Projects
              {availableProjects.length > 3 && (
                <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                  {availableProjects.length - 3}+ more
                </span>
              )}
              </Link>
            </div>
          )}
      </div>
      <div className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-r from-gray-900/90 to-gray-800/90 py-2 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <ScrollVelocity
          texts={genreOptions}
          velocity={80}
          className="text-lg md:text-2xl font-semibold text-blue-300 tracking-wide"
          numCopies={4}
          parallaxClassName="overflow-hidden"
          scrollerClassName="flex items-center"
          parallaxStyle={{height: '2.5rem'}}
        />
      </div>
    </div>
    </DashboardLayout>
  );
}

// Add helper functions for project formatting
const getStatusColor = (status: string | undefined): string => {
  switch (status) {
    case 'published':
    case 'open':
      return 'bg-green-500/20 text-green-400';
    case 'funded':
      return 'bg-blue-500/20 text-blue-400';
    case 'closed':
      return 'bg-red-500/20 text-red-400';
    case 'draft':
      return 'bg-yellow-500/20 text-yellow-400';
    default:
      return 'bg-purple-500/20 text-purple-400';
  }
};

const getStatusText = (status: string | undefined): string => {
  if (!status) return 'Unknown';
  
  switch (status) {
    case 'published':
    case 'open':
      return 'Open';
    case 'funded':
      return 'Funded';
    case 'closed':
      return 'Closed';
    case 'draft':
      return 'Coming Soon';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const formatDeadline = (deadline: string | Date | undefined): string => {
  if (!deadline) return 'No deadline';
  try {
    // Check if it's already a formatted date string
    if (typeof deadline === 'string' && !deadline.includes('T')) {
      return deadline;
    }
    
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return String(deadline);
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return String(deadline);
  }
};

const formatBudget = (budget: string | number | undefined): string => {
  if (!budget) return 'Not specified';
  
  if (typeof budget === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(budget);
  }
  
  return budget.toString();
};