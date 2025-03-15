'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

// Define interfaces for data types
interface MetricData {
  value: number | string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface OverviewData {
  activeProjects: MetricData;
  totalSubmissions: MetricData;
  averageScore: MetricData;
  totalInvestment: MetricData;
}

interface ProjectPerformance {
  id: number | string;
  title: string;
  submissions: number;
  averageScore: number;
  topScore: number;
  status: string;
  trend: 'up' | 'down' | 'neutral';
  topSubmissions: TopSubmission[];
}

interface TopSubmission {
  id: number | string;
  title: string;
  writer: string;
  submittedDate: string;
  score: number;
  status: string;
  genre: string;
  synopsis: string;
  strengths: string[];
  feedback: string;
}

interface GenrePopularity {
  genre: string;
  count: number;
  averageScore: number;
}

interface WriterEngagement {
  month: string;
  count: number;
}

interface TopWriter {
  id: number | string;
  name: string;
  submissions: number;
  averageScore: number;
  acceptanceRate: string;
  earnings: string;
}

interface AnalyticsData {
  overview: OverviewData;
  projectPerformance: ProjectPerformance[];
  genrePopularity: GenrePopularity[];
  writerEngagement: WriterEngagement[];
  topWriters: TopWriter[];
}

// Initialize with empty data
const emptyAnalyticsData: AnalyticsData = {
  overview: {
    activeProjects: { value: 0, change: '0', trend: 'neutral' },
    totalSubmissions: { value: 0, change: '0', trend: 'neutral' },
    averageScore: { value: '0', change: '0', trend: 'neutral' },
    totalInvestment: { value: '$0', change: '$0', trend: 'neutral' },
  },
  projectPerformance: [{
    id: 0,
    title: '',
    submissions: 0,
    averageScore: 0,
    topScore: 0,
    status: '',
    trend: 'neutral',
    topSubmissions: []
  }],
  genrePopularity: [],
  writerEngagement: [],
  topWriters: [],
};

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(emptyAnalyticsData);
  const [timeframe, setTimeframe] = useState('6m');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
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
        // const response = await fetch(`/api/producer/analytics?timeframe=${timeframe}`, { headers });
        // if (response.ok) {
        //   const data = await response.json();
        //   setAnalyticsData(data);
        // } else {
        //   setError('Failed to load analytics data');
        // }
        
        // Temporary empty data until the API is implemented
        setAnalyticsData(emptyAnalyticsData);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [timeframe]);
  
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
      <div className="p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your projects' performance and submission analytics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Object.entries(analyticsData.overview).map(([key, data]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  {data.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="text-xl md:text-2xl font-bold text-white mb-2">
                  {data.value}
                </div>
                <div className={`text-sm ${data.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {data.change} this month
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-4 md:p-6">
              <h3 className="text-xl font-bold text-white mb-6">Project Performance</h3>
              <div className="space-y-4">
                {analyticsData.projectPerformance.map((project) => (
                  <button
                    key={project.id}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      project.id === analyticsData.projectPerformance[0].id
                        ? 'bg-[rgb(var(--accent-primary))]/10 border border-[rgb(var(--accent-primary))]/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">{project.title}</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-gray-400">
                            <DocumentTextIcon className="inline-block w-4 h-4 mr-1" />
                            {project.submissions} Submissions
                          </span>
                          <span className="text-gray-400">
                            <StarIcon className="inline-block w-4 h-4 mr-1" />
                            Avg. Score: {project.averageScore}
                          </span>
                        </div>
                      </div>
                      <div className={`text-sm ${project.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {project.trend === 'up' ? (
                          <ArrowTrendingUpIcon className="inline-block w-4 h-4 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="inline-block w-4 h-4 mr-1" />
                        )}
                        Top Score: {project.topScore}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Top Submissions</h3>
                <div className="text-sm text-gray-400">
                  {analyticsData.projectPerformance[0].submissions} total submissions
                </div>
              </div>
              <div className="space-y-6">
                {analyticsData.projectPerformance[0].topSubmissions.map((submission) => (
                  <div key={submission.id} className="p-4 bg-white/5 rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{submission.title}</h4>
                        <p className="text-sm text-gray-400">by {submission.writer}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-bold text-[rgb(var(--accent-primary))]">
                          {submission.score}
                        </div>
                        <div className="text-sm text-gray-400">
                          {submission.submittedDate}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-300">
                      {submission.synopsis}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {submission.strengths.map((strength, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-[rgb(var(--accent-primary))]/10 text-[rgb(var(--accent-primary))]"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <p className="text-sm text-gray-400">
                        <span className="text-[rgb(var(--accent-primary))] font-semibold">Feedback:</span>{' '}
                        {submission.feedback}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                        View Details
                      </button>
                      <button className="px-3 py-1 text-sm rounded-lg bg-[rgb(var(--accent-primary))]/10 hover:bg-[rgb(var(--accent-primary))]/20 text-[rgb(var(--accent-primary))] transition-colors">
                        Contact Writer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Submission Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-white">Submission Trends</h3>
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      timeframe === period
                        ? 'bg-[rgb(var(--accent-primary))] text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 md:h-80">
              {/* Chart placeholder - you would implement the actual chart here */}
              <div className="w-full h-full bg-gradient-to-r from-[rgb(var(--accent-primary))]/10 to-[rgb(var(--accent-secondary))]/10 rounded-lg" />
            </div>
          </div>
        </motion.div>

        {/* Genre Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="p-4 md:p-6">
            <h3 className="text-xl font-bold text-white mb-6">Genre Distribution</h3>
            <div className="h-64 md:h-80">
              {/* Chart placeholder - you would implement the actual chart here */}
              <div className="w-full h-full bg-gradient-to-r from-[rgb(var(--accent-primary))]/10 to-[rgb(var(--accent-secondary))]/10 rounded-lg" />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
} 