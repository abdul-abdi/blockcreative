'use client';

import { useState } from 'react';

export default function TestBlockchain() {
  const [txHash, setTxHash] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkTransaction = async () => {
    if (!txHash) {
      setError('Please enter a transaction hash');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const walletAddress = localStorage.getItem('walletAddress') || '';
      const response = await fetch(`/api/blockchain/transaction-status?txHash=${txHash}`, {
        headers: {
          'x-wallet-address': walletAddress
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to check transaction');
      console.error('Error checking transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Blockchain Transaction Status Tester</h1>
      
      <div className="bg-white/5 p-6 rounded-lg border border-white/10 mb-6">
        <div className="mb-4">
          <label className="block text-white font-medium mb-2">
            Transaction Hash
          </label>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none text-white"
            placeholder="Enter transaction hash"
          />
        </div>
        
        <button
          onClick={checkTransaction}
          disabled={loading}
          className="px-4 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Transaction Status'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-white p-4 rounded-lg mb-6">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
          <h2 className="text-xl font-bold mb-4">Transaction Status</h2>
          <pre className="bg-black/30 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 