'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import AuthWrapper from './AuthWrapper';
import { appKitModal } from '@/context';
import { useAccount, useDisconnect } from 'wagmi';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const navItems = userType === 'producer' ? producerNavItems : writerNavItems;
  
  // User data from localStorage
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('/default-avatar.png');

  // Load user data from localStorage
  useEffect(() => {
    // Get user data from localStorage
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    const storedAvatar = localStorage.getItem('userAvatar');
    
    // Set user data
    setUserName(storedName || (userType === 'producer' ? 'Producer User' : 'Writer User'));
    setUserEmail(storedEmail || 'user@blockcreative.io');
    setUserAvatar(storedAvatar || '/default-avatar.png');
  }, [userType]);

  // Handle logout properly
  const handleLogout = async () => {
    try {
      // Clear user data from localStorage
      localStorage.removeItem('userRole');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('signupDate');
      
      // Disconnect wallet
      disconnect();
      
      // Redirect to sign-out page
      router.push('/signout');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still try to navigate to sign-out page
      router.push('/signout');
    }
  };

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Function to display user identifier (wallet address or name)
  const getUserIdentifier = () => {
    if (userName && userName !== 'Writer User' && userName !== 'Producer User') {
      return userName;
    }
    
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    return userType === 'writer' ? 'Writer User' : 'Producer User';
  };

  // Function to get initials for avatar fallback
  const getInitials = () => {
    if (userName && userName !== 'Writer User' && userName !== 'Producer User') {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    
    if (address) {
      return address.slice(0, 2).toUpperCase();
    }
    
    return userType === 'writer' ? 'WU' : 'PU';
  };

  return (
    <AuthWrapper requireAuth requiredRole={userType}>
      <div className="flex h-screen bg-black text-white overflow-hidden">
        {/* Sidebar Navigation - Desktop */}
        <aside 
          className={`hidden lg:block ${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 h-screen border-r border-white/10 bg-black/50 backdrop-blur-lg sticky top-0 z-30`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <Link href={`/${userType}/dashboard`} className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 flex-shrink-0 rounded-md bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] flex items-center justify-center">
                <span className="text-sm font-bold text-white">BC</span>
              </div>
              {!isSidebarCollapsed && (
                <span className="text-lg font-bold gradient-text whitespace-nowrap">BlockCreative</span>
              )}
            </Link>
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isSidebarCollapsed ? (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingInIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors ${
                      isSidebarCollapsed ? 'justify-center' : ''
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User Profile in Sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                {userAvatar === '/default-avatar.png' ? (
                  <span className="text-xs font-medium">{getInitials()}</span>
                ) : (
                  <Image
                    src={userAvatar}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-white truncate max-w-[180px]">
                    {userName || `${userType === 'writer' ? 'Writer' : 'Producer'} Account`}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-gray-400 hover:text-white flex items-center"
                  >
                    <ArrowLeftOnRectangleIcon className="w-3 h-3 mr-1" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
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
                <div className="lg:hidden flex items-center gap-2">
                  <span className="text-xl font-bold gradient-text">BlockCreative</span>
                  <span className="hidden md:inline-block text-sm px-3 py-1 rounded-full bg-[rgb(var(--accent-primary))]/10 text-[rgb(var(--accent-primary))]">
                    {userType === 'producer' ? 'Studio' : 'Writer'} Portal
                  </span>
                </div>
              </div>

              {/* Center Section - Search */}
              <div className="flex-1 max-w-3xl mx-4 hidden md:block">
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
                {/* Action Button - Project Creation or Script Submission */}
                <div className="hidden md:block">
                  {userType === 'producer' ? (
                    <Link
                      href="/producer/projects/new"
                      className="px-4 py-2 rounded-lg bg-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-primary))]/90 text-white flex items-center gap-2 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>New Project</span>
                    </Link>
                  ) : (
                    <Link
                      href="/writer/submit"
                      className="px-4 py-2 rounded-lg bg-[rgb(var(--accent-primary))] hover:bg-[rgb(var(--accent-primary))]/90 text-white flex items-center gap-2 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Submit Script</span>
                    </Link>
                  )}
                </div>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))] flex items-center justify-center">
                      {userAvatar === '/default-avatar.png' ? (
                        <span className="text-xs font-medium">{getInitials()}</span>
                      ) : (
                        <Image
                          src={userAvatar}
                          alt="User Avatar"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-white truncate max-w-[120px]">{getUserIdentifier()}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[120px]">{userEmail}</p>
                    </div>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-lg bg-black/90 border border-white/10 shadow-xl backdrop-blur-xl z-50">
                      <div className="p-4 border-b border-white/5">
                        <p className="font-semibold text-white">{getUserIdentifier()}</p>
                        <p className="text-sm text-gray-400">{userEmail}</p>
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
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 p-2 w-full text-left rounded-lg bg-[rgb(var(--accent-primary))]/10 hover:bg-[rgb(var(--accent-primary))]/20 text-[rgb(var(--accent-primary))] transition-colors"
                        >
                          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                          <span>Sign Out</span>
                        </button>
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

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-lg">
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
                  <div className="mt-8 p-4 space-y-4">
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
                        href="/writer/submit"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="button-primary w-full flex items-center justify-center"
                      >
                        <PlusIcon className="h-5 w-5 mr-1" />
                        Submit Script
                      </Link>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                      Sign Out
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
} 