'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';

export default function Settings() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => router.push('/dashboard')}
        className="flex items-center text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">MCP Server Configuration</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Store Connection */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Store Connection</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Connected
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-700 font-bold">S</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">boutique-sarah.myshopify.com</p>
                <p className="text-sm text-slate-500">Shopify Store</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Last synced: 2 minutes ago</p>
              <button className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-700">
                <RefreshCw className="w-3 h-3 mr-1" /> Sync Now
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Reconnect
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200">
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Product Sync Settings */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Product Sync Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <Checkbox 
            label="Auto-sync inventory" 
            desc="Automatically update stock levels every 5 minutes" 
            checked 
          />
          <Checkbox 
            label="Include out-of-stock products" 
            desc="Let agents see products even if they are currently unavailable" 
            checked 
          />
          <Checkbox 
            label="Sync product variants" 
            desc="Include size, color, and material options" 
            checked 
          />
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <div>
                <span className="block text-sm font-medium text-slate-900">Only sync specific collections</span>
                <span className="block text-xs text-slate-500 mt-1">Restrict agents to specific product categories</span>
              </div>
            </label>
            <div className="mt-2 ml-7">
               <select className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-slate-100 disabled:text-slate-400" disabled>
                 <option>Select collections...</option>
               </select>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Permissions */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Agent Permissions</h3>
        </div>
        <div className="p-6 space-y-4">
          <Checkbox 
            label="Allow product search" 
            desc="Agents can search and filter your catalog" 
            checked 
          />
          <Checkbox 
            label="Allow price checking" 
            desc="Agents can retrieve real-time pricing" 
            checked 
          />
          <Checkbox 
            label="Allow inventory checks" 
            desc="Agents can see stock levels" 
            checked 
          />
          <Checkbox 
            label="Allow purchase completion" 
            desc="Agents can create orders" 
            checked 
          />
          <Checkbox 
            label="Require approval for orders >$500" 
            desc="Flag high-value transactions for manual review" 
          />
        </div>
      </div>

      {/* Payment Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Payment Configuration</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <input type="radio" name="payment_mode" defaultChecked className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-900">Halo Payments (Active)</label>
              <p className="text-xs text-slate-500 mt-1 mb-2">Virtual cards: Enabled</p>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View Transaction History</button>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input type="radio" name="payment_mode" className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-900">Manual Review Mode</label>
              <p className="text-xs text-slate-500 mt-1">Review each order before fulfillment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ label, desc, checked }: { label: string, desc: string, checked?: boolean }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
      <input 
        type="checkbox" 
        defaultChecked={checked}
        className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
      />
      <div>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500 mt-1">{desc}</span>
      </div>
    </label>
  );
}