'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

// Define interface for user data structure
interface UserData {
  id: string;
  address: string;
  name: string;
  email: string;
  avatar: string;
  company: string; // For backward compatibility
  role: string;
  bio: string;
  location: string;
  phone: string;
  notifications: {
    email: boolean;
    push: boolean;
    newsletter: boolean;
    newSubmissions: boolean;
    projectUpdates: boolean;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
  };
  company_settings: {
    name: string;
    website: string;
    industry: string;
    size: string;
    budget_range: string;
  };
  social: {
    twitter: string;
    linkedin: string;
    instagram: string;
  }
}

// Default placeholder user data
const defaultUserData: UserData = {
  id: '',
  address: '',
  name: '',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  company: '',
  role: 'Producer',
  bio: '',
  location: '',
  phone: '',
  notifications: {
    email: true,
    push: true,
    newsletter: true,
    newSubmissions: true,
    projectUpdates: true,
  },
  preferences: {
    theme: 'dark',
    language: 'English',
    timezone: 'America/Los_Angeles',
  },
  company_settings: {
    name: '',
    website: '',
    industry: 'Entertainment',
    size: '',
    budget_range: '',
  },
  social: {
    twitter: '',
    linkedin: '',
    instagram: ''
  }
};

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: UserCircleIcon },
  { id: 'company', name: 'Company', icon: BuildingOfficeIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'preferences', name: 'Preferences', icon: PaintBrushIcon },
  { id: 'billing', name: 'Billing', icon: CurrencyDollarIcon },
];

export default function Settings() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Define fetchUserData outside useEffect as a memoized callback
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get wallet address from current state or localStorage
      const currentWalletAddress = address || localStorage.getItem('walletAddress');
      
      // Prepare headers with wallet address if available
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' // Prevent browser cache issues
      };
      
      if (currentWalletAddress) {
        headers['x-wallet-address'] = currentWalletAddress;
        console.log('Using wallet address for fetch:', currentWalletAddress);
      }
      
      // Fetch user data from API with credentials for cookie authentication
      console.log('Fetching producer data from API...');
      const response = await fetch('/api/users/me', { 
        headers,
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user data:', response.status, response.statusText);
        const errorText = await response.text();
        throw new Error(`Failed to fetch user data (${response.status}): ${errorText}`);
      }
      
      const { user } = await response.json();
      console.log('Fetched producer data:', user);
      
      if (!user) {
        throw new Error('User data not found in API response');
      }
      
      // Update localStorage with key user data for resilience
      if (user.role) {
        localStorage.setItem('userRole', user.role);
      }
      
      if (user.address) {
        localStorage.setItem('walletAddress', user.address);
      }
      
      if (user.profile_data?.name) {
        localStorage.setItem('userName', user.profile_data.name);
      }
      
      // Set form data from API response with all necessary fallbacks
      setFormData({
        // Base info (ID and authentication)
        id: user.id || '',
        address: user.address || currentWalletAddress || '',
        role: user.role || 'producer',
        
        // Personal info
        name: user.profile_data?.name || '',
        email: session?.user?.email || user.profile_data?.email || '',
        bio: user.profile_data?.bio || '',
        avatar: user.profile_data?.avatar || defaultUserData.avatar,
        location: user.profile_data?.location || '',
        phone: user.profile_data?.phone || '',
        
        // Company info - handle multiple possible data structures for backwards compatibility
        company: user.profile_data?.company_settings?.name || user.profile_data?.company || '',
        company_settings: {
          name: user.profile_data?.company_settings?.name || user.profile_data?.company || '',
          website: user.profile_data?.company_settings?.website || user.profile_data?.website || '',
          industry: user.profile_data?.company_settings?.industry || user.profile_data?.industry || 'Entertainment',
          size: user.profile_data?.company_settings?.size || user.profile_data?.company_settings?.team_size || user.profile_data?.team_size || '',
          budget_range: user.profile_data?.company_settings?.budget_range || user.profile_data?.budget_range || ''
        },
        
        // Social media links
        social: user.profile_data?.social || defaultUserData.social,
        
        // User preferences
        notifications: user.profile_data?.notifications || defaultUserData.notifications,
        preferences: user.profile_data?.preferences || defaultUserData.preferences
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data. Please try again later.');
      
      // If API fails, try to use data from localStorage as fallback
      const storedName = localStorage.getItem('userName');
      const storedAddress = localStorage.getItem('walletAddress');
      const storedRole = localStorage.getItem('userRole');
      
      if (storedName || storedAddress || storedRole) {
        console.log('Using localStorage fallback data for profile');
        setFormData({
          ...defaultUserData,
          name: storedName || defaultUserData.name,
          address: storedAddress || defaultUserData.address,
          role: storedRole as any || defaultUserData.role
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [session, status, address, isConnected]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Get wallet address from current state or localStorage
      const currentWalletAddress = address || localStorage.getItem('walletAddress');
      
      // Prepare headers with wallet address if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (currentWalletAddress) {
        headers['x-wallet-address'] = currentWalletAddress;
        console.log('Using wallet address for save:', currentWalletAddress);
      } else {
        console.warn('No wallet address available for save operation');
      }
      
      // Prepare complete profile data object
      const profileData = {
        // Personal info
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar || defaultUserData.avatar,
        location: formData.location,
        phone: formData.phone,
        email: formData.email,
        
        // Company info - store both flat and structured formats for compatibility
        company: formData.company_settings.name, // For backwards compatibility
        company_settings: {
          name: formData.company_settings.name,
          website: formData.company_settings.website,
          industry: formData.company_settings.industry,
          size: formData.company_settings.size,
          team_size: formData.company_settings.size, // Duplicate for compatibility
          budget_range: formData.company_settings.budget_range
        },
        
        // Also store flat versions for backwards compatibility
        website: formData.company_settings.website,
        industry: formData.company_settings.industry,
        team_size: formData.company_settings.size,
        budget_range: formData.company_settings.budget_range,
        
        // Social and preferences
        social: formData.social,
        notifications: formData.notifications,
        preferences: formData.preferences
      };
      
      console.log('Saving producer profile data:', profileData);
      
      // Update user data via the API
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          profile_data: profileData
        }),
        credentials: 'include' // Important for cookie authentication
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from API:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to update profile');
      }
      
      const responseData = await response.json();
      console.log('Save response:', responseData);
      
      // Update localStorage with key user data
      localStorage.setItem('userName', formData.name);
      
      if (formData.company_settings.name) {
        localStorage.setItem('companyName', formData.company_settings.name);
      }
      
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Refresh page data to show updated information
      fetchUserData();
    } catch (err) {
      console.error('Error updating user data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const renderProfileSection = () => (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-[rgb(var(--accent-primary))]" />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-full md:w-auto">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))]">
                <Image
                  src={formData.avatar}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              {isEditing && (
                <div className="mt-2">
                  <label htmlFor="avatar-url" className="text-sm text-[rgb(var(--accent-primary))] hover:underline cursor-pointer">
                    Change Photo URL
                  </label>
                  <input
                    id="avatar-url"
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="mt-1 w-full px-2 py-1 text-xs bg-white/5 border border-white/10 rounded focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}
            </div>
            <div className="flex-1 w-full space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || "Not provided"}
                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                    disabled={true}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={formData.address || address || localStorage.getItem('walletAddress') || "Not connected"}
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                  disabled={true}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white h-24"
                  disabled={!isEditing}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-white">Social Media</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={formData.social.twitter}
                        onChange={(e) => setFormData({
                          ...formData,
                          social: { ...formData.social, twitter: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="text"
                        value={formData.social.linkedin}
                        onChange={(e) => setFormData({
                          ...formData,
                          social: { ...formData.social, linkedin: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={formData.social.instagram}
                        onChange={(e) => setFormData({
                          ...formData,
                          social: { ...formData.social, instagram: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Display social profiles when not editing */}
          {!isEditing && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-3">Social Profiles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(formData.social).map(([platform, url]) => (
                  <div key={platform} className="flex items-center">
                    <span className="text-gray-400 mr-2 capitalize">{platform}:</span>
                    {url ? (
                      <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent-primary))] hover:underline">
                        {url}
                      </a>
                    ) : (
                      <span className="text-gray-500">Not provided</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-200">
              {successMessage}
              {successMessage.includes('successfully') && (
                <div className="mt-2">
                  <Link 
                    href="/producer/dashboard"
                    className="text-[rgb(var(--accent-primary))] hover:underline"
                  >
                    Go to Dashboard →
                  </Link>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            {isEditing ? (
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 transition-opacity flex items-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderCompanySection = () => (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-[rgb(var(--accent-primary))]" />
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 transition-opacity"
              >
                Edit Company
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company_settings.name}
                onChange={(e) => setFormData({
                  ...formData,
                  company_settings: { ...formData.company_settings, name: e.target.value }
                })}
                className={`w-full px-4 py-2 ${isEditing ? 'bg-white/5' : 'bg-white/2'} border ${isEditing ? 'border-white/10' : 'border-white/5'} rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white ${isEditing ? '' : 'cursor-not-allowed'}`}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Website
              </label>
              <input
                type="text"
                value={formData.company_settings.website}
                onChange={(e) => setFormData({
                  ...formData,
                  company_settings: { ...formData.company_settings, website: e.target.value }
                })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.company_settings.industry}
                onChange={(e) => setFormData({
                  ...formData,
                  company_settings: { ...formData.company_settings, industry: e.target.value }
                })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Company Size
              </label>
              <select
                value={formData.company_settings.size}
                onChange={(e) => setFormData({
                  ...formData,
                  company_settings: { ...formData.company_settings, size: e.target.value }
                })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                disabled={!isEditing}
              >
                <option value="" disabled>Select company size</option>
                <option value="1-5">1-5 employees</option>
                <option value="6-20">6-20 employees</option>
                <option value="21-50">21-50 employees</option>
                <option value="51-100">51-100 employees</option>
                <option value="101-500">101-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Budget Range
            </label>
            <select
              value={formData.company_settings.budget_range}
              onChange={(e) => setFormData({
                ...formData,
                company_settings: { ...formData.company_settings, budget_range: e.target.value }
              })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
              disabled={!isEditing}
            >
              <option value="" disabled>Select typical budget range</option>
              <option value="$1K-$10K">$1K-$10K</option>
              <option value="$10K-$50K">$10K-$50K</option>
              <option value="$50K-$100K">$50K-$100K</option>
              <option value="$100K-$500K">$100K-$500K</option>
              <option value="$500K-$1M">$500K-$1M</option>
              <option value="$1M+">$1M+</option>
              <option value="Varies">Varies by project</option>
            </select>
          </div>
        </>
      )}
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      {Object.entries(formData.notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div>
            <h4 className="font-semibold text-white capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <p className="text-sm text-gray-400">
              Receive {key.toLowerCase()} notifications
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={() => {}}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--accent-primary))]"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="font-semibold text-white mb-4">Change Password</h4>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          />
          <input
            type="password"
            placeholder="New Password"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          />
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 transition-opacity">
            Update Password
          </button>
        </div>
      </div>
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="font-semibold text-white mb-4">Two-Factor Authentication</h4>
        <p className="text-gray-400 mb-4">
          Add an extra layer of security to your account
        </p>
        <button className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
          Enable 2FA
        </button>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Theme
          </label>
          <select
            value={formData.preferences.theme}
            onChange={() => {}}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Language
          </label>
          <select
            value={formData.preferences.language}
            onChange={() => {}}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Timezone
        </label>
        <select
          value={formData.preferences.timezone}
          onChange={() => {}}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
        >
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="Europe/London">London (GMT)</option>
        </select>
      </div>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="font-semibold text-white mb-4">Payment Methods</h4>
        <p className="text-gray-400 mb-4">
          Manage your payment methods and billing history
        </p>
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 transition-opacity">
          Add Payment Method
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'company':
        return renderCompanySection();
      case 'notifications':
        return renderNotificationsSection();
      case 'security':
        return renderSecuritySection();
      case 'preferences':
        return renderPreferencesSection();
      case 'billing':
        return renderBillingSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <DashboardLayout userType="producer">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
          </div>
          <div className="flex gap-4">
            {(activeSection === 'profile' || activeSection === 'company') && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 transition-opacity flex items-center gap-2"
                      disabled={isSaving}
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
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 transition-opacity"
                  >
                    Edit {activeSection === 'profile' ? 'Profile' : 'Company'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Settings Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="card p-4 md:p-6 rounded-xl">
            <nav className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                    activeSection === section.id
                      ? 'bg-[rgb(var(--accent-primary))]/10 text-[rgb(var(--accent-primary))]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  } transition-colors`}
                >
                  <section.icon className="w-5 h-5" />
                  <span>{section.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="card p-6 rounded-xl md:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 