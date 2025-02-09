'use client';

import { useState } from 'react';
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

// Mock data for analytics
const analyticsData = {
  overview: {
    activeProjects: {
      value: 12,
      change: '+2',
      trend: 'up',
    },
    totalSubmissions: {
      value: 156,
      change: '+23',
      trend: 'up',
    },
    averageScore: {
      value: '85.5',
      change: '+2.3',
      trend: 'up',
    },
    totalInvestment: {
      value: '$450K',
      change: '+$50K',
      trend: 'up',
    },
  },
  projectPerformance: [
    {
      id: 1,
      title: 'Sci-Fi Feature Film',
      submissions: 45,
      averageScore: 88,
      topScore: 94,
      status: 'Active',
      trend: 'up',
      topSubmissions: [
        {
          id: 1,
          title: 'The Last Frontier',
          writer: 'Sarah Johnson',
          submittedDate: '2024-03-15',
          score: 94,
          status: 'Under Review',
          genre: 'Sci-Fi',
          synopsis: 'A groundbreaking exploration of human consciousness in deep space.',
          strengths: ['Original concept', 'Strong character arcs', 'Visual potential'],
          feedback: 'Exceptional world-building with compelling character dynamics.',
        },
        {
          id: 2,
          title: 'Beyond the Stars',
          writer: 'Michael Chen',
          submittedDate: '2024-03-14',
          score: 92,
          status: 'Under Review',
          genre: 'Sci-Fi',
          synopsis: 'A journey through parallel universes reveals humanity\'s true potential.',
          strengths: ['Unique premise', 'Scientific accuracy', 'Emotional depth'],
          feedback: 'Innovative take on multiverse theory with strong emotional core.',
        },
        {
          id: 3,
          title: 'Quantum Dreams',
          writer: 'Emily Parker',
          submittedDate: '2024-03-13',
          score: 89,
          status: 'Under Review',
          genre: 'Sci-Fi',
          synopsis: 'When dreams become a gateway to quantum realms.',
          strengths: ['Creative concept', 'Engaging plot', 'Commercial appeal'],
          feedback: 'Fresh perspective on quantum mechanics with mainstream appeal.',
        }
      ]
    },
    {
      id: 2,
      title: 'Drama Series Pilot',
      submissions: 32,
      averageScore: 85,
      topScore: 92,
      status: 'Active',
      trend: 'up',
      topSubmissions: [
        {
          id: 1,
          title: 'Breaking Point',
          writer: 'Anna Lee',
          submittedDate: '2024-03-15',
          score: 92,
          status: 'Under Review',
          genre: 'Drama',
          synopsis: 'A family\'s struggle with addiction and redemption.',
          strengths: ['Powerful dialogue', 'Complex characters', 'Timely themes'],
          feedback: 'Emotionally resonant with excellent character development.',
        },
        {
          id: 2,
          title: 'City Lights',
          writer: 'David Wilson',
          submittedDate: '2024-03-14',
          score: 88,
          status: 'Under Review',
          genre: 'Drama',
          synopsis: 'Intersecting lives in a city that never sleeps.',
          strengths: ['Ensemble cast', 'Rich storytelling', 'Social commentary'],
          feedback: 'Well-crafted narrative with strong potential for character arcs.',
        }
      ]
    },
    {
      id: 3,
      title: 'Action Thriller',
      submissions: 28,
      averageScore: 82,
      topScore: 89,
      status: 'Completed',
      trend: 'down',
      topSubmissions: [
        {
          id: 1,
          title: 'Dark Corridors',
          writer: 'James Martinez',
          submittedDate: '2024-03-10',
          score: 89,
          status: 'Selected',
          genre: 'Thriller',
          synopsis: 'A detective uncovers a conspiracy that goes to the highest levels.',
          strengths: ['Fast-paced action', 'Plot twists', 'Strong antagonist'],
          feedback: 'Gripping narrative with excellent pacing and suspense.',
        }
      ]
    }
  ],
  genreDistribution: {
    labels: ['Action', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller', 'Horror'],
    data: [30, 25, 20, 15, 7, 3],
  },
  submissionTrends: {
    daily: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [12, 15, 18, 14, 16, 10, 8],
    },
    weekly: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [45, 52, 48, 56],
    },
    monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [180, 195, 210, 205, 220, 235],
    },
  },
};

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('weekly');
  const [selectedProject, setSelectedProject] = useState(analyticsData.projectPerformance[0]);

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
                    onClick={() => setSelectedProject(project)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedProject.id === project.id
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
                  {selectedProject.submissions} total submissions
                </div>
              </div>
              <div className="space-y-6">
                {selectedProject.topSubmissions.map((submission) => (
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