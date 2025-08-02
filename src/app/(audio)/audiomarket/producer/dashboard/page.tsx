'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ArrowSmallUpIcon,
  ArrowSmallDownIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useMarketplace } from '@/context/audio';

// Define interfaces for typed data
interface Analysis {
  strengths?: string[];
  weaknesses?: string[];
  overview?: string;
  characters?: string[];
  plot?: string;
  dialogue?: string;
  marketability?: string;
  improvements?: string[];
}

interface Submission {
  id: number | string;
  title: string;
  writer: string;
  score: number;
  analysis?: Analysis;
  status?: string;
  date?: string;
  writer_id?: string;
  writer_name?: string;
  writer_avatar?: string;
  ai_score?: number | {
    overall_score?: number;
    analysis?: Analysis;
  };
  content?: string;
  project_id?: string | number;
}

// Extended submission interface for API responses
interface ApiSubmission extends Omit<Submission, 'ai_score'> {
  writer_id?: string;
  writer_name?: string;
  writer_avatar?: string;
  ai_score?: number | {
    overall_score?: number;
    analysis?: Analysis;
  };
  date?: string;
  created_at?: string;
  _id?: string | number;
  project_id?: string | number;
}

interface Project {
  id: string | number;
  projectId?: string;
  _id?: string;
  title: string;
  budget: string | number;
  submissions: number;
  status: string;
  deadline: string;
  topScore: number;
  recentSubmissions: ApiSubmission[];
  escrow_funded: boolean;
  blockchain_data?: Record<string, any>;
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
  id?: string;
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  iconType?: string;
  icon?: any; // Icon component type
  color: string;
}

// Near the beginning of the file, after other interfaces
interface TopWriter {
  id: string | number;
  name: string;
  avatar?: string;
  genre?: string;
  genres?: string[];
  bio?: string;
  location?: string;
  rating: number;
  submissions: number;
  acceptanceRate: string;
  earnings: string;
  joined?: string;
}

// Function to render the appropriate icon based on iconType
const renderIcon = (iconType: string | undefined) => {
  switch (iconType) {
    case 'document':
      return <DocumentTextIcon className="h-5 w-5" />;
    case 'chart':
      return <ChartBarIcon className="h-5 w-5" />;
    case 'currency':
      return <CurrencyDollarIcon className="h-5 w-5" />;
    case 'star':
      return <SparklesIcon className="h-5 w-5" />;
    default:
      return <FolderIcon className="h-5 w-5" />;
  }
};

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

// Helper functions for blockchain interactions
const checkTransactionStatus = async (txHash: string, projectId: string | number) => {
  try {
    const response = await fetch(`/api/blockchain/status/${txHash}`);
    if (response.ok) {
      const data = await response.json();
      if (data.confirmed) {
        // Update project status in UI by refreshing data
        console.log('Transaction confirmed for project:', projectId);
        return true;
      } else {
        // Schedule another check in 10 seconds
        setTimeout(() => checkTransactionStatus(txHash, projectId), 10000);
        return false;
      }
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return false;
  }
};

const fundProject = async (projectId: string | number, amount: string) => {
  try {
    const walletAddress = localStorage.getItem('walletAddress') || '';
    const response = await fetch(`/api/projects/${projectId}/fund`, {
      method: 'POST',
      headers: {
        'x-wallet-address': walletAddress,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });
    
    if (response.ok) {
      const data = await response.json();
      // Check transaction status
      checkTransactionStatus(data.transactionHash, projectId);
      return {
        success: true,
        data
      };
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fund project');
    }
  } catch (error: any) {
    console.error('Error funding project:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

const acceptSubmission = async (submissionId: string | number) => {
  try {
    const walletAddress = localStorage.getItem('walletAddress') || '';
    const response = await fetch(`/api/submissions/${submissionId}/accept`, {
      method: 'POST',
      headers: {
        'x-wallet-address': walletAddress,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data
      };
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to accept submission');
    }
  } catch (error: any) {
    console.error('Error accepting submission:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

const getSubmissionDetails = async (submissionId: string | number) => {
  try {
    const walletAddress = localStorage.getItem('walletAddress') || '';
    const response = await fetch(`/api/submissions/${submissionId}`, {
      headers: {
        'x-wallet-address': walletAddress,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch submission details');
    }
  } catch (error: any) {
    console.error('Error fetching submission details:', error);
    throw error;
  }
};

// Add a new function to fetch project submissions
const fetchProjectSubmissions = async (projectId: string | number) => {
  try {
    const walletAddress = localStorage.getItem('walletAddress') || '';
    console.log(`Fetching submissions for project: ${projectId}, wallet: ${walletAddress}`);
    
    const response = await fetch(`/api/projects/${projectId}/submissions`, {
      headers: {
        'x-wallet-address': walletAddress,
        'Content-Type': 'application/json'
      }
    });
    
    // Parse the response data
    const textData = await response.text();
    let data;
    
    try {
      // Try to parse as JSON
      data = JSON.parse(textData);
    } catch (parseError) {
      console.error('Failed to parse API response:', textData);
      return {
        success: false,
        error: 'Invalid API response format',
        submissions: []
      };
    }
    
    // Even if status is not OK, we can still have structured data with submissions array
    if (response.ok) {
      return {
        success: true,
        submissions: data.submissions || []
      };
    } else {
      // If API returned an error but with structured data, use the submissions if available
      console.warn(`API returned error ${response.status}: ${data.error || 'Unknown error'}`);
      return {
        success: false,
        error: data.error || 'Failed to fetch submissions',
        // Return any submissions array provided in error response
        submissions: data.submissions || []
      };
    }
  } catch (error: any) {
    console.error('Error fetching project submissions:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      submissions: []
    };
  }
};

// Function to update stats using real data
const updateStatsFromRealData = (submissions: ApiSubmission[], projects: Project[]) => {
  // Projects count
  const activeProjectsCount = projects.filter(p => 
    p.status === 'active' || p.status === 'published' || p.status === 'funded'
  ).length;
  
  // Submissions count
  const totalSubmissionsCount = submissions.length;
  
  // Calculate total investment
  const totalInvestment = projects.reduce((sum, project) => {
    if (!project.budget) return sum;
    
    // Try to extract numeric value from budget
    try {
      // Check if budget is a string before using match
      if (typeof project.budget === 'string') {
        const budgetMatch = project.budget.match(/[\d,]+/);
        if (budgetMatch) {
          const numericBudget = parseFloat(budgetMatch[0].replace(/,/g, ''));
          if (!isNaN(numericBudget)) {
            return sum + numericBudget;
          }
        }
      } else if (typeof project.budget === 'number') {
        // If budget is already a number, use it directly
        return sum + project.budget;
      }
    } catch (error) {
      console.error('Error parsing budget:', error);
    }
    return sum;
  }, 0);
  
  // Format investment as currency
  const formattedInvestment = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(totalInvestment);
  
  // Calculate average submission quality
  const scoredSubmissions = submissions.filter(sub => 
    typeof sub.score === 'number' || typeof sub.ai_score === 'number' || 
    (typeof sub.ai_score === 'object' && typeof sub.ai_score?.overall_score === 'number')
  );
  
  let avgQuality = 0;
  if (scoredSubmissions.length > 0) {
    const total = scoredSubmissions.reduce((sum, sub) => {
      const score = typeof sub.score === 'number' ? sub.score : 
                   (typeof sub.ai_score === 'number' ? sub.ai_score : 
                   (typeof sub.ai_score === 'object' && sub.ai_score?.overall_score ? sub.ai_score?.overall_score : 0));
      return sum + score;
    }, 0);
    avgQuality = Math.round(total / scoredSubmissions.length);
  }
  
  return [
    {
      id: 'projects',
      name: 'Active Projects',
      value: activeProjectsCount.toString(),
      change: 'Current projects',
      trend: 'neutral' as const,
      iconType: 'document',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'submissions',
      name: 'Total Submissions',
      value: totalSubmissionsCount.toString(),
      change: 'All time',
      trend: 'neutral' as const,
      iconType: 'chart',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'investment',
      name: 'Total Investment',
      value: formattedInvestment,
      change: 'All projects',
      trend: 'neutral' as const,
      iconType: 'currency',
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'quality',
      name: 'Avg Submission Quality',
      value: `${avgQuality || 0}%`,
      change: 'Based on AI analysis',
      trend: 'neutral' as const,
      iconType: 'star',
      color: 'from-pink-500 to-rose-500',
    },
  ];
};

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
    // Log specific counts and IDs to help debug
    if (data.projectCounts) {
      console.log('Project counts by method:', data.projectCounts);
    }
    if (data.sampleProjects && data.sampleProjects.length > 0) {
      console.log('Sample project fields:');
      const project = data.sampleProjects[0];
      console.log('- id:', project.id);
      console.log('- projectId:', project.projectId);
      console.log('- _id:', project._id);
      console.log('- producer:', project.producer);
      console.log('- producer_id:', project.producer_id);
    }
  })
  .catch(error => {
    console.error('Error inspecting MongoDB:', error);
  });
};

// First, create a helper function to check if submission belongs to project
const isSubmissionForProject = (submission: ApiSubmission, project: Project): boolean => {
  const projectIds = [
    project.id, 
    project.projectId, 
    project._id
  ].filter(Boolean); // Remove any undefined/null values
  
  return projectIds.includes(submission.project_id);
};

export default function ProducerDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [topWriters, setTopWriters] = useState<TopWriter[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [companyName, setCompanyName] = useState('Your Studio');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);
  
  // Define empty stats for initialization
  const emptyStats: Stat[] = [
    {
      id: 'projects',
      name: 'Active Projects',
      value: '0',
      change: '0 this week',
      trend: 'neutral',
      iconType: 'document',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'submissions',
      name: 'Total Submissions',
      value: '0',
      change: '0 new',
      trend: 'neutral',
      iconType: 'chart',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'investment',
      name: 'Total Investment',
      value: '$0',
      change: '$0 this month',
      trend: 'neutral',
      iconType: 'currency',
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'quality',
      name: 'Avg Submission Quality',
      value: '0%',
      change: '0% change',
      trend: 'neutral',
      iconType: 'star',
      color: 'from-pink-500 to-rose-500',
    },
  ];
  
  // Use the updated useUser hook that uses wallet-based authentication
  const { user, authenticated, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { setMarketplace } = useMarketplace();

  // Add a function to manually refresh data
  const handleRefreshData = () => {
    setIsLoading(true);
    setDataRefreshCounter(prev => prev + 1);
  };

  // Add a function to handle project funding
  const handleFundProject = async (projectId: string | number, amount: string) => {
    try {
      setIsLoading(true);
      const result = await fundProject(projectId, amount);
      if (result.success) {
        // Show success notification
        alert('Project funded successfully! Transaction is being processed.');
        handleRefreshData();
      } else {
        // Show error notification
        alert(`Failed to fund project: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error funding project: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to handle submission acceptance
  const handleAcceptSubmission = async (submissionId: string | number) => {
    try {
      setIsLoading(true);
      const result = await acceptSubmission(submissionId);
      if (result.success) {
        // Show success notification
        alert('Submission accepted successfully! Transaction is being processed.');
        handleRefreshData();
      } else {
        // Show error notification
        alert(`Failed to accept submission: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error accepting submission: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle project selection and fetch submissions
  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project);
    setIsLoading(true);
    
    try {
      // Ensure we have a valid ID to work with, using fallbacks
      const projectId = project.id || project.projectId || project._id || '';
      console.log(`Selected project: ${project.title}, ID: ${projectId}`);
      const result = await fetchProjectSubmissions(projectId);
      
      // Ensure we always have a recentSubmissions array, even if empty or on error
      const updatedProject = {
        ...project,
        recentSubmissions: result.submissions || []
      };
      setSelectedProject(updatedProject);
      
      // Only select a submission if we have at least one
      if (result.submissions && result.submissions.length > 0) {
        setSelectedSubmission(result.submissions[0]);
      } else {
        setSelectedSubmission(null);
      }
      
      // Show error if needed but continue with the UI
      if (!result.success) {
        console.error('Issue fetching submissions:', result.error);
        // Optional: You could set an error state here to show in the UI
      }
    } catch (error) {
      console.error('Error in handleProjectSelect:', error);
      // Still update the project even on error, just with empty submissions
      const updatedProject = {
        ...project,
        recentSubmissions: []
      };
      setSelectedProject(updatedProject);
      setSelectedSubmission(null);
    } finally {
      setIsLoading(false);
      
      // Auto-scroll to submissions section
      setTimeout(() => {
        const submissionsSection = document.getElementById('submissions-section');
        if (submissionsSection) {
          submissionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  };

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

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Starting dashboard data fetch');
        
        // Inspect MongoDB data for debugging
        inspectMongoDB();
        
        // Check if wallet is connected
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (!walletAddress) {
          console.log('No wallet address found, redirecting to sign in');
          router.push('/signin');
          return;
        }
        
        console.log('Fetching producer data with wallet address:', walletAddress);
        
        // Fetch user data
        const userResponse = await fetch('/api/users/me', {
          headers: {
            'x-wallet-address': walletAddress,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
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
        setCompanyName(userData.user.profile_data?.company_name || 'Your Studio');
        
        // Check if user is a producer
        if (userData.user.role !== 'producer') {
          console.error('User is not a producer, redirecting to appropriate dashboard');
          router.push(`/${userData.user.role}/dashboard`);
          return;
        }
        
        // Check if onboarding is completed
        if (!userData.user.onboarding_completed) {
          console.log('Onboarding not completed, redirecting');
          router.push('/producer/onboarding');
          return;
        }
        
        console.log('Fetching projects with wallet address:', walletAddress);
        
        // Fetch projects - explicitly request producer's projects only
        const projectsResponse = await fetch('/api/projects?producer=true', {
          headers: {
            'x-wallet-address': walletAddress,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('Projects API response status:', projectsResponse.status);
        
        // Handle specific case of 404 when producer is not found
        if (projectsResponse.status === 404) {
          const errorData = await projectsResponse.json();
          console.log('Debug: Project API error data:', errorData);
          
          // If the error is specifically "Producer not found"
          if (errorData.error === 'Producer not found') {
            console.log('Producer not found in database, redirecting to onboarding');
            // Check if user is already in the system before redirecting
            if (userData.user && userData.user.role === 'producer') {
              router.push('/producer/onboarding');
            } else {
              // Clear auth data and redirect to signup
              clearAuthData();
              router.push('/signup');
            }
            return;
          }
        }
        
        if (!projectsResponse.ok) {
          const projectsError = await projectsResponse.text();
          console.error('Error fetching projects:', projectsError);
          setError('Failed to fetch projects. Please try again later.');
          setIsLoading(false);
          return;
        }
        
        const projectsData = await projectsResponse.json();
        console.log('DEBUG: Raw projects response:', JSON.stringify(projectsData, null, 2));
        
        // Ensure we have an array of projects
        const projectsList = Array.isArray(projectsData.projects) ? projectsData.projects : [];
        console.log('DEBUG: Projects list length:', projectsList.length);
        
        if (projectsList.length === 0) {
          console.log('DEBUG: No projects found for this producer');
        } else {
          console.log('DEBUG: First project data:', JSON.stringify(projectsList[0], null, 2));
          console.log('DEBUG: Project IDs formats:', projectsList.map((p: Project) => ({
            id: p.id,
            projectId: p.projectId,
            _id: p._id,
          })));
        }
        
        // Check for blockchain transaction status for each project
        projectsList.forEach((project: any) => {
          if (project.blockchain_data && project.blockchain_data.transactionHash && !project.blockchain_data.confirmed) {
            checkTransactionStatus(project.blockchain_data.transactionHash, project.id || project.projectId || project._id);
          }
        });
        
        // Format projects data with consistent date formatting
        const formattedProjects = projectsList.map((project: any) => {
          // Extract project ID using fallbacks with consistent types
          const projectId = project.id || project.projectId || project._id?.toString();
          console.log(`Formatting project ${projectId}:`, project.title);
          
          // Format deadline if it's a valid date
          let formattedDeadline = project.deadline;
          try {
            if (project.deadline) {
              const deadlineDate = new Date(project.deadline);
              if (!isNaN(deadlineDate.getTime())) {
                formattedDeadline = format(deadlineDate, 'MMM d, yyyy');
              }
            }
          } catch (e) {
            console.error('Error formatting deadline:', e);
          }
          
          return {
            id: projectId,
            projectId: project.projectId || projectId, // Store original projectId too
            _id: project._id?.toString(),  // Store MongoDB ID for reference
            title: project.title || 'Untitled Project',
            budget: project.budget || 'N/A',
            submissions: 0, // Will update after fetching submissions
            status: project.status || 'draft',
            deadline: formattedDeadline || 'No deadline',
            topScore: 0, // Will update after fetching submissions
            recentSubmissions: [], // Will update after fetching submissions
            escrow_funded: project.is_funded || false,
            blockchain_data: project.blockchain_data || {}
          };
        });
        
        console.log('Formatted projects:', formattedProjects);
        
        // Fetch submissions with explicit role parameter
        console.log('Fetching submissions with wallet address:', walletAddress);
        const submissionsResponse = await fetch('/api/submissions?role=producer', {
          headers: {
            'x-wallet-address': walletAddress,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('Submissions API response status:', submissionsResponse.status);
        
        if (!submissionsResponse.ok) {
          const submissionsError = await submissionsResponse.text();
          console.error('Error fetching submissions:', submissionsError);
          setError('Failed to fetch submissions. Please try again later.');
          
          // Still set the projects even if submissions fail
          setActiveProjects(formattedProjects);
          setIsLoading(false);
          return;
        }
        
        const submissionsData = await submissionsResponse.json();
        console.log('DEBUG: Raw submissions response:', JSON.stringify(submissionsData, null, 2));
        
        // Ensure we have an array of submissions
        let allSubmissions: ApiSubmission[] = Array.isArray(submissionsData.submissions) 
          ? submissionsData.submissions 
          : [];
        
        console.log('DEBUG: Submissions list length:', allSubmissions.length);
        
        if (allSubmissions.length === 0) {
          console.log('DEBUG: No submissions found for this producer');
        } else {
          console.log('DEBUG: First submission data:', JSON.stringify(allSubmissions[0], null, 2));
          console.log('DEBUG: Submission project_id formats:', allSubmissions.map(s => ({
            submission_id: s.id,
            project_id: s.project_id
          })));
        }
        
        // Format and enhance submissions data
        allSubmissions = allSubmissions.map((submission: ApiSubmission): ApiSubmission => {
          // Get submission ID using fallbacks
          const submissionId = submission.id || submission._id;
          console.log(`Formatting submission ${submissionId}:`, submission.title);
          
          // Format date if available
          let formattedDate = submission.date;
          try {
            if (submission.created_at) {
              const submissionDate = new Date(submission.created_at);
              if (!isNaN(submissionDate.getTime())) {
                formattedDate = format(submissionDate, 'MMM d, yyyy');
              }
            }
          } catch (e) {
            console.error('Error formatting submission date:', e);
          }
          
          // Safely get the score, handling both number and object types
          let score = 70; // Default score
          let analysisData: Analysis | undefined = undefined;
          
          if (typeof submission.score === 'number') {
            score = submission.score;
          } else if (typeof submission.ai_score === 'number') {
            score = submission.ai_score;
          } else if (submission.ai_score && typeof submission.ai_score === 'object') {
            if (submission.ai_score.overall_score) {
              score = submission.ai_score.overall_score;
            }
            if (submission.ai_score.analysis) {
              analysisData = submission.ai_score.analysis;
            }
          }
          
          return {
            id: submissionId as string | number,
            title: submission.title || 'Untitled',
            writer: submission.writer_name || 'Anonymous Writer',
            writer_id: submission.writer_id,
            writer_avatar: submission.writer_avatar,
            score: score,
            analysis: analysisData,
            status: submission.status || 'pending',
            date: formattedDate || 'Unknown date',
            content: submission.content,
            project_id: submission.project_id
          };
        });
        
        console.log('Formatted submissions:', allSubmissions);
        
        // Update projects with submission data
        const projectsWithSubmissions = formattedProjects.map((project: Project) => {
          // Find submissions for this project by trying different ID formats
          const projectSubmissions = allSubmissions.filter(
            (sub: ApiSubmission) => isSubmissionForProject(sub, project)
          );
          
          console.log(`Found ${projectSubmissions.length} submissions for project ${project.id} (${project.title})`);
          
          // Get top score
          const topScore = projectSubmissions.length > 0
            ? Math.max(...projectSubmissions.map(sub => sub.score || 0))
            : 0;
          
          return {
            ...project,
            submissions: projectSubmissions.length,
            topScore,
            recentSubmissions: projectSubmissions.slice(0, 3) // Take 3 most recent
          };
        });
        
        console.log('DEBUG: Projects with submissions mapping:', projectsWithSubmissions.map((p: any) => ({
          projectId: p.id,
          title: p.title,
          submissionsCount: p.submissions,
          submissionIds: p.recentSubmissions.map((s: ApiSubmission) => s.id)
        })));
        
        setActiveProjects(projectsWithSubmissions);
        
        // Sort submissions by date (newest first)
        const sortedSubmissions = [...allSubmissions].sort(
          (a, b) => {
            // Use timestamp for comparison if available
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          }
        );
        
        // Only set selected project if projects are available
        if (projectsWithSubmissions.length > 0) {
          console.log('DEBUG: Setting selected project:', projectsWithSubmissions[0].title, 
            'ID:', projectsWithSubmissions[0].id,
            'Type:', typeof projectsWithSubmissions[0].id);
          setSelectedProject(projectsWithSubmissions[0]);
          
          // Find submissions for this project
          const firstProjectSubs = sortedSubmissions.filter(
            sub => sub.project_id === projectsWithSubmissions[0].id
          );
          
          console.log(`Found ${firstProjectSubs.length} submissions for selected project`);
          
          // Set selected submission if available for this project
          if (firstProjectSubs.length > 0) {
            console.log('Setting selected submission:', firstProjectSubs[0].title);
            setSelectedSubmission(firstProjectSubs[0]);
          } else {
            console.log('No submissions available for selected project');
            setSelectedSubmission(null);
          }
        } else {
          console.log('No projects available to select');
          setSelectedProject(null);
          setSelectedSubmission(null);
        }
        
        // Update stats based on real data
        const updatedStats = updateStatsFromRealData(allSubmissions, projectsWithSubmissions);
        console.log('Setting dashboard stats:', updatedStats);
        setStats(updatedStats);
        
        // Try to fetch top writers
        try {
          console.log('Fetching top writers data');
          const writersResponse = await fetch('/api/users?role=writer&limit=10&sort=rating', {
            headers: {
              'x-wallet-address': walletAddress,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (writersResponse.ok) {
            const writersData = await writersResponse.json();
            if (writersData.users && Array.isArray(writersData.users) && writersData.users.length > 0) {
              // Get submissions to calculate writer performance metrics
              const submissionsResponse = await fetch('/api/submissions?role=producer', {
                headers: {
                  'x-wallet-address': walletAddress,
                  'Content-Type': 'application/json'
                }
              });
              
              let submissions: any[] = [];
              if (submissionsResponse.ok) {
                const submissionsData = await submissionsResponse.json();
                submissions = submissionsData.submissions || [];
              }
              
              // Format the writers data with real metrics
              const formattedWriters = writersData.users
                .map((user: any) => {
                  const profile = user.profile_data || {};
                  console.log(`Processing writer profile data:`, profile);
                  
                  // Find submissions for this writer
                  const writerSubmissions = submissions.filter(
                    (sub: any) => sub.writer_id === user.id
                  );
                  
                  // Calculate metrics
                  const totalSubmissions = writerSubmissions.length;
                  const selectedSubmissions = writerSubmissions.filter(
                    (sub: any) => sub.status === 'accepted'
                  ).length;
                  
                  // Calculate acceptance rate
                  const acceptanceRate = totalSubmissions > 0 
                    ? `${Math.round((selectedSubmissions / totalSubmissions) * 100)}%` 
                    : 'N/A';
                  
                  // Estimate earnings (if available in profile or calculate from submissions)
                  const earnings = profile.total_earnings || 
                    profile.earnings || 
                    (totalSubmissions > 0 ? `$${Math.round(totalSubmissions * 800)}` : '$0');
                  
                  // Get writer name from multiple possible sources
                  const writerName = profile.display_name || 
                    profile.name || 
                    user.name || 
                    user.display_name || 
                    '';
                  
                  // Get preferred genres
                  const genres = profile.genres || [];
                  const preferredGenre = profile.preferred_genre || 
                    (genres.length > 0 ? genres[0] : 'Various');
                  
                  // Calculate a completeness score for the writer profile
                  // This helps prioritize writers with more complete profiles
                  let completenessScore = 0;
                  if (writerName && writerName !== "Anonymous Writer") completenessScore += 3;
                  if (profile.avatar) completenessScore += 2;
                  if (genres.length > 0) completenessScore += 1;
                  if (totalSubmissions > 0) completenessScore += 2;
                  if (profile.rating) completenessScore += 1;
                  if (profile.bio) completenessScore += 1;
                  
                  const writerNameInitial = writerName ? writerName.charAt(0).toUpperCase() : 'W';
                  
                  return {
                    id: user.id || user._id,
                    name: writerName || `Writer ${writerNameInitial}${Math.floor(Math.random() * 1000)}`,
                    avatar: profile.avatar,
                    genre: preferredGenre,
                    genres: genres,
                    bio: profile.bio || '',
                    location: profile.location || '',
                    rating: profile.rating || 4.0,
                    submissions: totalSubmissions,
                    acceptanceRate,
                    earnings,
                    completenessScore,
                    joined: user.created_at || profile.join_date || '',
                  };
                })
                // Filter out writers with no name or "Anonymous Writer"
                .filter((writer: TopWriter & { completenessScore: number }) => 
                  writer.name && writer.name !== "Anonymous Writer")
                // Sort by completeness score (highest first) and then by rating
                .sort((a: any, b: any) => 
                  b.completenessScore - a.completenessScore || b.rating - a.rating)
                // Take the top 3 after filtering and sorting
                .slice(0, 3);

              console.log(`Found ${formattedWriters.length} writers with complete profiles`);
              
              // Only display writers if we have any users after filtering
              if (formattedWriters.length > 0) {
                console.log('Setting top writers:', formattedWriters);
                setTopWriters(formattedWriters);
              } else {
                console.log('No writers with names found, showing empty state');
                // Set empty array for top writers if all are anonymous
                setTopWriters([]);
              }
            } else {
              // Set sample writers data if API returned no writers
              setTopWriters([]);
            }
          } else {
            // Set sample writers data if API call failed
            setTopWriters([]);
          }
        } catch (error) {
          console.error('Error fetching writers:', error);
          setTopWriters([]);
        }
        
        setIsLoading(false);
        console.log('Dashboard data fetch complete');
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError('An unexpected error occurred. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    setMarketplace('audio');
  }, [setMarketplace]);

  // Loading state
  if (isLoading || isUserLoading) {
    return (
      <DashboardLayout userType="producer">
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout userType="producer">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-200">{error}</p>
            
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => setDataRefreshCounter(prev => prev + 1)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Try Again
              </button>
              
              <button
                onClick={forceReload}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"
              >
                Hard Reload
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="producer">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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
              Let's bring your creative projects to life today.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4"
          >
            <Link
              href="/producer/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all w-full sm:w-auto"
              title="Switch to Script Marketplace"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Switch to Script Marketplace</span>
            </Link>
            <Link
              href="/producer/projects/new"
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-semibold hover:opacity-90 transition-all shadow-lg"
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
                    {stat.icon ? stat.icon : renderIcon(stat.iconType)}
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
                  activeProjects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className="p-4 rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[rgb(var(--accent-primary))]/5 group"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                        <div className="mb-2 sm:mb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full 
                              ${project.status === 'funded' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' : 
                              project.status === 'published' ? 'bg-blue-900/40 text-blue-400 border border-blue-800' : 
                              project.status === 'draft' ? 'bg-gray-700/50 text-gray-300 border border-gray-600' : 
                              'bg-purple-900/40 text-purple-400 border border-purple-800'}`}
                            >
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                            {project.escrow_funded && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/40 text-green-400 border border-green-800">
                                Funded
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-white group-hover:text-[rgb(var(--accent-primary))] transition-colors">
                            {project.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1.5 rounded-lg bg-white/5 flex items-center gap-1 border border-white/5">
                            <CurrencyDollarIcon className="w-4 h-4 text-amber-400" />
                            <span className="text-white font-medium">{project.budget}</span>
                          </div>
                          <div className="px-3 py-1.5 rounded-lg bg-white/5 flex items-center gap-1 border border-white/5">
                            <ClockIcon className="w-4 h-4 text-cyan-400" />
                            <span className="text-white font-medium">{typeof project.deadline === 'string' ? project.deadline : 'Due Soon'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                          <p className="text-xs text-gray-400 mb-1">Submissions</p>
                          <p className="text-base font-semibold text-white flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-1 text-indigo-400" />
                            {project.submissions}
                          </p>
                        </div>
                        <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                          <p className="text-xs text-gray-400 mb-1">Top Score</p>
                          <p className="text-base font-semibold text-white flex items-center">
                            <StarIcon className="w-4 h-4 mr-1 text-amber-400" />
                            {project.topScore || 'N/A'}
                          </p>
                        </div>
                        <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                          <p className="text-xs text-gray-400 mb-1">Best Scripts</p>
                          <p className="text-base font-semibold text-white flex items-center">
                            <SparklesIcon className="w-4 h-4 mr-1 text-fuchsia-400" />
                            {project.recentSubmissions?.length || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectSelect(project);
                          }}
                          className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-white transition-all text-sm font-medium ${
                            selectedProject?.id === project.id
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {selectedProject?.id === project.id ? 'Viewing Submissions' : 'View Submissions'}
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/producer/projects/${project.id}`}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 transition-opacity text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Project Details
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <DocumentTextIcon className="w-10 h-10 mx-auto text-gray-500 mb-3" />
                    <p className="text-gray-400 mb-4">No active projects found</p>
                    <Link
                      href="/producer/projects/new"
                      className="inline-flex items-center gap-1 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Create Your First Project</span>
                    </Link>
                  </div>
                )}
                
                {activeProjects.length > 3 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/producer/projects"
                      className="inline-flex items-center gap-1 px-6 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      View All {activeProjects.length} Projects
                      <ArrowRightIcon className="w-4 h-4 ml-1" />
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
            className="card overflow-hidden"
          >
            <div className="p-6">
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
              
              <div className="space-y-5">
                {topWriters.length > 0 ? (
                  topWriters.map((writer) => (
                    <div key={writer.id} className="bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 p-4">
                      <div className="flex items-start gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
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
                          {writer.rating >= 4.7 && (
                            <div 
                              className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1" 
                              title={`Top rated writer: ${writer.rating}/5`}
                            >
                            <SparklesIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="text-lg font-semibold text-white hover:text-[rgb(var(--accent-primary))] transition-colors">
                          {writer.name}
                        </h3>
                              <div className="flex items-center text-sm text-gray-400 gap-2">
                                <span>{writer.genre || 'Various'} Specialist</span>
                                {writer.location && (
                                  <>
                                    <span className="text-gray-600">•</span>
                                    <span>{writer.location}</span>
                                  </>
                                )}
                      </div>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                              <StarIcon className="w-4 h-4" />
                              <span className="font-medium">{writer.rating}</span>
                            </div>
                          </div>
                          
                          {writer.bio && (
                            <p className="text-xs text-gray-400 mt-1 mb-2 line-clamp-2">{writer.bio}</p>
                          )}
                          
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="bg-black/20 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400">Submissions</p>
                              <p className="text-white font-medium">{writer.submissions}</p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400">Success</p>
                              <p className="text-emerald-400 font-medium">{writer.acceptanceRate}</p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400">Earnings</p>
                              <p className="text-amber-400 font-medium">{writer.earnings}</p>
                            </div>
                          </div>
                          
                          {writer.genres && writer.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {writer.genres.slice(0, 3).map((genre, index) => (
                                <span key={index} className="px-2 py-0.5 text-xs rounded-full bg-black/20 text-gray-300">
                                  {genre}
                                </span>
                              ))}
                              {writer.genres.length > 3 && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-black/20 text-gray-300">
                                  +{writer.genres.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-black/20">
                    <UserGroupIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Top Writers Yet</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      As your projects receive submissions, you'll see your top writers appear here.
                    </p>
                    <Link
                      href="/producer/writers"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
                    >
                      <UserGroupIcon className="w-5 h-5" />
                      Browse Writers
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Submissions Grid */}
        <div id="submissions-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`card lg:col-span-2 ${selectedProject ? 'ring-2 ring-[rgb(var(--accent-primary))] ring-opacity-50' : ''}`}
          >
            <div className="card p-6">
              {selectedProject && selectedProject.recentSubmissions && selectedProject.recentSubmissions.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        Submissions for {selectedProject.title}
                      </h2>
                      <p className="text-gray-400">
                        Review and select the winning script from the top-ranked submissions.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      {selectedProject.recentSubmissions.map((submission, index) => (
                        <button
                          key={submission.id}
                          onClick={() => setSelectedSubmission(submission)}
                          className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
                            selectedSubmission?.id === submission.id
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
                      <div className="mt-6 w-full rounded-lg border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                          Script Analysis
                        </h3>
                        <div className="flex items-center justify-center p-8 text-center">
                          <div className="max-w-md">
                            <p className="text-gray-500 dark:text-gray-400">
                              AI-powered script analysis is currently unavailable. Our team is working on implementing this feature.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                          {selectedSubmission?.title}
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400">Writer</p>
                            <p className="text-sm sm:text-base text-white">{selectedSubmission?.writer}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-400">Overall Score</p>
                            <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--accent-primary))]">
                              {selectedSubmission?.score}
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
              ) : selectedProject ? (
                // No submissions visual indicator
                <div className="bg-black/30 border border-gray-700/50 rounded-lg p-8 text-center">
                  <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    This project hasn't received any submissions yet. Writers will be able to submit their scripts once they discover your project.
                  </p>
                  <Link
                    href={`/producer/projects/${selectedProject.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    Manage Project
                  </Link>
                </div>
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

        {/* Submission Details */}
        {selectedSubmission && (
          <div className="p-6 bg-black border border-white/10 rounded-lg">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-white">{selectedSubmission.title}</h2>
              {selectedSubmission.status === 'pending' && (
                <button
                  onClick={() => handleAcceptSubmission(selectedSubmission.id)}
                  className="px-4 py-2 bg-[rgb(var(--accent-primary))] rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Accept Submission
                </button>
              )}
              {selectedSubmission.status === 'accepted' && (
                <div className="px-4 py-2 bg-green-900/30 text-green-400 rounded-lg text-sm font-medium flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  Accepted
                </div>
              )}
            </div>
            
            {/* Rest of the submission details */}
            
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}