'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

interface FormData {
  title: string;
  description: string;
  genre: string;
  type: string;
  budget: string;
  deadline: string;
  requirements: string[];
  aiPreferences: {
    plotStrength: number;
    characterDevelopment: number;
    marketPotential: number;
    uniqueness: number;
    pacing: number;
    dialogue: number;
    structure: number;
    theme: number;
  };
}

const initialFormData: FormData = {
  title: '',
  description: '',
  genre: '',
  type: '',
  budget: '',
  deadline: '',
  requirements: [],
  aiPreferences: {
    plotStrength: 80,
    characterDevelopment: 80,
    marketPotential: 80,
    uniqueness: 80,
    pacing: 80,
    dialogue: 80,
    structure: 80,
    theme: 80,
  },
};

const steps = [
  { id: 'details', title: 'Project Details' },
  { id: 'requirements', title: 'Requirements' },
  { id: 'preferences', title: 'AI Preferences' },
  { id: 'review', title: 'Review & Post' },
];

export default function NewProject() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [newRequirement, setNewRequirement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Redirect to projects page
    router.push('/producer/projects');
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateAiPreference = (field: keyof FormData['aiPreferences'], value: number) => {
    setFormData(prev => ({
      ...prev,
      aiPreferences: {
        ...prev.aiPreferences,
        [field]: value,
      },
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white h-32"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Genre
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => updateFormData('genre', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  required
                >
                  <option value="">Select Genre</option>
                  <option value="action">Action</option>
                  <option value="comedy">Comedy</option>
                  <option value="drama">Drama</option>
                  <option value="scifi">Science Fiction</option>
                  <option value="thriller">Thriller</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => updateFormData('type', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="feature">Feature Film</option>
                  <option value="series">TV Series</option>
                  <option value="pilot">TV Pilot</option>
                  <option value="short">Short Film</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget Range
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => updateFormData('budget', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  required
                >
                  <option value="">Select Budget</option>
                  <option value="10k-25k">$10K - $25K</option>
                  <option value="25k-50k">$25K - $50K</option>
                  <option value="50k-100k">$50K - $100K</option>
                  <option value="100k-250k">$100K - $250K</option>
                  <option value="250k+">$250K+</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Submission Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => updateFormData('deadline', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  required
                />
              </div>
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add Requirements
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                  placeholder="Enter a requirement"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                />
                <button
                  onClick={addRequirement}
                  className="button-secondary whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {formData.requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <span className="text-white">{req}</span>
                  <button
                    onClick={() => removeRequirement(index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-8">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-6">
                AI Evaluation Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(formData.aiPreferences).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">
                        {key.split(/(?=[A-Z])/).join(' ')}
                      </label>
                      <span className="text-[rgb(var(--accent-primary))]">
                        {value}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => updateAiPreference(key as keyof FormData['aiPreferences'], parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-6">
                Preview
              </h3>
              <AIAnalysisChart analysisData={formData.aiPreferences} />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Project Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-gray-400">Title</dt>
                    <dd className="text-white">{formData.title}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Genre</dt>
                    <dd className="text-white">{formData.genre}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Type</dt>
                    <dd className="text-white">{formData.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Budget</dt>
                    <dd className="text-white">{formData.budget}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Deadline</dt>
                    <dd className="text-white">{formData.deadline}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
                <ul className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-primary))]" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4">AI Preferences</h3>
              <AIAnalysisChart analysisData={formData.aiPreferences} />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="producer">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-4">Create New Project</h1>
          <p className="text-gray-400">
            Define your project requirements and find the perfect script.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 text-center relative ${
                  index === steps.length - 1 ? 'flex-grow-0' : ''
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStep
                        ? 'bg-[rgb(var(--accent-primary))] text-white'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        index < currentStep
                          ? 'bg-[rgb(var(--accent-primary))]'
                          : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
                <div
                  className={`mt-2 text-sm ${
                    index <= currentStep ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {renderStepContent()}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="mt-12 flex justify-between">
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="button-secondary"
            disabled={currentStep === 0}
          >
            Previous
          </button>
          
          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="button-primary"
            >
              {isSubmitting ? 'Posting Project...' : 'Post Project'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={
                (currentStep === 0 && (!formData.title || !formData.genre || !formData.type || !formData.budget || !formData.deadline)) ||
                (currentStep === 1 && formData.requirements.length === 0)
              }
              className="button-primary"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 