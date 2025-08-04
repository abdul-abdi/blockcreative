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
  ChartBarIcon,
  EyeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

interface Project {
  id: string | number;
  title: string;
  description: string;
  studio: string;
  budget: string;
  deadline: string;
  submissions: number;
  requirements: string[] | string | any;
  genre?: string;
  type?: string;
  aiPreferences?: Record<string, number>;
  rating?: number;
}

export default function ProjectDetails() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!projectId) {
          throw new Error('Project ID is missing');
        }
        
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
        
        // Process and enhance project data
        const projectData = {
          ...data.project,
          id: data.project.id || data.project._id || data.project.projectId,
          studio: data.project.producer_name || data.project.company_name || 'Unknown Studio',
          description: data.project.description || 'No description provided',
          deadline: data.project.deadline ? new Date(data.project.deadline).toLocaleDateString() : 'No deadline',
          budget: data.project.budget || 'Not specified',
          requirements: data.project.requirements || data.project.genre || [],
          submissions: data.project.submission_count || 0
        };
        
        setProject(projectData);
        
        // Fetch related projects
        try {
          const relatedResponse = await fetch(`/api/projects?limit=3&genre=${projectData.genre || ''}&exclude=${projectId}`, {
            headers
          });
          
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            
            // Process related projects
            const enhancedRelatedProjects = (relatedData.projects || []).map((project: any) => ({
              ...project,
              id: project.id || project._id || project.projectId,
              studio: project.producer_name || project.company_name || 'Unknown Studio',
              description: project.description || 'No description provided',
              deadline: project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline',
              budget: project.budget || 'Not specified',
              requirements: project.requirements || project.genre || [],
              submissions: project.submission_count || 0
            }));
            
            setRelatedProjects(enhancedRelatedProjects);
          } else {
            console.error('Failed to fetch related projects:', relatedResponse.statusText);
            setRelatedProjects([]);
          }
        } catch (relatedError) {
          console.error('Error fetching related projects:', relatedError);
          setRelatedProjects([]);
        }
        
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

  if (isLoading) {
    return (
      <DashboardLayout userType="writer">
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout userType="writer">
        <div className="p-6 md:p-8">
          <div className="text-center p-8 border border-dashed border-white/10 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Project Not Found</h2>
            <p className="text-gray-400 mb-6">{error || "This project doesn't exist or you don't have access to view it."}</p>
            <Link 
              href="audiomarket/writer/projects" 
              className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors inline-flex items-center"
            >
              <ArrowLongLeftIcon className="w-5 h-5 mr-2" />
              Back to Projects
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="writer">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header with navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/audiomarket/writer/projects"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLongLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-300 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-[rgb(var(--accent-primary))]" />
              Due: {project.deadline}
            </div>
            <div className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-300 flex items-center gap-2">
              <BriefcaseIcon className="w-4 h-4 text-[rgb(var(--accent-primary))]" />
              {project.studio}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <div className="card p-6">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Project Overview</h2>
                {project.rating && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <StarIcon className="w-5 h-5" />
                    <span>{project.rating}</span>
                  </div>
                )}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">{project.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase mb-1">Budget</div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-[rgb(var(--accent-primary))]" />
                    {project.budget}
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase mb-1">Deadline</div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-[rgb(var(--accent-primary))]" />
                    {project.deadline}
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase mb-1">Submissions</div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-[rgb(var(--accent-primary))]" />
                    {project.submissions}
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase mb-1">Genre</div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <EyeIcon className="w-5 h-5 text-[rgb(var(--accent-primary))]" />
                    {project.genre || "Not specified"}
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Project Requirements</h2>
              {project.requirements ? (
                <div className="space-y-3">
                  {Array.isArray(project.requirements) ? (
                    project.requirements.map((requirement, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                      >
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-[rgb(var(--accent-primary))]" />
                        <span className="text-gray-300">{requirement}</span>
                      </div>
                    ))
                  ) : typeof project.requirements === 'string' ? (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[rgb(var(--accent-primary))]" />
                      <span className="text-gray-300">{project.requirements}</span>
                    </div>
                  ) : (
                    <p className="text-gray-400">Requirements format not recognized.</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No specific requirements provided.</p>
              )}
            </div>

            {/* AI Scoring Criteria */}
            {project.aiPreferences && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-white mb-4">AI Scoring Criteria</h2>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm">
                    Projects are scored on various factors. This breakdown shows what this project values most.
                  </p>
                </div>
                <div className="space-y-4">
                  {Object.entries(project.aiPreferences).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-white">{value}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white mb-1">Ready to Submit?</h2>
                  <p className="text-gray-400 text-sm">
                    Submit your script and get a chance to work with {project.studio}
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5" />
                      </div>
                      <div>Upload your script file</div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <ChartBarIcon className="w-5 h-5" />
                      </div>
                      <div>Get AI-powered script analysis</div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <UserGroupIcon className="w-5 h-5" />
                      </div>
                      <div>Potential selection by {project.studio}</div>
                    </div>
                  </div>
                  
                  <Link
                    href={`/audiomarket/writer/submit?project=${project.id}`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105 shadow-lg"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Submit Script Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Related Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedProjects.map((relatedProject) => (
                <motion.div
                  key={relatedProject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card cursor-pointer group hover:border-[rgb(var(--accent-primary))]/30 transition-all"
                >
                  <div className="p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white mb-1">{relatedProject.title}</h3>
                      <p className="text-sm text-[rgb(var(--accent-primary))]">{relatedProject.studio}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <CurrencyDollarIcon className="w-5 h-5" />
                        <span className="font-medium">{relatedProject.budget}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <ClockIcon className="w-5 h-5" />
                        <span className="font-medium">Due: {relatedProject.deadline}</span>
                      </div>
                    </div>
                    
                    <Link
                      href={`/audiomarket/writer/projects/${relatedProject.id}`}
                      className="w-full px-3 py-2 bg-white/5 rounded-md text-white text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 