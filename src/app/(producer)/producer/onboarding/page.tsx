'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  WalletIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';

const steps = [
  {
    id: 'company',
    name: 'Company Details',
    icon: BuildingOfficeIcon,
    description: 'Tell us about your company'
  },
  {
    id: 'funding',
    name: 'Funding Information',
    icon: WalletIcon,
    description: 'Verify your funding wallet'
  },
  {
    id: 'preferences',
    name: 'Project Preferences',
    icon: Cog6ToothIcon,
    description: 'Set your preferences'
  }
];

export default function ProducerOnboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    company_name: '',
    company_website: '',
    team_size: '',
    project_types: [] as string[],
    budget_range: '',
    industry: '',
    location: '',
    phone: '',
    genres: [] as string[],
    social: {
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

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
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
    
    // Check if user has the correct role
    const storedRole = localStorage.getItem('userRole');
    if (storedRole && storedRole !== 'producer') {
      setIsRedirecting(true);
      setError(`You are registered as a ${storedRole}. You cannot access producer onboarding.`);
      
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
    const fetchUserData = async () => {
      try {
        const walletAddress = localStorage.getItem('walletAddress');
        if (!walletAddress) return;
        
        console.log('Fetching producer data for wallet:', walletAddress);
        const response = await fetch('/api/users/me', {
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': walletAddress
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role === 'producer') {
            // Pre-fill form with existing data
            const userData = data.user;
            console.log('Fetched existing producer data for pre-filling form:', userData);
            
            if (userData.profile_data) {
              const pd = userData.profile_data;
              setFormData({
                name: pd.name || '',
                bio: pd.bio || '',
                avatar: pd.avatar || '',
                company_name: pd.company || '',
                company_website: pd.website || '',
                team_size: pd.team_size || '',
                budget_range: pd.budget_range || '',
                industry: pd.industry || 'Entertainment',
                location: pd.location || '',
                phone: pd.phone || '',
                project_types: pd.project_types || [],
                genres: pd.genres || [],
                social: pd.social || {
                  twitter: '',
                  linkedin: '',
                  instagram: ''
                }
              });
            }
            
            // If onboarding is already completed, redirect to dashboard
            if (userData.onboarding_completed) {
              console.log('Producer onboarding already completed, redirecting to dashboard');
              router.push('/producer/dashboard');
            }
          }
        } else if (response.status !== 404) {
          // Only show error for unexpected errors, not 404 (which is expected for new users)
          console.error('Error fetching producer data:', await response.text());
        } else {
          console.log('No existing producer found with this wallet address - continuing with onboarding as new user');
        }
      } catch (error) {
        console.error('Error fetching producer data:', error);
      }
    };
    
    if (status !== 'loading' && !isRedirecting) {
      fetchUserData();
    }
  }, [status, router, isRedirecting]);

  const currentStep = steps[currentStepIndex];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const validateCurrentStep = () => {
    setError(null);
    
    switch (currentStep.id) {
      case 'company':
        if (!formData.name.trim()) {
          setError('Name is required');
          return false;
        }
        if (!formData.bio.trim()) {
          setError('Bio is required');
          return false;
        }
        if (!formData.company_name.trim()) {
          setError('Company name is required');
          return false;
        }
        break;
      // Add validation for other steps if needed
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
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
        console.log('Using wallet address for producer onboarding:', connectedAddress);
      } else {
        console.error('No wallet address found in localStorage');
        setError('No wallet address found. Please connect your wallet again.');
        setIsSubmitting(false);
        return;
      }
      
      // Prepare complete producer profile data
      const producerData = {
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar || '',
        company_name: formData.company_name,
        company_website: formData.company_website || '',
        team_size: formData.team_size || '',
        budget_range: formData.budget_range || '',
        industry: formData.industry || 'Entertainment',
        location: formData.location || '',
        phone: formData.phone || '',
        social: formData.social || { twitter: '', linkedin: '', instagram: '' }
      };
      
      console.log('Submitting producer onboarding data:', producerData);
      
      // First, check if user exists already
      const checkResponse = await fetch('/api/users/me', {
        headers
      });
      
      let shouldCreateUser = false;
      
      if (checkResponse.status === 404) {
        console.log('Producer not found in database, will create during onboarding');
        shouldCreateUser = true;
      } else if (!checkResponse.ok) {
        console.error('Error checking producer existence:', await checkResponse.text());
      }
      
      // If user doesn't exist, create them first
      if (shouldCreateUser) {
        console.log('Creating new producer account before onboarding...');
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            address: connectedAddress,
            role: 'producer',
            profile_data: producerData,
            onboarding_completed: false
          })
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.error('Error creating producer account:', errorData);
          throw new Error(errorData.error || errorData.message || 'Failed to create producer account');
        }
        
        console.log('Successfully created new producer account');
      }
      
      // First, save the profile data
      console.log('Submitting to producer onboarding API...');
      const profileResponse = await fetch('/api/onboarding/producer', {
        method: 'POST',
        headers,
        body: JSON.stringify(producerData)
      });
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        console.error('Producer onboarding API error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to complete producer onboarding');
      }
      
      const responseData = await profileResponse.json();
      console.log('Producer onboarding response:', responseData);
      
      // Save user data in localStorage for persistence
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userCompany', formData.company_name);
      
      // Then, mark onboarding as complete
      console.log('Marking producer onboarding as complete...');
      const completeResponse = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: 'producer' })
      });
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        console.error('Complete API error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to mark producer onboarding as complete');
      }
      
      const completeData = await completeResponse.json();
      console.log('Complete API response:', completeData);
      
      // Set onboarding completed in localStorage as a fallback
      localStorage.setItem('onboardingCompleted', 'true');
      localStorage.setItem('userRole', 'producer');
      
      setSuccess('Producer onboarding completed successfully!');
      
      // Redirect to dashboard after a short delay
      console.log('Producer onboarding successful, redirecting to dashboard');
      setTimeout(() => {
        router.push('/producer/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Producer onboarding error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      // Retry logic for transient errors
      if (err instanceof Error && 
         (err.message.includes('Failed to fetch') || err.message.includes('network'))) {
        setError('Network error: Please check your connection and try again');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {isRedirecting ? (
        <div className="max-w-xl mx-auto px-4 pt-20">
          <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-8 text-center shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-4">Role Mismatch</h2>
            <p className="text-red-200 text-lg mb-6">{error}</p>
            <p className="text-white mb-6">
              Redirecting you in <span className="font-bold text-xl">{redirectTimer}</span> seconds...
            </p>
            <div className="flex flex-wrap justify-center gap-4">
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
        <div className="container max-w-4xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Producer Onboarding</h1>
            <p className="text-gray-400 text-lg">Complete your studio profile to start finding scripts</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center ${index <= currentStepIndex ? 'text-white' : 'text-gray-500'}`}
                >
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      index < currentStepIndex 
                        ? 'bg-green-500' 
                        : index === currentStepIndex 
                          ? 'bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]' 
                          : 'bg-gray-800'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.name}</span>
                  <span className="text-xs text-gray-500">{step.description}</span>
                </div>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Form Steps */}
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card p-8 rounded-xl"
          >
            {currentStep.id === 'company' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Company Details</h2>
                <p className="text-gray-400">Tell us about your studio or production company.</p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Your Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Your Bio *</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                      placeholder="Tell us about your background and experience..."
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-1">Company Name *</label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                      placeholder="e.g., Universal Studios"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="company_website" className="block text-sm font-medium text-gray-300 mb-1">Company Website</label>
                    <input
                      type="text"
                      id="company_website"
                      name="company_website"
                      value={formData.company_website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                      placeholder="https://company-website.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-1">Company Logo URL</label>
                    <input
                      type="text"
                      id="avatar"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                      placeholder="https://example.com/logo.jpg"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="team_size" className="block text-sm font-medium text-gray-300 mb-1">Team Size</label>
                    <select
                      id="team_size"
                      name="team_size"
                      value={formData.team_size}
                      onChange={handleInputChange as any}
                      className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                    >
                      <option value="" disabled>Select team size</option>
                      <option value="1-5">1-5 employees</option>
                      <option value="6-20">6-20 employees</option>
                      <option value="21-50">21-50 employees</option>
                      <option value="51-100">51-100 employees</option>
                      <option value="100+">100+ employees</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep.id === 'funding' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Company Information</h2>
                <p className="text-gray-400">Additional details about your company.</p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      BlockCreative lets you connect with talented writers and discover amazing scripts for your next project.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="team_size" className="block text-sm font-medium text-gray-300 mb-1">Team Size</label>
                    <select
                      id="team_size"
                      name="team_size"
                      value={formData.team_size}
                      onChange={handleInputChange as any}
                      className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                    >
                      <option value="" disabled>Select team size</option>
                      <option value="1-5">1-5 employees</option>
                      <option value="6-20">6-20 employees</option>
                      <option value="21-50">21-50 employees</option>
                      <option value="51-100">51-100 employees</option>
                      <option value="100+">100+ employees</option>
                    </select>
                  </div>
                  
                  <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-lg mt-4">
                    <h3 className="text-white font-medium mb-2">Social Media Profiles</h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="twitter" className="block text-xs text-gray-400 mb-1">Twitter</label>
                        <input
                          type="text"
                          id="twitter"
                          name="social.twitter"
                          value={formData.social.twitter}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                          placeholder="@company"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="linkedin" className="block text-xs text-gray-400 mb-1">LinkedIn</label>
                        <input
                          type="text"
                          id="linkedin"
                          name="social.linkedin"
                          value={formData.social.linkedin}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                          placeholder="https://linkedin.com/company/name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="instagram" className="block text-xs text-gray-400 mb-1">Instagram</label>
                        <input
                          type="text"
                          id="instagram"
                          name="social.instagram"
                          value={formData.social.instagram}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-zinc-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent"
                          placeholder="@company"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep.id === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Project Preferences</h2>
                <p className="text-gray-400">Tell us about the types of projects and scripts you're looking for.</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Project Types</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {['Feature Films', 'TV Series', 'Short Films', 'Web Series', 'Documentaries', 'Animation'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleProjectTypeToggle(type)}
                          className={`px-4 py-3 rounded-lg border ${
                            formData.project_types.includes(type)
                              ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/10'
                              : 'border-gray-700 bg-zinc-900'
                          } hover:bg-zinc-800 transition-colors text-left`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Budget Range</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['$1K-$10K', '$10K-$50K', '$50K-$100K', '$100K-$500K', '$500K+', 'Varies'].map((budget) => (
                        <button
                          key={budget}
                          type="button"
                          onClick={() => setFormData({ ...formData, budget_range: budget })}
                          className={`px-4 py-3 rounded-lg border ${
                            formData.budget_range === budget
                              ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/10'
                              : 'border-gray-700 bg-zinc-900'
                          } hover:bg-zinc-800 transition-colors`}
                        >
                          {budget}
                        </button>
                      ))}
                    </div>
                  </div>
                  
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
                </div>
              </div>
            )}
            
            {error && !isRedirecting && (
              <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mt-6 p-4 bg-green-900/50 border border-green-500 rounded-lg">
                <p className="text-green-400">{success}</p>
              </div>
            )}
            
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                  currentStepIndex === 0
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-white/5 text-white hover:bg-white/10'
                } transition-colors`}
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back
              </button>
              
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    <span>{currentStepIndex === steps.length - 1 ? 'Completing...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <span>{currentStepIndex === steps.length - 1 ? 'Complete' : 'Continue'}</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 