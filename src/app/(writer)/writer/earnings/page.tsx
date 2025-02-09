'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

// Mock data for earnings
const earningsData = {
  overview: {
    totalEarnings: {
      value: '$45,000',
      change: '+$5,000',
      trend: 'up',
    },
    pendingPayments: {
      value: '$15,000',
      change: '+$2,000',
      trend: 'up',
    },
    averageBounty: {
      value: '$25,000',
      change: '+$1,500',
      trend: 'up',
    },
    successRate: {
      value: '75%',
      change: '+5%',
      trend: 'up',
    },
  },
  recentTransactions: [
    {
      id: 1,
      title: 'The Last Frontier',
      studio: 'Paramount Pictures',
      amount: '$45,000',
      date: '2024-03-15',
      status: 'Completed',
      type: 'Bounty Payment',
    },
    {
      id: 2,
      title: 'Dark Corridors',
      studio: 'A24',
      amount: '$35,000',
      date: '2024-03-10',
      status: 'Pending',
      type: 'Bounty Payment',
    },
    {
      id: 3,
      title: 'Echoes of Tomorrow',
      studio: 'Netflix',
      amount: '$30,000',
      date: '2024-03-05',
      status: 'Processing',
      type: 'Bounty Payment',
    },
  ],
  monthlyEarnings: {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    earnings: [25000, 30000, 28000, 35000, 40000, 45000],
  },
  paymentMethods: [
    {
      id: 1,
      type: 'Bank Account',
      name: '****1234',
      isDefault: true,
    },
    {
      id: 2,
      type: 'Crypto Wallet',
      name: '0x1234...5678',
      isDefault: false,
    },
  ],
};

const statusColors = {
  'Completed': 'text-green-400',
  'Pending': 'text-yellow-400',
  'Processing': 'text-blue-400',
  'Failed': 'text-red-400',
};

export default function Earnings() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m');

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Earnings</h1>
          <p className="text-gray-400">Track your bounties and payment history</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(earningsData.overview).map(([key, data]) => (
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
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
              <div className="space-y-4">
                {earningsData.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold text-white mb-1">{transaction.title}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">{transaction.studio}</span>
                        <span className="text-gray-400">{transaction.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white mb-1">{transaction.amount}</div>
                      <div className={`text-sm ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Payment Methods</h3>
                <button className="button-primary text-sm">Add New</button>
              </div>
              <div className="space-y-4">
                {earningsData.paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <BanknotesIcon className="w-6 h-6 text-[rgb(var(--accent-primary))]" />
                      <div>
                        <h4 className="font-semibold text-white">{method.type}</h4>
                        <p className="text-sm text-gray-400">{method.name}</p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <span className="text-sm text-[rgb(var(--accent-primary))]">Default</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Earnings History</h3>
              <div className="flex gap-2">
                {['1m', '3m', '6m', '1y'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedTimeframe(period)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedTimeframe === period
                        ? 'bg-[rgb(var(--accent-primary))] text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              {/* Here you would render a line chart using the data from earningsData.monthlyEarnings */}
              {/* For now, showing a placeholder gradient bar */}
              <div className="w-full h-full bg-gradient-to-r from-[rgb(var(--accent-primary))]/10 to-[rgb(var(--accent-secondary))]/10 rounded-lg" />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
} 