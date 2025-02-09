'use client';

import { useState } from 'react';
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

// Mock data for performance metrics
const performanceData = {
  overview: {
    aiScore: {
      value: '8.5',
      change: '+0.3',
      trend: 'up',
    },
    successRate: {
      value: '75%',
      change: '+5%',
      trend: 'up',
    },
    totalSubmissions: {
      value: '24',
      change: '+3',
      trend: 'up',
    },
    averageResponse: {
      value: '4.2 days',
      change: '-0.5',
      trend: 'up',
    },
  },
  aiAnalysis: {
    overall: 8.5,
    categories: [
      { name: 'Plot Structure', score: 8.7 },
      { name: 'Character Development', score: 8.3 },
      { name: 'Dialogue', score: 8.6 },
      { name: 'Pacing', score: 8.2 },
      { name: 'Theme Development', score: 8.4 },
      { name: 'Market Potential', score: 8.8 },
    ],
  },
  recentSubmissions: [
    {
      id: 1,
      title: 'The Last Frontier',
      studio: 'Universal Pictures',
      submitted: '2024-03-15',
      status: 'Selected',
      aiScore: 8.9,
      bounty: '$45K',
    },
    {
      id: 2,
      title: 'Dark Corridors',
      studio: 'Paramount',
      submitted: '2024-03-10',
      status: 'Under Review',
      aiScore: 8.7,
      bounty: '$35K',
    },
    {
      id: 3,
      title: 'Echoes of Tomorrow',
      studio: 'Netflix',
      submitted: '2024-03-05',
      status: 'Not Selected',
      aiScore: 8.2,
      bounty: '$30K',
    },
  ],
  genrePerformance: [
    { genre: 'Sci-Fi', score: 8.8, submissions: 8 },
    { genre: 'Drama', score: 8.4, submissions: 6 },
    { genre: 'Thriller', score: 8.6, submissions: 5 },
    { genre: 'Action', score: 8.2, submissions: 5 },
  ],
  performanceHistory: {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    aiScores: [8.0, 8.1, 8.3, 8.2, 8.4, 8.5],
    successRates: [65, 68, 70, 72, 73, 75],
  },
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
          {Object.entries(performanceData.overview).map(([key, data]) => (
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
                    {performanceData.aiAnalysis.overall}
                  </div>
                  <div className="text-gray-400">Overall Score</div>
                </div>
                <div className="space-y-4">
                  {performanceData.aiAnalysis.categories.map((category) => (
                    <div key={category.name}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">{category.name}</span>
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
              {performanceData.recentSubmissions.map((submission) => {
                const StatusIcon = statusIcons[submission.status as keyof typeof statusIcons];
                return (
                  <div key={submission.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{submission.title}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">{submission.studio}</span>
                        <span className="text-gray-400">Submitted: {submission.submitted}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-semibold">{submission.aiScore}</span>
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
              {/* Here you would render a line chart using the data from performanceData.performanceHistory */}
              {/* For now, showing a placeholder gradient bar */}
              <div className="w-full h-full bg-gradient-to-r from-[rgb(var(--accent-primary))]/10 to-[rgb(var(--accent-secondary))]/10 rounded-lg" />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
} 