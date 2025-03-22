'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  CheckIcon,
  PaperAirplaneIcon,
  CubeTransparentIcon,
  DocumentCheckIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { createAuthenticatedHeaders } from '@/lib/utils';

// Define form data interface
interface FormData {
  title: string;
  description: string;
  genre: string;
  type: string;
  budget: string;
  deadline: string;
  requirements: string;
  target_audience: string;
  estimated_runtime: string;
  content_rating: string;
  script_length: string;
  format_requirements: string;
  screenplay_elements: string[];
  tone: string;
  themes: string[];
  visual_style: string;
  character_notes: string;
  additional_materials: string;
  compensation_details: string;
  submission_guidelines: string;
}

// Default initial form data
const initialFormData: FormData = {
  title: '',
  description: '',
  genre: '',
  type: '',
  budget: '',
  deadline: '',
  requirements: '',
  target_audience: '',
  estimated_runtime: '',
  content_rating: '',
  script_length: '',
  format_requirements: '',
  screenplay_elements: [],
  tone: '',
  themes: [],
  visual_style: '',
  character_notes: '',
  additional_materials: '',
  compensation_details: '',
  submission_guidelines: ''
};

// Transaction status type
type TransactionStatus = 'idle' | 'pending' | 'mining' | 'confirmed' | 'failed' | 'error' | 'skipped' | 'completed';

// Blockchain data structure
interface BlockchainData {
  projectId: string;
  txHash?: string;
  status: 'idle' | 'pending' | 'mining' | 'confirmed' | 'failed' | 'error' | 'skipped';
  startTime: number;
  elapsedTime: number;
  message: string;
  networkName?: string;
  error?: string;
  details?: any;
}

export default function CreateProject() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [blockchainData, setBlockchainData] = useState<BlockchainData>({
    projectId: '',
    txHash: '',
    status: 'idle',
    startTime: 0,
    elapsedTime: 0,
    message: '',
    networkName: 'Lisk Sepolia'
  });
  const [projectCreated, setProjectCreated] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [submissionStartTime, setSubmissionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initialize form data
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    genre: '',
    type: '',
    budget: '',
    deadline: '',
    requirements: '',
    target_audience: '',
    estimated_runtime: '',
    content_rating: '',
    script_length: '',
    format_requirements: '',
    screenplay_elements: [],
    tone: '',
    themes: [],
    visual_style: '',
    character_notes: '',
    additional_materials: '',
    compensation_details: '',
    submission_guidelines: '',
  });

  // Form steps
  const steps = [
    { title: 'Basic Info', description: 'General project information', icon: DocumentTextIcon },
    { title: 'Creative Direction', description: 'Tone, themes, and vision', icon: ClipboardDocumentListIcon },
    { title: 'Technical Requirements', description: 'Format and structural needs', icon: CubeTransparentIcon },
    { title: 'Compensation', description: 'Payment and submission details', icon: DocumentCheckIcon },
    { title: 'Review & Submit', description: 'Submit your project', icon: PaperAirplaneIcon }
  ];

  // Initialize the form steps
  useEffect(() => {
    // Only reset if the form is empty
    if (formData.title === '') {
      setFormData(initialFormData);
    }
    
    // Setup blockchain elapsed time counter if a transaction is in progress
    if (blockchainData.txHash && ['pending', 'mining'].includes(blockchainData.status)) {
      const interval = setInterval(() => {
        setBlockchainData(prev => ({
          ...prev,
          elapsedTime: Date.now() - prev.startTime
        }));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  // Timer for transaction duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (submissionStartTime && transactionStatus !== 'confirmed' && transactionStatus !== 'failed') {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - submissionStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [submissionStartTime, transactionStatus]);

  // Format elapsed time as mm:ss
  const formatElapsedTime = () => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Transaction status polling effect
  useEffect(() => {
    // Only poll when we have a transaction hash and the status is not final
    if (
      blockchainData.txHash && 
      blockchainData.status !== 'idle' && 
      blockchainData.status !== 'confirmed' && 
      blockchainData.status !== 'failed'
    ) {
      console.log(`Starting to check status for transaction: ${blockchainData.txHash}`);
      
      // Create polling interval to check transaction status
      const intervalId = setInterval(async () => {
        try {
          // Get the wallet address from localStorage for authentication
          const walletAddress = localStorage.getItem('walletAddress');
          if (!walletAddress) {
            console.error('Wallet address not found in localStorage');
            setError('Authentication error: Wallet address not found');
            setBlockchainData(prev => ({
              ...prev,
              status: 'error',
              message: 'Authentication error: Please sign in again'
            }));
            clearInterval(intervalId);
            return;
          }

          const response = await fetch(`/api/blockchain/status/${blockchainData.txHash}`, {
            headers: {
              'x-wallet-address': walletAddress
            }
          });

          if (!response.ok) {
            console.warn(`Error checking transaction status: ${response.status}`);
            
            // Handle authentication errors
            if (response.status === 401) {
              setError('Authentication error: Please sign in again');
          setBlockchainData(prev => ({
            ...prev,
                status: 'error',
                message: 'Authentication error: Please sign in again'
              }));
              clearInterval(intervalId);
              return;
            }
            
            // Don't update status or clear interval for other errors - keep trying
            return;
          }

          const data = await response.json();
          
          console.log('Transaction status update:', data);
          
          if (!data.success) {
            // API returned an error but the request itself succeeded
            console.warn('Transaction status check failed:', data.message || data.error);
            return; // Continue polling
          }

          // Update blockchain data with API response
                setBlockchainData(prev => ({
                  ...prev,
            status: data.confirmed ? 'confirmed' : data.status || prev.status,
            message: data.message || prev.message,
            details: data
          }));

          // If transaction is confirmed or failed, stop polling
          if (data.confirmed) {
            setSuccess('Project successfully created and registered on blockchain!');
            setTransactionStatus('confirmed');
            setIsSubmitting(false);
            clearInterval(intervalId);
          } else if (data.status === 'failed') {
            setError(data.message || 'Transaction failed. Your project was created but blockchain registration failed.');
            setTransactionStatus('failed');
            setIsSubmitting(false);
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Error checking transaction status:', error);
          // Don't update state or clear interval for unexpected errors - keep trying
        }
      }, 3000); // Check every 3 seconds

      // Clear interval after 10 minutes (safety cleanup)
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        // If we timeout and status is still pending/mining, set to error
        setBlockchainData(prev => {
          if (prev.status === 'pending' || prev.status === 'mining') {
            setError('Transaction status check timed out. Please check your project status page for updates.');
            return {
              ...prev,
              status: 'error',
              message: 'Transaction status check timed out'
            };
          }
          return prev;
        });
      }, 10 * 60 * 1000);

      // Cleanup function to clear interval and timeout
    return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
    };
    }
  }, [blockchainData.txHash, blockchainData.status]);

  // Handle input change on form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for array fields
    if (name === 'themes') {
      const themes = value.split(',').map(theme => theme.trim());
      setFormData(prev => ({ ...prev, [name]: themes }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle checkbox change for screenplay elements
  const handleCheckboxChange = (element: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
      ...prev,
          screenplay_elements: [...prev.screenplay_elements, element]
        };
      } else {
        return {
          ...prev,
          screenplay_elements: prev.screenplay_elements.filter(el => el !== element)
        };
      }
    });
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle project creation
  const handleCreateProject = async () => {
    // Only proceed if we're on the final step
    if (currentStep !== steps.length) {
      return;
    }
    
    // Don't allow multiple submissions or resubmission after success
    if (isSubmitting || blockchainData.status === 'confirmed' || projectCreated) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
    setIsSubmitting(true);
      setTransactionStatus('idle');
      setSubmissionStartTime(new Date());
      
      // Validate form data - check required fields
      const requiredFields = [
        'title', 'description', 'genre', 'type', 'budget', 
        'deadline', 'requirements', 'compensation_details', 
        'submission_guidelines'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field as keyof FormData]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        setTransactionStatus('idle');
        return;
      }

      // Get wallet address from localStorage for authentication
      const walletAddress = localStorage.getItem('walletAddress');
      if (!walletAddress) {
        setError('Authentication error: Wallet address not found. Please sign in again.');
        setIsSubmitting(false);
        setTransactionStatus('failed');
        setBlockchainData(prev => ({
          ...prev,
          status: 'failed',
          message: 'Authentication error. Please sign in again.',
          error: 'Wallet address not found'
        }));
        // Redirect to sign-in after a delay
        setTimeout(() => router.push('/signin'), 3000);
        return;
      }

      // Convert budget to number if needed
      const budgetValue = typeof formData.budget === 'string' 
        ? parseFloat(formData.budget.replace(/[^0-9.]/g, '')) 
        : formData.budget;

      // Create the project with blockchain registration in a single API call
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: createAuthenticatedHeaders(),
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          budget: budgetValue,
          deadline: formData.deadline,
          genre: formData.genre || '',
          type: formData.type || ''
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
      } catch (e) {
          throw new Error(`Failed to create project: ${response.statusText}`);
        }
        throw new Error(errorData.error || errorData.message || 'Failed to create project');
      }

      const result = await response.json();
      
      // Handle the result which now includes both project and blockchain data
      if (result.success) {
      setProjectCreated(true);
        setProject(result.project);
        
        // Check if blockchain registration was attempted
        if (result.blockchain) {
          if (result.blockchain.success) {
            setTransactionStatus('pending');
        setBlockchainData({
              projectId: result.blockchain.projectId,
              txHash: result.blockchain.txHash || result.blockchain.transactionHash,
              status: 'pending',
          startTime: Date.now(),
          elapsedTime: 0,
              message: 'Transaction submitted to blockchain',
              networkName: result.blockchain.networkName || 'Lisk Sepolia'
        });
      } else {
            // Blockchain registration failed but project was created
            setTransactionStatus('failed');
          setBlockchainData({
              projectId: result.project.id,
            status: 'failed',
            startTime: Date.now(),
            elapsedTime: 0,
              message: 'Project created but blockchain registration failed',
              error: result.blockchain.error
          });
            setError('Project created but blockchain registration failed: ' + (result.blockchain.error || 'Unknown error'));
          }
        } else {
          // No blockchain data returned
          setTransactionStatus('skipped');
          setBlockchainData({
            projectId: result.project.id,
            status: 'skipped',
            startTime: Date.now(),
            elapsedTime: 0,
            message: 'Project created without blockchain registration'
          });
        }
        
        // Go to final step
        setCurrentStep(5);
          } else {
        throw new Error(result.error || 'Failed to create project');
          }
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < steps.length) {
      goToNextStep();
    }
    // Removed calling handleCreateProject here to prevent double submission
  };

  // Format time from milliseconds to readable format
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Get blockchain explorer URL for transaction
  const getExplorerUrl = (): string => {
    if (!blockchainData.txHash) return '';
    return `https://sepolia.explorer.lisk.com/transactions/${blockchainData.txHash}`;
  };

  // Navigate to the project detail page
  const goToProject = () => {
    if (!project) {
      router.push('/producer/projects');
      return;
    }
    
    // Use _id first, then fallback to projectId if _id is not available
    const projectIdentifier = project._id || project.id || project.projectId;
    
    if (projectIdentifier) {
      router.push(`/producer/projects/${projectIdentifier}`);
    } else {
      console.error('Project ID not found in project data:', project);
      router.push('/producer/projects');
    }
  };
  
  // Navigate to all projects
  const goToAllProjects = () => {
    router.push('/producer/projects');
  };
  
  // Component to show the progressive steps of project creation
  const CreationSteps = () => {
    if (!isSubmitting && blockchainData.status === 'idle') return null;
    
    const steps = [
      { id: 'submit', label: 'Submitting Data', status: isSubmitting ? 'complete' : 'pending' },
      { id: 'database', label: 'Database Creation', status: projectCreated ? 'complete' : isSubmitting ? 'current' : 'pending' },
      { id: 'blockchain', label: 'Blockchain Registration', status: blockchainData.txHash ? (blockchainData.status === 'confirmed' ? 'complete' : 'current') : (projectCreated ? 'current' : 'pending') }
    ];
    
    return (
      <div className="mt-6 p-5 border border-white/10 rounded-lg bg-white/5">
        <h3 className="text-lg font-semibold text-white mb-4">Creation Progress</h3>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
          
          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center relative pl-9">
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'complete' ? 'bg-green-500' : 
                  step.status === 'current' ? 'bg-yellow-500 animate-pulse' : 
                  'bg-gray-700'
                }`}>
                  {step.status === 'complete' ? (
                    <CheckIcon className="w-5 h-5 text-white" />
                  ) : step.status === 'current' ? (
                    <ArrowPathIcon className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  step.status === 'complete' ? 'text-green-400' :
                  step.status === 'current' ? 'text-white' :
                  'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Transaction status card component
  const TransactionStatusCard = () => {
    if (!blockchainData.txHash) return null;
    
    return (
      <div className="mt-6 p-5 border border-white/10 rounded-lg bg-white/5">
        <h3 className="text-lg font-semibold text-white mb-4">Blockchain Transaction Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              blockchainData.status === 'idle' ? 'bg-gray-500' :
              blockchainData.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
              blockchainData.status === 'mining' ? 'bg-yellow-500 animate-pulse' :
              blockchainData.status === 'confirmed' ? 'bg-green-500' :
              'bg-red-500'
            }`}></div>
            <span className="text-white">
              {blockchainData.status === 'idle' ? 'Waiting to start' :
               blockchainData.status === 'pending' ? 'Preparing transaction...' :
               blockchainData.status === 'mining' ? 'Transaction in progress...' :
               blockchainData.status === 'confirmed' ? 'Transaction confirmed!' :
               'Transaction failed'}
            </span>
          </div>
          
          {blockchainData.status !== 'idle' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Transaction Hash:</span>
                <a 
                  href={getExplorerUrl()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[rgb(var(--accent-primary))] truncate ml-2 hover:underline flex items-center"
                >
                  {blockchainData.txHash.substring(0, 10)}...{blockchainData.txHash.substring(blockchainData.txHash.length - 10)}
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                </a>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network:</span>
                <span className="text-white">{blockchainData.networkName || 'Lisk Sepolia'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Time Elapsed:</span>
                <span className="text-white">{formatTime(blockchainData.elapsedTime)}</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                <div 
                  className={`h-2 rounded-full ${
                    blockchainData.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ 
                    width: `${blockchainData.status === 'confirmed' ? '100' : Math.min(blockchainData.elapsedTime, 120000) / 1200}%` 
                  }}
                ></div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Success card component
  const SuccessCard = () => {
    if (blockchainData.status !== 'confirmed') return null;
    
    return (
      <div className="mt-6 p-5 border border-green-800/30 rounded-lg bg-green-900/20">
        <div className="flex items-start gap-4">
          <div className="bg-green-500/20 p-2 rounded-full">
            <CheckIcon className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">Project Successfully Created!</h3>
            <p className="text-gray-300 mb-4">
              Your project "{formData.title}" has been created and registered on the blockchain. 
              Writers can now begin submitting their work.
            </p>
            
            <div className="mb-4 p-3 bg-black/30 rounded-lg">
              <h4 className="text-[rgb(var(--accent-primary))] font-medium mb-2">Next Steps:</h4>
              <ul className="text-sm text-gray-300 space-y-1 ml-5 list-disc">
                <li>You can now view your project details and monitor submissions</li>
                <li>Share your project with writers to start receiving submissions</li>
                <li>Review and provide feedback on submitted scripts</li>
                <li>Select and fund winning submissions when ready</li>
              </ul>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg mb-4">
              <h4 className="text-white font-medium flex items-center mb-2">
                <DocumentTextIcon className="w-4 h-4 mr-1 text-[rgb(var(--accent-primary))]" />
                Project ID
              </h4>
              <p className="text-sm text-gray-300 font-mono bg-black/50 p-2 rounded overflow-x-auto">
                {project?._id || project?.id || project?.projectId || 'Unknown'}
              </p>
              
              <h4 className="text-white font-medium flex items-center mt-3 mb-2">
                <CubeTransparentIcon className="w-4 h-4 mr-1 text-[rgb(var(--accent-primary))]" />
                Blockchain Transaction
              </h4>
              <p className="text-sm text-gray-300 font-mono bg-black/50 p-2 rounded overflow-x-auto">
                {blockchainData.txHash}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={goToProject}
                className="px-4 py-2 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <DocumentTextIcon className="w-5 h-5" />
                View Project Details
              </button>
              
              <button
                onClick={goToAllProjects}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors flex items-center gap-2"
              >
                <ClipboardDocumentListIcon className="w-5 h-5" />
                See All Projects
              </button>
              
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors flex items-center gap-2"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                View on Explorer
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Final step with updated layout for summary and transaction status
  const renderLastStepContent = () => (
    <div className="space-y-6">
      <div className="p-6 border border-white/10 rounded-lg bg-white/5">
        <h3 className="text-xl font-bold text-white mb-4">Project Summary</h3>
        
        {/* Project summary details */}
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-medium text-white">{formData.title}</h4>
            <p className="text-gray-400 mt-1">{formData.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Genre</p>
              <p className="text-white">{formData.genre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Type</p>
              <p className="text-white">{formData.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Budget</p>
              <p className="text-white">{formData.budget}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Deadline</p>
              <p className="text-white">{formData.deadline}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Show error message if there is one */}
      {error && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-300 font-medium mb-1">{error}</p>
            <p className="text-red-400 text-sm">
              {projectCreated 
                ? "Your project was created in the database but blockchain registration failed. You can still view your project."
                : "Please try again or contact support if the problem persists."}
            </p>
            
            {projectCreated && (
              <button
                onClick={goToProject}
                className="mt-2 px-3 py-1 bg-white/10 rounded text-white text-sm hover:bg-white/20 transition-colors"
              >
                View Project
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Show success message */}
      {success && (
        <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3">
          <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-green-300 font-medium mb-1">{success}</p>
            <p className="text-green-400 text-sm">
              Your project has been successfully created and registered on the blockchain.
            </p>
            
            <div className="mt-3 flex gap-3">
              <button
                onClick={goToProject}
                className="px-3 py-1 bg-white/10 rounded text-white text-sm hover:bg-white/20 transition-colors"
              >
                View Project
              </button>
              <button
                onClick={goToAllProjects}
                className="px-3 py-1 bg-white/10 rounded text-white text-sm hover:bg-white/20 transition-colors"
              >
                See All Projects
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transaction status indicator - shown during submission */}
      {isSubmitting && (
        <div className="mt-6 p-5 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
              <ArrowPathIcon className="w-5 h-5 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-white font-medium">Creating your project...</h3>
              <p className="text-sm text-gray-400">This may take a minute or two</p>
              <div className="mt-2 flex items-center">
                <ClockIcon className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-xs text-gray-500">{formatElapsedTime()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Transaction status card - only shown when we have transaction data */}
      {blockchainData.txHash && blockchainData.status !== 'idle' && (
        <div className="mt-6 p-5 border border-white/10 rounded-lg bg-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Blockchain Transaction Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                blockchainData.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                blockchainData.status === 'mining' ? 'bg-yellow-500 animate-pulse' :
                blockchainData.status === 'confirmed' ? 'bg-green-500' :
                'bg-red-500'
              }`}></div>
              <span className="text-white">
                {blockchainData.status === 'pending' ? 'Preparing transaction...' :
                 blockchainData.status === 'mining' ? 'Transaction in progress...' :
                 blockchainData.status === 'confirmed' ? 'Transaction confirmed!' :
                 'Transaction failed'}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Transaction Hash:</span>
              <a 
                href={getExplorerUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[rgb(var(--accent-primary))] truncate ml-2 hover:underline flex items-center"
              >
                {blockchainData.txHash.substring(0, 10)}...{blockchainData.txHash.substring(blockchainData.txHash.length - 10)}
                <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
              </a>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network:</span>
              <span className="text-white">{blockchainData.networkName || 'Lisk Sepolia'}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Time Elapsed:</span>
              <span className="text-white">{formatTime(blockchainData.elapsedTime)}</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
              <div 
                className={`h-2 rounded-full ${
                  blockchainData.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ 
                  width: `${blockchainData.status === 'confirmed' ? '100' : Math.min(blockchainData.elapsedTime, 120000) / 1200}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Create project button - only show if not already submitted or confirmed */}
      {!isSubmitting && blockchainData.status === 'idle' && (
        <button
          type="button"
          onClick={handleCreateProject}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-primary-dark))] text-white font-medium rounded-lg transition-colors"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
          Create Project
        </button>
      )}
      
      {/* Processing indicator */}
      {isSubmitting && !projectCreated && (
        <div className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gray-700 text-white font-medium rounded-lg">
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
          Processing...
        </div>
      )}
    </div>
  );

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-white font-medium mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Enter a descriptive title for your project"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-white font-medium mb-2">
                Project Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Describe your project and what you're looking for in detail"
                required
              ></textarea>
              <p className="mt-1 text-xs text-gray-400">
                Provide a comprehensive overview of your project to help writers understand your vision
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="genre" className="block text-white font-medium mb-2">
                  Genre <span className="text-red-500">*</span>
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  required
                >
                  <option value="">Select a genre</option>
                  <option value="action">Action</option>
                  <option value="comedy">Comedy</option>
                  <option value="drama">Drama</option>
                  <option value="sci-fi">Science Fiction</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="horror">Horror</option>
                  <option value="romance">Romance</option>
                  <option value="thriller">Thriller</option>
                  <option value="documentary">Documentary</option>
                  <option value="animation">Animation</option>
                  <option value="family">Family</option>
                  <option value="musical">Musical</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="type" className="block text-white font-medium mb-2">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  required
                >
                  <option value="">Select a type</option>
                  <option value="feature-film">Feature Film</option>
                  <option value="short-film">Short Film</option>
                  <option value="tv-series">TV Series</option>
                  <option value="tv-episode">TV Episode</option>
                  <option value="documentary">Documentary</option>
                  <option value="music-video">Music Video</option>
                  <option value="web-series">Web Series</option>
                  <option value="commercial">Commercial</option>
                  <option value="online-content">Online Content</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="budget" className="block text-white font-medium mb-2">
                  Budget <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  placeholder="e.g. $5,000 - $10,000"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Specify budget range to set expectations with writers
                </p>
              </div>
              
              <div>
                <label htmlFor="deadline" className="block text-white font-medium mb-2">
                  Submission Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  When do you need submissions by?
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="target_audience" className="block text-white font-medium mb-2">
                Target Audience
              </label>
              <input
                type="text"
                id="target_audience"
                name="target_audience"
                value={formData.target_audience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="e.g. Adults 18-35, Young Adults, Family, etc."
              />
              <p className="mt-1 text-xs text-gray-400">
                Specify the intended audience demographic for your project
              </p>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="tone" className="block text-white font-medium mb-2">
                Tone & Mood
              </label>
              <input
                type="text"
                id="tone"
                name="tone"
                value={formData.tone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="e.g. Dark comedy, Suspenseful, Uplifting, Gritty, etc."
              />
              <p className="mt-1 text-xs text-gray-400">
                Describe the emotional tone or mood you want to convey
              </p>
            </div>

            <div>
              <label htmlFor="themes" className="block text-white font-medium mb-2">
                Key Themes
              </label>
              <input
                type="text"
                id="themes"
                name="themes"
                value={formData.themes.join(', ')}
                onChange={(e) => {
                  const themes = e.target.value.split(',').map(theme => theme.trim());
                  setFormData(prev => ({...prev, themes}));
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="e.g. Redemption, Family, Justice (comma separated)"
              />
              <p className="mt-1 text-xs text-gray-400">
                List the primary themes you want explored in the script
              </p>
            </div>

            <div>
              <label htmlFor="visual_style" className="block text-white font-medium mb-2">
                Visual Style & References
              </label>
              <textarea
                id="visual_style"
                name="visual_style"
                value={formData.visual_style}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Describe your visual references or similar works that inspire this project"
              ></textarea>
              <p className="mt-1 text-xs text-gray-400">
                Mention any films, shows, or visual styles that should influence this project
              </p>
            </div>
            
            <div>
              <label htmlFor="character_notes" className="block text-white font-medium mb-2">
                Character Notes
              </label>
              <textarea
                id="character_notes"
                name="character_notes"
                value={formData.character_notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Describe key characters or character dynamics you want included"
              ></textarea>
              <p className="mt-1 text-xs text-gray-400">
                Any specific character traits, backgrounds, or arcs you want in the screenplay
              </p>
            </div>

            <div>
              <label htmlFor="content_rating" className="block text-white font-medium mb-2">
                Content Rating
              </label>
              <select
                id="content_rating"
                name="content_rating"
                value={formData.content_rating}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
              >
                <option value="">Select desired rating</option>
                <option value="G">G - General Audiences</option>
                <option value="PG">PG - Parental Guidance Suggested</option>
                <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                <option value="R">R - Restricted</option>
                <option value="NC-17">NC-17 - Adults Only</option>
                <option value="TV-Y">TV-Y - All Children</option>
                <option value="TV-Y7">TV-Y7 - Older Children</option>
                <option value="TV-G">TV-G - General Audience</option>
                <option value="TV-PG">TV-PG - Parental Guidance Suggested</option>
                <option value="TV-14">TV-14 - Parents Strongly Cautioned</option>
                <option value="TV-MA">TV-MA - Mature Audiences Only</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Specify the intended content rating for your project
              </p>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
                    <div>
              <label htmlFor="requirements" className="block text-white font-medium mb-2">
                Project Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="List any specific requirements for your project"
                required
              ></textarea>
              <p className="mt-1 text-xs text-gray-400">
                Specific elements that must be included in the screenplay
              </p>
                </div>
                
            <div>
              <label htmlFor="estimated_runtime" className="block text-white font-medium mb-2">
                Estimated Runtime
              </label>
              <input
                type="text"
                id="estimated_runtime"
                name="estimated_runtime"
                value={formData.estimated_runtime}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="e.g. 90-120 minutes, 30 minutes per episode, etc."
              />
              <p className="mt-1 text-xs text-gray-400">
                Specify the expected runtime of the completed project
              </p>
                    </div>

                    <div>
              <label htmlFor="script_length" className="block text-white font-medium mb-2">
                Expected Script Length
              </label>
              <input
                type="text"
                id="script_length"
                name="script_length"
                value={formData.script_length}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="e.g. 90-120 pages, 30-40 pages, etc."
              />
              <p className="mt-1 text-xs text-gray-400">
                Indicate how long the screenplay should be in pages
                      </p>
                    </div>

                        <div>
              <label htmlFor="format_requirements" className="block text-white font-medium mb-2">
                Formatting Requirements
              </label>
              <textarea
                id="format_requirements"
                name="format_requirements"
                value={formData.format_requirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Specify any particular format requirements (Final Draft, specific templates, etc.)"
              ></textarea>
              <p className="mt-1 text-xs text-gray-400">
                Any specific formatting requirements for the submitted script
              </p>
                        </div>
                      
                      <div>
              <label className="block text-white font-medium mb-2">
                Required Screenplay Elements
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Title Page', 'Scene Headings', 'Action', 'Character Names',
                  'Dialogue', 'Parentheticals', 'Transitions', 'Shot Specifications',
                  'Character Descriptions', 'Sound Effects', 'Camera Directions'
                ].map(element => (
                  <div key={element} className="flex items-center">
                    <input
                      type="checkbox"
                      id={element.replace(/\s+/g, '-').toLowerCase()}
                      checked={formData.screenplay_elements.includes(element)}
                      onChange={(e) => {
                        handleCheckboxChange(element, e.target.checked);
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={element.replace(/\s+/g, '-').toLowerCase()} className="text-white text-sm">
                      {element}
                    </label>
                        </div>
                ))}
                      </div>
                    </div>
                    
            <div>
              <label htmlFor="additional_materials" className="block text-white font-medium mb-2">
                Additional Materials
              </label>
              <textarea
                id="additional_materials"
                name="additional_materials"
                value={formData.additional_materials}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Describe any additional materials you'll provide (treatments, character bios, etc.)"
              ></textarea>
              <p className="mt-1 text-xs text-gray-400">
                List any supplementary materials that will be available to writers
              </p>
                    </div>
                  </div>
        );

      case 4:
        return (
          <div className="space-y-6">
                  <div>
              <label htmlFor="compensation_details" className="block text-white font-medium mb-2">
                Compensation Details <span className="text-red-500">*</span>
              </label>
              <textarea
                id="compensation_details"
                name="compensation_details"
                value={formData.compensation_details}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Specify payment details, royalties, or other compensation"
                required
              ></textarea>
              <p className="mt-1 text-xs text-gray-400">
                Be clear about how writers will be compensated for their work
              </p>
                  </div>
              
                    <div>
              <label htmlFor="submission_guidelines" className="block text-white font-medium mb-2">
                Submission Guidelines <span className="text-red-500">*</span>
              </label>
              <textarea
                id="submission_guidelines"
                name="submission_guidelines"
                value={formData.submission_guidelines}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Explain your submission process and what writers need to include"
                required
              ></textarea>
              <p className="mt-1 text-xs text-gray-400">
                Detail what should be included in submissions, selection process, and timeline
                      </p>
                    </div>

            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <h3 className="text-white font-medium mb-2">Selection Process</h3>
              <p className="text-sm text-gray-400 mb-4">
                Explain to writers how submissions will be reviewed, selected, and what happens after selection.
                This helps set clear expectations and increases quality submissions.
              </p>
              <textarea
                name="selection_process"
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                placeholder="Describe your selection process, feedback approach, and timeline for decisions"
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    submission_guidelines: `${prev.submission_guidelines}\n\nSelection Process:\n${e.target.value}`
                  }));
                }}
              ></textarea>
                  </div>
          </div>
        );

      case 5:
        return renderLastStepContent();
      
      default:
        return null;
    }
  };

  // Navigation buttons
  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-between mt-8">
                    <button 
          type="button"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1 || isSubmitting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium ${
            currentStep === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
          }`}
        >
          <ArrowLongLeftIcon className="w-5 h-5" />
          Back
                    </button>
        
        {currentStep < steps.length ? (
                    <button 
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          >
            Next
            <ArrowLongRightIcon className="w-5 h-5" />
                    </button>
        ) : (
          <button
            type="button"
            onClick={handleCreateProject}
            disabled={isSubmitting || blockchainData.status === 'confirmed'}
            className={`flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg text-white font-medium ${
              isSubmitting || blockchainData.status === 'confirmed' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 transition-opacity'
            }`}
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : blockchainData.status === 'confirmed' ? (
              <>
                <CheckIcon className="w-5 h-5" />
                Created!
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="w-5 h-5" />
                Create Project
              </>
            )}
          </button>
        )}
          </div>
        );
  };

  // Update success state on successful transaction
  useEffect(() => {
    if (blockchainData.status === 'confirmed' && project) {
      // Set final success state
      setSuccess(`Project "${formData.title}" successfully created and registered on the blockchain.`);
      
      // Ensure we're no longer in submitting state
      setIsSubmitting(false);
      setTransactionStatus('completed');
      
      // Log success data for debugging
      console.log('Project creation completed successfully:', {
        projectId: project._id || project.id || project.projectId,
        txHash: blockchainData.txHash,
        title: formData.title
      });
    }
  }, [blockchainData.status, project, formData.title]);

  // Transaction status monitor component
  const TransactionMonitor = ({ data }: { data: BlockchainData }) => {
    // Format elapsed time
    const formatElapsedTime = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Determine what icon to show based on status
    const renderStatusIcon = () => {
      switch (data.status) {
        case 'confirmed':
          return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
        case 'failed':
        case 'error':
          return <XCircleIcon className="h-8 w-8 text-red-500" />;
        case 'mining':
          return <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />;
        case 'pending':
          return <ClockIcon className="h-8 w-8 text-yellow-500" />;
      default:
          return <ExclamationTriangleIcon className="h-8 w-8 text-gray-500" />;
      }
    };

    // Determine background color based on status
    const getBackgroundColor = () => {
      switch (data.status) {
        case 'confirmed':
          return 'bg-green-50 border-green-200';
        case 'failed':
        case 'error':
          return 'bg-red-50 border-red-200';
        case 'mining':
          return 'bg-blue-50 border-blue-200';
        case 'pending':
          return 'bg-yellow-50 border-yellow-200';
        default:
          return 'bg-gray-50 border-gray-200';
      }
    };

    // Skip rendering if status is idle
    if (data.status === 'idle') {
        return null;
    }

    return (
      <div className={`rounded-lg p-4 mb-4 border ${getBackgroundColor()}`}>
        <div className="flex items-center">
          <div className="mr-4">
            {renderStatusIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              Transaction {data.status === 'confirmed' ? 'Confirmed' : data.status === 'failed' ? 'Failed' : 'In Progress'}
            </h3>
            <p className="text-sm">{data.message}</p>
            {data.error && (
              <p className="text-sm text-red-600 mt-1">{data.error}</p>
            )}
            {data.txHash && (
              <p className="text-xs mt-2 text-gray-500">
                Transaction Hash: <span className="font-mono">{`${data.txHash.substring(0, 10)}...${data.txHash.substring(data.txHash.length - 8)}`}</span>
              </p>
            )}
            {(data.status === 'pending' || data.status === 'mining') && data.startTime > 0 && (
              <p className="text-xs mt-1 text-gray-500">
                Time elapsed: {formatElapsedTime(data.elapsedTime)}
              </p>
            )}
            {data.networkName && (
              <p className="text-xs mt-1 text-gray-500">
                Network: {data.networkName}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout userType="producer">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/producer/projects" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
            <ArrowLongLeftIcon className="w-5 h-5" />
            <span>Back to Projects</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
          <p className="text-gray-400">Fill in the details to create your new project</p>
        </div>
        
        {/* Steps */}
        <div className="mb-8">
          <nav className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex items-center"
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep >= index + 1
                      ? 'bg-[rgb(var(--accent-primary))] text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`ml-2 text-sm ${
                    currentStep >= index + 1 ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </nav>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6">
          {/* Error message (for steps 1-2) */}
          {error && currentStep !== 5 && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          )}
          
          {/* Success message (for steps 1-2) */}
          {success && currentStep !== 5 && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <p className="text-green-300">{success}</p>
            </div>
          )}
          
          {/* Step content */}
          {renderStepContent()}
          
          {/* Navigation buttons */}
          {currentStep < 5 && renderNavigationButtons()}
        </form>
        
        {/* Remove redundant displays when on the final step */}
        {currentStep === 5 && blockchainData.status === 'confirmed' && (
          <SuccessCard />
        )}
      </div>
    </DashboardLayout>
  );
} 