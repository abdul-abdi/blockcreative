'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  FunnelIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

// Mock data for active projects
const projects = [
  {
    id: 1,
    title: 'Sci-Fi Feature Film',
    description: 'Looking for an original sci-fi concept that explores the intersection of artificial intelligence and human consciousness.',
    budget: '$100K-200K',
    deadline: '2024-04-15',
    totalSubmissions: 24,
    status: 'Active',
    topSubmissions: [
      { id: 1, title: 'Beyond the Stars', writer: 'Sarah Johnson', score: 94 },
      { id: 2, title: 'Digital Dreams', writer: 'Michael Chen', score: 92 },
      { id: 3, title: 'Neural Network', writer: 'Alex Kim', score: 89 },
    ],
    requirements: [
      'Original concept',
      'High-concept premise',
      'Commercial appeal',
      'Strong character arcs',
    ],
    genre: 'Science Fiction',
    type: 'Feature Film',
    progress: 75,
  },
  {
    id: 2,
    title: 'Drama Series Pilot',
    description: 'Seeking a compelling drama series pilot that explores contemporary social issues through a unique lens.',
    budget: '$50K-100K',
    deadline: '2024-04-20',
    totalSubmissions: 18,
    status: 'Review',
    topSubmissions: [
      { id: 4, title: 'City Lights', writer: 'Emma Thompson', score: 91 },
      { id: 5, title: 'Breaking Point', writer: 'David Rodriguez', score: 88 },
      { id: 6, title: 'The Divide', writer: 'Lisa Chen', score: 86 },
    ],
    requirements: [
      'Character-driven',
      'Social relevance',
      'Series potential',
      'Diverse perspectives',
    ],
    genre: 'Drama',
    type: 'TV Pilot',
    progress: 60,
  },
  {
    id: 3,
    title: 'Thriller Feature',
    description: 'Looking for a unique psychological thriller that pushes genre boundaries and delivers unexpected twists.',
    budget: '$75K-150K',
    deadline: '2024-04-25',
    totalSubmissions: 15,
    status: 'Shortlisting',
    topSubmissions: [
      { id: 7, title: 'Dark Corridors', writer: 'James Wilson', score: 90 },
      { id: 8, title: 'The Echo Chamber', writer: 'Anna Lee', score: 87 },
      { id: 9, title: 'Mirrors', writer: 'Robert Chang', score: 85 },
    ],
    requirements: [
      'Unique perspective',
      'Plot twists',
      'Genre innovation',
      'Psychological elements',
    ],
    genre: 'Thriller',
    type: 'Feature Film',
    progress: 40,
  },
];

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');

  return (
    <DashboardLayout userType="producer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Active Projects</h1>
            <p className="text-gray-400">Manage your ongoing projects and review submissions</p>
          </div>
          <Link
            href="/producer/projects/new"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all hover:scale-105 shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Project</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="review">In Review</option>
            <option value="shortlisting">Shortlisting</option>
          </select>
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option value="all">All Genres</option>
            <option value="scifi">Science Fiction</option>
            <option value="drama">Drama</option>
            <option value="thriller">Thriller</option>
          </select>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects List */}
          <div className="space-y-4">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card cursor-pointer ${
                  selectedProject.id === project.id ? 'border-[rgb(var(--accent-primary))]' : ''
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                      <p className="text-sm text-gray-400">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      project.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                      project.status === 'Review' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CurrencyDollarIcon className="w-5 h-5" />
                      <span>{project.budget}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <ClockIcon className="w-5 h-5" />
                      <span>Due: {project.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <DocumentTextIcon className="w-5 h-5" />
                      <span>{project.totalSubmissions} submissions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <ChartBarIcon className="w-5 h-5" />
                      <span>{project.progress}% complete</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Project Details */}
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Top Submissions */}
              <div className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Top Submissions</h3>
                  <div className="space-y-4">
                    {selectedProject.topSubmissions.map((submission, index) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            #{index + 1}
                          </span>
                          <div>
                            <h4 className="font-semibold text-white">{submission.title}</h4>
                            <p className="text-sm text-gray-400">{submission.writer}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-[rgb(var(--accent-primary))]/20 text-[rgb(var(--accent-primary))] rounded-full">
                          {submission.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Project Requirements */}
              <div className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Project Requirements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProject.requirements.map((requirement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-white/5 rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-[rgb(var(--accent-primary))]" />
                        <span className="text-gray-300">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-4">
                <Link
                  href={`/producer/projects/${selectedProject.id}/submissions`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  View All Submissions
                </Link>
                <Link
                  href={`/producer/projects/${selectedProject.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Edit Project
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 