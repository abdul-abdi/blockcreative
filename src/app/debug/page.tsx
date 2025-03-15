'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import { getSessionCookieName } from '@/lib/session-helper';

export default function DebugPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, error, isLoading } = useUser();
  const [cookies, setCookies] = useState<string[]>([]);
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({});
  const [apiTest, setApiTest] = useState<{ status: string; data: any | null }>({ 
    status: 'idle', 
    data: null 
  });

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

  // Test the API directly
  const testApi = async () => {
    try {
      setApiTest({ status: 'loading', data: null });
      
      const result = await fetch('/api/users/me', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      const data = await result.json();
      setApiTest({ 
        status: `${result.status} ${result.statusText}`, 
        data 
      });
    } catch (err) {
      setApiTest({ 
        status: 'error', 
        data: { error: err instanceof Error ? err.message : String(err) } 
      });
    }
  };

  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="space-y-2">
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'Not set'}</p>
            <p><strong>Expected Cookie Name:</strong> {getSessionCookieName()}</p>
            <p><strong>Is Production:</strong> {process.env.NODE_ENV === 'production' ? 'Yes' : 'No'}</p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Session Exists:</strong> {session ? 'Yes' : 'No'}</p>
            {session && (
              <div className="mt-2">
                <h3 className="text-lg">Session Data:</h3>
                <pre className="bg-gray-900 p-2 rounded mt-2 overflow-auto max-h-40">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">useUser Hook</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error ? 'Yes' : 'No'}</p>
            <p><strong>User Exists:</strong> {user ? 'Yes' : 'No'}</p>
            {error && (
              <div className="mt-2">
                <h3 className="text-lg">Error:</h3>
                <pre className="bg-gray-900 p-2 rounded mt-2 overflow-auto max-h-40">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            )}
            {user && (
              <div className="mt-2">
                <h3 className="text-lg">User Data:</h3>
                <pre className="bg-gray-900 p-2 rounded mt-2 overflow-auto max-h-40">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          {cookies.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {cookies.map((cookie, i) => (
                <li key={i}>{cookie}</li>
              ))}
            </ul>
          ) : (
            <p>No cookies found.</p>
          )}
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Local Storage Auth Items</h2>
          {Object.keys(localStorageItems).length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(localStorageItems).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          ) : (
            <p>No auth items found in localStorage.</p>
          )}
          <button 
            onClick={clearLocalStorage} 
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Clear LocalStorage
          </button>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">API Test</h2>
          <button 
            onClick={testApi} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
            disabled={apiTest.status === 'loading'}
          >
            {apiTest.status === 'loading' ? 'Testing...' : 'Test /api/users/me Endpoint'}
          </button>
          
          {apiTest.status !== 'idle' && (
            <div className="mt-2">
              <h3 className="text-lg">Response Status: {apiTest.status}</h3>
              <pre className="bg-gray-900 p-2 rounded mt-2 overflow-auto max-h-60">
                {JSON.stringify(apiTest.data, null, 2)}
              </pre>
            </div>
          )}
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
    </div>
  );
} 