/**
 * Mock Database Service
 * 
 * This module provides mock data and functions for development purposes
 * when the MongoDB connection is not available.
 */

// Mock user data
const mockUsers = [
  {
    id: 'user_1',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    role: 'writer',
    name: 'John Writer',
    email: 'john@example.com',
    onboarding_completed: true,
    onboarding_step: 5,
    created_at: new Date('2023-01-01'),
    profile_data: {
      bio: 'Experienced screenwriter with a passion for sci-fi and drama.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      website: 'https://johnwriter.com',
      social: {
        twitter: 'johnwriter',
        linkedin: 'johnwriter'
      }
    }
  },
  {
    id: 'user_2',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    role: 'producer',
    name: 'Universal Studios',
    email: 'contact@universal.com',
    onboarding_completed: true,
    onboarding_step: 5,
    created_at: new Date('2023-01-01'),
    profile_data: {
      bio: 'Major film studio producing blockbuster movies.',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
      company_name: 'Universal Studios',
      company_website: 'https://universal.com',
      social: {
        twitter: 'universalstudios',
        linkedin: 'universal-studios'
      }
    }
  }
];

// Mock projects data
const mockProjects = [
  {
    id: 'project_1',
    producer_id: 'user_2',
    title: 'Sci-Fi Feature Film',
    description: 'Looking for an original sci-fi screenplay with strong character development and unique world-building.',
    requirements: 'Must be feature-length (90-120 pages), original concept, and suitable for a PG-13 audience.',
    budget: 50000,
    deadline: new Date('2023-12-31'),
    status: 'open',
    created_at: new Date('2023-06-01'),
    updated_at: new Date('2023-06-01'),
    is_funded: true,
    funding_amount: 50000
  },
  {
    id: 'project_2',
    producer_id: 'user_2',
    title: 'Drama Series',
    description: 'Seeking scripts for a character-driven drama series set in contemporary times.',
    requirements: 'Episode length 45-60 minutes, strong ensemble cast, contemporary setting.',
    budget: 30000,
    deadline: new Date('2023-11-30'),
    status: 'open',
    created_at: new Date('2023-05-15'),
    updated_at: new Date('2023-05-15'),
    is_funded: true,
    funding_amount: 30000
  }
];

// Mock submissions data
const mockSubmissions = [
  {
    id: 'submission_1',
    project_id: 'project_1',
    writer_id: 'user_1',
    title: 'The Last Frontier',
    content: 'Script content here...',
    status: 'pending',
    created_at: new Date('2023-07-01'),
    updated_at: new Date('2023-07-01'),
    is_purchased: false,
    nft_minted: false,
    analysis: {
      overall: 85,
      creativity: 90,
      structure: 80,
      character_development: 85,
      marketability: 80,
      analysis: 'Strong concept with compelling characters. Structure needs some refinement in the second act.',
      strengths: ['Unique premise', 'Well-developed protagonist', 'Strong dialogue'],
      weaknesses: ['Second act pacing issues', 'Supporting characters need more depth'],
      keywords: ['sci-fi', 'space', 'adventure']
    }
  }
];

// Mock database service
export const mockDbService = {
  // User methods
  users: {
    findById: (id: string) => mockUsers.find(user => user.id === id),
    findByAddress: (address: string) => mockUsers.find(user => user.address === address),
    create: (userData: any) => ({ ...userData, id: `user_${Date.now()}` }),
    update: (id: string, userData: any) => {
      const userIndex = mockUsers.findIndex(user => user.id === id);
      if (userIndex === -1) return null;
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
      return mockUsers[userIndex];
    }
  },
  
  // Project methods
  projects: {
    findById: (id: string) => mockProjects.find(project => project.id === id),
    findByProducerId: (producerId: string) => mockProjects.filter(project => project.producer_id === producerId),
    findAll: () => mockProjects,
    create: (projectData: any) => ({ ...projectData, id: `project_${Date.now()}` }),
    update: (id: string, projectData: any) => {
      const projectIndex = mockProjects.findIndex(project => project.id === id);
      if (projectIndex === -1) return null;
      mockProjects[projectIndex] = { ...mockProjects[projectIndex], ...projectData };
      return mockProjects[projectIndex];
    }
  },
  
  // Submission methods
  submissions: {
    findById: (id: string) => mockSubmissions.find(submission => submission.id === id),
    findByProjectId: (projectId: string) => mockSubmissions.filter(submission => submission.project_id === projectId),
    findByWriterId: (writerId: string) => mockSubmissions.filter(submission => submission.writer_id === writerId),
    create: (submissionData: any) => ({ ...submissionData, id: `submission_${Date.now()}` }),
    update: (id: string, submissionData: any) => {
      const submissionIndex = mockSubmissions.findIndex(submission => submission.id === id);
      if (submissionIndex === -1) return null;
      mockSubmissions[submissionIndex] = { ...mockSubmissions[submissionIndex], ...submissionData };
      return mockSubmissions[submissionIndex];
    }
  }
};

export default mockDbService; 