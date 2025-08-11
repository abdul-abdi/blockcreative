'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { ethers } from 'ethers';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ClipboardDocumentListIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XCircleIcon,
  ArrowUturnLeftIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useMarketplace } from '@/context/audio';


interface Project {
  id: string | number;
  title: string;
  description: string;
  genre?: string;
  requirements?: string[] | string | any;
  studio?: string;
  producer_name?: string;
  company_name?: string;
  budget?: number | string;
  deadline?: string | Date;
}

interface ScriptData {
  title: string;
  genre: string;
  content: string;
  targetAudience: string;
  logline: string;
  synopsis: string;
  projectId: string | null;
  projectTitle: string | null;
  runtime?: string;
  comparables?: string;
  market?: string; // Add market field
  skipAiAnalysis?: boolean;
  aiAnalysis: {
    overall?: number;
    creativity?: number; 
    structure?: number;
    character_development?: number;
    marketability?: number;
    strengths?: string[];
    weaknesses?: string[];
    keywords?: string[];
    analysis?: string;
  };
  nftTokenId?: string;
  nftTransactionHash?: string;
}

const initialScriptData: ScriptData = {
  title: '',
  logline: '',
  synopsis: '',
  genre: '',
  targetAudience: '',
  content: '',
  runtime: '',
  comparables: '',
  market: '', // Initialize market field
  skipAiAnalysis: false,
  aiAnalysis: {
    overall: 0,
    creativity: 0,
    structure: 0,
    character_development: 0,
    marketability: 0,
    strengths: [],
    weaknesses: [],
    keywords: [],
    analysis: ''
  },
  projectId: null,
  projectTitle: '',
};

const steps = [
  { id: 'details', title: 'Script Details', icon: DocumentTextIcon, description: 'Basic script information' },
  { id: 'upload', title: 'Upload Script', icon: ClipboardDocumentListIcon, description: 'Script content and format' },
  { id: 'analysis', title: 'AI Analysis', icon: ChartBarIcon, description: 'AI-powered script analysis' },
  { id: 'review', title: 'Review & Submit', icon: PaperAirplaneIcon, description: 'Submit to project' },
];

// Update the loadProvider function with proper TypeScript typing
const loadProvider = async () => {
  try {
    // Check if window is defined (for Next.js SSR)
    if (typeof window !== 'undefined' && window.ethereum) {
      // Define ethereum provider type
      const ethereum = window.ethereum as any;
      
      // Request account access
      await ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create and return ethers provider (v6 syntax)
      const provider = new ethers.BrowserProvider(ethereum);
      return provider;
    }
    return null;
  } catch (error) {
    console.error('Error loading provider:', error);
    return null;
  }
};

// Update the SubmissionConfirmation component to show NFT status
const SubmissionConfirmation = ({ submissionId, projectTitle }: { submissionId: string; projectTitle?: string }) => {
  const [nftStatus, setNftStatus] = useState<string>("pending");
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  useEffect(() => {
    // Poll for NFT status if submission ID is available
    let intervalId: NodeJS.Timeout;
    
    const checkNftStatus = async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}`);
        const data = await response.json();
        
        if (data.nftTokenId) {
          setTokenId(data.nftTokenId);
          setTransactionHash(data.nftTransactionHash);
          setNftStatus("minted");
          clearInterval(intervalId);
        } else if (data.nftStatus === "failed") {
          setNftStatus("failed");
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Error checking NFT status:", error);
      }
    };
    
    if (submissionId) {
      checkNftStatus();
      intervalId = setInterval(checkNftStatus, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [submissionId]);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto p-8 bg-white/5 border border-white/10 rounded-xl shadow-2xl"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[rgb(var(--accent-primary))]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckIcon className="w-10 h-10 text-[rgb(var(--accent-primary))]" />
          </div>
        <h2 className="text-2xl font-bold text-white mb-3">Script Submitted Successfully!</h2>
        <p className="text-gray-300 max-w-md mx-auto">
          Your script has been submitted{projectTitle ? ` to "${projectTitle}"` : ''} for review. We'll notify you when there's an update.
          </p>
        </div>
          
          <div className="space-y-6">
        {/* Submission ID */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Submission ID</p>
          <p className="text-white font-mono">{submissionId}</p>
              </div>
        
        {/* NFT Status */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Blockchain NFT Status</p>
          
          {nftStatus === "pending" && (
            <div className="flex items-center">
              <ArrowPathIcon className="w-5 h-5 text-amber-400 animate-spin mr-2" />
              <span className="text-amber-400">Minting NFT on blockchain...</span>
              </div>
          )}
          
          {nftStatus === "minted" && (
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-green-400">NFT Minted Successfully!</span>
              </div>
              {tokenId && (
              <div>
                  <p className="text-sm text-gray-400 mt-2">Token ID</p>
                  <p className="text-white font-mono">{tokenId}</p>
              </div>
              )}
              {transactionHash && (
                <div>
                  <p className="text-sm text-gray-400 mt-2">Transaction Hash</p>
                  <a 
                    href={`https://etherscan.io/tx/${transactionHash}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[rgb(var(--accent-primary))] hover:underline font-mono text-sm block truncate"
                  >
                    {transactionHash}
                  </a>
            </div>
              )}
            </div>
          )}
          
          {nftStatus === "failed" && (
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">NFT minting failed. Please contact support.</span>
              </div>
          )}
            </div>
            
        {/* Next Steps */}
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-medium text-white">What happens next?</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-1 w-6 h-6 bg-[rgb(var(--accent-primary))]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[rgb(var(--accent-primary))] text-sm font-medium">1</span>
              </div>
              <div>
                <p className="text-white font-medium">Producer Review</p>
                <p className="text-gray-400 text-sm">The producer will review your script and provide feedback.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-6 h-6 bg-[rgb(var(--accent-primary))]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[rgb(var(--accent-primary))] text-sm font-medium">2</span>
            </div>
              <div>
                <p className="text-white font-medium">Potential Acquisition</p>
                <p className="text-gray-400 text-sm">If the script meets the project requirements, the producer may choose to acquire it.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-6 h-6 bg-[rgb(var(--accent-primary))]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[rgb(var(--accent-primary))] text-sm font-medium">3</span>
              </div>
              <div>
                <p className="text-white font-medium">NFT Ownership Transfer</p>
                <p className="text-gray-400 text-sm">Upon acquisition, NFT ownership will be transferred to the producer.</p>
              </div>
            </li>
          </ul>
          </div>
          
          <div className="mt-8 flex justify-center">
          <Link href="/writer/dashboard" className="px-6 py-3 bg-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-primary))]/90 text-white rounded-lg flex items-center">
            <ArrowUturnLeftIcon className="w-5 h-5 mr-2" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// Add mock analysis data for fallback when AI is unavailable
const mockAnalysisData = {
  overall: 78,
  creativity: 82,
  structure: 75,
  character_development: 80,
  marketability: 76,
  strengths: [
    "Strong character development with clear motivations",
    "Engaging dialogue that reveals character personalities",
    "Unique premise with potential for audience engagement",
    "Good pacing that maintains interest throughout"
  ],
  weaknesses: [
    "Plot structure could be tightened in the second act",
    "Some secondary characters lack development",
    "Certain plot points might benefit from additional setup",
    "The ending could be more impactful with additional foreshadowing"
  ],
  keywords: ["Character-driven", "Suspenseful", "Original", "Dramatic", "Emotional"],
  analysis: "This script demonstrates strong potential with well-developed characters and engaging dialogue. The premise is original and offers a fresh perspective on the genre. The structure is generally sound, though the second act could benefit from tightening to maintain tension throughout. The character arcs are well-established, and the overall marketability is promising for the target audience. With some refinement to the plot structure and further development of secondary characters, this script could become even stronger."
};

const SubmitScript = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [scriptData, setScriptData] = useState<ScriptData>({
    title: '',
    genre: '',
    content: '',
    targetAudience: '',
    logline: '',
    synopsis: '',
    projectId: null,
    projectTitle: null,
    market: '', // Initialize market field
    aiAnalysis: {},
  });
  
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  
  // Connect wallet function
  const connectWallet = async () => {
    setIsWalletConnecting(true);
    try {
      const provider = await loadProvider();
      if (provider) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        
        // Store wallet address in localStorage for future use
        localStorage.setItem('walletAddress', address);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setIsWalletConnecting(false);
    }
  };
  
  // Check if wallet is connected on initial load
  useEffect(() => {
    const checkWalletConnection = async () => {
      const savedAddress = localStorage.getItem('walletAddress');
      if (savedAddress) {
        try {
          const provider = await loadProvider();
          if (provider) {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            
            // Verify the saved address matches the current connected wallet
            if (address.toLowerCase() === savedAddress.toLowerCase()) {
              setWalletAddress(address);
            } else {
              // Address mismatch, clear stored address
              localStorage.removeItem('walletAddress');
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          localStorage.removeItem('walletAddress');
        }
      }
    };
    
    checkWalletConnection();
  }, []);
  
  // Fetch project details if projectId is available in URL
  useEffect(() => {
    // Use optional chaining to safely access searchParams
    const projectId = searchParams?.get('projectId');
    
    if (projectId) {
      setScriptData(prev => ({
        ...prev,
        projectId
      }));
      
      const fetchProjectDetails = async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch project details');
          }
          
          const data = await response.json();
          setProjectData(data);
          setScriptData(prev => ({
            ...prev,
            projectTitle: data.title
          }));
        } catch (error) {
          console.error('Error fetching project details:', error);
        }
      };
      
      fetchProjectDetails();
    }
  }, [searchParams]);
  
  // Fetch available projects for the writer
  useEffect(() => {
    const fetchAvailableProjects = async () => {
      setIsLoadingProjects(true);
      try {
        // Get the wallet address
          const walletAddress = localStorage.getItem('walletAddress');
          
        // Initialize auth headers
        const headers: HeadersInit = { 
          'Content-Type': 'application/json',
        };
        
        // Add wallet address if available
          if (walletAddress) {
            headers['x-wallet-address'] = walletAddress;
          setWalletAddress(walletAddress);
        }
        
        // Set user role in localStorage and headers
        localStorage.setItem('userRole', 'writer');
        headers['x-user-role'] = 'writer';
        
        // First verify user authentication if wallet address exists
        if (walletAddress) {
          try {
            const authCheck = await fetch('/api/users/me', {
              method: 'GET',
              headers,
              credentials: 'include',
              cache: 'no-store'
            });
            
            // If user doesn't exist, don't treat as error but log it
            if (authCheck.status === 404) {
              console.log("User not found, but proceeding to fetch projects");
            }
          } catch (authError) {
            console.error("Auth check error:", authError);
            // Continue anyway to fetch public projects
          }
        }
        
        // Use the correct API endpoint with proper filtering
        const response = await fetch('/api/projects?status=open', {
          headers,
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch available projects');
        }
        
        const data = await response.json();
        setAvailableProjects(data.projects || data);
        } catch (error) {
        console.error('Error fetching available projects:', error);
        } finally {
        setIsLoadingProjects(false);
      }
    };
    
    fetchAvailableProjects();
  }, []);
  
  // Add function to navigate to next step
  const goToNextStep = () => {
    if (currentStep < steps.length) {
      // Validate required fields for Step 1 before proceeding
      if (currentStep === 1) {
        if (!scriptData.title || !scriptData.genre || !scriptData.logline || !scriptData.targetAudience || !scriptData.synopsis) {
          setError("Please fill in all required fields");
          return;
        }
        if (!scriptData.projectId) {
          setError("Please select a project to submit to");
          return;
        }
      }
      
      // Validate script content for Step 2 before proceeding
      if (currentStep === 2 && !scriptData.content) {
        setError("Please enter your script content");
        return;
      }
      
      // Clear any previous errors
      setError("");
      
      // If moving from Step 2 to AI Analysis, check if we should skip analysis
      if (currentStep === 2) {
        if (scriptData.skipAiAnalysis) {
          // Skip to step 4 (Review & Submit)
          setCurrentStep(4);
        } else {
          // Just go to step 3, no authentication needed for AI Analysis
          setCurrentStep(3);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Normal step progression
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Add function to go to previous step
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setError("");
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Update analyzeScript function to handle Gemini API errors better
  const analyzeScript = async () => {
    if (!scriptData.content || scriptData.content.trim().length < 100) {
      setError("Please enter a valid script with at least 100 characters");
      return;
    }
    
    setIsAnalyzing(true);
    setError("");
    
    try {
      // Prepare analysis data with field names exactly matching the API expectations
      const analysisData = {
        content: scriptData.content,
        title: scriptData.title,
        genre: scriptData.genre,
        projectId: scriptData.projectId, // API expects camelCase
        logline: scriptData.logline,
        synopsis: scriptData.synopsis,
        targetAudience: scriptData.targetAudience // API expects camelCase
      };
      
      console.log("Sending analysis request to API...");
      
      // Simplified request without authentication
      const response = await fetch('/api/writer/scripts/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analysisData)
      });
      
      console.log("Analysis API response status:", response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          
          // Check for specific error responses from the API
          if (errorData.error === 'AI service unavailable' || 
              errorData.error === 'AI model not found' ||
              (errorData.message && (
                errorData.message.includes("GoogleGenerativeAI") || 
                errorData.message.includes("gemini") ||
                errorData.message.includes("AI service")
              ))) {
            throw new Error("The AI analysis service is currently unavailable. You can use the fallback analysis, skip AI analysis, or try again later.");
          } else {
            throw new Error(errorData.error || errorData.message || `API error: ${response.statusText}`);
          }
        } else {
          const errorText = await response.text();
          console.error("API returned non-JSON error:", errorText);
          
          // Check for specific error patterns in the text response
          if (errorText.includes("GoogleGenerativeAI") || 
              errorText.includes("gemini") || 
              errorText.includes("AI service") ||
              errorText.includes("404 Not Found")) {
            throw new Error("The AI analysis service is experiencing technical difficulties. You can use the fallback analysis instead.");
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
        }
      }
      
      const result = await response.json();
      console.log("Analysis result:", result);
      
      // Update script data with analysis results based on API response structure
        setScriptData(prev => ({
          ...prev,
        aiAnalysis: result.result || result.analysis || result,
      }));
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Add more specific handling for different error types
      if (error instanceof Error) {
        if (error.message.includes("AI service") || 
            error.message.includes("AI model") || 
            error.message.includes("unavailable") || 
            error.message.includes("gemini") ||
            error.message.includes("GoogleGenerativeAI")) {
          // AI service specific errors - provide helpful guidance with fallback option
          setError(error.message);
        } else {
          setError(error.message || 'Script analysis failed. Please try again later.');
        }
      } else {
        setError('Script analysis failed. Please try again later or use the fallback analysis.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Add function to use mock analysis data as fallback
  const useFallbackAnalysis = () => {
    setScriptData(prev => ({
      ...prev,
      aiAnalysis: mockAnalysisData
    }));
    setError("");
  };
  
  const {marketplace} = useMarketplace();
  // Similarly update the handleSubmitScript function for consistent auth pattern
  const handleSubmitScript = async () => {
    setIsSubmitting(true);
    setError("");

    const endpoint = marketplace === 'audio' ? '/api/audiomarket/submissions' : '/api/submission'

    // Validate required fields
    if (!scriptData.title || !scriptData.genre || !scriptData.content || !scriptData.logline 
        || !scriptData.targetAudience || !scriptData.synopsis || !scriptData.projectId) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }
    
    // Check AI analysis completion only if not skipped
    if (!scriptData.skipAiAnalysis && (!scriptData.aiAnalysis || !scriptData.aiAnalysis.overall)) {
      setError("Please complete the AI analysis step before submitting");
      setIsSubmitting(false);
      return;
    }

    try {
      // Get the wallet address - required for auth
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (!walletAddress) {
        setError("Please connect your wallet to submit your script");
        setIsSubmitting(false);
        return;
      }
      
      // Initialize auth headers with proper structure matching middleware expectations
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress,
        'x-user-role': 'writer'
      };
      
      // Store role in localStorage for middleware access 
      localStorage.setItem('userRole', 'writer');
      
      // First verify user authentication before submission 
      console.log("Verifying user authentication before submission...");
      const authCheck = await fetch('/api/users/me', {
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store'
      });
      
      // If user is not found, handle the error
      if (!authCheck.ok) {
        console.error("Authentication failed:", authCheck.status);
        if (authCheck.status === 404) {
          throw new Error("User not found. Please sign up first.");
        } else {
          throw new Error("Authentication error. Please try signing in again.");
        }
      }
      
      console.log("User authenticated successfully, proceeding with submission");

      // Prepare submission data with field names matching API expectations
      const submissionData = {
        title: scriptData.title,
        content: scriptData.content,
        project_id: scriptData.projectId, // API expects snake_case
        logline: scriptData.logline,
        synopsis: scriptData.synopsis,
        genre: scriptData.genre,
        target_audience: scriptData.targetAudience, // API expects snake_case
        market: scriptData.market, // Add market field
        runtime: scriptData.runtime || '',
        comparables: scriptData.comparables || '',
        analysis: scriptData.aiAnalysis
      };
      
      // Use the correct API endpoint from the documentation
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(submissionData),
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to submit script");
      }

      const data = await response.json();
      
      setSubmissionId(data.submission_id);
      setSubmissionSuccess(true);
      
      // Initiate NFT minting with the same authentication pattern
      try {
        if (data.submission_id) {
          await fetch("/api/nft/mint", {
            method: "POST",
            headers,
            body: JSON.stringify({
              submission_id: data.submission_id,
              title: scriptData.title,
              content: scriptData.content,
            }),
            credentials: 'include',
            cache: 'no-store',
          });
        }
      } catch (nftError) {
        console.error("NFT minting initiation failed:", nftError);
      }
    } catch (error: any) {
      console.error("Script submission error:", error);
      setError(error.message || "Failed to submit script");
      
      // If user not found, redirect to signup
      if (error.message.includes("User not found")) {
        console.log("User not found, redirecting to signup");
        router.push('/signup');
      }
      
      setIsSubmitting(false);
    }
  };

  // Update the renderStepContent function to match the screenshot styling
  const renderStepContent = () => {
    // Step 1: Script Details (styled to match screenshot)
    if (currentStep === 1) {
        return (
          <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Script Details</h2>
          <p className="text-gray-400 mb-6">Provide basic information about your script</p>
          
          {/* Script Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-white font-medium mb-2">
              Script Title <span className="text-red-500">*</span>
                  </label>
                  <input
              id="title"
                    type="text"
                    value={scriptData.title}
              onChange={(e) => setScriptData({...scriptData, title: e.target.value})}
              placeholder="Enter a descriptive title for your script"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    required
                  />
                </div>
                
          {/* Script Description / Synopsis */}
          <div className="mb-6">
            <label htmlFor="synopsis" className="block text-white font-medium mb-2">
              Script Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="synopsis"
              value={scriptData.synopsis}
              onChange={(e) => setScriptData({...scriptData, synopsis: e.target.value})}
              placeholder="Describe your script and what you're looking for in detail"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white h-36"
              required
            />
            <p className="text-gray-400 text-sm mt-1">Provide a comprehensive overview of your script to help producers understand your vision</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Genre */}
                <div>
              <label htmlFor="genre" className="block text-white font-medium mb-2">
                Genre <span className="text-red-500">*</span>
                  </label>
                  <select
                id="genre"
                    value={scriptData.genre}
                onChange={(e) => setScriptData({...scriptData, genre: e.target.value})}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    required
                  >
                    <option value="">Select a genre</option>
                    <option value="Action">Action</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Drama">Drama</option>
                    <option value="Fantasy">Fantasy</option>
                <option value="Horror">Horror</option>
                    <option value="Romance">Romance</option>
                <option value="Sci-Fi">Science Fiction</option>
                <option value="Thriller">Thriller</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Animation">Animation</option>
                <option value="Other">Other</option>
                  </select>
                </div>
                
            {/* Project Selection */}
                <div>
              <label htmlFor="projectId" className="block text-white font-medium mb-2">
                Submit to Project <span className="text-red-500">*</span>
                  </label>
                  <select
                id="projectId"
                value={scriptData.projectId || ''}
                onChange={(e) => setScriptData({
                  ...scriptData, 
                  projectId: e.target.value,
                  projectTitle: availableProjects.find(p => p.id.toString() === e.target.value)?.title || ''
                })}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    required
                  >
                <option value="">Select a project</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.title}
                  </option>
                ))}
                  </select>
              {isLoadingProjects && (
                <p className="mt-2 text-sm text-gray-400 flex items-center">
                  <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                  Loading available projects...
                </p>
              )}
                </div>
              </div>
          
          {projectData && (
            <div className="mt-3 p-3 border border-[rgb(var(--accent-primary))]/20 bg-[rgb(var(--accent-primary))]/10 rounded-lg">
              <p className="text-white font-medium">{projectData.title}</p>
              <p className="text-sm text-gray-400 mt-1">
                {projectData.description 
                  ? `${projectData.description.substring(0, 100)}...` 
                  : "No description available"}
              </p>
            </div>
          )}
          
          {/* Target Audience */}
          <div className="mt-4">
            <label htmlFor="targetAudience" className="block text-white font-medium mb-2">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <input
              id="targetAudience"
              type="text"
              value={scriptData.targetAudience}
              onChange={(e) => setScriptData({...scriptData, targetAudience: e.target.value})}
              placeholder="e.g., Adults 18-35, Young Adults, Family, etc."
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
              required
            />
            <p className="text-sm text-gray-400 mt-1">Specify the intended audience demographic for your script</p>
              </div>
              
          {/* Market/Platform */}
          <div className="mt-4">
            <label htmlFor="market" className="block text-white font-medium mb-2">
              Market/Platform (Optional)
            </label>
            <input
              id="market"
              type="text"
              value={scriptData.market || ''}
              onChange={(e) => setScriptData({...scriptData, market: e.target.value})}
              placeholder="e.g., Netflix, Amazon Prime, Theaters, etc."
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
            />
            <p className="text-sm text-gray-400 mt-1">Specify the intended market or platform for your script</p>
          </div>
          
          {/* Logline */}
          <div className="mt-4">
            <label htmlFor="logline" className="block text-white font-medium mb-2">
              Logline <span className="text-red-500">*</span>
                  </label>
                  <textarea
              id="logline"
                    value={scriptData.logline}
              onChange={(e) => setScriptData({...scriptData, logline: e.target.value})}
              placeholder="A one-sentence summary of your script"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white h-24"
                    required
                  />
            <p className="text-sm text-gray-400 mt-1">Clearly explain your concept in a single compelling sentence</p>
                </div>
        </div>
      );
    }
    
    // Step 2: Upload Script
    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Upload Script</h2>
          <p className="text-gray-400 mb-6">Enter your complete script content below</p>
          
          <div className="flex flex-col space-y-6">
            {/* Script content textarea */}
                <div>
              <label htmlFor="scriptContent" className="block text-white font-medium mb-2">
                Script Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                id="scriptContent"
                value={scriptData.content}
                onChange={(e) => setScriptData({...scriptData, content: e.target.value})}
                placeholder="Paste or type your full script here..."
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white h-[500px] font-mono"
                    required
                  />
              <p className="text-sm text-gray-400 mt-2">
                Enter your complete script content. This will be analyzed by our AI to provide feedback and insights.
              </p>
            </div>
            
            {/* Optional fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label htmlFor="runtime" className="block text-white font-medium mb-2">
                  Estimated Runtime (optional)
                    </label>
                    <input
                  id="runtime"
                  type="text"
                      value={scriptData.runtime || ''}
                  onChange={(e) => setScriptData({...scriptData, runtime: e.target.value})}
                  placeholder="e.g., 90 minutes, 30 minutes, etc."
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    />
                </div>
                
              <div>
                <label htmlFor="comparables" className="block text-white font-medium mb-2">
                  Comparable Works (optional)
                  </label>
                  <input
                  id="comparables"
                    type="text"
                    value={scriptData.comparables || ''}
                  onChange={(e) => setScriptData({...scriptData, comparables: e.target.value})}
                  placeholder="e.g., 'Similar to The Office meets Stranger Things'"
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                  />
                </div>
                </div>
            
            {/* AI Analysis Option */}
            <div className="mt-6 p-5 border border-white/10 bg-black/30 rounded-lg">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={!scriptData.skipAiAnalysis}
                  onChange={(e) => setScriptData({...scriptData, skipAiAnalysis: !e.target.checked})}
                  className="mt-1 w-4 h-4 text-[rgb(var(--accent-primary))] bg-black/30 border-white/10 rounded focus:ring-[rgb(var(--accent-primary))]"
                />
                <div className="ml-3">
                  <p className="text-white font-medium">Enable AI Script Analysis</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Our AI will analyze your script to provide feedback on structure, character development, 
                    marketability, and more. This can help improve your script and increase its chances of being selected.
                    </p>
                  </div>
                </label>
                </div>
                
            <div className="mt-2 p-4 border border-amber-600/30 bg-amber-500/10 rounded-lg">
              <div className="flex items-start">
                <InformationCircleIcon className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-300 font-medium">Important Note</p>
                  <p className="text-amber-200/80 text-sm mt-1">
                    {scriptData.skipAiAnalysis 
                      ? "You've chosen to skip AI analysis. Your script will be submitted directly without AI feedback."
                      : "In the next step, our AI will analyze your script to provide feedback. Please ensure your script is complete and formatted properly for the best analysis results."}
                  </p>
                </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
      
    // Step 3: AI Analysis
    if (currentStep === 3) {
        return (
          <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">AI Script Analysis</h2>
          <p className="text-gray-400 mb-6">Get AI-powered insights into your script</p>
          
          {/* Show error message prominently if there is one */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-300 font-medium">Error analyzing script</p>
                <p className="text-red-300 mt-1">{error}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setError("")}
                    className="text-red-300 hover:text-red-200 text-sm px-3 py-1 border border-red-700/50 rounded"
                  >
                    Clear error
                  </button>
                  {(error.includes("AI service") || error.includes("AI model")) && (
                    <button
                      onClick={useFallbackAnalysis}
                      className="text-green-300 hover:text-green-200 text-sm px-3 py-1 border border-green-700/50 rounded flex items-center"
                    >
                      <ChartBarIcon className="w-4 h-4 mr-1" />
                      Use Fallback Analysis
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setScriptData(prev => ({...prev, skipAiAnalysis: true}));
                      setCurrentStep(4); // Skip to review step
                    }}
                    className="text-amber-300 hover:text-amber-200 text-sm px-3 py-1 border border-amber-700/50 rounded flex items-center"
                  >
                    <ArrowRightIcon className="w-4 h-4 mr-1" />
                    Skip AI Analysis
                  </button>
                  </div>
                    </div>
                  </div>
                )}
              
          {!scriptData.aiAnalysis?.overall ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="bg-black/30 border border-white/10 rounded-xl p-8 max-w-xl w-full text-center">
                <ChartBarIcon className="w-16 h-16 text-[rgb(var(--accent-primary))] mx-auto mb-6" />
                <h3 className="text-lg font-medium text-white mb-3">AI Script Analysis</h3>
                <p className="text-gray-400 mb-6">
                  Our AI will analyze your script to provide feedback on structure, character development, 
                  marketability, and more. This can help improve your script and increase its chances of being selected.
                  <br/><br/>
                  <span className="text-amber-300">Note: This feature is available without authentication.</span>
                </p>
                
                {isAnalyzing ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 relative mb-4">
                      <div className="absolute inset-0 border-t-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
                    </div>
                    <p className="text-white font-medium">Analyzing your script...</p>
                    <p className="text-gray-400 text-sm mt-2">This may take a minute or two depending on the length of your script.</p>
                  </div>
                ) : (
                      <button 
                        onClick={analyzeScript}
                    className="px-8 py-3 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg text-white font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                      >
                    <ChartBarIcon className="w-5 h-5" />
                    Start AI Analysis
                      </button>
                )}
              </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
              {/* Overall Score */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">Overall Score</h3>
                  <div className="bg-[rgb(var(--accent-primary))]/20 px-3 py-1 rounded-full">
                    <span className="text-[rgb(var(--accent-primary))] font-semibold">{scriptData.aiAnalysis?.overall}/100</span>
                          </div>
                        </div>
                <p className="text-gray-400">{scriptData.aiAnalysis?.analysis}</p>
                      </div>
                      
                      {/* Score Breakdown */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-6">Score Breakdown</h3>
                
                        <div className="space-y-5">
                  {/* Creativity */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">Creativity</span>
                      <span className="text-[rgb(var(--accent-primary))]">{scriptData.aiAnalysis?.creativity}/100</span>
                                </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] h-2 rounded-full" 
                        style={{ width: `${scriptData.aiAnalysis?.creativity ?? 0}%` }}
                                  ></div>
                                </div>
                              </div>
                  
                  {/* Structure */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">Structure</span>
                      <span className="text-[rgb(var(--accent-primary))]">{scriptData.aiAnalysis?.structure}/100</span>
                        </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] h-2 rounded-full" 
                        style={{ width: `${scriptData.aiAnalysis?.structure ?? 0}%` }}
                      ></div>
                      </div>
                    </div>
                  
                  {/* Character Development */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">Character Development</span>
                      <span className="text-[rgb(var(--accent-primary))]">{scriptData.aiAnalysis?.character_development}/100</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] h-2 rounded-full" 
                        style={{ width: `${scriptData.aiAnalysis?.character_development ?? 0}%` }}
                      ></div>
                    </div>
                </div>
                
                  {/* Marketability */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">Marketability</span>
                      <span className="text-[rgb(var(--accent-primary))]">{scriptData.aiAnalysis?.marketability}/100</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] h-2 rounded-full" 
                        style={{ width: `${scriptData.aiAnalysis?.marketability ?? 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        Strengths
                      </h3>
                  <ul className="space-y-2">
                    {scriptData.aiAnalysis?.strengths?.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                          <span className="text-green-500 text-xs">✓</span>
                    </div>
                        <span className="text-gray-300">{strength}</span>
                          </li>
                        ))}
                      </ul>
                  </div>
                  
                {/* Weaknesses */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <XMarkIcon className="w-5 h-5 text-amber-500 mr-2" />
                        Areas for Improvement
                      </h3>
                  <ul className="space-y-2">
                    {scriptData.aiAnalysis?.weaknesses?.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                          <span className="text-amber-500 text-xs">!</span>
                    </div>
                        <span className="text-gray-300">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                  </div>
                </div>
                
              {/* Keywords & Tags */}
              {scriptData.aiAnalysis?.keywords && scriptData.aiAnalysis?.keywords.length > 0 && (
                <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Script Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {scriptData.aiAnalysis?.keywords?.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-[rgb(var(--accent-primary))]/10 border border-[rgb(var(--accent-primary))]/20 rounded-full text-[rgb(var(--accent-primary))] text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                    </div>
                      </div>
                    )}
                  </div>
            )}
          </div>
        );
    }
      
    // Step 4: Review & Submit
    if (currentStep === 4) {
        return (
          <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Review & Submit</h2>
          <p className="text-gray-400 mb-6">Review your script details before submitting</p>
          
          <div className="space-y-8">
            {/* Script Details Summary */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Script Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                  <p className="text-gray-400 text-sm">Title</p>
                  <p className="text-white">{scriptData.title}</p>
                  </div>
                  <div>
                  <p className="text-gray-400 text-sm">Genre</p>
                  <p className="text-white">{scriptData.genre}</p>
                  </div>
                  <div>
                  <p className="text-gray-400 text-sm">Target Audience</p>
                  <p className="text-white">{scriptData.targetAudience}</p>
                  </div>
                  <div>
                  <p className="text-gray-400 text-sm">Market/Platform</p>
                  <p className="text-white">{scriptData.market || 'Not specified'}</p>
                  </div>
                    <div>
                  <p className="text-gray-400 text-sm">Project</p>
                  <p className="text-white">{scriptData.projectTitle}</p>
                    </div>
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-sm">Logline</p>
                  <p className="text-white">{scriptData.logline}</p>
                    </div>
              </div>
                  </div>
                  
            {/* Analysis Summary (if analysis was performed) */}
            {!scriptData.skipAiAnalysis && scriptData.aiAnalysis && (scriptData.aiAnalysis?.overall ?? 0) > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">AI Analysis Results</h3>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-400 text-sm">Overall Score</p>
                    <p className="text-[rgb(var(--accent-primary))] text-xl font-semibold">{scriptData.aiAnalysis?.overall}/100</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-400 text-sm">Creativity</p>
                    <p className="text-white">{scriptData.aiAnalysis?.creativity}/100</p>
                    </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-400 text-sm">Structure</p>
                    <p className="text-white">{scriptData.aiAnalysis?.structure}/100</p>
                    </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-400 text-sm">Character Development</p>
                    <p className="text-white">{scriptData.aiAnalysis?.character_development}/100</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-gray-400 text-sm">Marketability</p>
                    <p className="text-white">{scriptData.aiAnalysis?.marketability}/100</p>
                          </div>
                          </div>
                        </div>
            )}
            
            {/* Blockchain Notice */}
            <div className="bg-amber-500/10 border border-amber-600/30 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Blockchain NFT Creation</h3>
                  <p className="text-gray-300">
                    Upon submission, an NFT (Non-Fungible Token) will be created on the blockchain to 
                    represent ownership of your script. This provides proof of authorship 
                    and enables secure ownership transfer if your script is purchased.
                  </p>
                  <div className="mt-4 p-3 bg-black/30 border border-white/10 rounded-lg">
                    <p className="text-gray-400 text-sm">Wallet Address</p>
                    <p className="text-white font-mono text-sm truncate">{walletAddress || "Not connected"}</p>
                  </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
      
        return null;
  };

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/writer/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
            <ArrowLongLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
                          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Submit New Script</h1>
          <p className="text-gray-400">Fill in the details to submit your script</p>
                        </div>
        
        {/* Show confirmation if submitted successfully, otherwise show the form */}
        {submissionSuccess && submissionId ? (
          <SubmissionConfirmation 
            submissionId={submissionId} 
            projectTitle={scriptData.projectTitle || undefined}
          />
        ) : (
          <div>
            {/* Step indicator */}
            <div className="flex items-center mb-8">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                
                const StepIcon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div 
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isActive 
                          ? 'bg-[rgb(var(--accent-primary))]' 
                          : isCompleted 
                          ? 'bg-green-500' 
                          : 'bg-white/10'
                      }`}
                    >
                      <StepIcon className="w-5 h-5 text-white" />
                    </div>
                    <span 
                      className={`ml-2 text-sm font-medium ${
                        isActive || isCompleted ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                    </span>
                    
                    {index < steps.length - 1 && (
                      <div className="w-8 h-px bg-white/10 mx-4"></div>
                    )}
                    </div>
                );
              })}
                  </div>
            
            {/* Form content */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-6">
              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-300">{error}</p>
              </div>
              )}
              
              {/* Step content */}
              {renderStepContent()}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
              <button
                  onClick={goToPrevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                    currentStep === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-transparent border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  <ArrowLongLeftIcon className="w-5 h-5" />
                Back
              </button>
              
                {currentStep < steps.length ? (
                <button
                    onClick={goToNextStep}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    {isAnalyzing ? (
                      <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" /> 
                        Analyzing...
                      </>
                  ) : (
                    <>
                        Next
                        <ArrowLongRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                    onClick={handleSubmitScript}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-lg text-white font-medium ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 transition-opacity'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Submitting...
                    </>
                  ) : (
                    <>
                        <PaperAirplaneIcon className="w-5 h-5" />
                        Submit Script
                    </>
                  )}
                </button>
              )}
                  </div>
                </div>
              </div>
            )}
          </div>
    </DashboardLayout>
  );
} 

export default SubmitScript; 