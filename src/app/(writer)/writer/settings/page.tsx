'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useAccount } from 'wagmi';

// Define interface for user data structure
interface UserData {
  id: string;
  address: string;
  name: string;
  email: string;
  avatar: string;
  genres: string[];
  bio: string;
  writing_experience: string;
  portfolio_url: string;
  website: string;
  project_types: string[];
  notifications: {
    email: boolean;
    push: boolean;
    newsletter: boolean;
    projectAlerts: boolean;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
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
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  genres: [],
  bio: '',
  writing_experience: '',
  portfolio_url: '',
  website: '',
  project_types: [],
  notifications: {
    email: true,
    push: true,
    newsletter: false,
    projectAlerts: true,
  },
  preferences: {
    theme: 'dark',
    language: 'English',
    timezone: 'America/Los_Angeles',
  },
  social: {
    twitter: '',
    linkedin: '',
    instagram: ''
  }
};

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: UserCircleIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'preferences', name: 'Preferences', icon: PaintBrushIcon },
  { id: 'portfolio', name: 'Portfolio', icon: DocumentTextIcon },
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

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Prepare headers with wallet address if available
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        const walletAddress = address || localStorage.getItem('walletAddress');
        
        if (walletAddress) {
          headers['x-wallet-address'] = walletAddress;
          console.log('Using wallet address for fetch:', walletAddress);
        }
        
        // First try to get user data from /api/users/me
        console.log('Fetching user data from API...');
        const response = await fetch('/api/users/me', { 
          headers,
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.error('Failed to fetch user data:', response.status);
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        
        const { user } = await response.json();
        console.log('Fetched user data:', user);
        
        if (!user) {
          throw new Error('User data not found');
        }
        
        // Update localStorage with user data
        if (user.role) {
          localStorage.setItem('userRole', user.role);
        }
        
        if (user.address) {
          localStorage.setItem('walletAddress', user.address);
        }
        
        // Set form data from API response - ensure we capture ALL fields
        setFormData({
          ...defaultUserData,
          id: user.id || '',
          address: user.address || walletAddress || '',
          name: user.profile_data?.name || '',
          email: session?.user?.email || user.profile_data?.email || '',
          bio: user.profile_data?.bio || '',
          writing_experience: user.profile_data?.writing_experience || '',
          avatar: user.profile_data?.avatar || defaultUserData.avatar,
          website: user.profile_data?.website || '',
          genres: user.profile_data?.genres || [],
          project_types: user.profile_data?.project_types || [],
          social: user.profile_data?.social || defaultUserData.social,
          // Preserve any additional data we have in profile_data
          ...(user.profile_data?.notifications && { notifications: user.profile_data.notifications }),
          ...(user.profile_data?.preferences && { preferences: user.profile_data.preferences }),
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again later.');
        
        // If API fails, try to use data from localStorage as fallback
        const storedName = localStorage.getItem('userName');
        const walletAddress = address || localStorage.getItem('walletAddress');
        
        if (storedName || walletAddress) {
          setFormData({
            ...formData,
            name: storedName || formData.name,
            address: walletAddress || formData.address
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [session, status, address, isConnected]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Prepare headers with wallet address if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      const walletAddress = address || localStorage.getItem('walletAddress');
      if (walletAddress) {
        headers['x-wallet-address'] = walletAddress;
        console.log('Using wallet address for save:', walletAddress);
      } else {
        console.warn('No wallet address available for save operation');
      }
      
      // Prepare complete profile data object
      const profileData = {
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar,
        website: formData.website,
        writing_experience: formData.writing_experience,
        genres: formData.genres,
        project_types: formData.project_types,
        social: formData.social,
        // Include email if available
        ...(formData.email && { email: formData.email }),
        // Include other sections that might be editable
        ...(formData.notifications && { notifications: formData.notifications }),
        ...(formData.preferences && { preferences: formData.preferences })
      };
      
      console.log('Saving profile data:', profileData);
      
      // Update user data - always use /api/users/me for consistency
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          profile_data: profileData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from API:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to update profile');
      }
      
      const responseData = await response.json();
      console.log('Save response:', responseData);
      
      // Update localStorage
      localStorage.setItem('userName', formData.name);
      
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
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

  const renderProfileSection = () => (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-[rgb(var(--accent-primary))]" />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))]">
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
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Writing Experience
                </label>
                <textarea
                  value={formData.writing_experience}
                  onChange={(e) => setFormData({ ...formData, writing_experience: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white h-24"
                  disabled={!isEditing}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {isEditing && (
                <>
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
                  
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-white">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Action', 'Romance', 'Thriller', 'Documentary', 'Fantasy'].map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => {
                            const updatedGenres = formData.genres.includes(genre)
                              ? formData.genres.filter(g => g !== genre)
                              : [...formData.genres, genre];
                            setFormData({...formData, genres: updatedGenres});
                          }}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            formData.genres.includes(genre)
                              ? 'bg-[rgb(var(--accent-primary))] text-white'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-white">Project Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Feature Film', 'TV Series', 'TV Pilot', 'Short Film', 'Web Series', 'Documentary'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            const updatedTypes = formData.project_types.includes(type)
                              ? formData.project_types.filter(t => t !== type)
                              : [...formData.project_types, type];
                            setFormData({...formData, project_types: updatedTypes});
                          }}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            formData.project_types.includes(type)
                              ? 'bg-[rgb(var(--accent-primary))] text-white'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Display genres and project types when not editing */}
          {!isEditing && (
            <div className="grid grid-cols-1 gap-8 mt-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.genres.length > 0 ? (
                    formData.genres.map((genre) => (
                      <span key={genre} className="px-3 py-1 bg-white/5 text-gray-300 rounded-lg text-sm">
                        {genre}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No genres selected</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Project Types</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.project_types.length > 0 ? (
                    formData.project_types.map((type) => (
                      <span key={type} className="px-3 py-1 bg-white/5 text-gray-300 rounded-lg text-sm">
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No project types selected</span>
                  )}
                </div>
              </div>
              
              <div>
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
          <button className="button-primary">Update Password</button>
        </div>
      </div>
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="font-semibold text-white mb-4">Two-Factor Authentication</h4>
        <p className="text-gray-400 mb-4">
          Add an extra layer of security to your account
        </p>
        <button className="button-secondary">Enable 2FA</button>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
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

  const renderPortfolioSection = () => (
    <div className="space-y-6">
      <div className="p-4 border border-dashed border-white/20 rounded-lg text-center">
        <p className="text-gray-400 mb-4">
          Add your scripts and samples to showcase your work to producers
        </p>
        <button className="button-primary">Upload Script</button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'security':
        return renderSecuritySection();
      case 'preferences':
        return renderPreferencesSection();
      case 'portfolio':
        return renderPortfolioSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
          </div>
          <div className="flex gap-4">
            {activeSection === 'profile' && (
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
                    Edit Profile
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