'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

// Mock data for budget
const budgetData = {
  overview: {
    totalBudget: {
      value: '$500K',
      allocated: '$325K',
      remaining: '$175K',
    },
    activeBounties: {
      value: '$325K',
      change: '+$50K',
      trend: 'up',
    },
    completedPayments: {
      value: '$175K',
      change: '+$25K',
      trend: 'up',
    },
    averageBounty: {
      value: '$25K',
      change: '+$2K',
      trend: 'up',
    },
  },
  recentTransactions: [
    {
      id: 1,
      title: 'The Last Frontier',
      writer: 'Sarah Johnson',
      amount: '$45K',
      status: 'Completed',
      date: '2024-03-15',
      type: 'Bounty Payment',
    },
    {
      id: 2,
      title: 'Dark Corridors',
      writer: 'Anna Lee',
      amount: '$35K',
      status: 'Pending',
      date: '2024-03-14',
      type: 'Bounty Payment',
    },
    {
      id: 3,
      title: 'Q2 Budget Allocation',
      amount: '$150K',
      status: 'Completed',
      date: '2024-03-10',
      type: 'Budget Deposit',
    },
  ],
  activeBounties: [
    {
      id: 1,
      title: 'Sci-Fi Feature Film',
      amount: '$150K',
      submissions: 24,
      deadline: '2024-04-15',
      allocated: '2024-03-01',
    },
    {
      id: 2,
      title: 'Drama Series Pilot',
      amount: '$75K',
      submissions: 18,
      deadline: '2024-04-20',
      allocated: '2024-03-05',
    },
    {
      id: 3,
      title: 'Thriller Feature',
      amount: '$100K',
      submissions: 15,
      deadline: '2024-04-25',
      allocated: '2024-03-10',
    },
  ],
  budgetHistory: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    allocated: [200000, 250000, 300000, 325000, 375000, 500000],
    spent: [150000, 200000, 225000, 275000, 300000, 325000],
  },
};

const statusColors = {
  'Completed': 'text-green-400',
  'Pending': 'text-yellow-400',
  'Failed': 'text-red-400',
};

const statusIcons = {
  'Completed': CheckCircleIcon,
  'Pending': ClockIcon,
  'Failed': XCircleIcon,
};

export default function Budget() {
  return (
    <DashboardLayout userType="producer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Budget</h1>
          <p className="text-gray-400">Track your budget allocation and bounty payments</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(budgetData.overview).map(([key, data]) => (
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
                  {'trend' in data && (
                    data.trend === 'up' ? (
                      <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
                    )
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {data.value}
                </div>
                {'allocated' in data ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Allocated</span>
                      <span className="text-white">{data.allocated}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remaining</span>
                      <span className="text-white">{data.remaining}</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]"
                        style={{ width: `${(parseInt(data.allocated.replace(/\D/g, '')) / parseInt(data.value.replace(/\D/g, '')) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  'change' in data && (
                    <div className={`text-sm ${data.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {data.change} this month
                    </div>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Bounties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">Active Bounties</h3>
              <div className="space-y-6">
                {budgetData.activeBounties.map((bounty) => (
                  <div key={bounty.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{bounty.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="w-4 h-4" />
                          {bounty.submissions} submissions
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          Due: {bounty.deadline}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{bounty.amount}</div>
                      <div className="text-sm text-gray-400">Allocated: {bounty.allocated}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
              <div className="space-y-4">
                {budgetData.recentTransactions.map((transaction) => {
                  const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons];
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{transaction.title}</h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-400">{transaction.type}</span>
                          {transaction.writer && (
                            <span className="text-gray-400">to {transaction.writer}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{transaction.amount}</div>
                        <div className="flex items-center gap-1 text-sm justify-end">
                          <StatusIcon className={`w-4 h-4 ${statusColors[transaction.status as keyof typeof statusColors]}`} />
                          <span className={statusColors[transaction.status as keyof typeof statusColors]}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Budget History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Budget History</h3>
            <div className="h-64">
              {/* Here you would render a line chart using the data from budgetData.budgetHistory */}
              {/* For now, showing a placeholder gradient bar */}
              <div className="w-full h-full bg-gradient-to-r from-[rgb(var(--accent-primary))]/10 to-[rgb(var(--accent-secondary))]/10 rounded-lg" />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
} 