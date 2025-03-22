'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAccount } from 'wagmi';

const steps = [
  {
    id: 'profile',
    name: 'Personal Details',
    icon: UserIcon,
    description: 'Tell us about yourself'
  },
  {
    id: 'writing',
    name: 'Writing Experience',
    icon: DocumentTextIcon,
    description: 'Share your writing background'
  },
  {
    id: 'preferences',
    name: 'Project Preferences',
    icon: Cog6ToothIcon,
    description: 'Set your preferences'
  }
];

export default function WriterOnboarding() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    writing_experience: '',
    portfolio_url: '',
    social: {
      twitter: '',
      linkedin: '',
      instagram: ''
    },
    genres: [] as string[],
    project_types: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // Circuit breaker for onboarding loops
  useEffect(() => {
    const onboardingAttempts = parseInt(localStorage.getItem('onboardingAttempts') || '0');
    
    if (onboardingAttempts > 5) {
      // Too many onboarding attempts, something is wrong
      console.error('Too many onboarding attempts detected, redirecting to signup with reset');
      router.push('/signup?reset=true');
      return;
    }
    
    localStorage.setItem('onboardingAttempts', (onboardingAttempts + 1).toString());
    
    // Clear onboarding attempts when completed successfully
    return () => {
      if (localStorage.getItem('onboardingCompleted') === 'true') {
        localStorage.removeItem('onboardingAttempts');
      }
    };
  }, [router]);

  // Redirect if not authenticated
  useEffect(() => {
    // Check if wallet is connected
    const isAuthenticated = isConnected || !!localStorage.getItem('walletAddress');
    
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    
    // Check if user has the correct role
    const storedRole = localStorage.getItem('userRole');
    if (storedRole && storedRole !== 'writer') {
      setIsRedirecting(true);
      setError(`You are registered as a ${storedRole}. You cannot access writer onboarding.`);
      
      // Start a countdown for redirection
      let countdown = 5;
      setRedirectTimer(countdown);
      const timer = window.setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(timer);
          router.push(`/${storedRole}/dashboard`);
        } else {
          setRedirectTimer(countdown);
        }
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [router, isConnected]);

  // Fetch user data if it exists
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const walletAddress = localStorage.getItem('walletAddress') || address;
        if (!walletAddress) return;
        
        console.log('Fetching writer data for wallet:', walletAddress);
        const response = await fetch('/api/users/me', {
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': walletAddress
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          
          if (data.user && data.user.role === 'writer') {
            // Pre-fill form with existing data
            console.log('Using fetched user data for pre-filling form:', data.user);
            
            if (data.user.profile_data) {
              const profileData = data.user.profile_data;
              
              // Update form data with user profile information
              setFormData({
                name: profileData.name || '',
                bio: profileData.bio || '',
                avatar: profileData.avatar || '',
                writing_experience: profileData.writing_experience || '',
                portfolio_url: profileData.website || profileData.portfolio_url || '',
                social: {
                  twitter: profileData.social?.twitter || '',
                  linkedin: profileData.social?.linkedin || '',
                  instagram: profileData.social?.instagram || ''
                },
                genres: profileData.genres || [],
                project_types: profileData.project_types || []
              });
            }
            
            // If onboarding is already completed, redirect to dashboard
            if (data.user.onboarding_completed) {
              console.log('Onboarding already completed, redirecting to dashboard');
              router.push('/writer/dashboard');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!loading && !isRedirecting) {
      fetchUserData();
    }
  }, [loading, router, isRedirecting, address]);

  const currentStep = steps[currentStepIndex];

  // Save writer profile data
  const saveProfileData = async (currentData: any) => {
    try {
      if (!address && !localStorage.getItem('walletAddress')) {
        throw new Error('No wallet address available');
      }
      
      setIsSubmitting(true);
      setError(null);
      
      const walletAddress = localStorage.getItem('walletAddress') || address;
      
      const response = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress || ''
        },
        body: JSON.stringify({
          profile_data: {
            ...currentData,
            // Ensuring we have social data structure correct
            social: {
              twitter: currentData.social?.twitter || '',
              linkedin: currentData.social?.linkedin || '',
              instagram: currentData.social?.instagram || ''
            }
          },
          onboarding_step: currentStepIndex + 1,
          onboarding_completed: currentStepIndex === steps.length - 1
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save profile data');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error saving profile data:', error);
      setError(error.message || 'Failed to save profile data');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle next step click
  const handleNextStep = async () => {
    // Save current step data
    const result = await saveProfileData(formData);
    
    if (result) {
      if (currentStepIndex === steps.length - 1) {
        // Final step - complete onboarding
        setSuccess('Writer profile completed! Redirecting to dashboard...');
        localStorage.setItem('onboardingCompleted', 'true');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/writer/dashboard');
        }, 2000);
      } else {
        // Move to next step
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  // Handle previous step click
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (like social.twitter)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...(formData as any)[parent],
          [child]: value
        }
      });
    } else {
      // Handle simple fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle checkbox/multi-select changes
  const handleMultiSelect = (item: string, category: 'genres' | 'project_types') => {
    const current = [...formData[category]];
    
    if (current.includes(item)) {
      // Remove item if already selected
      setFormData({
        ...formData,
        [category]: current.filter(i => i !== item)
      });
    } else {
      // Add item if not selected
      setFormData({
        ...formData,
        [category]: [...current, item]
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                placeholder="Tell us about yourself in a few sentences"
              />
            </div>
            
            <div>
              <label htmlFor="portfolio_url" className="block text-sm font-medium text-gray-300 mb-1">Portfolio URL (Optional)</label>
              <input
                type="url"
                id="portfolio_url"
                name="portfolio_url"
                value={formData.portfolio_url}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                placeholder="https://your-portfolio.com"
              />
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-300">Social Media (Optional)</p>
              
              <div>
                <label htmlFor="social.twitter" className="block text-sm font-medium text-gray-400 mb-1">Twitter/X</label>
                <input
                  type="text"
                  id="social.twitter"
                  name="social.twitter"
                  value={formData.social.twitter}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                  placeholder="@username"
                />
              </div>
              
              <div>
                <label htmlFor="social.linkedin" className="block text-sm font-medium text-gray-400 mb-1">LinkedIn</label>
                <input
                  type="text"
                  id="social.linkedin"
                  name="social.linkedin"
                  value={formData.social.linkedin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                  placeholder="linkedin.com/in/username"
                />
              </div>
            </div>
          </div>
        );
        
      case 'writing':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="writing_experience" className="block text-sm font-medium text-gray-300 mb-1">Writing Experience</label>
              <textarea
                id="writing_experience"
                name="writing_experience"
                value={formData.writing_experience}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                placeholder="Tell us about your writing experience, published works, and background"
              />
            </div>
          </div>
        );
        
      case 'preferences':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-3">Preferred Genres</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Action', 'Romance', 'Thriller', 'Documentary', 'Fantasy'].map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleMultiSelect(genre, 'genres')}
                    className={`px-4 py-3 rounded-lg border ${
                      formData.genres.includes(genre)
                        ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/10'
                        : 'border-gray-700 bg-zinc-900'
                    } hover:bg-zinc-800 transition-colors`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Project Types</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Feature Film', 'TV Series', 'TV Pilot', 'Short Film', 'Web Series', 'Documentary'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleMultiSelect(type, 'project_types')}
                    className={`px-4 py-3 rounded-lg border ${
                      formData.project_types.includes(type)
                        ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/10'
                        : 'border-gray-700 bg-zinc-900'
                    } hover:bg-zinc-800 transition-colors`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Check if currently loading or redirecting
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          {isRedirecting ? (
            <>
              <div className="text-red-500 mb-4 text-xl">
                {error}
              </div>
              <p className="text-gray-400">
                Redirecting in {redirectTimer} seconds...
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading writer profile...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">Writer Onboarding</h1>
          <p className="text-gray-400">Complete your profile to get started</p>
        </div>
        
        {/* Steps indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStepIndex
                    ? 'bg-[rgb(var(--accent-primary))] text-white'
                    : index === currentStepIndex
                      ? 'bg-[rgb(var(--accent-primary))]/20 text-white border-2 border-[rgb(var(--accent-primary))]'
                      : 'bg-zinc-800 text-gray-400'
                }`}>
                  {index < currentStepIndex ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <p className={`mt-2 text-sm ${
                  index <= currentStepIndex ? 'text-white' : 'text-gray-400'
                }`}>
                  {step.name}
                </p>
              </div>
            ))}
          </div>
          
          <div className="relative mt-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1 bg-zinc-800"></div>
            </div>
            <div className="relative flex justify-between">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-10 h-1 ${
                    index <= currentStepIndex ? 'bg-[rgb(var(--accent-primary))]' : 'bg-zinc-800'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Form content */}
        <div className="bg-zinc-900 rounded-xl p-6 md:p-8 shadow-xl mb-8">
          <h2 className="text-2xl font-bold mb-6">{currentStep.description}</h2>
          
          {error && !isRedirecting && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-200">
              {success}
            </div>
          )}
          
          {renderStepContent()}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium 
              ${currentStepIndex === 0 
                ? 'bg-zinc-800 text-gray-400 cursor-not-allowed' 
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
          
          <button
            type="button"
            onClick={handleNextStep}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            ) : (
              <>
                {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}