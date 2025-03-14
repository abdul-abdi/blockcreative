'use client';

import { useState, useEffect } from 'react';
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

// Define interfaces for data types
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
  project: string;
  studio: string;
  submittedDate: string;
  status: string;
  rank?: number;
  score: number;
  analysis?: Analysis;
  feedback?: string;
  bounty?: string;
}

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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch submissions from API
  useEffect(() => {
    const fetchSubmissions = async () => {
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
        // const response = await fetch('/api/writer/submissions', { headers });
        // if (response.ok) {
        //   const data = await response.json();
        //   setSubmissions(data.submissions);
        //   if (data.submissions.length > 0) {
        //     setSelectedSubmission(data.submissions[0]);
        //   }
        // } else {
        //   setError('Failed to load submissions');
        // }
        
        // Temporary empty data until the API is implemented
        setSubmissions([]);
        setSelectedSubmission(null);
        
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError('Failed to load submissions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubmissions();
  }, []);
  
  // Filter submissions based on activeFilter
  const filteredSubmissions = submissions.filter(submission => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'review' && submission.status === 'Under Review') return true;
    if (activeFilter === 'selected' && submission.status === 'Selected') return true;
    if (activeFilter === 'rejected' && submission.status === 'Rejected') return true;
    return false;
  });

  const handleSubmissionClick = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

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
              onClick={() => setActiveFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeFilter === status
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
            {filteredSubmissions.map((submission) => {
              const StatusIcon = statusIcons[submission.status as keyof typeof statusIcons];
              return (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card cursor-pointer ${
                    selectedSubmission?.id === submission.id ? 'border-[rgb(var(--accent-primary))]' : ''
                  }`}
                  onClick={() => handleSubmissionClick(submission)}
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