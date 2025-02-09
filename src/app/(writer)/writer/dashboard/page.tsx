'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

// Mock data
const stats = [
  {
    name: 'Active Submissions',
    value: '12',
    change: '+2 this week',
    trend: 'up',
    icon: DocumentTextIcon,
    color: 'from-purple-500 to-indigo-500',
  },
  {
    name: 'Average AI Score',
    value: '87',
    change: '+3 points',
    trend: 'up',
    icon: ChartBarIcon,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Total Earnings',
    value: '$45K',
    change: '+$5K this month',
    trend: 'up',
    icon: CurrencyDollarIcon,
    color: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Success Rate',
    value: '92%',
    change: '+5% improvement',
    trend: 'up',
    icon: StarIcon,
    color: 'from-pink-500 to-rose-500',
  },
];

const activeSubmissions = [
  {
    id: 1,
    title: 'Beyond the Stars',
    project: 'Sci-Fi Adventure',
    studio: 'Universal Pictures',
    submitted: '2024-03-15',
    status: 'Under Review',
    rank: 1,
    score: 94,
    analysis: {
      plotStrength: 92,
      characterDevelopment: 95,
      marketPotential: 88,
      uniqueness: 94,
      pacing: 91,
      dialogue: 93,
      structure: 90,
      theme: 92,
    },
  },
  {
    id: 2,
    title: 'The Last Detective',
    project: 'Crime Thriller',
    studio: 'Netflix Studios',
    submitted: '2024-03-10',
    status: 'Shortlisted',
    rank: 2,
    score: 91,
    analysis: {
      plotStrength: 89,
      characterDevelopment: 92,
      marketPotential: 90,
      uniqueness: 91,
      pacing: 88,
      dialogue: 90,
      structure: 89,
      theme: 91,
    },
  },
  {
    id: 3,
    title: 'City Lights',
    project: 'Drama Series',
    studio: 'HBO Max',
    submitted: '2024-03-05',
    status: 'In Competition',
    rank: 3,
    score: 88,
    analysis: {
      plotStrength: 87,
      characterDevelopment: 89,
      marketPotential: 88,
      uniqueness: 87,
      pacing: 88,
      dialogue: 86,
      structure: 88,
      theme: 87,
    },
  },
];

const availableProjects = [
  {
    id: 1,
    title: 'Sci-Fi Feature Film',
    studio: 'Paramount Pictures',
    budget: '$100K-200K',
    deadline: '2024-04-15',
    submissions: 12,
    requirements: ['Original concept', 'High-concept premise', 'Commercial appeal'],
  },
  {
    id: 2,
    title: 'Drama Series Pilot',
    studio: 'Amazon Studios',
    budget: '$50K-100K',
    deadline: '2024-04-20',
    submissions: 8,
    requirements: ['Character-driven', 'Social relevance', 'Series potential'],
  },
  {
    id: 3,
    title: 'Thriller Feature',
    studio: 'A24',
    budget: '$75K-150K',
    deadline: '2024-04-25',
    submissions: 15,
    requirements: ['Unique perspective', 'Plot twists', 'Genre innovation'],
  },
];

export default function WriterDashboard() {
  const [selectedSubmission, setSelectedSubmission] = useState(activeSubmissions[0]);

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
            >
              Welcome back, <span className="gradient-text">Sarah</span> 👋
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
                  <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500">{stat.change}</span>
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`} />
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Active Submissions</h2>
              <div className="space-y-6">
                {activeSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
                    <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-gray-400 gap-2">
                      <span>{submission.studio}</span>
                      <span>Submitted: {submission.submitted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* AI Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">AI Analysis</h2>
              {selectedSubmission && (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-2">{selectedSubmission.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-400">{selectedSubmission.project}</p>
                  </div>
                  <div className="aspect-square w-full max-w-md mx-auto">
                    <AIAnalysisChart analysisData={selectedSubmission.analysis} />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Available Projects */}
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
                className="text-sm text-[rgb(var(--accent-primary))] hover:underline"
              >
                View All Projects →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {availableProjects.map((project) => (
                <div key={project.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-2">{project.title}</h3>
                  <p className="text-xs sm:text-sm text-[rgb(var(--accent-primary))] mb-4">{project.studio}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      <span>{project.budget}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                      <ClockIcon className="w-4 h-4" />
                      <span>Due: {project.deadline}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/writer/projects/${project.id}`}
                      className="text-xs sm:text-sm text-[rgb(var(--accent-primary))] hover:underline text-center sm:text-left"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/writer/submit?project=${project.id}`}
                      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Submit Script
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
} 