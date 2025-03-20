'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import { getSessionCookieName } from '@/lib/session-helper';

// Define API endpoint types for testing
type ApiEndpoint = {
  id?: string;
  name: string;
  method: string;
  url: string;
  description: string;
  category?: string;
  defaultParams?: Record<string, any>;
  body?: Record<string, any>;
};

export default function DebugPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, error, isLoading } = useUser();
  const [cookies, setCookies] = useState<string[]>([]);
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({});
  const [apiTest, setApiTest] = useState<{ 
    status: string; 
    data: any | null;
    endpoint?: string;
    duration?: number;
  }>({ 
    status: 'idle', 
    data: null 
  });
  
  // Input states for API testing
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // List of available API endpoints to test
  const apiEndpoints: ApiEndpoint[] = [
    // Auth endpoints
    {
      name: 'Get Current User',
      url: '/api/users/me',
      method: 'GET',
      description: 'Retrieves current authenticated user details',
      category: 'user'
    },
    {
      name: 'Health Check',
      url: '/api/health',
      method: 'GET',
      description: 'Checks the health status of all system components',
      category: 'auth'
    },
    
    // Project endpoints
    {
      name: 'List Projects',
      url: '/api/projects',
      method: 'GET',
      description: 'Get all projects accessible to the current user',
      category: 'project'
    },
    {
      name: 'Create Project',
      url: '/api/projects',
      method: 'POST',
      description: 'Create a new project (producer only)',
      category: 'project',
      body: {
        title: 'Test Project',
        description: 'Created from debug page',
        genre: 'Drama',
        budget: 0.1,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: 'Script length: 10-20 pages',
        status: 'draft'
      }
    },
    {
      name: 'Get Project By ID',
      url: '/api/projects/{id}',
      method: 'GET',
      description: 'Get a specific project by ID',
      category: 'project'
    },
    
    // Blockchain endpoints
    {
      name: 'Fund Project Escrow',
      url: '/api/blockchain/escrow/fund',
      method: 'POST',
      description: 'Fund escrow for a project (producer only)',
      category: 'blockchain',
      body: {
        project_id: '',
        amount: '0.1'
      }
    },
    {
      name: 'Refund Project Escrow',
      url: '/api/blockchain/escrow/refund',
      method: 'POST',
      description: 'Refund escrow funds to producer (producer only)',
      category: 'blockchain',
      body: {
        project_id: ''
      }
    },
    {
      name: 'Blockchain Status',
      url: '/api/blockchain/status',
      method: 'GET',
      description: 'Get status of blockchain components',
      category: 'blockchain'
    },
    {
      name: 'Contract Balance',
      url: '/api/blockchain/contracts/balance',
      method: 'GET',
      description: 'Get balance of platform contracts',
      category: 'blockchain',
      body: {
        contract: 'escrow' // Options: escrow, nft, platform
      }
    },
    
    // Submission endpoints
    {
      name: 'Submit Script',
      url: '/api/projects/{id}/submissions',
      method: 'POST',
      description: 'Submit a script to a project (writer only)',
      category: 'submission',
      body: {
        title: 'Test Submission',
        content: 'This is a test script submission created from the debug page.'
      }
    },
    {
      name: 'List Submissions',
      url: '/api/projects/{id}/submissions',
      method: 'GET',
      description: 'Get all submissions for a project',
      category: 'submission'
    },
    {
      name: 'Get Submission',
      url: '/api/submissions/{id}',
      method: 'GET',
      description: 'Get details of a specific submission',
      category: 'submission'
    },
    {
      name: 'Accept Submission',
      url: '/api/submissions/{id}/accept',
      method: 'POST',
      description: 'Accept a submission (producer only)',
      category: 'submission',
      body: {}
    },
    {
      name: 'Reject Submission',
      url: '/api/submissions/{id}/reject',
      method: 'POST',
      description: 'Reject a submission (producer only)',
      category: 'submission',
      body: {
        feedback: 'Rejected for testing purposes'
      }
    },
    
    // NFT endpoints
    {
      name: 'Mint NFT',
      url: '/api/nft/mint',
      method: 'POST',
      description: 'Mint an NFT for an accepted submission (producer only)',
      category: 'nft',
      body: {
        submission_id: '',
        project_id: ''
      }
    },
    {
      name: 'Get NFT Details',
      url: '/api/nft/{id}',
      method: 'GET',
      description: 'Get details of a minted NFT',
      category: 'nft'
    },
    
    // AI endpoints
    {
      name: 'Analyze Script',
      url: '/api/ai/analyze',
      method: 'POST',
      description: 'Analyze a script using AI',
      category: 'ai',
      body: {
        content: 'FADE IN:\n\nEXT. CITY STREET - NIGHT\n\nRain pours down on empty streets, streetlights casting long shadows. A lone figure walks slowly, shoulders hunched against the downpour.\n\nJANE (V.O.)\nI never thought it would end like this.\n\nFADE OUT.'
      }
    },
    {
      name: 'Generate Script Synopsis',
      url: '/api/ai/synopsis',
      method: 'POST',
      description: 'Generate a synopsis for a script concept',
      category: 'ai',
      body: {
        title: 'The Last Journey',
        genre: 'Science Fiction',
        theme: 'Exploration of unknown planets',
        characters: 'Captain, Engineer, Scientist',
        setting: 'Spaceship and alien world'
      }
    },
    {
      name: 'AI Model Status',
      url: '/api/ai/status',
      method: 'GET',
      description: 'Check AI service availability and quotas',
      category: 'ai'
    },
    
    // Complete workflow tests
    {
      name: 'Project Lifecycle Test',
      url: '/api/debug/workflows/project',
      method: 'POST',
      description: 'Test complete project lifecycle (create, fund, submit, accept, mint)',
      category: 'workflow',
      body: {
        runAutomatically: false,
        steps: ['create', 'fund', 'submit', 'analyze', 'accept', 'mint']
      }
    },
    
    // Add Project Blockchain status endpoint
    {
      id: 'check-project-status',
      name: 'Check Project Blockchain Status',
      method: 'GET',
      url: '/api/blockchain/project-status',
      description: 'Check and update a project\'s blockchain status',
      category: 'blockchain',
      defaultParams: {
        projectId: ''
      }
    },
  ];

  // Get cookies and localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get cookies
      const cookieList = document.cookie.split(';').map(cookie => cookie.trim());
      setCookies(cookieList);
      
      // Get localStorage items related to auth
      const storageItems: Record<string, string> = {};
      const authKeys = ['userRole', 'walletAddress', 'userName', 'onboardingCompleted'];
      
      authKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          storageItems[key] = value;
        }
      });
      
      setLocalStorageItems(storageItems);
    }
  }, []);

  // Handle input changes for API testing
  const handleInputChange = (key: string, value: any) => {
    setTestInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Request logging for debugging
  const [requestLog, setRequestLog] = useState<Array<{
    timestamp: string;
    method: string;
    url: string;
    requestBody?: any;
    headers?: Record<string, string>;
  }>>([]);

  // Test any API endpoint
  const testEndpoint = async (endpoint: ApiEndpoint) => {
    try {
      setApiTest({ 
        status: 'loading', 
        data: null, 
        endpoint: endpoint.name 
      });
      
      const startTime = performance.now();
      
      // Process URL - replace any path parameters
      let url = endpoint.url;
      if (url.includes('{id}') && testInputs.id) {
        url = url.replace('{id}', testInputs.id);
      }
      
      // Create request options
      const options: RequestInit = {
        method: endpoint.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      };
      
      // Add body for non-GET requests
      let bodyData: Record<string, any> = {};
      if (endpoint.method !== 'GET' && endpoint.body) {
        // Merge default body with user inputs
        bodyData = { ...endpoint.body, ...testInputs };
        
        // Type conversion for numeric fields if needed
        if (endpoint.name === 'Create Project' && bodyData.budget) {
          bodyData.budget = Number(bodyData.budget);
        }
        
        options.body = JSON.stringify(bodyData);
      }
      
      // Log the request for debugging
      setRequestLog(prev => [{
        timestamp: new Date().toISOString(),
        method: endpoint.method,
        url,
        requestBody: bodyData,
        headers: options.headers as Record<string, string>
      }, ...prev.slice(0, 9)]);
      
      // Make the API call
      const result = await fetch(url, options);
      const endTime = performance.now();
      
      // Safely handle JSON parsing
      let data;
      const responseText = await result.text();
      
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        data = { 
          parseError: 'Invalid JSON response', 
          details: parseError instanceof Error ? parseError.message : String(parseError),
          rawResponse: responseText || 'Empty response'
        };
        
        // Log the error
        setErrorLog(prev => [{
          timestamp: new Date().toISOString(),
          error: `JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          endpoint: endpoint.name
        }, ...prev.slice(0, 19)]);
      }
      
      // Log any API errors
      if (!result.ok) {
        setErrorLog(prev => [{
          timestamp: new Date().toISOString(),
          error: `API error: ${result.status} ${result.statusText}${data?.error ? ` - ${data.error}` : ''}`,
          endpoint: endpoint.name
        }, ...prev.slice(0, 19)]);
      }
      
      setApiTest({ 
        status: `${result.status} ${result.statusText}`, 
        data,
        endpoint: endpoint.name,
        duration: Math.round(endTime - startTime)
      });
    } catch (err) {
      // Log network or other errors
      setErrorLog(prev => [{
        timestamp: new Date().toISOString(),
        error: `Request error: ${err instanceof Error ? err.message : String(err)}`,
        endpoint: endpoint.name
      }, ...prev.slice(0, 19)]);
      
      setApiTest({ 
        status: 'error', 
        data: { error: err instanceof Error ? err.message : String(err) },
        endpoint: endpoint.name
      });
    }
  };

  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Get endpoints for the selected category
  const filteredEndpoints = activeCategory === 'all' 
    ? apiEndpoints 
    : apiEndpoints.filter(endpoint => endpoint.category === activeCategory);

  // New function to format JSON data with syntax highlighting
  const formatJson = (json: any) => {
    if (!json) return null;
    
    try {
      const stringified = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
      
      // Basic syntax highlighting for JSON
      return stringified
        .replace(/"([^"]+)":/g, '<span style="color: #9cdcfe;">\"$1\":</span>')  // keys
        .replace(/"([^"]*)"/g, '<span style="color: #ce9178;">\"$1\"</span>')    // strings
        .replace(/\b(true|false|null)\b/g, '<span style="color: #569cd6;">$1</span>')  // booleans and null
        .replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color: #b5cea8;">$1</span>');      // numbers
    } catch (e) {
      return String(json);
    }
  };

  // Error tracking
  const [errorLog, setErrorLog] = useState<Array<{
    timestamp: string;
    error: string;
    endpoint?: string;
  }>>([]);
  
  // Clear error log
  const clearErrorLog = () => {
    setErrorLog([]);
  };
  
  // Clear request log
  const clearRequestLog = () => {
    setRequestLog([]);
  };

  // Add new state for blockchain troubleshooting
  const [blockchainDiagnostics, setBlockchainDiagnostics] = useState<{
    running: boolean;
    results: Array<{
      test: string;
      status: 'success' | 'warning' | 'error' | 'pending';
      message: string;
      details?: any;
    }>;
  }>({
    running: false,
    results: []
  });

  // Function to run blockchain diagnostics
  const runBlockchainDiagnostics = async () => {
    setBlockchainDiagnostics({
      running: true,
      results: [
        { test: 'Health Check', status: 'pending', message: 'Checking blockchain health status...' },
        { test: 'Environment Variables', status: 'pending', message: 'Checking blockchain environment variables...' },
        { test: 'Provider Connection', status: 'pending', message: 'Testing provider connection...' },
        { test: 'Contract Access', status: 'pending', message: 'Verifying contract access...' },
        { test: 'Network Validation', status: 'pending', message: 'Validating blockchain network...' }
      ]
    });
    
    // Step 1: Get health status
    try {
      const healthResult = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache',
          'Accept': 'application/json'
        }
      });
      
      const healthData = await healthResult.json();
      const blockchainHealth = healthData.components.blockchain;
      
      // Update health check result
      setBlockchainDiagnostics(prev => ({
        ...prev,
        results: prev.results.map(r => 
          r.test === 'Health Check' 
            ? { 
                test: 'Health Check', 
                status: blockchainHealth.status === 'healthy' ? 'success' : 'warning',
                message: `Blockchain reports as ${blockchainHealth.status}`,
                details: blockchainHealth.details
              }
            : r
        )
      }));
      
      // Step 2: Check blockchain status endpoint (complete details)
      try {
        const statusResult = await fetch('/api/blockchain/status', {
          method: 'GET',
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache',
            'Accept': 'application/json'
          }
        });
        
        const statusData = await statusResult.json();
        const details = statusData.data?.details || {};
        
        // Update environment variables status
        const envStatus = details.configPresent ? 'success' : 'error';
        setBlockchainDiagnostics(prev => ({
          ...prev,
          results: prev.results.map(r => 
            r.test === 'Environment Variables' 
              ? { 
                  test: 'Environment Variables', 
                  status: envStatus,
                  message: envStatus === 'success' 
                    ? 'All required environment variables are present' 
                    : 'Missing some required environment variables',
                  details: {
                    configPresent: details.configPresent,
                    endpoints: details.endpoints
                  }
                }
              : r
          )
        }));
        
        // Update provider connection status
        const providerStatus = details.providerConnected ? 'success' : 'error';
        setBlockchainDiagnostics(prev => ({
          ...prev,
          results: prev.results.map(r => 
            r.test === 'Provider Connection' 
              ? { 
                  test: 'Provider Connection', 
                  status: providerStatus,
                  message: providerStatus === 'success' 
                    ? 'Provider is connected' 
                    : 'Failed to connect to blockchain provider',
                  details: { 
                    providerConnected: details.providerConnected,
                    connectionAttempts: details.connectionAttempts,
                    lastInitializationTime: details.lastInitializationTime
                  }
                }
              : r
          )
        }));
        
        // Add network validation status
        const networkInfo = details.network || {};
        const networkStatus = networkInfo.valid ? 'success' : (details.providerConnected ? 'warning' : 'error');
        
        setBlockchainDiagnostics(prev => ({
          ...prev,
          results: prev.results.map(r => 
            r.test === 'Network Validation' 
              ? { 
                  test: 'Network Validation', 
                  status: networkStatus,
                  message: networkStatus === 'success' 
                    ? 'Connected to the correct network' 
                    : networkStatus === 'warning'
                      ? `Connected to wrong network: expected chainId ${networkInfo.expected}, found ${networkInfo.actual}`
                      : 'Cannot validate network (provider not connected)',
                  details: networkInfo
                }
              : r
          )
        }));
        
        // Step 3: Test contract access
        try {
          const contractsStatus = 
            details.contracts?.projectRegistry && 
            details.contracts?.escrowManager && 
            details.contracts?.scriptNFT
              ? 'success' : 'warning';
            
          setBlockchainDiagnostics(prev => ({
            ...prev,
            results: prev.results.map(r => 
              r.test === 'Contract Access' 
                ? { 
                    test: 'Contract Access', 
                    status: contractsStatus,
                    message: contractsStatus === 'success' 
                      ? 'All contracts initialized successfully' 
                      : 'Some contracts may not be initialized',
                    details: { contracts: details.contracts }
                  }
                : r
            ),
            running: false
          }));
        } catch (err) {
          setBlockchainDiagnostics(prev => ({
            ...prev,
            results: prev.results.map(r => 
              r.test === 'Contract Access' 
                ? { 
                    test: 'Contract Access', 
                    status: 'error',
                    message: 'Error while testing contract access',
                    details: { error: err instanceof Error ? err.message : String(err) }
                  }
                : r
            ),
            running: false
          }));
        }
      } catch (err) {
        // Handle error in status check
        console.error('Error checking blockchain status:', err);
        
        // Update remaining tests as errors
        setBlockchainDiagnostics(prev => ({
          ...prev,
          results: prev.results.map(r => 
            r.test !== 'Health Check' 
              ? { 
                  ...r,
                  status: 'error',
                  message: 'Failed to check due to blockchain status API error',
                  details: { error: err instanceof Error ? err.message : String(err) }
                }
              : r
          ),
          running: false
        }));
      }
    } catch (err) {
      console.error('Error checking health status:', err);
      
      // All tests failed due to health check error
      setBlockchainDiagnostics(prev => ({
        ...prev,
        results: prev.results.map(r => ({
          ...r,
          status: 'error',
          message: 'Failed to run tests due to health check error',
          details: { error: err instanceof Error ? err.message : String(err) }
        })),
        running: false
      }));
    }
  };

  // Add new state for blockchain initialization
  const [initializingBlockchain, setInitializingBlockchain] = useState(false);
  const [blockchainInitResult, setBlockchainInitResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Function to force blockchain initialization
  const forceBlockchainInitialization = async () => {
    setInitializingBlockchain(true);
    setBlockchainInitResult(null);
    
    try {
      // First, try to initialize via a direct API call
      const initResult = await fetch('/api/blockchain/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ force: true })
      });
      
      let data;
      try {
        data = await initResult.json();
      } catch (e) {
        data = { success: false, message: 'Failed to parse response from initialization endpoint' };
      }
      
      setBlockchainInitResult({
        success: initResult.ok,
        message: initResult.ok ? 'Blockchain initialized successfully' : `Initialization failed: ${initResult.status} ${initResult.statusText}`,
        details: data
      });
      
      // Add small delay and run diagnostics again
      setTimeout(() => {
        runBlockchainDiagnostics();
      }, 1000);
    } catch (err) {
      setBlockchainInitResult({
        success: false,
        message: `Error during initialization: ${err instanceof Error ? err.message : String(err)}`,
        details: { error: err }
      });
    } finally {
      setInitializingBlockchain(false);
    }
  };

  // State for environment variables editor
  const [envEditor, setEnvEditor] = useState({
    isOpen: false,
    variables: {
      LISK_RPC_URL: '',
      LISK_PRIVATE_KEY: '',
      PLATFORM_ADDRESS: '',
      ESCROW_MANAGER_ADDRESS: '',
      SCRIPT_NFT_ADDRESS: '',
      GAS_LIMIT: '',
      GAS_PRICE: ''
    }
  });

  // Load env vars from localStorage for demo purposes
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('debug_env_vars')) {
      try {
        const savedVars = JSON.parse(localStorage.getItem('debug_env_vars') || '{}');
        setEnvEditor(prev => ({
          ...prev,
          variables: { ...prev.variables, ...savedVars }
        }));
      } catch (e) {
        console.error('Failed to load saved env vars:', e);
      }
    }
  }, []);

  // Save environment variables to localStorage
  const saveEnvVariables = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug_env_vars', JSON.stringify(envEditor.variables));
      
      // Show notification of success
      setErrorLog(prev => [{
        timestamp: new Date().toISOString(),
        error: `Environment variables saved to localStorage for testing`,
        endpoint: 'Environment Editor'
      }, ...prev.slice(0, 19)]);
      
      // Close the editor
      setEnvEditor(prev => ({ ...prev, isOpen: false }));
      
      // Rerun diagnostics after a moment
      setTimeout(() => {
        runBlockchainDiagnostics();
      }, 500);
    }
  };

  // Update environment variable in editor
  const updateEnvVariable = (key: string, value: string) => {
    setEnvEditor(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value
      }
    }));
  };

  // Add state variables at the top of your component
  const [projectStatusId, setProjectStatusId] = useState('');
  const [projectStatusResult, setProjectStatusResult] = useState<any>(null);

  // Add the function to check project status
  const checkProjectStatus = async () => {
    if (!projectStatusId) {
      setProjectStatusResult({ error: 'Please enter a Project ID' });
      return;
    }
    
    try {
      const response = await fetch(`/api/blockchain/project-status?projectId=${projectStatusId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText);
          setProjectStatusResult({ 
            error: errorJson.error || 'Failed to check project status', 
            details: errorJson
          });
        } catch {
          // If not valid JSON, return as text
          setProjectStatusResult({ 
            error: 'Failed to check project status', 
            details: errorText
          });
        }
        return;
      }
      
      const data = await response.json();
      setProjectStatusResult(data);
      
      // Add to the request log
      addToRequestLog({
        method: 'GET',
        url: `/api/blockchain/project-status?projectId=${projectStatusId}`,
        timestamp: new Date().toISOString(),
        body: null,
        response: {
          status: response.status,
          ok: response.ok
        }
      });
    } catch (error) {
      setProjectStatusResult({ 
        error: 'Failed to check project status', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Add a request logging function
  const addToRequestLog = (requestData: any) => {
    setRequestLog(prev => [requestData, ...prev].slice(0, 10));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Debug Console</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
            <div className="space-y-2 text-sm">
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'Not set'}</p>
            <p><strong>Expected Cookie Name:</strong> {getSessionCookieName()}</p>
            <p><strong>Is Production:</strong> {process.env.NODE_ENV === 'production' ? 'Yes' : 'No'}</p>
              <p><strong>Auth Status:</strong> {status}</p>
              <p><strong>User Role:</strong> {user?.role || 'Not authenticated'}</p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 text-xs rounded ${activeCategory === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                All
              </button>
              {['auth', 'user', 'project', 'blockchain', 'submission', 'nft', 'ai', 'workflow'].map(category => (
                <button 
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-1 text-xs rounded capitalize ${activeCategory === category ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {filteredEndpoints.map((endpoint) => (
                <div key={endpoint.name} className="border border-gray-700 rounded p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{endpoint.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      endpoint.method === 'GET' ? 'bg-green-800' : 
                      endpoint.method === 'POST' ? 'bg-blue-800' : 
                      endpoint.method === 'PUT' ? 'bg-yellow-800' : 'bg-red-800'
                    }`}>
                      {endpoint.method}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{endpoint.description}</p>
                  <div className="text-xs mt-2 text-gray-400">
                    <code>{endpoint.url}</code>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedEndpoint(endpoint.name);
                      // Pre-populate with any default values
                      if (endpoint.body) {
                        setTestInputs(endpoint.body);
                      } else {
                        setTestInputs({});
                      }
                    }}
                    className="mt-2 bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1 rounded w-full"
                  >
                    Select
                  </button>
                </div>
              ))}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Error Log</h2>
              <button 
                onClick={clearErrorLog} 
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
              >
                Clear Errors
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {errorLog.length === 0 ? (
                <p className="text-gray-400 text-center text-sm py-4">No errors logged</p>
              ) : (
          <div className="space-y-2">
                  {errorLog.map((error, index) => (
                    <div key={index} className="bg-gray-900 p-2 rounded text-xs border-l-2 border-red-500">
                      <div className="flex justify-between items-start">
                        <span className="text-red-400 font-medium">
                          {error.endpoint || 'Unknown endpoint'}
                        </span>
                        <span className="text-gray-500">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-300">{error.error}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Request Log</h2>
              <button 
                onClick={clearRequestLog} 
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
              >
                Clear Log
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {requestLog.length === 0 ? (
                <p className="text-gray-400 text-center text-sm py-4">No requests logged</p>
              ) : (
          <div className="space-y-2">
                  {requestLog.map((req, index) => (
                    <div key={index} className="bg-gray-900 p-2 rounded text-xs border-l-2 border-blue-500">
                      <div className="flex justify-between items-start">
                        <span className="text-blue-400 font-medium">
                          {req.method} {req.url}
                        </span>
                        <span className="text-gray-500">
                          {new Date(req.timestamp).toLocaleTimeString()}
                        </span>
              </div>
                      
                      {req.requestBody && Object.keys(req.requestBody).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-gray-400 cursor-pointer">Request Body</summary>
                          <pre className="mt-1 bg-gray-950 p-1 rounded text-xxs overflow-auto">
                            {JSON.stringify(req.requestBody, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      {req.headers && Object.keys(req.headers).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-gray-400 cursor-pointer">Headers</summary>
                          <pre className="mt-1 bg-gray-950 p-1 rounded text-xxs overflow-auto">
                            {JSON.stringify(req.headers, null, 2)}
                </pre>
                        </details>
                      )}
                    </div>
                  ))}
              </div>
            )}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-6">
        <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Test Console</h2>
            
            {selectedEndpoint ? (
              <>
                <div className="mb-4">
                  <h3 className="font-medium mb-2">
                    {apiEndpoints.find(e => e.name === selectedEndpoint)?.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {apiEndpoints.find(e => e.name === selectedEndpoint)?.description}
                  </p>
                  
                  <div className="space-y-3">
                    {/* Dynamic form for endpoint parameters */}
                    {apiEndpoints.find(e => e.name === selectedEndpoint)?.body && 
                      Object.entries(apiEndpoints.find(e => e.name === selectedEndpoint)?.body || {}).map(([key, defaultValue]) => (
                        <div key={key} className="grid grid-cols-3 gap-2 items-center">
                          <label className="text-sm">{key}:</label>
                          {key === 'content' ? (
                            <textarea
                              className="col-span-2 bg-gray-700 p-2 rounded text-sm"
                              value={testInputs[key] || ''}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              placeholder={String(defaultValue)}
                              rows={8}
                            />
                          ) : (
                            <input 
                              type={typeof defaultValue === 'number' ? 'number' : 'text'}
                              className="col-span-2 bg-gray-700 p-2 rounded text-sm"
                              value={testInputs[key] || ''}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              placeholder={String(defaultValue)}
                            />
                          )}
                        </div>
                      ))
                    }
                    
                    {/* ID field for endpoints with URL parameters */}
                    {apiEndpoints.find(e => e.name === selectedEndpoint)?.url.includes('{id}') && (
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-sm">id (URL parameter):</label>
                        <input 
                          type="text"
                          className="col-span-2 bg-gray-700 p-2 rounded text-sm"
                          value={testInputs.id || ''}
                          onChange={(e) => handleInputChange('id', e.target.value)}
                          placeholder="Required ID parameter"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => testEndpoint(apiEndpoints.find(e => e.name === selectedEndpoint)!)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      disabled={apiTest.status === 'loading'}
                    >
                      {apiTest.status === 'loading' ? 'Testing...' : 'Execute Request'}
                    </button>
                    
                    {selectedEndpoint === 'Create Project' && (
                      <button 
                        onClick={() => {
                          // Ensure proper types for create project
                          const modifiedInputs = {
                            ...testInputs,
                            budget: Number(testInputs.budget || 0.1),
                            status: 'draft' // Force status to draft for testing
                          };
                          setTestInputs(modifiedInputs);
                          
                          // Run the test with a slight delay to allow state update
                          setTimeout(() => {
                            testEndpoint(apiEndpoints.find(e => e.name === selectedEndpoint)!);
                          }, 100);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                        disabled={apiTest.status === 'loading'}
                      >
                        Fix & Execute
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-400 my-8">
                Select an API endpoint from the list to test
              </p>
            )}
            
            {apiTest.status !== 'idle' && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">
                    Response: <span className={`${apiTest.status.startsWith('2') ? 'text-green-400' : 'text-red-400'}`}>
                      {apiTest.status}
                    </span>
                  </h3>
                  {apiTest.duration && (
                    <span className="text-xs text-gray-400">
                      Completed in {apiTest.duration}ms
                    </span>
                  )}
                </div>
                
                {/* Show troubleshooting tips for 500 errors on Create Project */}
                {apiTest.endpoint === 'Create Project' && apiTest.status.includes('500') && (
                  <div className="mb-4 bg-red-900/30 border border-red-800 p-3 rounded">
                    <h4 className="text-red-300 text-sm font-medium">Troubleshooting Project Creation:</h4>
                    <ul className="list-disc pl-5 text-xs mt-2 space-y-1 text-gray-300">
                      <li>Ensure your user role is <strong>producer</strong> (Check user details section)</li>
                      <li>Verify budget is a number, not a string</li>
                      <li>Ensure all required fields are provided (title, description, budget)</li>
                      <li>Try using the "Fix & Execute" button which enforces proper types</li>
                      <li>Check the Server logs for more detailed error information</li>
                    </ul>
                  </div>
                )}
                
                {/* Enhanced response display with collapsible sections for AI analysis results */}
                {apiTest.endpoint?.includes('Analyze') && apiTest.data?.analysis ? (
                  <div className="bg-gray-900 p-3 rounded overflow-auto max-h-96">
                    <div className="mb-3">
                      <h4 className="text-blue-400 text-sm font-medium mb-1">AI Analysis Results</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {apiTest.data.analysis.genre && (
                          <div className="bg-gray-800 p-2 rounded">
                            <h5 className="text-xs text-gray-400">Genre</h5>
                            <p className="text-sm">{apiTest.data.analysis.genre}</p>
                          </div>
                        )}
                        {apiTest.data.analysis.tone && (
                          <div className="bg-gray-800 p-2 rounded">
                            <h5 className="text-xs text-gray-400">Tone</h5>
                            <p className="text-sm">{apiTest.data.analysis.tone}</p>
                          </div>
                        )}
                        {apiTest.data.analysis.theme && (
                          <div className="bg-gray-800 p-2 rounded">
                            <h5 className="text-xs text-gray-400">Theme</h5>
                            <p className="text-sm">{apiTest.data.analysis.theme}</p>
                          </div>
                        )}
                        {apiTest.data.analysis.pacing && (
                          <div className="bg-gray-800 p-2 rounded">
                            <h5 className="text-xs text-gray-400">Pacing</h5>
                            <p className="text-sm">{apiTest.data.analysis.pacing}</p>
                          </div>
                        )}
                      </div>
                      
                      {apiTest.data.analysis.summary && (
                        <div className="mt-3 bg-gray-800 p-2 rounded">
                          <h5 className="text-xs text-gray-400">Summary</h5>
                          <p className="text-sm whitespace-pre-wrap">{apiTest.data.analysis.summary}</p>
                        </div>
                      )}
                      
                      {apiTest.data.analysis.strengths && (
                        <div className="mt-3 bg-gray-800 p-2 rounded">
                          <h5 className="text-xs text-gray-400">Strengths</h5>
                          <ul className="list-disc pl-5 text-sm">
                            {apiTest.data.analysis.strengths.map((strength: string, i: number) => (
                              <li key={i}>{strength}</li>
              ))}
            </ul>
                        </div>
                      )}
                      
                      {apiTest.data.analysis.improvements && (
                        <div className="mt-3 bg-gray-800 p-2 rounded">
                          <h5 className="text-xs text-gray-400">Areas for Improvement</h5>
                          <ul className="list-disc pl-5 text-sm">
                            {apiTest.data.analysis.improvements.map((improvement: string, i: number) => (
                              <li key={i}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <details className="mt-4">
                      <summary className="text-xs text-gray-400 cursor-pointer">View Raw JSON Response</summary>
                      <pre className="mt-2 text-xs">
                        {JSON.stringify(apiTest.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <pre className="bg-gray-900 p-3 rounded overflow-auto max-h-80 text-sm">
                    {JSON.stringify(apiTest.data, null, 2)}
                </pre>
                )}
              </div>
          )}
        </div>
        
          {/* Add blockchain troubleshooter below API test console */}
        <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Blockchain Troubleshooter</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEnvEditor(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                >
                  Edit Env Vars
                </button>
                <button 
                  onClick={forceBlockchainInitialization} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
                  disabled={initializingBlockchain}
                >
                  {initializingBlockchain ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Initializing...
                    </>
                  ) : (
                    <>Force Initialize</>
                  )}
                </button>
          <button 
                  onClick={runBlockchainDiagnostics} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
                  disabled={blockchainDiagnostics.running}
                >
                  {blockchainDiagnostics.running ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running Tests...
                    </>
                  ) : (
                    <>Run Diagnostics</>
                  )}
          </button>
              </div>
        </div>
        
            {/* Environment Variables Editor */}
            {envEditor.isOpen && (
              <div className="mb-6 border border-yellow-700 p-3 rounded bg-gray-900/50">
                <h3 className="text-lg font-medium text-yellow-400 mb-3">Environment Variables</h3>
                <p className="text-sm text-gray-400 mb-4">
                  These variables are required for blockchain operations. For testing purposes, they will be stored in your browser's localStorage.
                </p>
                
                <div className="space-y-3">
                  {Object.entries(envEditor.variables).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-5 gap-2 items-center">
                      <label className="text-sm col-span-2">{key}:</label>
                      <input 
                        type="text"
                        className="col-span-3 bg-gray-700 p-2 rounded text-sm"
                        value={value}
                        onChange={(e) => updateEnvVariable(key, e.target.value)}
                        placeholder={`Enter ${key}`}
                      />
                    </div>
                  ))}
                  
                  <div className="flex justify-end gap-2 mt-4">
          <button 
                      onClick={() => setEnvEditor(prev => ({ ...prev, isOpen: false }))}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
                      Cancel
          </button>
                    <button 
                      onClick={saveEnvVariables}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Save Variables
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Blockchain Initialization Result */}
            {blockchainInitResult && (
              <div className={`mb-6 border p-3 rounded ${
                blockchainInitResult.success ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'
              }`}>
                <h3 className={`text-lg font-medium ${
                  blockchainInitResult.success ? 'text-green-400' : 'text-red-400'
                } mb-2`}>
                  {blockchainInitResult.success ? 'Initialization Successful' : 'Initialization Failed'}
                </h3>
                <p className="text-sm text-gray-300 mb-2">{blockchainInitResult.message}</p>
                
                {blockchainInitResult.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer">View Details</summary>
                    <div className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto max-h-32">
                      <pre>{JSON.stringify(blockchainInitResult.details, null, 2)}</pre>
                    </div>
                  </details>
                )}
              </div>
            )}
            
            {blockchainDiagnostics.results.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                Click "Run Diagnostics" to check blockchain connectivity issues
              </p>
            ) : (
              <div className="space-y-3">
                {blockchainDiagnostics.results.map((result, index) => (
                  <div key={index} className={`border p-3 rounded ${
                    result.status === 'pending' ? 'border-gray-600 bg-gray-700/30' : 
                    result.status === 'success' ? 'border-green-600 bg-green-900/20' : 
                    result.status === 'warning' ? 'border-yellow-600 bg-yellow-900/20' : 
                    'border-red-600 bg-red-900/20'
                  }`}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium flex items-center gap-2">
                        {result.status === 'pending' && (
                          <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {result.status === 'success' && (
                          <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {result.status === 'warning' && (
                          <svg className="h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {result.status === 'error' && (
                          <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {result.test}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.status === 'pending' ? 'bg-gray-700 text-gray-300' : 
                        result.status === 'success' ? 'bg-green-900 text-green-300' : 
                        result.status === 'warning' ? 'bg-yellow-900 text-yellow-300' : 
                        'bg-red-900 text-red-300'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    <p className="text-sm mt-1 text-gray-300">{result.message}</p>
                    
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer">View Details</summary>
                        <div className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto max-h-32">
                          <pre>{JSON.stringify(result.details, null, 2)}</pre>
                        </div>
                      </details>
                    )}
                    
                    {/* Special troubleshooting tips */}
                    {result.test === 'Environment Variables' && result.status === 'error' && (
                      <div className="mt-2 text-xs bg-gray-900 p-2 rounded">
                        <h4 className="font-medium text-yellow-400 mb-1">Troubleshooting Tips:</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Check your .env.local file for missing blockchain variables</li>
                          <li>Required variables: LISK_RPC_URL, LISK_PRIVATE_KEY, PLATFORM_ADDRESS</li>
                          <li>Make sure your .env.local file is in the project root directory</li>
                          <li>Restart the development server after updating environment variables</li>
                        </ul>
                      </div>
                    )}
                    
                    {result.test === 'Provider Connection' && result.status === 'error' && (
                      <div className="mt-2 text-xs bg-gray-900 p-2 rounded">
                        <h4 className="font-medium text-yellow-400 mb-1">Troubleshooting Tips:</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Verify your RPC URL is correct and available</li>
                          <li>Ensure your private key has valid format</li>
                          <li>Check if your network is reachable (firewall settings)</li>
                          <li>Try restarting the development server</li>
                        </ul>
                      </div>
                    )}
                    
                    {result.test === 'Contract Access' && result.status === 'error' && (
                      <div className="mt-2 text-xs bg-gray-900 p-2 rounded">
                        <h4 className="font-medium text-yellow-400 mb-1">Troubleshooting Tips:</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Verify contract addresses in your .env.local are correct</li>
                          <li>Check if contract ABIs match the deployed contracts</li>
                          <li>Make sure you have the right chain ID configured</li>
                          <li>Verify you have adequate gas for blockchain interactions</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Special message for initialization issues */}
                {blockchainDiagnostics.results.find(r => r.test === 'Health Check')?.status === 'success' &&
                 blockchainDiagnostics.results.find(r => r.test === 'Health Check')?.details?.initializationAttempted === false && (
                  <div className="border-2 border-purple-500 p-3 rounded bg-purple-900/20 mb-4">
                    <h3 className="font-medium text-purple-400 flex items-center gap-2">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Quick Fix Available
                    </h3>
                    <p className="text-sm mt-2 text-gray-300">
                      The blockchain provider is connected but not initialized. Click "Force Initialize" to attempt initialization.
                    </p>
                    <button 
                      onClick={forceBlockchainInitialization} 
                      className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                      disabled={initializingBlockchain}
                    >
                      {initializingBlockchain ? 'Initializing...' : 'Force Initialize Blockchain'}
                    </button>
                  </div>
                )}
                
                {/* Contract error HTML response fix suggestion */}
                {blockchainDiagnostics.results.find(r => 
                  r.test === 'Contract Access' && 
                  r.details?.error?.includes('<!DOCTYPE')
                ) && (
                  <div className="border-2 border-orange-500 p-3 rounded bg-orange-900/20 mb-4">
                    <h3 className="font-medium text-orange-400 flex items-center gap-2">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      API Endpoint Error
                    </h3>
                    <p className="text-sm mt-2 text-gray-300">
                      The contract access test received HTML instead of JSON. This usually means:
                    </p>
                    <ul className="list-disc pl-5 text-xs mt-2 space-y-1 text-gray-300">
                      <li>The API endpoint doesn't exist or is not registered</li>
                      <li>Server returned a 404 or 500 error page</li>
                      <li>The route is not properly handling the request</li>
                    </ul>
                    <p className="text-sm mt-2 text-gray-300">
                      Check the server console for more details on the error.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg mb-2">Session Data</h3>
                {session ? (
                  <pre className="bg-gray-900 p-2 rounded overflow-auto max-h-40 text-xs">
                    {JSON.stringify(session, null, 2)}
              </pre>
                ) : (
                  <p className="text-gray-400">No active session</p>
                )}
            </div>
              
              <div>
                <h3 className="text-lg mb-2">User Details</h3>
                {user ? (
                  <pre className="bg-gray-900 p-2 rounded overflow-auto max-h-40 text-xs">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-400">No user data available</p>
                )}
              </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Browser Storage</h2>
              <button 
                onClick={clearLocalStorage} 
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Clear LocalStorage
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg mb-2">Cookies</h3>
          {cookies.length > 0 ? (
                  <div className="bg-gray-900 p-2 rounded max-h-40 overflow-y-auto text-xs">
                    <ul className="space-y-1">
              {cookies.map((cookie, i) => (
                        <li key={i} className="break-all">{cookie}</li>
              ))}
            </ul>
                  </div>
          ) : (
                  <p className="text-gray-400">No cookies found</p>
          )}
        </div>
        
              <div>
                <h3 className="text-lg mb-2">LocalStorage</h3>
          {Object.keys(localStorageItems).length > 0 ? (
                  <div className="bg-gray-900 p-2 rounded max-h-40 overflow-y-auto text-xs">
                    <ul className="space-y-1">
              {Object.entries(localStorageItems).map(([key, value]) => (
                        <li key={key} className="break-all">
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
                  </div>
                ) : (
                  <p className="text-gray-400">No localStorage items found</p>
                )}
        </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex gap-4">
        <button 
          onClick={() => router.push('/')} 
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Back to Home
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Refresh Page
        </button>
      </div>
      
      {/* Add this new section for blockchain diagnostics */}
      <div className="bg-gray-800 text-white p-6 rounded-xl mb-8">
        <h2 className="text-xl font-bold mb-4">Blockchain Diagnostics</h2>
        
        {/* Existing blockchain diagnostics */}
        
        {/* Project Blockchain Status */}
        <div className="bg-white/10 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Project Blockchain Status</h3>
          <div className="flex flex-col space-y-2">
            <input 
              type="text" 
              placeholder="Project ID" 
              value={projectStatusId} 
              onChange={e => setProjectStatusId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-2"
            />
            <button
              onClick={checkProjectStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Check Project Status
            </button>
          </div>
          {projectStatusResult && (
            <div className="mt-4">
              <div className="bg-white/5 p-3 rounded-lg">
                <pre className="text-sm overflow-auto max-h-60 whitespace-pre-wrap">
                  {JSON.stringify(projectStatusResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 