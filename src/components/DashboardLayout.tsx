'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
import AuthWrapper from '@/components/AuthWrapper';
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
  { name: 'Settings', href: '/producer/settings', icon: Cog6ToothIcon },
];

const writerNavItems = [
  { name: 'Dashboard', href: '/writer/dashboard', icon: HomeIcon },
  { name: 'My Submissions', href: '/writer/submissions', icon: DocumentTextIcon },
  { name: 'Browse Projects', href: '/writer/projects', icon: FolderIcon },
  { name: 'Settings', href: '/writer/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const pathname = usePathname();
  const navItems = userType === 'producer' ? producerNavItems : writerNavItems;
  
  // User data from localStorage
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('/default-avatar.png');
  
  // Add more detailed user data
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user data from API
  const fetchUserData = useCallback(async () => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) return;
    
    try {
      setIsLoadingUserData(true);
      setError(null);
      
      const response = await fetch('/api/users/me', {
        headers: {
          'x-wallet-address': walletAddress,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.user) {
        throw new Error('User data not found');
      }
      
      setUserProfileData(data.user);
      
      // Update basic user info
      if (data.user.profile_data) {
        setUserName(data.user.profile_data.name || data.user.profile_data.company_name || getUserIdentifier());
        setUserEmail(data.user.profile_data.email || '');
        
        // Improved avatar handling
        if (data.user.profile_data.avatar) {
          console.log('Setting avatar from API data:', data.user.profile_data.avatar);
          setUserAvatar(data.user.profile_data.avatar);
          // Store in localStorage for future use
          localStorage.setItem('userAvatar', data.user.profile_data.avatar);
        }
      }
      
      console.log('User data fetched successfully:', data.user);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setError(error.message || 'Failed to load user data');
    } finally {
      setIsLoadingUserData(false);
    }
  }, []);

  // Load user data from localStorage and then fetch from API
  useEffect(() => {
    try {
      // Get user data from localStorage
      const storedName = localStorage.getItem('userName');
      const storedEmail = localStorage.getItem('userEmail');
      const storedAvatar = localStorage.getItem('userAvatar');
      
      console.log('Loading user data from localStorage:', { storedName, storedEmail, storedAvatar });
      
      // Set user data from localStorage initially
      setUserName(storedName || (userType === 'producer' ? 'Producer User' : 'Writer User'));
      setUserEmail(storedEmail || 'user@blockcreative.io');
      
      // Make sure we have a valid avatar URL or use default
      if (storedAvatar && storedAvatar.trim() !== '') {
        console.log('Setting avatar from localStorage:', storedAvatar);
        setUserAvatar(storedAvatar);
      } else {
        console.log('Using default avatar');
      }
      
      // Then fetch from API
      fetchUserData();
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
    }
  }, [userType, fetchUserData]);

  // Additional validation for avatar URL after component is mounted
  useEffect(() => {
    if (userAvatar && userAvatar !== '/default-avatar.png') {
      // Create a test image to verify if the avatar URL is valid
      const img = document.createElement('img');
      img.onload = () => {
        console.log('Avatar validated successfully:', userAvatar);
        // Make sure we keep this valid avatar URL in localStorage
        localStorage.setItem('userAvatar', userAvatar);
      };
      img.onerror = () => {
        console.error('Failed to validate avatar image, using fallback:', userAvatar);
        setUserAvatar('/default-avatar.png');
        localStorage.setItem('userAvatar', '/default-avatar.png');
      };
      img.src = userAvatar;
    }
  }, [userAvatar]);

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

  // Add a function to get user role-specific data for display
  const getUserRoleSpecificData = () => {
    if (!userProfileData || !userProfileData.profile_data) return null;
    
    if (userType === 'writer') {
      return {
        role: 'Writer',
        joinDate: userProfileData.created_at ? new Date(userProfileData.created_at).toLocaleDateString() : 'N/A',
        genres: userProfileData.profile_data.genres?.join(', ') || 'Not specified',
        bio: userProfileData.profile_data.bio || 'No bio available',
        submissions: userProfileData.stats?.total_submissions || 0,
        acceptanceRate: userProfileData.stats?.acceptance_rate ? `${userProfileData.stats.acceptance_rate}%` : 'N/A'
      };
    } else {
      return {
        role: 'Producer',
        joinDate: userProfileData.created_at ? new Date(userProfileData.created_at).toLocaleDateString() : 'N/A',
        company: userProfileData.profile_data.company_name || 'Not specified',
        position: userProfileData.profile_data.position || 'Not specified',
        projects: userProfileData.stats?.total_projects || 0,
        activeProjects: userProfileData.stats?.active_projects || 0
      };
    }
  };

  return (
    <AuthWrapper requireAuth requiredRole={userType}>
      <div className="flex h-screen bg-black text-white overflow-hidden">
        {/* Sidebar Navigation - Desktop */}
        <aside 
          className={`hidden lg:block ${isSidebarCollapsed ? 'w-20' : 'w-72'} transition-all duration-300 h-screen border-r border-white/10 bg-gradient-to-b from-black to-[rgb(var(--accent-primary))]/5 backdrop-blur-lg sticky top-0 z-30`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <Link href={`/${userType}/dashboard`} className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">BC</span>
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <span className="text-xl font-bold gradient-text whitespace-nowrap">BlockCreative</span>
                  <p className="text-xs text-[rgb(var(--accent-primary))]">{userType === 'producer' ? 'Studio Portal' : 'Writer Portal'}</p>
                </div>
              )}
            </Link>
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
            >
              {isSidebarCollapsed ? (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingInIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Navigation Items */}
          <div className="p-4">
            <div className={`${!isSidebarCollapsed ? 'px-2 py-1 mb-4' : 'mb-8'}`}>
              {!isSidebarCollapsed && (
                <p className="text-xs uppercase text-gray-500 tracking-wider">Main Navigation</p>
              )}
            </div>
            <nav>
              <ul className="space-y-2">
                {navItems.map((item) => {
                  // Logic to determine if this is the active route
                  const isActive = pathname?.startsWith(item.href) || false;
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-gradient-to-r from-[rgb(var(--accent-primary))]/20 to-[rgb(var(--accent-secondary))]/10 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <div className={`relative ${isActive ? 'text-[rgb(var(--accent-primary))]' : ''}`}>
                          <item.icon className="h-6 w-6 flex-shrink-0" />
                          {isActive && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[rgb(var(--accent-primary))]"></span>
                          )}
                        </div>
                        {!isSidebarCollapsed && (
                          <span className={`truncate ${isActive ? 'font-medium' : ''}`}>{item.name}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          
          {/* User Profile in Sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/10 bg-black/30 backdrop-blur-sm">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] shadow-lg">
                <span className="text-lg font-bold text-white">BC</span>
              </div>
              {!isSidebarCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-semibold text-white gradient-text">BlockCreative</p>
                  <p className="text-xs text-gray-400">Blockchain & AI-Powered</p>
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
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 text-white flex items-center gap-2 transition-opacity font-medium"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>New Project</span>
                    </Link>
                  ) : (
                    <Link
                      href="/writer/submit"
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 text-white flex items-center gap-2 transition-opacity font-medium"
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
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))] flex items-center justify-center bg-gray-800">
                      {userAvatar && userAvatar !== '/default-avatar.png' ? (
                        <Image
                          src={userAvatar}
                          alt={`${userName}'s avatar`}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                          priority
                          unoptimized
                          onLoad={() => console.log("Avatar image loaded successfully:", userAvatar)}
                          onError={() => {
                            console.error("Avatar image failed to load:", userAvatar);
                            setUserAvatar('/default-avatar.png');
                          }}
                        />
                      ) : (
                        <span className="text-xs font-medium">{getInitials()}</span>
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-white truncate max-w-[120px]">{getUserIdentifier()}</p>
                      <p className="text-xs text-[rgb(var(--accent-primary))]">{userType === 'producer' ? 'Studio' : 'Writer'}</p>
                    </div>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-lg bg-black/90 border border-white/10 shadow-xl backdrop-blur-xl z-50">
                      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[rgb(var(--accent-primary))]/20 to-[rgb(var(--accent-secondary))]/20 rounded-t-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))] flex items-center justify-center bg-gray-800">
                            {userAvatar && userAvatar !== '/default-avatar.png' ? (
                              <Image
                                src={userAvatar}
                                alt={`${userName}'s avatar`}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                                priority
                                unoptimized
                                onLoad={() => console.log("Avatar image loaded successfully:", userAvatar)}
                                onError={() => {
                                  console.error("Avatar image failed to load:", userAvatar);
                                  setUserAvatar('/default-avatar.png');
                                }}
                              />
                            ) : (
                              <span className="text-base font-medium">{getInitials()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{getUserIdentifier()}</p>
                            <p className="text-sm text-[rgb(var(--accent-primary))]">
                              {userType === 'producer' ? 'Studio Account' : 'Writer Account'}
                            </p>
                          </div>
                        </div>
                        
                        {isLoadingUserData ? (
                          <div className="text-center py-2">
                            <div className="w-5 h-5 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs text-gray-400 mt-1">Loading profile data...</p>
                          </div>
                        ) : error ? (
                          <p className="text-xs text-red-400 mt-1">{error}</p>
                        ) : userProfileData && (
                          <div className="mt-2 text-sm space-y-1 border-t border-white/5 pt-2">
                            {userType === 'writer' ? (
                              <>
                                <p key="writer-joined" className="flex justify-between">
                                  <span className="text-gray-400">Joined:</span>
                                  <span className="text-white">{getUserRoleSpecificData()?.joinDate}</span>
                                </p>
                                <p key="writer-submissions" className="flex justify-between">
                                  <span className="text-gray-400">Submissions:</span>
                                  <span className="text-white">{getUserRoleSpecificData()?.submissions}</span>
                                </p>
                                <p key="writer-success-rate" className="flex justify-between">
                                  <span className="text-gray-400">Success Rate:</span>
                                  <span className="text-white">{getUserRoleSpecificData()?.acceptanceRate}</span>
                                </p>
                              </>
                            ) : (
                              <>
                                <p key="producer-company" className="flex justify-between">
                                  <span className="text-gray-400">Company:</span>
                                  <span className="text-white">{getUserRoleSpecificData()?.company}</span>
                                </p>
                                <p key="producer-projects" className="flex justify-between">
                                  <span className="text-gray-400">Total Projects:</span>
                                  <span className="text-white">{getUserRoleSpecificData()?.projects}</span>
                                </p>
                                <p key="producer-active-projects" className="flex justify-between">
                                  <span className="text-gray-400">Active Projects:</span>
                                  <span className="text-white">{getUserRoleSpecificData()?.activeProjects}</span>
                                </p>
                              </>
                            )}
                          </div>
                        )}
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
                          className="flex items-center gap-2 p-2 w-full text-left rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))]/20 to-[rgb(var(--accent-secondary))]/20 hover:from-[rgb(var(--accent-primary))]/30 hover:to-[rgb(var(--accent-secondary))]/30 text-white transition-colors"
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
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))]">
                      <span className="text-sm font-bold text-white">BC</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold gradient-text">BlockCreative</h2>
                      <p className="text-xs text-[rgb(var(--accent-primary))]">{userType === 'producer' ? 'Studio Portal' : 'Writer Portal'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                {/* User profile section in mobile menu */}
                <div className="mb-6 px-2 py-3 rounded-lg bg-white/5 flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[rgb(var(--accent-primary))] flex items-center justify-center bg-gray-800">
                    {userAvatar && userAvatar !== '/default-avatar.png' ? (
                      <Image
                        src={userAvatar}
                        alt={`${userName}'s avatar`}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        priority
                        unoptimized
                        onLoad={() => console.log("Avatar image loaded successfully:", userAvatar)}
                        onError={() => {
                          console.error("Avatar image failed to load:", userAvatar);
                          setUserAvatar('/default-avatar.png');
                        }}
                      />
                    ) : (
                      <span className="text-sm font-medium">{getInitials()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{getUserIdentifier()}</p>
                    <p className="text-sm text-[rgb(var(--accent-primary))]">{userType === 'producer' ? 'Studio' : 'Writer'}</p>
                    {userProfileData && (
                      <p className="text-xs text-gray-400 mt-1">
                        {userType === 'producer' 
                          ? `${getUserRoleSpecificData()?.projects} Projects` 
                          : `${getUserRoleSpecificData()?.submissions} Submissions`}
                      </p>
                    )}
                  </div>
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
                          <item.icon key={`mobile-icon-${item.name}`} className="h-5 w-5" />
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
                        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 flex items-center justify-center gap-2 transition-opacity font-medium"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Post Project
                      </Link>
                    ) : (
                      <Link
                        href="/writer/submit"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 flex items-center justify-center gap-2 transition-opacity font-medium"
                      >
                        <PlusIcon className="h-5 w-5" />
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