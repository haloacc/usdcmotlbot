'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Lock, CheckCircle, Store, Zap, Sparkles } from 'lucide-react';
import { useStore, MOCK_STORES } from '@/app/lib/store';

export default function StoreConnection() {
  const router = useRouter();
  const params = useParams();
  const platform = params?.platform as string;
  const { setActiveStore } = useStore();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedStore, setDetectedStore] = useState<string | null>(null);

  // Auto-detect mock stores
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    
    // Simple mock detection logic
    if (val.toLowerCase().includes('tech')) setDetectedStore('tech');
    else if (val.toLowerCase().includes('green')) setDetectedStore('green');
    else if (val.toLowerCase().includes('sarah')) setDetectedStore('sarah');
    else setDetectedStore(null);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Set the active store based on input, or default to Sarah if unknown
    const targetStoreId = detectedStore || 'sarah';
    setActiveStore(targetStoreId);

    // Simulate connection delay
    setTimeout(() => {
      router.push(`/config/${platform}`);
    }, 1500);
  };

  const getPlatformName = () => {
    switch(platform) {
      case 'shopify': return 'Shopify';
      case 'woocommerce': return 'WooCommerce';
      default: return 'Custom API';
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-8">
      <button 
        onClick={() => router.push('/')}
        className="flex items-center text-sm text-slate-500 hover:text-black mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to platforms
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-display text-slate-900">Connect {getPlatformName()}</h1>
            <p className="text-sm text-slate-500">Securely link your store to Halo</p>
          </div>
        </div>

        <form onSubmit={handleConnect} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {platform === 'shopify' ? 'Store URL' : 'Base API URL'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={platform === 'shopify' ? "your-store" : "https://api.yoursite.com"}
                value={url}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
              />
              {detectedStore && (
                <div className="absolute right-3 top-3 flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-left-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Found: {MOCK_STORES[detectedStore].name}
                </div>
              )}
            </div>
            {platform === 'shopify' && (
              <p className="mt-2 text-xs text-slate-500">
                Tip: Try typing "tech" or "green" to load demo stores.
              </p>
            )}
          </div>

          {(platform === 'woocommerce' || platform === 'custom') && (
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                <input
                  type="password"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                />
              </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-sm font-medium text-slate-900 mb-2">We will request access to:</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-slate-900 mr-2" />
                Read products and collections
              </li>
              <li className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-slate-900 mr-2" />
                Create checkout sessions
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-slate-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Connecting...' : `Connect ${getPlatformName()}`}
          </button>
        </form>
      </div>
    </div>
  );
}