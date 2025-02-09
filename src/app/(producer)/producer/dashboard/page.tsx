'use client';

import { useState } from 'react';
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
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

// Mock data
const stats = [
  {
    name: 'Active Projects',
    value: '12',
    change: '+2 this week',
    trend: 'up',
    icon: FolderIcon,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Total Submissions',
    value: '158',
    change: '+23 new',
    trend: 'up',
    icon: DocumentTextIcon,
    color: 'from-violet-500 to-purple-500',
  },
  {
    name: 'Average AI Score',
    value: '87.5',
    change: '+1.2 points',
    trend: 'up',
    icon: ChartBarIcon,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Total Investment',
    value: '$125K',
    change: '+$15K this month',
    trend: 'up',
    icon: CurrencyDollarIcon,
    color: 'from-amber-500 to-orange-500',
  },
];

const activeProjects = [
  {
    id: 1,
    title: 'Sci-Fi Adventure',
    budget: '$50K-100K',
    submissions: 45,
    status: 'Ranking Phase',
    deadline: '2024-04-01',
    topScore: 94,
    recentSubmissions: [
      { id: 1, title: 'Beyond the Stars', writer: 'Sarah Johnson', score: 94, analysis: {
        plotStrength: 92,
        characterDevelopment: 95,
        marketPotential: 88,
        uniqueness: 94,
        pacing: 91,
        dialogue: 93,
        structure: 90,
        theme: 92
      }},
      { id: 2, title: 'Quantum Dreams', writer: 'Michael Chen', score: 91, analysis: {
        plotStrength: 89,
        characterDevelopment: 92,
        marketPotential: 90,
        uniqueness: 91,
        pacing: 88,
        dialogue: 90,
        structure: 89,
        theme: 91
      }},
      { id: 3, title: 'The Last Frontier', writer: 'Emily Parker', score: 89, analysis: {
        plotStrength: 88,
        characterDevelopment: 90,
        marketPotential: 87,
        uniqueness: 89,
        pacing: 86,
        dialogue: 88,
        structure: 87,
        theme: 89
      }},
    ],
  },
  {
    id: 2,
    title: 'Crime Thriller',
    budget: '$75K-150K',
    submissions: 32,
    status: 'Review Phase',
    deadline: '2024-04-10',
    topScore: 92,
    recentSubmissions: [
      { id: 1, title: 'Silent Witness', writer: 'James Wilson', score: 92, analysis: {
        plotStrength: 93,
        characterDevelopment: 91,
        marketPotential: 94,
        uniqueness: 90,
        pacing: 92,
        dialogue: 91,
        structure: 93,
        theme: 90
      }},
      { id: 2, title: 'Dark Corridors', writer: 'Anna Lee', score: 90, analysis: {
        plotStrength: 89,
        characterDevelopment: 91,
        marketPotential: 90,
        uniqueness: 88,
        pacing: 91,
        dialogue: 89,
        structure: 90,
        theme: 89
      }},
      { id: 3, title: 'The Last Detective', writer: 'Robert Chang', score: 88, analysis: {
        plotStrength: 87,
        characterDevelopment: 89,
        marketPotential: 88,
        uniqueness: 87,
        pacing: 88,
        dialogue: 86,
        structure: 88,
        theme: 87
      }},
    ],
  },
];

const topWriters = [
  {
    id: 1,
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    genre: 'Sci-Fi',
    rating: 4.9,
    submissions: 12,
    acceptanceRate: '92%',
    earnings: '$45K'
  },
  {
    id: 2,
    name: 'Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    genre: 'Drama',
    rating: 4.8,
    submissions: 15,
    acceptanceRate: '87%',
    earnings: '$38K'
  },
  {
    id: 3,
    name: 'Emily Parker',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    genre: 'Thriller',
    rating: 4.7,
    submissions: 10,
    acceptanceRate: '85%',
    earnings: '$32K'
  },
];

export default function ProducerDashboard() {
  const [selectedProject, setSelectedProject] = useState(activeProjects[0]);
  const [selectedSubmission, setSelectedSubmission] = useState(selectedProject.recentSubmissions[0]);

  return (
    <DashboardLayout userType="producer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
            >
              Welcome back, <span className="gradient-text">Universal Studios</span> 🎬
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-base text-gray-400"
            >
              Discover exceptional scripts and connect with talented writers.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4"
          >
            <Link
              href="/producer/writers"
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-all hover:scale-105"
            >
              <UserGroupIcon className="w-5 h-5" />
              <span>Find Writers</span>
            </Link>
            <Link
              href="/producer/projects/new"
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105 shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Project</span>
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
                  <ArrowRightIcon className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500">{stat.change}</span>
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`} />
            </motion.div>
          ))}
        </div>

        {/* Projects and Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
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
                {activeProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      setSelectedSubmission(project.recentSubmissions[0]);
                    }}
                    className={`p-4 rounded-lg border ${
                      selectedProject.id === project.id
                        ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/5'
                        : 'border-white/10 hover:border-white/20'
                    } cursor-pointer transition-all`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                        <p className="text-gray-400 text-sm">Budget: {project.budget}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[rgb(var(--accent-primary))] font-semibold">{project.status}</p>
                        <p className="text-sm text-gray-400">Due: {project.deadline}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Submissions</p>
                        <p className="text-base sm:text-lg font-semibold text-white">{project.submissions}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Top Score</p>
                        <p className="text-base sm:text-lg font-semibold text-white">{project.topScore}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs sm:text-sm text-gray-400">Top Scripts</p>
                        <p className="text-base sm:text-lg font-semibold text-white">{project.recentSubmissions.length}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top Writers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="card p-6">
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
              
              <div className="space-y-6">
                {topWriters.map((writer) => (
                  <div key={writer.id} className="flex items-center gap-4 group hover:bg-white/5 p-3 rounded-lg transition-colors">
                    <div className="relative w-12 h-12">
                      <Image
                        src={writer.avatar}
                        alt={writer.name}
                        fill
                        className="rounded-full object-cover"
                      />
                      {writer.rating >= 4.8 && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                          <SparklesIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold group-hover:text-[rgb(var(--accent-primary))] transition-colors">
                        {writer.name}
                      </h3>
                      <p className="text-sm text-gray-400">{writer.genre} Specialist</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[rgb(var(--accent-primary))] font-semibold">{writer.acceptanceRate}</p>
                      <p className="text-sm text-gray-400">{writer.earnings} earned</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Submission Analysis */}
        {selectedProject && selectedSubmission && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Top Submissions for {selectedProject.title}
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
                        selectedSubmission.id === submission.id
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
                  <AIAnalysisChart analysisData={selectedSubmission.analysis} />
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                      {selectedSubmission.title}
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Writer</p>
                        <p className="text-sm sm:text-base text-white">{selectedSubmission.writer}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Overall Score</p>
                        <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--accent-primary))]">
                          {selectedSubmission.score}
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
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
} 