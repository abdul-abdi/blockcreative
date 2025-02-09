'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PaintBrushIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';

// Mock user data
const userData = {
  name: 'John Anderson',
  email: 'john.anderson@studio.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  company: 'Paramount Pictures',
  role: 'Executive Producer',
  bio: 'Experienced producer with a focus on discovering and developing original content.',
  location: 'Los Angeles, CA',
  phone: '+1 (555) 123-4567',
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
    name: 'Paramount Pictures',
    website: 'www.paramount.com',
    industry: 'Entertainment',
    size: '10000+ employees',
    budget_range: '$100M - $500M',
  },
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
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userData);

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically make an API call to save the changes
  };

  const renderProfileSection = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-full md:w-auto">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))]">
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
                Phone
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
        </div>
      </div>
    </div>
  );

  const renderCompanySection = () => (
    <div className="space-y-6">
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
          <input
            type="text"
            value={formData.company_settings.size}
            onChange={(e) => setFormData({
              ...formData,
              company_settings: { ...formData.company_settings, size: e.target.value }
            })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
            disabled={!isEditing}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Budget Range
        </label>
        <input
          type="text"
          value={formData.company_settings.budget_range}
          onChange={(e) => setFormData({
            ...formData,
            company_settings: { ...formData.company_settings, budget_range: e.target.value }
          })}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[rgb(var(--accent-primary))] text-white"
          disabled={!isEditing}
        />
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <h4 className="font-semibold text-white mb-4">Payment Method</h4>
        <p className="text-gray-400 mb-4">
          Manage your payment methods and billing information
        </p>
        <button className="button-primary">Add Payment Method</button>
      </div>
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="font-semibold text-white mb-4">Billing History</h4>
        <p className="text-gray-400 mb-4">
          View and download your billing history
        </p>
        <button className="button-secondary">View History</button>
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
        return null;
    }
  };

  return (
    <DashboardLayout userType="producer">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account and company preferences</p>
          </div>
          {(activeSection === 'profile' || activeSection === 'company') && (
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
                  Edit {activeSection === 'profile' ? 'Profile' : 'Company'}
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