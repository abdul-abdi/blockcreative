'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisChart from '@/components/AIAnalysisChart';

interface ScriptData {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  targetAudience: string;
  file: File | null;
  aiAnalysis: {
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

const initialScriptData: ScriptData = {
  title: '',
  logline: '',
  synopsis: '',
  genre: '',
  targetAudience: '',
  file: null,
  aiAnalysis: {
    plotStrength: 0,
    characterDevelopment: 0,
    marketPotential: 0,
    uniqueness: 0,
    pacing: 0,
    dialogue: 0,
    structure: 0,
    theme: 0,
  },
};

const steps = [
  { id: 'details', title: 'Script Details' },
  { id: 'upload', title: 'Upload Script' },
  { id: 'analysis', title: 'AI Analysis' },
  { id: 'review', title: 'Review & Submit' },
];

export default function SubmitScript() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [scriptData, setScriptData] = useState<ScriptData>(initialScriptData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.fdx') || file.name.endsWith('.fountain')) {
        setScriptData(prev => ({ ...prev, file }));
        setUploadError('');
      } else {
        setUploadError('Please upload a PDF, Final Draft, or Fountain file.');
      }
    }
  };

  const analyzeScript = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Prepare headers with wallet address if available
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (walletAddress) {
        headers['x-wallet-address'] = walletAddress;
      }
      
      // TODO: Replace with actual API endpoint once available
      // For now, we'll just use empty scores
      // const formData = new FormData();
      // formData.append('title', scriptData.title);
      // formData.append('logline', scriptData.logline);
      // formData.append('synopsis', scriptData.synopsis);
      // formData.append('genre', scriptData.genre);
      // formData.append('targetAudience', scriptData.targetAudience);
      // if (scriptData.file) {
      //   formData.append('file', scriptData.file);
      // }
      // 
      // const response = await fetch('/api/writer/analyze-script', {
      //   method: 'POST',
      //   body: formData,
      //   headers,
      // });
      // 
      // if (response.ok) {
      //   const data = await response.json();
      //   setScriptData(prev => ({
      //     ...prev,
      //     aiAnalysis: data.analysis,
      //   }));
      // } else {
      //   throw new Error('Failed to analyze script');
      // }
      
      // Temporary empty analysis scores until API is implemented
      setScriptData(prev => ({
        ...prev,
        aiAnalysis: {
          plotStrength: 0,
          characterDevelopment: 0,
          marketPotential: 0,
          uniqueness: 0,
          pacing: 0,
          dialogue: 0,
          structure: 0,
          theme: 0,
        },
      }));
    } catch (error) {
      console.error('Error analyzing script:', error);
      setError('Failed to analyze script. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [scriptData.title, scriptData.logline, scriptData.synopsis, scriptData.genre, scriptData.targetAudience, scriptData.file]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Prepare headers with wallet address if available
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (walletAddress) {
        headers['x-wallet-address'] = walletAddress;
      }
      
      // TODO: Replace with actual API endpoint once available
      // const formData = new FormData();
      // formData.append('title', scriptData.title);
      // formData.append('logline', scriptData.logline);
      // formData.append('synopsis', scriptData.synopsis);
      // formData.append('genre', scriptData.genre);
      // formData.append('targetAudience', scriptData.targetAudience);
      // if (scriptData.file) {
      //   formData.append('file', scriptData.file);
      // }
      // formData.append('aiAnalysis', JSON.stringify(scriptData.aiAnalysis));
      // 
      // const response = await fetch('/api/writer/submit-script', {
      //   method: 'POST',
      //   body: formData,
      //   headers,
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to submit script');
      // }
      
      // For now, just redirect to submissions page
      router.push('/writer/submissions');
    } catch (error) {
      console.error('Error submitting script:', error);
      setError('Failed to submit script. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Script Title
              </label>
              <input
                type="text"
                value={scriptData.title}
                onChange={(e) => setScriptData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Logline
              </label>
              <textarea
                value={scriptData.logline}
                onChange={(e) => setScriptData(prev => ({ ...prev, logline: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white h-20"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Synopsis
              </label>
              <textarea
                value={scriptData.synopsis}
                onChange={(e) => setScriptData(prev => ({ ...prev, synopsis: e.target.value }))}
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
                  value={scriptData.genre}
                  onChange={(e) => setScriptData(prev => ({ ...prev, genre: e.target.value }))}
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
                  Target Audience
                </label>
                <select
                  value={scriptData.targetAudience}
                  onChange={(e) => setScriptData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  required
                >
                  <option value="">Select Target Audience</option>
                  <option value="general">General Audience</option>
                  <option value="young-adult">Young Adult</option>
                  <option value="adult">Adult</option>
                  <option value="family">Family</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="card p-8 border-2 border-dashed border-white/10 rounded-lg text-center">
              <div className="mb-4">
                <CloudArrowUpIcon className="w-12 h-12 mx-auto text-gray-400" />
              </div>
              
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-medium text-white">
                  Upload Your Script
                </h3>
                <p className="text-sm text-gray-400">
                  Supported formats: PDF, Final Draft (.fdx), Fountain
                </p>
              </div>
              
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.fdx,.fountain"
                className="hidden"
                id="script-upload"
              />
              
              <label
                htmlFor="script-upload"
                className="button-primary cursor-pointer inline-block"
              >
                Choose File
              </label>
              
              {scriptData.file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-300">
                  <DocumentTextIcon className="w-4 h-4" />
                  {scriptData.file.name}
                  <button
                    onClick={() => setScriptData(prev => ({ ...prev, file: null }))}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {uploadError && (
                <p className="mt-4 text-sm text-red-400">
                  {uploadError}
                </p>
              )}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-8">
            {isAnalyzing ? (
              <div className="text-center py-12">
                <ChartBarIcon className="w-12 h-12 mx-auto text-[rgb(var(--accent-primary))] mb-4 animate-pulse" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Analyzing Your Script
                </h3>
                <p className="text-sm text-gray-400">
                  Our AI is reviewing your script for quality and market potential...
                </p>
              </div>
            ) : (
              <>
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-white mb-6">
                    AI Analysis Results
                  </h3>
                  <AIAnalysisChart analysisData={scriptData.aiAnalysis} />
                </div>
                
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Detailed Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(scriptData.aiAnalysis).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-300">
                          {key.split(/(?=[A-Z])/).join(' ')}
                        </span>
                        <span className="text-[rgb(var(--accent-primary))] font-medium">
                          {value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Script Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-gray-400">Title</dt>
                    <dd className="text-white">{scriptData.title}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Genre</dt>
                    <dd className="text-white">{scriptData.genre}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Target Audience</dt>
                    <dd className="text-white">{scriptData.targetAudience}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Logline</dt>
                    <dd className="text-white">{scriptData.logline}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Uploaded File</h3>
                {scriptData.file && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <DocumentTextIcon className="w-6 h-6" />
                    <span>{scriptData.file.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4">AI Analysis</h3>
              <AIAnalysisChart analysisData={scriptData.aiAnalysis} />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="writer">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-4">Submit Your Script</h1>
          <p className="text-gray-400">
            Share your story with producers and get AI-powered feedback.
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
              {isSubmitting ? 'Submitting Script...' : 'Submit Script'}
            </button>
          ) : (
            <button
              onClick={() => {
                if (currentStep === 1 && !scriptData.file) {
                  setUploadError('Please upload a script file before continuing.');
                  return;
                }
                
                if (currentStep === 2) {
                  analyzeScript();
                }
                
                setCurrentStep(prev => prev + 1);
              }}
              disabled={
                (currentStep === 0 && (!scriptData.title || !scriptData.logline || !scriptData.synopsis || !scriptData.genre || !scriptData.targetAudience)) ||
                (currentStep === 1 && !scriptData.file) ||
                (currentStep === 2 && isAnalyzing)
              }
              className="button-primary"
            >
              {currentStep === 2 && !scriptData.aiAnalysis.plotStrength ? 'Analyze Script' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 