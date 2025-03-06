'use client';

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AIAnalysisData {
  plotStrength: number;
  characterDevelopment: number;
  marketPotential: number;
  uniqueness: number;
  pacing: number;
  dialogue: number;
  structure: number;
  theme: number;
}

interface TimelineData {
  timestamps: string[];
  scores: number[];
}

interface Props {
  analysisData?: AIAnalysisData;
  timelineData?: TimelineData;
  showTimeline?: boolean;
  className?: string;
}

// Default analysis data for when no data is provided
const defaultAnalysisData: AIAnalysisData = {
  plotStrength: 85,
  characterDevelopment: 78,
  marketPotential: 82,
  uniqueness: 88,
  pacing: 75,
  dialogue: 80,
  structure: 76,
  theme: 85
};

// Default timeline data
const defaultTimelineData: TimelineData = {
  timestamps: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  scores: [65, 72, 78, 75, 82, 85]
};

const AIAnalysisChart = ({ 
  analysisData = defaultAnalysisData,
  timelineData = defaultTimelineData, 
  showTimeline = false, 
  className = '' 
}: Props) => {
  // Radar chart data
  const radarData = {
    labels: [
      'Plot Strength',
      'Character Development',
      'Market Potential',
      'Uniqueness',
      'Pacing',
      'Dialogue',
      'Structure',
      'Theme',
    ],
    datasets: [
      {
        label: 'Script Analysis',
        data: [
          analysisData.plotStrength,
          analysisData.characterDevelopment,
          analysisData.marketPotential,
          analysisData.uniqueness,
          analysisData.pacing,
          analysisData.dialogue,
          analysisData.structure,
          analysisData.theme,
        ],
        backgroundColor: 'rgba(64, 224, 208, 0.2)',
        borderColor: 'rgb(64, 224, 208)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(64, 224, 208)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(64, 224, 208)',
      },
    ],
  };

  // Radar chart options
  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: 'rgba(255, 255, 255, 0.5)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: false,
  };

  // Timeline chart data
  const timelineChartData = timelineData ? {
    labels: timelineData.timestamps,
    datasets: [
      {
        label: 'AI Score Trend',
        data: timelineData.scores,
        borderColor: 'rgb(64, 224, 208)',
        backgroundColor: 'rgba(64, 224, 208, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  // Timeline chart options
  const timelineOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: false,
  };

  // Bar chart data for key metrics
  const barData = {
    labels: ['Plot', 'Characters', 'Market', 'Uniqueness'],
    datasets: [
      {
        data: [
          analysisData.plotStrength,
          analysisData.characterDevelopment,
          analysisData.marketPotential,
          analysisData.uniqueness,
        ],
        backgroundColor: [
          'rgba(64, 224, 208, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderRadius: 4,
      },
    ],
  };

  // Bar chart options
  const barOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">
            Comprehensive Analysis
          </h3>
          <div className="h-[300px]">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">
            Key Metrics
          </h3>
          <div className="h-[300px]">
            <Bar data={barData} options={barOptions} />
          </div>
        </motion.div>
      </div>

      {/* Timeline Chart */}
      {showTimeline && timelineData && timelineChartData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">
            Score Timeline
          </h3>
          <div className="h-[300px]">
            <Line data={timelineChartData} options={timelineOptions} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIAnalysisChart; 