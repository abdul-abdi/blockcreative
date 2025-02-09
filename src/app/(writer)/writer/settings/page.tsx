'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';

// Mock user data
const userData = {
  name: 'Sarah Johnson',
  email: 'sarah.j@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  genres: ['Sci-Fi', 'Drama', 'Thriller'],
  bio: 'Award-winning screenwriter with a passion for science fiction and character-driven narratives.',
  location: 'Los Angeles, CA',
  website: 'www.sarahjohnson.com',
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
};

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: UserCircleIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'preferences', name: 'Preferences', icon: PaintBrushIcon },
  { id: 'portfolio', name: 'Portfolio', icon: DocumentTextIcon },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userData);

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically make an API call to save the changes
  };

  const renderProfileSection = () => (
    <div className="space-y-8">
      <div className="flex items-start gap-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))]">
            <Image
              src={userData.avatar}
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          <button className="mt-2 text-sm text-[rgb(var(--accent-primary))] hover:underline">
            Change Photo
          </button>
        </div>
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-6">
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                disabled={!isEditing}
              />
            </div>
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
          <div className="grid grid-cols-2 gap-6">
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
                Website
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      {Object.entries(userData.notifications).map(([key, value]) => (
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
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="font-semibold text-white mb-4">Featured Scripts</h4>
        <p className="text-gray-400 mb-4">
          Select scripts to showcase on your public profile
        </p>
        <button className="button-primary">Manage Portfolio</button>
      </div>
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="font-semibold text-white mb-4">Genre Specialization</h4>
        <div className="flex flex-wrap gap-2">
          {formData.genres.map((genre) => (
            <span
              key={genre}
              className="px-3 py-1 rounded-full bg-[rgb(var(--accent-primary))]/10 text-[rgb(var(--accent-primary))] text-sm"
            >
              {genre}
            </span>
          ))}
          <button className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-sm hover:bg-white/10">
            + Add Genre
          </button>
        </div>
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
        return null;
    }
  };

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account preferences</p>
          </div>
          {activeSection === 'profile' && (
            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="button-primary"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="button-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <nav className="lg:col-span-1">
            <div className="card">
              <div className="p-2">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-[rgb(var(--accent-primary))]/10 text-[rgb(var(--accent-primary))]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="p-6">
                {renderContent()}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 