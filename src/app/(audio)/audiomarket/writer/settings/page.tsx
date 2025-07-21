'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAccount, useDisconnect } from 'wagmi';
import { useUser } from '@/lib/hooks/useUser';
import DashboardLayout from '@/components/DashboardLayout';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import {CheckLine, Divide} from 'lucide-react'

// Define interface for writer user data structure
interface WriterUserData {
  id: string;
  address: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  website: string;
  genres: string[];
  social: {
    twitter: string;
    linkedin: string;
    instagram: string;
  };
}

// Default placeholder user data
const defaultUserData: WriterUserData = {
  id: '',
  address: '',
  name: '',
  email: '',
  avatar: '/default-avatar.png',
  bio: '',
  website: '',
  genres: [],
  social: {
    twitter: '',
    linkedin: '',
    instagram: ''
  }
};

const genreOptions = [
  'Drama', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 
  'Fantasy', 'Animation', 'Documentary', 'Action', 'Romance'
];

const settingsSections = [
  { id: 'profile', name: 'Profile Details', icon: UserCircleIcon },
  { id: 'portfolio', name: 'Portfolio & Skils', icon: DocumentTextIcon },
  {id: 'kyc', name:'KYC Verification', icon: ShieldCheckIcon},
  { id: 'security', name: 'Security & Account', icon: ShieldCheckIcon },
];

export default function WriterSettings() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { user, isLoading: isUserLoading, mutate: refreshUser } = useUser();

  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState<WriterUserData>(defaultUserData);
  const [originalData, setOriginalData] = useState<WriterUserData>(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [kycStatus,setKycStatus] = useState<'not_submitted'|'pending'|'verified'|'rejected'>('not_submitted');
  const [kycFiles,setKycFiles] = useState<{idFile:File|null,selfieFile:File|null}>({idFile:null,selfieFile:null});
  const [kycError,setKycError] = useState<string|null>(null);
  const [kycMessage,setKycMessage] = useState<string|null>(null);

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user data when component mounts
  useEffect(() => {
    if (user && !isUserLoading) {
      console.log('Loading writer profile data', user);
      
      // Create a user data object from the profile data
      const userData = {
        id: user.id || '',
        address: user.address || address || '',
        name: user.profile_data?.name || '',
        email: user.profile_data?.email || '',
        avatar: user.profile_data?.avatar || defaultUserData.avatar,
        bio: user.profile_data?.bio || '',
        website: user.profile_data?.website || '',
        genres: user.profile_data?.genres || [],
        social: user.profile_data?.social || {
          twitter: '',
          linkedin: '',
          instagram: ''
        }
      };
      
      setFormData(userData);
      setOriginalData(userData);
      setIsLoading(false);
    } else if (!isUserLoading) {
      setIsLoading(false);
    }
  }, [user, isUserLoading, address]);

  //Will be back to implement api handles for checking if the user is validated to upload songs
  useEffect(() => {
    async function fetchKYCStatus(){
      try{
        const res = await fetch('/api/users/me/kyc');
        if(res.ok){
          const data =await res.json();
          setKycStatus(data.status);
        }
      }catch (e){

      }
    }
  })

  // Check for form changes
  useEffect(() => {
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(hasFormChanges);
  }, [formData, originalData]);

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof WriterUserData] as Record<string, any>),
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // Handle array field changes (genres)
  const handleGenreToggle = (genre: string) => {
    setFormData(prev => {
      const newGenres = prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres: newGenres };
    });
  };

  // Reset form to original data
  const handleReset = () => {
    setFormData(originalData);
    setError(null);
    setSuccessMessage(null);
  };

  // Save user profile changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const walletAddress = address || localStorage.getItem('walletAddress');
      if (!walletAddress) {
        throw new Error('No wallet address available');
      }
      
      // Prepare profile data object for API
      const profileData = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        avatar: formData.avatar,
        website: formData.website,
        genres: formData.genres,
        social: formData.social
      };
      
      // Save profile data to API
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({
          profile_data: profileData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to update profile');
      }
      
      // Update localStorage with key user data
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userAvatar', formData.avatar);
      
      // Update original data to match current form data
      setOriginalData(formData);
      setSuccessMessage('Profile updated successfully!');
      
      // Refresh user data in the cache
      refreshUser();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating user data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving your profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const walletAddress = address || localStorage.getItem('walletAddress');
      if (!walletAddress) {
        throw new Error('No wallet address available');
      }
      
      // Call the API to delete the user account
      const response = await fetch(`/api/users/${formData.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to delete account');
      }
      
      // Clear local storage
      localStorage.clear();
      
      // Disconnect wallet
      disconnect();
      
      // Redirect to homepage
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting your account');
      setIsDeleting(false);
    }
  };

  // Render profile details section
  const renderProfileSection = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))] flex items-center justify-center bg-gray-800 transition-all hover:shadow-lg hover:shadow-[rgb(var(--accent-primary))]/20">
              {formData.avatar && formData.avatar !== '/default-avatar.png' ? (
                <Image
                  src={formData.avatar}
                  alt={`${formData.name}'s avatar`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  priority
                  unoptimized
                />
              ) : (
                <span className="text-3xl font-medium">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'W'}
                </span>
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-[rgb(var(--accent-primary))] p-2 rounded-full text-white hover:bg-[rgb(var(--accent-secondary))] transition-colors shadow-lg hover:scale-110 transform duration-200"
              onClick={() => {
                const url = prompt('Enter the URL of your profile image:', formData.avatar);
                if (url) handleInputChange('avatar', url);
              }}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">{formData.name || 'Writer'}</h2>
            <p className="text-gray-400">{formData.address ? `${formData.address.substring(0, 6)}...${formData.address.substring(formData.address.length - 4)}` : 'No wallet connected'}</p>
            <p className="text-[rgb(var(--accent-primary))] text-sm">Writer Account</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-lg transition-colors ${hasChanges ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${hasChanges ? 'bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 text-white' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-3 text-red-200">
          <XCircleIcon className="w-5 h-5 text-red-500" />
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg flex items-center gap-3 text-green-200">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          <p>{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Full Name
          </label>
          <div className="relative group">
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 
              focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))]
              transition-colors duration-200 group-hover:border-white/30"
              placeholder="Your full name"
            />
            <PencilIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email Address
          </label>
          <div className="relative group">
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 
              focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))]
              transition-colors duration-200 group-hover:border-white/30"
              placeholder="your.email@example.com"
            />
            <PencilIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>

        {/* Bio */}
        <div className="md:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
            Bio
          </label>
          <div className="relative group">
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 
              focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))]
              transition-colors duration-200 group-hover:border-white/30"
              placeholder="Write a short bio about yourself..."
            />
            <PencilIcon className="absolute right-3 top-3 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>

        {/* Website */}
        <div className="md:col-span-2">
          <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-1">
            Website
          </label>
          <div className="relative group">
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 
              focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))]
              transition-colors duration-200 group-hover:border-white/30"
              placeholder="https://yourwebsite.com"
            />
            <PencilIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>

        {/* Social Links */}
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-1">
            Twitter / X
          </label>
          <div className="flex items-center group">
            <span className="bg-white/10 text-gray-400 px-3 py-2.5 rounded-l-lg border-y border-l border-white/10 transition-colors duration-200 group-hover:border-white/30">
              @
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                id="twitter"
                value={formData.social.twitter}
                onChange={(e) => handleInputChange('social.twitter', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-r-lg px-4 py-2.5 text-white placeholder-gray-400 
                focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))]
                transition-colors duration-200 group-hover:border-white/30"
                placeholder="username"
              />
              <PencilIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-300 mb-1">
            LinkedIn
          </label>
          <div className="flex items-center group">
            <span className="bg-white/10 text-gray-400 px-3 py-2.5 rounded-l-lg border-y border-l border-white/10 transition-colors duration-200 group-hover:border-white/30">
              linkedin.com/in/
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                id="linkedin"
                value={formData.social.linkedin}
                onChange={(e) => handleInputChange('social.linkedin', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-r-lg px-4 py-2.5 text-white placeholder-gray-400 
                focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))]
                transition-colors duration-200 group-hover:border-white/30"
                placeholder="username"
              />
              <PencilIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render portfolio & skills section
  const renderPortfolioSection = () => (
    <div className="space-y-8">
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-xl font-bold mb-2">Portfolio & Skills</h2>
        <p className="text-gray-400">Showcase your writing experience and preferred genres</p>
      </div>

      {/* Genres */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Preferred Genres
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {genreOptions.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreToggle(genre)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 text-center hover:scale-105 ${
                formData.genres.includes(genre)
                  ? 'bg-[rgb(var(--accent-primary))]/20 border border-[rgb(var(--accent-primary))] text-white shadow-lg shadow-[rgb(var(--accent-primary))]/10'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-400">Select all genres that apply to your writing style</p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
            hasChanges
              ? 'bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 text-white hover:scale-105 shadow-lg shadow-[rgb(var(--accent-primary))]/20'
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );

  // Render security & account section
  const renderSecuritySection = () => (
    <div className="space-y-8">
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-xl font-bold mb-2">Security & Account</h2>
        <p className="text-gray-400">Manage your account security and wallet connections</p>
      </div>

      {/* Wallet Connection */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200 shadow-lg hover:shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Connected Wallet</h3>
          {formData.address && (
            <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs border border-green-500/30">
              Connected
            </span>
          )}
        </div>
        <p className="text-white mb-4 font-mono bg-black/20 p-2 rounded-lg text-sm break-all">
          {formData.address
            ? `${formData.address}`
            : 'No wallet connected'}
        </p>
        <p className="text-sm text-gray-400 mb-4">
          Your wallet address is used to authenticate you on BlockCreative. Changing wallets will require re-authentication.
        </p>
      </div>

      {/* Delete Account */}
      <div className="border-t border-white/10 pt-8 mt-8">
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg hover:border-red-500 transition-colors duration-200 shadow-lg">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            Delete Account
          </h3>
          <p className="text-gray-300 mt-2 mb-4">
            Once you delete your account, there is no going back. All of your data will be permanently removed.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors hover:shadow-lg hover:shadow-red-500/10"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-red-300 text-sm">
                To confirm, please type <span className="font-bold">DELETE</span> below:
              </p>
              <div className="relative group">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-white/5 border border-red-500/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors duration-200"
                  placeholder="Type DELETE to confirm"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    deleteConfirmText === 'DELETE' && !isDeleting
                      ? 'bg-red-500 hover:bg-red-600 text-white hover:scale-105 shadow-lg hover:shadow-red-500/30'
                      : 'bg-red-500/20 text-red-300 cursor-not-allowed'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Permanently Delete Account'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'portfolio':
        return renderPortfolioSection();
      case 'security':
        return renderSecuritySection();
      case 'kyc':
        return renderKYCSection();
      default:
        return renderProfileSection();
    }
  };

  const renderKYCSection = () => (
    <div className='space-y-8'>
      <div className='border-b border-white/10 pb-6'>
        <h2 className='text-xl font-bold mb-2'>KYC Verification</h2>
        <p className='text-gray-400'>Upload your Government-issued ID & a selfie <br />⚠️required to upload any content on blockchain </p>
      </div>
      <div>
        <div className='mb-4'>
          <span className={`px-3 py-1 rounded-full text-xs border
            ${kycStatus === 'verified' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
              kycStatus === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' :
              kycStatus === 'rejected' ? 'bg-red-900/30 text-red-400 border-red-500/30' :
              'bg-gray-900/30 text-gray-400 border-gray-500/30'}`}>
            {kycStatus === 'verified' && 'Verified'}
            {kycStatus === 'pending' && 'Pending Review'}
            {kycStatus === 'rejected' && 'Rejected'}
            {kycStatus === 'not_submitted' && 'Not Submitted'}
          </span>
        </div>
        {kycStatus === 'rejected' && (
          <div className="p-2 bg-red-900/20 border border-red-500 rounded mb-4 text-red-200">
            Your KYC was rejected. Please re-submit your documents.
          </div>
        )}
        <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Government-issued ID</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={e => setKycFiles(f => ({ ...f, idFile: e.target.files?.[0] || null }))}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[rgb(var(--accent-primary))]/20 file:text-white"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Selfie</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setKycFiles(f => ({ ...f, selfieFile: e.target.files?.[0] || null }))}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[rgb(var(--accent-primary))]/20 file:text-white"
        />
      </div>
      {kycError && <div className='p-2 bg-red-900/20 border border-red-500 rounded mb-4 text-red-200 '>{kycError}</div>}
      {kycMessage && <div className='p-2 bg-green-900/20 border-green-50 rounded mb-4 text-green-200 '>{kycMessage}</div>}
      <button type="button" onClick={async()=>{
        setKycError(null);
        setKycMessage(null);
        if(!kycFiles.idFile||!kycFiles.selfieFile){
          setKycError('Please upload both ID and selfie');
          return
        }
        const formData = new FormData();
        formData.append('idFile',kycFiles.idFile);
        formData.append('selfieFile', kycFiles.selfieFile);

        try {
          const res = await fetch('.api/user/me/kyc',{
            method:'POST',
            body:formData,
          });
          if(!res.ok) throw new Error('Failed to submit KYC');
          setKycStatus('pending');
          setKycMessage('KYC submitted! We will review your documents soon.')



        } catch (err) {
          setKycError("Failed to submit KYC. Please try again later.")
        }
      }}
      disabled={kycStatus === "pending"|| kycStatus === 'verified'}
      className={`px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${(kycStatus === 'pending'||kycStatus === 'verified')
        ? 'bg-white text-gray-500 cursor-not-allowed'
        : 'bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 text-white flex items-center gap-2 transition-opacity hover:scale-105 shadow-lg shadow-[rgb(var(--accent-primary))]/20'
      }`}
      >
        {kycStatus === 'pending' ? 'Under review' :kycStatus ==='verified' ? 'Verified':'Submit KYC'}
      </button>
      </div>
    </div>
    
  )
  return (
    <DashboardLayout userType="writer">
      <div className="container px-4 sm:px-6 mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Account Settings</h1>
        
        <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <div className="flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="lg:w-72 bg-white/5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/10">
              <nav>
                <ul className="space-y-2">
                  {settingsSections.map((section) => (
                    <li key={section.id}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-[rgb(var(--accent-primary))]/20 to-[rgb(var(--accent-secondary))]/10 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <section.icon className="w-5 h-5" />
                        <span>{section.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <ArrowPathIcon className="w-8 h-8 text-[rgb(var(--accent-primary))] animate-spin" />
                </div>
              ) : (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {renderContent()}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 p-4 bg-[rgb(var(--accent-primary))]/90 backdrop-blur-sm rounded-xl shadow-xl border border-[rgb(var(--accent-primary))] animate-pulse">
            <span className="text-white">You have unsaved changes</span>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-white text-[rgb(var(--accent-primary))] rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Now'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 