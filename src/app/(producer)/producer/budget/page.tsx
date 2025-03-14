'use client';

import { useState, useEffect } from 'react';
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

// Define interfaces for data types
interface BudgetOverview {
  totalBudget: {
    value: string;
    allocated: string;
    remaining: string;
  };
  activeBounties: {
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  };
  completedPayments: {
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  };
  averageBounty: {
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  };
}

interface Transaction {
  id: number | string;
  title: string;
  writer: string;
  amount: string;
  status: 'Completed' | 'Pending' | 'Failed';
  date: string;
  type: string;
}

interface BudgetAllocation {
  category: string;
  allocated: string;
  used: string;
  remaining: string;
  percentage: number;
}

interface BudgetData {
  overview: BudgetOverview;
  recentTransactions: Transaction[];
  budgetAllocations: BudgetAllocation[];
}

// Initialize with empty data
const emptyBudgetData: BudgetData = {
  overview: {
    totalBudget: {
      value: '$0',
      allocated: '$0',
      remaining: '$0',
    },
    activeBounties: {
      value: '$0',
      change: '$0',
      trend: 'neutral',
    },
    completedPayments: {
      value: '$0',
      change: '$0',
      trend: 'neutral',
    },
    averageBounty: {
      value: '$0',
      change: '$0',
      trend: 'neutral',
    },
  },
  recentTransactions: [],
  budgetAllocations: [],
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
  const [budgetData, setBudgetData] = useState<BudgetData>(emptyBudgetData);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch budget data from API
  useEffect(() => {
    const fetchBudgetData = async () => {
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
        // const response = await fetch('/api/producer/budget', { headers });
        // if (response.ok) {
        //   const data = await response.json();
        //   setBudgetData(data);
        // } else {
        //   setError('Failed to load budget data');
        // }
        
        // Temporary empty data until the API is implemented
        setBudgetData(emptyBudgetData);
        
      } catch (error) {
        console.error('Error fetching budget data:', error);
        setError('Failed to load budget data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBudgetData();
  }, []);
  
  if (isLoading) {
    return (
      <DashboardLayout userType="producer">
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredTransactions = budgetData.recentTransactions.filter((transaction) => {
    if (filter === 'all') return true;
    return transaction.status.toLowerCase() === filter.toLowerCase();
  });

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
                {budgetData.budgetAllocations.map((allocation) => (
                  <div key={allocation.category} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{allocation.category}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="w-4 h-4" />
                          {allocation.used} used
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          Remaining: {allocation.remaining}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{allocation.allocated}</div>
                      <div className="text-sm text-gray-400">Allocated: {allocation.allocated}</div>
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
                {filteredTransactions.map((transaction) => {
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