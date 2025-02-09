'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  StarIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

// Mock data for submissions
const submissions = [
  {
    id: 1,
    title: 'The Last Frontier',
    project: 'Sci-Fi Feature Film',
    studio: 'Paramount Pictures',
    submittedDate: '2024-03-15',
    status: 'Under Review',
    rank: 2,
    score: 92,
    analysis: {
      plotStrength: 90,
      characterDevelopment: 88,
      marketPotential: 94,
      uniqueness: 92,
      pacing: 91,
      dialogue: 89,
      structure: 93,
      theme: 91
    },
    feedback: 'Strong concept with excellent market potential. Character arcs could be developed further.',
    bounty: '$150K',
  },
  {
    id: 2,
    title: 'Echoes of Tomorrow',
    project: 'Drama Series Pilot',
    studio: 'HBO Max',
    submittedDate: '2024-03-10',
    status: 'Selected',
    rank: 1,
    score: 95,
    analysis: {
      plotStrength: 95,
      characterDevelopment: 96,
      marketPotential: 92,
      uniqueness: 94,
      pacing: 93,
      dialogue: 96,
      structure: 94,
      theme: 95
    },
    feedback: 'Exceptional character work and dialogue. Compelling narrative structure.',
    bounty: '$75K',
  },
  {
    id: 3,
    title: 'Dark Corridors',
    project: 'Thriller Feature',
    studio: 'A24',
    submittedDate: '2024-03-05',
    status: 'Not Selected',
    rank: 4,
    score: 85,
    analysis: {
      plotStrength: 84,
      characterDevelopment: 86,
      marketPotential: 83,
      uniqueness: 85,
      pacing: 87,
      dialogue: 84,
      structure: 85,
      theme: 86
    },
    feedback: 'Intriguing premise but needs more unique elements to stand out.',
    bounty: '$100K',
  },
];

const statusColors = {
  'Under Review': 'text-yellow-400',
  'Selected': 'text-green-400',
  'Not Selected': 'text-red-400',
};

const statusIcons = {
  'Under Review': ArrowPathIcon,
  'Selected': CheckCircleIcon,
  'Not Selected': XCircleIcon,
};

export default function MySubmissions() {
  const [selectedSubmission, setSelectedSubmission] = useState(submissions[0]);
  const [filter, setFilter] = useState('all');

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Submissions</h1>
            <p className="text-gray-400">Track and manage your script submissions</p>
          </div>
          <Link
            href="/writer/projects"
            className="button-primary inline-flex items-center gap-2"
          >
            <DocumentTextIcon className="w-5 h-5" />
            Submit New Script
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'Under Review', 'Selected', 'Not Selected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === status
                  ? 'bg-[rgb(var(--accent-primary))] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>

        {/* Submissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions List */}
          <div className="space-y-4">
            {submissions
              .filter(sub => filter === 'all' || sub.status === filter)
              .map((submission) => {
                const StatusIcon = statusIcons[submission.status as keyof typeof statusIcons];
                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`card cursor-pointer ${
                      selectedSubmission.id === submission.id ? 'border-[rgb(var(--accent-primary))]' : ''
                    }`}
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{submission.title}</h3>
                          <p className="text-sm text-[rgb(var(--accent-primary))] mb-2">{submission.project}</p>
                          <p className="text-sm text-gray-400">{submission.studio}</p>
                        </div>
                        <div className={`flex items-center gap-1 ${statusColors[submission.status as keyof typeof statusColors]}`}>
                          <StatusIcon className="w-5 h-5" />
                          <span>{submission.status}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <ClockIcon className="w-5 h-5" />
                          <span>Submitted: {submission.submittedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <StarIcon className="w-5 h-5" />
                          <span>Score: {submission.score}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <ArrowTrendingUpIcon className="w-5 h-5" />
                          <span>Rank: #{submission.rank}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <ChartBarIcon className="w-5 h-5" />
                          <span>Bounty: {submission.bounty}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
            })}
          </div>

          {/* Submission Details */}
          {selectedSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* AI Analysis */}
              <div className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6">AI Analysis</h3>
                  <AIAnalysisChart analysisData={selectedSubmission.analysis} className="mb-6" />
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Feedback</h4>
                    <p className="text-gray-400">{selectedSubmission.feedback}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Link
                  href={`/writer/scripts/${selectedSubmission.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105"
                >
                  <EyeIcon className="w-5 h-5" />
                  View Full Script
                </Link>
                <Link
                  href={`/writer/submissions/${selectedSubmission.id}/revise`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  Edit & Resubmit
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 