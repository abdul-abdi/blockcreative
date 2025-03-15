'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  DocumentTextIcon,
  StarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

// Define interfaces for data types
interface PerformanceMetric {
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface CategoryScore {
  category: string;
  score: number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface AIAnalysis {
  overallScore: number;
  categoryScores: CategoryScore[];
}

interface SubmissionHistory {
  id: number | string;
  title: string;
  studio: string;
  date: string;
  score: number;
  status: string;
  bounty: string;
}

interface GenrePerformance {
  genre: string;
  score: number;
  submissions: number;
}

interface PerformanceData {
  aiScore: PerformanceMetric;
  successRate: PerformanceMetric;
  totalSubmissions: PerformanceMetric;
  averageResponse: PerformanceMetric;
  aiAnalysis: AIAnalysis;
  submissionHistory: SubmissionHistory[];
  genrePerformance: GenrePerformance[];
}

// Initialize with empty data
const emptyPerformanceData: PerformanceData = {
  aiScore: {
    value: 0,
    change: '0',
    trend: 'neutral',
  },
  successRate: {
    value: '0%',
    change: '0%',
    trend: 'neutral',
  },
  totalSubmissions: {
    value: 0,
    change: '0',
    trend: 'neutral',
  },
  averageResponse: {
    value: '0 days',
    change: '0',
    trend: 'neutral',
  },
  aiAnalysis: {
    overallScore: 0,
    categoryScores: [],
  },
  submissionHistory: [],
  genrePerformance: [],
};

const statusColors = {
  'Selected': 'text-green-400',
  'Under Review': 'text-yellow-400',
  'Not Selected': 'text-red-400',
};

const statusIcons = {
  'Selected': CheckCircleIcon,
  'Under Review': ClockIcon,
  'Not Selected': XCircleIcon,
};

export default function Performance() {
  const [performanceData, setPerformanceData] = useState<PerformanceData>(emptyPerformanceData);
  const [timeframe, setTimeframe] = useState('6m');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch performance data from API
  useEffect(() => {
    const fetchPerformanceData = async () => {
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
        // const response = await fetch(`/api/writer/performance?timeframe=${timeframe}`, { headers });
        // if (response.ok) {
        //   const data = await response.json();
        //   setPerformanceData(data);
        // } else {
        //   setError('Failed to load performance data');
        // }
        
        // Temporary empty data until the API is implemented
        setPerformanceData(emptyPerformanceData);
        
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setError('Failed to load performance data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [timeframe]);
  
  if (isLoading) {
    return (
      <DashboardLayout userType="writer">
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Performance</h1>
          <p className="text-gray-400">Track your writing performance and AI analysis scores</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(performanceData).map(([key, data]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  {data.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-2">
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
          {/* AI Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">AI Analysis</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-4xl font-bold text-white">
                    {performanceData.aiAnalysis.overallScore}
                  </div>
                  <div className="text-gray-400">Overall Score</div>
                </div>
                <div className="space-y-4">
                  {performanceData.aiAnalysis.categoryScores.map((category) => (
                    <div key={category.category}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">{category.category}</span>
                        <span className="text-white">{category.score}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]"
                          style={{ width: `${(category.score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Genre Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">Genre Performance</h3>
              <div className="space-y-6">
                {performanceData.genrePerformance.map((genre) => (
                  <div key={genre.genre} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{genre.genre}</h4>
                      <div className="text-sm text-gray-400">
                        {genre.submissions} submissions
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-white">{genre.score}</div>
                      <div className="flex-1">
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]"
                            style={{ width: `${(genre.score / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Submissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Recent Submissions</h3>
            <div className="space-y-4">
              {performanceData.submissionHistory.map((submission) => {
                const StatusIcon = statusIcons[submission.status as keyof typeof statusIcons];
                return (
                  <div key={submission.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{submission.title}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">{submission.studio}</span>
                        <span className="text-gray-400">Submitted: {submission.date}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-semibold">{submission.score}</span>
                      </div>
                      <div className="text-lg font-bold text-white">{submission.bounty}</div>
                      <div className="flex items-center gap-1 text-sm justify-end">
                        <StatusIcon className={`w-4 h-4 ${statusColors[submission.status as keyof typeof statusColors]}`} />
                        <span className={statusColors[submission.status as keyof typeof statusColors]}>
                          {submission.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Performance History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Performance History</h3>
            <div className="h-64">
              <div className="w-full h-full bg-gradient-to-r from-[rgb(var(--accent-primary))]/10 to-[rgb(var(--accent-secondary))]/10 rounded-lg" />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
} 