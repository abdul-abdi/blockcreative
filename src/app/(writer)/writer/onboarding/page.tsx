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
import { useSession } from 'next-auth/react';
import { useUser } from '@/lib/hooks/useUser';

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
  const { data: session, status } = useSession();
  const router = useRouter();
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

  const { user, isLoading: isUserLoading, mutate: refreshUser } = useUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
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
    }
  }, [status, router]);

  // Fetch user data if it exists
  useEffect(() => {
    // Use data from the custom hook if available
    if (user && user.role === 'writer') {
      // Pre-fill form with existing data
      console.log('Using cached user data for pre-filling form:', user);
      
      if (user.profile_data) {
        const profileData = user.profile_data;
        
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
      if (user.onboarding_completed) {
        console.log('Onboarding already completed, redirecting to dashboard');
        router.push('/writer/dashboard');
      }
    }
  }, [user, router]);

  const currentStep = steps[currentStepIndex];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (for social)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => {
      if (prev.genres.includes(genre)) {
        return {
          ...prev,
          genres: prev.genres.filter(g => g !== genre)
        };
      } else {
        return {
          ...prev,
          genres: [...prev.genres, genre]
        };
      }
    });
  };

  const handleProjectTypeToggle = (type: string) => {
    setFormData(prev => {
      if (prev.project_types.includes(type)) {
        return {
          ...prev,
          project_types: prev.project_types.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          project_types: [...prev.project_types, type]
        };
      }
    });
  };

  const validateStep = () => {
    setError(null);
    
    switch (currentStep.id) {
      case 'profile':
        if (!formData.name.trim()) {
          setError('Name is required');
          return false;
        }
        if (!formData.bio.trim()) {
          setError('Bio is required');
          return false;
        }
        break;
      case 'writing':
        if (!formData.writing_experience.trim()) {
          setError('Please share some information about your writing experience');
          return false;
        }
        break;
      case 'preferences':
        if (formData.genres.length === 0) {
          setError('Please select at least one genre');
          return false;
        }
        if (formData.project_types.length === 0) {
          setError('Please select at least one project type');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Get connected wallet address if available
      const connectedAddress = localStorage.getItem('walletAddress');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add wallet address to headers if available
      if (connectedAddress) {
        headers['x-wallet-address'] = connectedAddress;
        console.log('Using wallet address for onboarding:', connectedAddress);
      } else {
        console.error('No wallet address found in localStorage');
        setError('No wallet address found. Please connect your wallet again.');
        setIsSubmitting(false);
        return;
      }
      
      // Prepare data for API
      const onboardingData = {
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar || '',
        portfolio_url: formData.portfolio_url || '',
        writing_experience: formData.writing_experience || '',
        genres: formData.genres || [],
        project_types: formData.project_types || [],
        social: formData.social || { twitter: '', linkedin: '', instagram: '' }
      };
      
      console.log('Submitting writer onboarding data:', onboardingData);
      
      // First, check if user exists already
      const checkResponse = await fetch('/api/users/me', {
        headers
      });
      
      let shouldCreateUser = false;
      
      if (checkResponse.status === 404) {
        console.log('User not found in database, will create during onboarding');
        shouldCreateUser = true;
      } else if (!checkResponse.ok) {
        console.error('Error checking user existence:', await checkResponse.text());
      }
      
      // If user doesn't exist, create them first
      if (shouldCreateUser) {
        console.log('Creating new user before onboarding...');
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            address: connectedAddress,
            role: 'writer',
            profile_data: onboardingData,
            onboarding_completed: false
          })
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.error('Error creating user:', errorData);
          throw new Error(errorData.error || errorData.message || 'Failed to create user account');
        }
        
        console.log('Successfully created new user account');
      }
      
      // Submit to onboarding API
      console.log('Submitting to writer onboarding API...');
      const response = await fetch('/api/onboarding/writer', {
        method: 'POST',
        headers,
        body: JSON.stringify(onboardingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Onboarding API error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to complete onboarding');
      }
      
      const responseData = await response.json();
      console.log('Onboarding API response:', responseData);
      
      // Save user data in localStorage for persistence
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userRole', 'writer');
      
      // Update complete status
      console.log('Marking onboarding as complete...');
      const completeResponse = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: 'writer' })
      });
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        console.error('Complete API error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to mark onboarding as complete');
      }
      
      const completeData = await completeResponse.json();
      console.log('Complete API response:', completeData);
      
      // Set onboarding completed in localStorage as a fallback
      localStorage.setItem('onboardingCompleted', 'true');
      
      setSuccess('Onboarding completed successfully!');
      
      // Redirect to dashboard after a short delay
      console.log('Onboarding successful, redirecting to dashboard');
      setTimeout(() => {
        router.push('/writer/dashboard');
      }, 2000);
      
    } catch (error: any) {
      console.error('Onboarding error:', error);
      setError(error.message || 'Failed to complete onboarding');
      
      // Retry logic for transient errors
      if (error.message && error.message.includes('Failed to fetch') || error.message.includes('network')) {
        setError('Network error: Please check your connection and try again');
      }
    } finally {
      setIsSubmitting(false);
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                    onClick={() => handleGenreToggle(genre)}
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
                    onClick={() => handleProjectTypeToggle(type)}
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

  return (
    <div className="min-h-screen bg-black text-white pt-8 pb-16">
      {isRedirecting ? (
        <div className="max-w-xl mx-auto px-4 mt-20">
          <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-8 text-center shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-4">Role Mismatch</h2>
            <p className="text-red-200 text-lg mb-6">{error}</p>
            <p className="text-white mb-6">
              Redirecting you in <span className="font-bold text-xl">{redirectTimer}</span> seconds...
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/signup')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Back to Signup
              </button>
              <button
                onClick={() => {
                  const storedRole = localStorage.getItem('userRole');
                  if (storedRole) {
                    router.push(`/${storedRole}/dashboard`);
                  } else {
                    router.push('/');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
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
              onClick={handlePrevious}
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
              onClick={handleNext}
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
      )}
    </div>
  );
}