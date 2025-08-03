'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ClockIcon, 
  CurrencyDollarIcon,
  ArrowLongLeftIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

interface Submission {
  id: string;
  writer_id: string;
  writer_name?: string;
  writer_avatar?: string;
  title: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_score?: {
    overall: number;
    creativity: number;
    structure: number;
    marketability: number;
    character_development: number;
  };
}

interface Project {
  id: string;
  projectId: string;
  title: string;
  description: string;
  requirements: string | string[];
  budget: number;
  deadline: string | Date;
  status: 'draft' | 'published' | 'funded' | 'completed' | 'cancelled';
  is_funded: boolean;
  submissions?: Submission[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function ProjectDetails() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editedProject, setEditedProject] = useState<Partial<Project>>({});

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Prepare headers with wallet address if available
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (walletAddress) {
          headers['x-wallet-address'] = walletAddress;
        }
        
        // Fetch project details with retry logic
        let retries = 3;
        let response;
        let responseOk = false;
        
        while (retries > 0 && !responseOk) {
          try {
            response = await fetch(`/api/projects/${projectId}`, {
              headers,
              cache: 'no-store' // Prevent caching issues
            });
            
            responseOk = response.ok;
            if (responseOk) break;
            
            // If it's a 404, no point in retrying
            if (response.status === 404) {
              console.warn(`Project not found with ID: ${projectId}`);
              break;
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, (3 - retries + 1) * 1000));
            retries--;
          } catch (fetchError) {
            console.error(`Fetch attempt failed:`, fetchError);
            retries--;
            if (retries <= 0) throw fetchError;
          }
        }
        
        if (!response || !responseOk) {
          throw new Error(`Error fetching project: ${response?.statusText || 'Project not found'}`);
        }
        
        const data = await response.json();
        
        // Check if the response has the expected project structure
        if (!data.project || !data.project.id) {
          throw new Error('Invalid project data received from server');
        }
        
        setProject(data.project);
        setEditedProject(data.project);
        
        // Fetch submissions for this project
        fetchSubmissions(headers);
      } catch (error) {
        console.error('Error fetching project details:', error);
        
        // Set a more descriptive error message based on the error
        if (error instanceof Error) {
          if (error.message.includes('not found') || error.message.includes('404')) {
            setError(`Project with ID "${projectId}" not found. It may have been deleted or you don't have permission to view it.`);
          } else {
            setError(`Failed to load project details: ${error.message}`);
          }
        } else {
          setError('Failed to load project details. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);
  
  const fetchSubmissions = async (headers: HeadersInit) => {
    if (!projectId) return;
    
    setIsSubmissionsLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/submissions`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching submissions: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      // Not setting error here to not disrupt the main project view
    } finally {
      setIsSubmissionsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProject({
      ...editedProject,
      [name]: value
    });
  };
  
  const handleUpdateProject = async () => {
    if (!projectId || !project) return;
    
    setIsUpdatingProject(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare headers with wallet address if available
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (walletAddress) {
        headers['x-wallet-address'] = walletAddress;
      }
      
      // Update fields that can be changed
      const updateData = {
        title: editedProject.title,
        description: editedProject.description,
        requirements: editedProject.requirements,
        status: editedProject.status,
      };
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating project: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProject(data.project);
      setSuccess('Project updated successfully');
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project. Please try again later.');
    } finally {
      setIsUpdatingProject(false);
    }
  };
  
  const handleDeleteProject = async () => {
    if (!projectId || !project) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    setIsDeletingProject(true);
    setError(null);
    
    try {
      // Prepare headers with wallet address if available
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (walletAddress) {
        headers['x-wallet-address'] = walletAddress;
      }
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting project: ${response.statusText}`);
      }
      
      // Redirect to projects list
      router.push('/producer/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project. Please try again later.');
      setIsDeletingProject(false);
    }
  };
  
  const handleFundProject = async () => {
    if (!projectId || !project) return;
    
    setIsUpdatingProject(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare headers with wallet address if available
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (walletAddress) {
        headers['x-wallet-address'] = walletAddress;
      }
      
      const response = await fetch(`/api/projects/${projectId}/fund`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: project.budget })
      });
      
      if (!response.ok) {
        throw new Error(`Error funding project: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProject({
        ...project,
        is_funded: true,
        status: 'funded'
      });
      setSuccess('Project funded successfully');
    } catch (error) {
      console.error('Error funding project:', error);
      setError('Failed to fund project. Please try again later.');
    } finally {
      setIsUpdatingProject(false);
    }
  };
  
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'No deadline set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="producer">
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !project) {
    return (
      <DashboardLayout userType="producer">
        <div className="p-6 text-center">
          <div className="p-4 mb-6 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
          <Link 
            href="/audiomarket/producer/projects"
            className="px-4 py-2 rounded-lg text-white bg-gray-700 hover:bg-gray-600 transition-colors mt-4 inline-flex items-center"
          >
            <ArrowLongLeftIcon className="w-5 h-5 mr-2" />
            Back to Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout userType="producer">
        <div className="p-6 text-center">
          <p className="text-gray-400 mb-4">Project not found</p>
          <Link 
            href="/audiomarket/producer/projects"
            className="px-4 py-2 rounded-lg text-white bg-gray-700 hover:bg-gray-600 transition-colors mt-4 inline-flex items-center"
          >
            <ArrowLongLeftIcon className="w-5 h-5 mr-2" />
            Back to Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return(
    <DashboardLayout userType="producer">
      <div className="container mx-auto px-4 sm:px-6 py-6 relative">
        {/* Back button and action buttons */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/audiomarket/producer/projects"
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLongLeftIcon className="w-5 h-5 mr-2" />
            Back to Projects
          </Link>
          
          <div className="flex items-center gap-3">
            {isEditMode ? (
              <>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedProject(project);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProject}
                  disabled={isUpdatingProject}
                  className="px-4 py-2 rounded-lg bg-[rgb(var(--accent-primary))] text-white hover:bg-[rgb(var(--accent-secondary))] transition-colors flex items-center"
                >
                  {isUpdatingProject ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {project.status === 'draft' && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors flex items-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Project
                  </button>
                )}
                
                {!project.is_funded && (project.status === 'published' || project.status === 'draft') && (
                  <button
                    onClick={handleFundProject}
                    disabled={isUpdatingProject}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 transition-colors flex items-center"
                  >
                    {isUpdatingProject ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                        Fund Project
                      </>
                    )}
                  </button>
                )}
                
                {(project.status === 'draft' || project.status === 'published') && (
                  <button
                    onClick={handleDeleteProject}
                    disabled={isDeletingProject}
                    className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/50 transition-colors"
                    title="Delete Project"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-300">{success}</p>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-center">
            <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="p-6 space-y-4">
                {/* Project Title */}
                {isEditMode ? (
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={editedProject.title || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-white">{project.title}</h1>
                )}

                {/* Status Badge */}
                <div className="flex items-center">
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'published' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
                      project.status === 'draft' ? 'bg-gray-800 text-gray-400 border border-gray-700' :
                      project.status === 'funded' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                      project.status === 'completed' ? 'bg-purple-900/30 text-purple-400 border border-purple-800' :
                      'bg-red-900/30 text-red-400 border border-red-800'
                    }`}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                  
                  {project.is_funded && (
                    <span className="ml-2 px-3 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-800 text-xs font-medium">
                      Funded
                    </span>
                  )}
                </div>

                {/* Description */}
                {isEditMode ? (
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={editedProject.description || ''}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                    <p className="text-white whitespace-pre-wrap">{project.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {isEditMode ? (
                  <div className="mb-4">
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-400 mb-1">
                      Requirements
                    </label>
                    <textarea
                      id="requirements"
                      name="requirements"
                      value={editedProject.requirements || ''}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Requirements</h3>
                    {Array.isArray(project.requirements) ? (
                      <ul className="list-disc pl-5 text-white">
                        {project.requirements.map((requirement, index) => (
                          <li key={index} className="text-white">{requirement}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-white whitespace-pre-wrap">{project.requirements || 'No requirements specified.'}</p>
                    )}
                  </div>
                )}
                
                {/* Creation Date */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center text-sm text-gray-400">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Created on {formatDate(project.createdAt)}
                    {project.updatedAt && project.updatedAt !== project.createdAt && (
                      <span className="ml-2">• Updated on {formatDate(project.updatedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Submissions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Submissions {submissions.length > 0 && `(${submissions.length})`}
                </h2>
                
                {isSubmissionsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="w-10 h-10 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
                  </div>
                ) : submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div 
                        key={submission.id} 
                        className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                              {submission.writer_avatar ? (
                                <img 
                                  src={submission.writer_avatar} 
                                  alt={submission.writer_name || 'Writer'} 
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <UserIcon className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{submission.title}</h3>
                              <p className="text-sm text-gray-400">
                                by {submission.writer_name || 'Unknown Writer'} • {formatDate(submission.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs ${
                                submission.status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                                submission.status === 'rejected' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                                'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                              }`}
                            >
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        {submission.ai_score && (
                          <div className="mt-3 bg-black/30 rounded-lg p-3">
                            <div className="flex items-center mb-2">
                              <StarIcon className="w-4 h-4 text-[rgb(var(--accent-primary))] mr-1" />
                              <span className="text-sm font-medium text-white">
                                AI Score: {submission.ai_score.overall}/100
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="flex flex-col">
                                <span className="text-gray-400">Creativity</span>
                                <span className="text-white">{submission.ai_score.creativity}/100</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-400">Structure</span>
                                <span className="text-white">{submission.ai_score.structure}/100</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-400">Marketability</span>
                                <span className="text-white">{submission.ai_score.marketability}/100</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-400">Characters</span>
                                <span className="text-white">{submission.ai_score.character_development}/100</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-end">
                          <Link
                            href={`/producer/submissions/${submission.id}`}
                            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors flex items-center"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Submission
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-white/10 rounded-lg">
                    <UserGroupIcon className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 mb-2">No submissions yet</p>
                    <p className="text-sm text-gray-500">
                      Writers will submit their scripts here once they're ready.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Project Details Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Project Stats */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Project Details</h2>
              
              <div className="space-y-4">
                {/* Budget */}
                <div className="flex items-start">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Budget</p>
                    <p className="text-white font-medium">${project.budget.toFixed(2)}</p>
                  </div>
                </div>
                
                {/* Deadline */}
                <div className="flex items-start">
                  <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Deadline</p>
                    <p className="text-white font-medium">{formatDate(project.deadline)}</p>
                  </div>
                </div>
                
                {/* Submissions Count */}
                <div className="flex items-start">
                  <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Submissions</p>
                    <p className="text-white font-medium">{submissions.length}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  {project.status === 'published' && !project.is_funded && (
                    <button
                      onClick={handleFundProject}
                      disabled={isUpdatingProject}
                      className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90 transition-colors flex items-center justify-center"
                    >
                      {isUpdatingProject ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                          Fund Project
                        </>
                      )}
                    </button>
                  )}
                  
                  {project.status === 'draft' && (
                    <button
                      onClick={() => {
                        setEditedProject({
                          ...editedProject,
                          status: 'published'
                        });
                        setTimeout(() => {
                          handleUpdateProject();
                        }, 100);
                      }}
                      disabled={isUpdatingProject}
                      className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      {isUpdatingProject ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          Publish Project
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Help Box */}
            <div className="p-6 bg-gradient-to-br from-[rgb(var(--accent-primary))/10 to-[rgb(var(--accent-secondary))]/5 rounded-xl border border-[rgb(var(--accent-primary))]/20">
              <h3 className="text-[rgb(var(--accent-primary))] font-semibold mb-2">Need Help?</h3>
              <p className="text-gray-300 text-sm mb-3">
                Having issues with this project or need assistance? Our team is here to help.
              </p>
              <a
                href="mailto:support@blockcreative.com"
                className="text-[rgb(var(--accent-primary))] text-sm hover:underline"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
} 