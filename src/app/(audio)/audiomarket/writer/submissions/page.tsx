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
  SparklesIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

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
  id: string | number;
  title: string;
  project?: string;
  project_id?: string | number;
  score: number;
  rank?: number;
  status?: string;
  submitted?: string;
  submittedDate?: string;
  producer_name?: string;
  writer_name?: string;
  writer_id?: string;
  writer_avatar?: string;
  ai_score?: number | { overall_score?: number; analysis?: any };
  content?: string;
  created_at?: string;
  _id?: string | number;
  analysis?: Analysis;
  feedback?: string;
  bounty?: string;
  statusDetails?: {
    stage: number;
    feedback?: string;
    reviewDate?: string;
    expectedCompletionDate?: string;
    reviewerName?: string;
  };
}

const statusColors = {
  'Under Review': 'text-yellow-400',
  'Selected': 'text-green-400',
  'Not Selected': 'text-red-400',
  'Revision Requested': 'text-orange-400',
  'In Selection': 'text-blue-400',
};

const statusIcons = {
  'Under Review': ArrowPathIcon,
  'Selected': CheckCircleIcon,
  'Not Selected': XCircleIcon,
  'Revision Requested': DocumentTextIcon,
  'In Selection': StarIcon,
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
        
        if (!walletAddress) {
          console.error('No wallet address available');
          setError('Authentication required. Please sign in.');
          setIsLoading(false);
          return;
        }
        
        headers['x-wallet-address'] = walletAddress.toLowerCase();
        headers['Cache-Control'] = 'no-cache';
        
        console.log('Fetching submissions for writer with wallet:', walletAddress);
        
        // Use the main submissions endpoint which already handles writer filtering
        const response = await fetch('/api/submissions?writer=true', { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to load submissions:', errorText);
          
          // Try to parse error response
          try {
            const errorData = JSON.parse(errorText);
            setError(`Failed to load submissions: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch (parseError) {
            setError('Failed to load submissions: Server error');
          }
          
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log('Submissions data received:', data);
        
        if (!data.submissions || !Array.isArray(data.submissions)) {
          console.error('Invalid submissions data format:', data);
          setSubmissions([]);
          setIsLoading(false);
          return;
        }
        
        // Process and enhance submission data - use the same approach as in dashboard
        const enhancedSubmissions = (data.submissions || []).map((submission: any, index: number) => {
          return {
            ...submission,
            id: submission.id || submission._id,
            title: submission.title || 'Untitled Submission',
            project: submission.project_title || 'Unknown Project',
            submittedDate: submission.created_at 
              ? new Date(submission.created_at).toLocaleDateString() 
              : 'Unknown date',
            submitted: submission.created_at 
              ? new Date(submission.created_at).toLocaleDateString() 
              : 'Recently',
            status: submission.status || 'Under Review',
            statusDetails: {
              stage: submission.review_stage || 1,
              feedback: submission.feedback || null,
              reviewDate: submission.review_date 
                ? new Date(submission.review_date).toLocaleDateString() 
                : null,
              expectedCompletionDate: submission.expected_completion_date 
                ? new Date(submission.expected_completion_date).toLocaleDateString() 
                : null
            },
            rank: index + 1,
            score: typeof submission.score === 'number' 
              ? submission.score 
              : (typeof submission.ai_score === 'number' 
                  ? submission.ai_score 
                  : (typeof submission.ai_score === 'object' && submission.ai_score?.overall_score 
                      ? submission.ai_score.overall_score 
                      : 75)),
            analysis: submission.analysis || null,
            feedback: submission.feedback || null,
            bounty: submission.bounty_amount 
              ? `$${submission.bounty_amount}` 
              : null,
            producer_name: submission.producer_name || 'Unknown Producer'
          };
        });
        
        console.log(`Processed ${enhancedSubmissions.length} submissions`);
        setSubmissions(enhancedSubmissions);
        
        if (enhancedSubmissions.length > 0) {
          setSelectedSubmission(enhancedSubmissions[0]);
        }
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
            href="/audiomarket/writer/projects"
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
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((submission) => {
                const StatusIcon = statusIcons[submission.status as keyof typeof statusIcons] || DocumentTextIcon;
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
                          <p className="text-sm text-gray-400">Producer: {submission.producer_name}</p>
                        </div>
                        <div className={`flex items-center gap-1 ${
                          statusColors[(submission.status || 'Under Review') as keyof typeof statusColors] || 'text-gray-400'
                        }`}>
                          <StatusIcon className="w-5 h-5" />
                          <span>{submission.status}</span>
                        </div>
                      </div>
                      
                      {/* Status Timeline */}
                      {submission.statusDetails && (
                        <div className="mb-4 relative">
                          <div className="h-1 bg-white/10 relative w-full rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 absolute left-0 top-0"
                              style={{ width: `${Math.min(submission.statusDetails.stage * 25, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Submitted</span>
                            <span>Initial Review</span>
                            <span>Producer Review</span>
                            <span>Decision</span>
                          </div>
                        </div>
                      )}
                      
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
                          <span>Rank: #{submission.rank || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <ChartBarIcon className="w-5 h-5" />
                          <span>Bounty: {submission.bounty || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Show Expected Review Date if available */}
                      {submission.statusDetails?.expectedCompletionDate && submission.status === 'Under Review' && (
                        <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm">
                          <p className="text-gray-300">
                            <span className="text-[rgb(var(--accent-primary))]">Expected review completion:</span> {submission.statusDetails.expectedCompletionDate}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="lg:col-span-2 text-center py-10 border border-dashed border-white/10 rounded-xl bg-black/20">
                <DocumentTextIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  You haven't submitted any scripts yet. Browse available projects and submit your
                  creative work to start your journey.
                </p>
                
                <Link
                  href="/audiomarket/writer/projects"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Explore Projects
                </Link>
              </div>
            )}
          </div>

          {/* Submission Details */}
          {filteredSubmissions.length > 0 && selectedSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Details Card */}
              <div className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Submission Status</h3>
                  
                  {/* Detailed Status Timeline */}
                  <div className="mb-6">
                    <div className="relative">
                      {/* Timeline Track */}
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-white/10"></div>
                      
                      {/* Timeline Steps */}
                      <div className="space-y-8 relative">
                        {/* Step 1: Submitted */}
                        <div className="flex items-start gap-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 0 ? 'bg-[rgb(var(--accent-primary))]' : 'bg-white/10'}`}>
                            <CheckCircleIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">Submission Received</h4>
                            <p className="text-sm text-gray-400">{selectedSubmission.submittedDate}</p>
                            <p className="text-sm text-gray-300 mt-1">Your script has been successfully uploaded to our platform.</p>
                          </div>
                        </div>
                        
                        {/* Step 2: Initial Review */}
                        <div className="flex items-start gap-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 1 ? 'bg-[rgb(var(--accent-primary))]' : 'bg-white/10'}`}>
                            {selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 1 ? (
                              <CheckCircleIcon className="w-4 h-4 text-white" />
                            ) : (
                              <span className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">Initial Review</h4>
                            <p className="text-sm text-gray-400">{selectedSubmission.statusDetails?.reviewDate || 'Pending'}</p>
                            <p className="text-sm text-gray-300 mt-1">
                              {selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 1 
                                ? "Our team has completed the initial review of your script." 
                                : "Our team will evaluate your script for quality and project fit."}
                            </p>
                          </div>
                        </div>
                        
                        {/* Step 3: Producer Review */}
                        <div className="flex items-start gap-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 2 ? 'bg-[rgb(var(--accent-primary))]' : 'bg-white/10'}`}>
                            {selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 2 ? (
                              <CheckCircleIcon className="w-4 h-4 text-white" />
                            ) : (
                              <span className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">Producer Review</h4>
                            <p className="text-sm text-gray-400">{selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 2 ? 'Completed' : 'Pending'}</p>
                            <p className="text-sm text-gray-300 mt-1">
                              {selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 2 
                                ? `Producer has reviewed your submission.` 
                                : "The producer will evaluate your script against their project requirements."}
                            </p>
                          </div>
                        </div>
                        
                        {/* Step 4: Final Decision */}
                        <div className="flex items-start gap-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 3 ? (selectedSubmission.status === 'Selected' ? 'bg-green-500' : 'bg-red-500') : 'bg-white/10'}`}>
                            {selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 3 ? (
                              selectedSubmission.status === 'Selected' ? (
                                <CheckCircleIcon className="w-4 h-4 text-white" />
                              ) : (
                                <XCircleIcon className="w-4 h-4 text-white" />
                              )
                            ) : (
                              <span className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">Final Decision</h4>
                            <p className="text-sm text-gray-400">{selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 3 ? 'Completed' : 'Pending'}</p>
                            <p className="text-sm text-gray-300 mt-1">
                              {selectedSubmission.statusDetails && selectedSubmission.statusDetails.stage >= 3 
                                ? (selectedSubmission.status === 'Selected' 
                                    ? "Congratulations! Your script has been selected." 
                                    : "Thank you for your submission. The producer has selected another script.")
                                : "The final selection decision will be made by the producer."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expected Completion */}
                  {selectedSubmission.statusDetails?.expectedCompletionDate && selectedSubmission.status === 'Under Review' && (
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Review Timeline</h4>
                      <p className="text-gray-300">
                        <span className="text-[rgb(var(--accent-primary))] font-medium">Expected completion:</span> {selectedSubmission.statusDetails.expectedCompletionDate}
                      </p>
                      {selectedSubmission.statusDetails?.reviewerName && (
                        <p className="text-gray-300 mt-1">
                          <span className="text-[rgb(var(--accent-primary))] font-medium">Reviewer:</span> {selectedSubmission.statusDetails.reviewerName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* AI Analysis */}
              <div className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Script Analysis
                  </h3>
                  <div className="flex items-center justify-center p-8 text-center">
                    <div className="max-w-md">
                      <p className="text-gray-300">
                        AI-powered script analysis is currently unavailable. Our team is working on implementing this feature.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Link
                  href={`/audiomarket/writer/scripts/${selectedSubmission.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105"
                >
                  <EyeIcon className="w-5 h-5" />
                  View Full Script
                </Link>
                <Link
                  href={`/audiomarket/writer/submissions/${selectedSubmission.id}/revise`}
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