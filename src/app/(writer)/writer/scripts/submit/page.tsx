'use client';

import { useState, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  CheckCircleIcon,
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
    overallScore: number;
  } | null;
}

const initialScriptData: ScriptData = {
  title: '',
  logline: '',
  synopsis: '',
  genre: '',
  targetAudience: '',
  file: null,
  aiAnalysis: null,
};

const steps = [
  { id: 'details', title: 'Script Details' },
  { id: 'upload', title: 'Upload Script' },
  { id: 'analysis', title: 'AI Analysis' },
  { id: 'review', title: 'Review & Submit' },
];

const SubmitScriptContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [currentStep, setCurrentStep] = useState(0);
  const [scriptData, setScriptData] = useState<ScriptData>(initialScriptData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScriptData(prev => ({ ...prev, file }));
    }
  };

  const analyzeScript = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setScriptData(prev => ({
      ...prev,
      aiAnalysis: {
        plotStrength: Math.floor(Math.random() * 20) + 80,
        characterDevelopment: Math.floor(Math.random() * 20) + 80,
        marketPotential: Math.floor(Math.random() * 20) + 80,
        uniqueness: Math.floor(Math.random() * 20) + 80,
        pacing: Math.floor(Math.random() * 20) + 80,
        dialogue: Math.floor(Math.random() * 20) + 80,
        structure: Math.floor(Math.random() * 20) + 80,
        theme: Math.floor(Math.random() * 20) + 80,
        overallScore: Math.floor(Math.random() * 20) + 80,
      }
    }));
    
    setIsAnalyzing(false);
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Redirect to submissions page
    router.push('/writer/submissions');
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
              <input
                type="text"
                value={scriptData.logline}
                onChange={(e) => setScriptData(prev => ({ ...prev, logline: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
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
            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center">
              {scriptData.file ? (
                <div className="space-y-4">
                  <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto" />
                  <div>
                    <p className="text-white font-medium">{scriptData.file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(scriptData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setScriptData(prev => ({ ...prev, file: null }))}
                    className="text-sm text-[rgb(var(--accent-primary))] hover:underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-white font-medium">Drop your script file here</p>
                    <p className="text-sm text-gray-400">
                      or click to browse (PDF, Final Draft, or Fountain)
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.fdx,.fountain"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        );
      
      case 2:
        return scriptData.aiAnalysis ? (
          <div className="space-y-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold gradient-text">Overall Score</h3>
                <div className="text-3xl font-bold text-[rgb(var(--accent-primary))]">
                  {scriptData.aiAnalysis.overallScore}
                </div>
              </div>
              
              <AIAnalysisChart analysisData={scriptData.aiAnalysis} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-white font-medium">Analyzing your script...</p>
            <p className="text-sm text-gray-400">This may take a few moments</p>
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
                    <dt className="text-sm text-gray-400">File</dt>
                    <dd className="text-white">{scriptData.file?.name}</dd>
                  </div>
                </dl>
              </div>
              
              {scriptData.aiAnalysis && (
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-white mb-4">AI Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Overall Score</span>
                      <span className="text-2xl font-bold text-[rgb(var(--accent-primary))]">
                        {scriptData.aiAnalysis.overallScore}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-400">Plot Strength</span>
                        <div className="text-white">{scriptData.aiAnalysis.plotStrength}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Characters</span>
                        <div className="text-white">{scriptData.aiAnalysis.characterDevelopment}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Market Potential</span>
                        <div className="text-white">{scriptData.aiAnalysis.marketPotential}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Uniqueness</span>
                        <div className="text-white">{scriptData.aiAnalysis.uniqueness}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
            {projectId 
              ? "Submit your script for the selected project."
              : "Share your creative vision with producers worldwide."}
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
          className="max-w-3xl mx-auto"
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
              {isSubmitting ? 'Submitting...' : 'Submit Script'}
            </button>
          ) : currentStep === 1 ? (
            <button
              onClick={analyzeScript}
              disabled={!scriptData.file || isAnalyzing}
              className="button-primary"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Script'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={
                (currentStep === 0 && (!scriptData.title || !scriptData.genre || !scriptData.targetAudience)) ||
                (currentStep === 1 && !scriptData.file) ||
                (currentStep === 2 && !scriptData.aiAnalysis)
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
};

export default function Page() {
  return (
    <Suspense fallback={
      <DashboardLayout userType="writer">
        <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[rgb(var(--accent-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading submission form...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <SubmitScriptContent />
    </Suspense>
  );
} 