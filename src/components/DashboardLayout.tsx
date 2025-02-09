'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BanknotesIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'producer' | 'writer';
}

const producerNavItems = [
  { name: 'Dashboard', href: '/producer/dashboard', icon: HomeIcon },
  { name: 'Active Projects', href: '/producer/projects', icon: FolderIcon },
  { name: 'Find Writers', href: '/producer/writers', icon: UserGroupIcon },
  { name: 'Analytics', href: '/producer/analytics', icon: ChartBarIcon },
  { name: 'Budget', href: '/producer/budget', icon: BanknotesIcon },
  { name: 'Settings', href: '/producer/settings', icon: Cog6ToothIcon },
];

const writerNavItems = [
  { name: 'Dashboard', href: '/writer/dashboard', icon: HomeIcon },
  { name: 'My Submissions', href: '/writer/submissions', icon: DocumentTextIcon },
  { name: 'Browse Projects', href: '/writer/projects', icon: FolderIcon },
  { name: 'Performance', href: '/writer/performance', icon: ChartBarIcon },
  { name: 'Earnings', href: '/writer/earnings', icon: BanknotesIcon },
  { name: 'Settings', href: '/writer/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navItems = userType === 'producer' ? producerNavItems : writerNavItems;

  // Mock user data - in a real app, this would come from your auth system
  const mockUser = {
    name: userType === 'producer' ? 'Universal Studios' : 'Sarah Johnson',
    email: userType === 'producer' ? 'projects@universal.com' : 'sarah.j@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
            <Link href={`/${userType}/dashboard`} className="flex items-center gap-2">
              <span className="text-xl font-bold gradient-text">BlockCreative</span>
              <span className="hidden md:inline-block text-sm px-3 py-1 rounded-full bg-[rgb(var(--accent-primary))]/10 text-[rgb(var(--accent-primary))]">
                {userType === 'producer' ? 'Studio' : 'Writer'} Portal
              </span>
            </Link>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder={userType === 'producer' ? 'Search projects, submissions, or writers...' : 'Search available projects and opportunities...'}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))]"
              />
            </div>
          </div>

          {/* Right Section - Profile */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))]">
                  <Image
                    src={mockUser.avatar}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white">{mockUser.name}</p>
                  <p className="text-xs text-gray-400">{mockUser.email}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg bg-black/90 border border-white/10 shadow-xl backdrop-blur-xl">
                  <div className="p-4 border-b border-white/5">
                    <p className="font-semibold text-white">{mockUser.name}</p>
                    <p className="text-sm text-gray-400">{mockUser.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link
                      href={`/${userType}/settings`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span>Profile Settings</span>
                    </Link>
                    <Link
                      href="/signout"
                      className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-[rgb(var(--accent-primary))]/10 hover:bg-[rgb(var(--accent-primary))]/20 text-[rgb(var(--accent-primary))] transition-colors"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                      <span>Sign Out</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search (only shown on mobile) */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder={userType === 'producer' ? 'Search projects and writers...' : 'Search available projects...'}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[rgb(var(--accent-primary))] focus:ring-1 focus:ring-[rgb(var(--accent-primary))]"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden lg:block w-64 min-h-[calc(100vh-73px)] border-r border-white/10 bg-black/50 backdrop-blur-lg sticky top-[73px]">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/90 backdrop-blur-lg">
            <div className="p-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold gradient-text">Navigation</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <nav>
                <ul className="space-y-4">
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 p-4">
                  {userType === 'producer' ? (
                    <Link
                      href="/producer/projects/new"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="button-primary w-full flex items-center justify-center"
                    >
                      <PlusIcon className="h-5 w-5 mr-1" />
                      Post Project
                    </Link>
                  ) : (
                    <Link
                      href="/writer/scripts/submit"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="button-primary w-full flex items-center justify-center"
                    >
                      <PlusIcon className="h-5 w-5 mr-1" />
                      Submit Script
                    </Link>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  );
} 