'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Copy, Settings, ShoppingBag, Zap, Search, Package, ShoppingCart, CreditCard } from 'lucide-react';
import { useStore } from '@/app/lib/store';

export default function Dashboard() {
  const router = useRouter();
  const { getActiveStore } = useStore();
  const store = getActiveStore();
  const mcpUrl = `mcp://${store.domain.split('.')[0]}.halo.ai`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display text-slate-900 flex items-center gap-2">
              MCP Server Studio
              <span className="text-sm font-sans font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{store.name}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                Live Server:
              </span>
              <code className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono text-xs md:text-sm">
                {mcpUrl}
              </code>
              <button className="text-blue-600 hover:text-blue-700">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button 
              onClick={() => router.push('/test-agent')}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Test Agent
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Products Synced" 
          value={store.stats.products.toLocaleString()} 
          subtext="100% of catalog" 
          icon={Package} 
        />
        <StatCard 
          label="Agent Visits Today" 
          value={store.stats.visits.toString()} 
          subtext="+5 from yesterday" 
          icon={Activity} 
          trend="up"
        />
        <StatCard 
          label="Revenue This Week" 
          value={store.stats.revenue} 
          subtext="12 orders" 
          icon={CreditCard} 
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Agent Activity</h3>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {store.recentActivity.map((activity, i) => (
              <ActivityRow 
                key={i}
                time={activity.time}
                agent={`${activity.agent} Agent`}
                action={activity.action}
                icon={getIconForType(activity.icon)}
                highlight={activity.icon === 'cart'}
              />
            ))}
          </div>
        </div>

        {/* MCP Tools Available */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">MCP Tools Available</h3>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">+ Add Custom Tool</button>
          </div>
          <div className="p-4 space-y-3 flex-1">
            <ToolRow name="search_products" desc="Search catalog with semantic query" active />
            <ToolRow name="get_product_details" desc="Get metadata and variants" active />
            <ToolRow name="check_inventory" desc="Real-time stock check" active />
            <ToolRow name="create_cart" desc="Initialize shopping session" active />
            <ToolRow name="complete_purchase" desc="Execute Halo payment" active />
          </div>
        </div>
      </div>
    </div>
  );
}

function getIconForType(type: string) {
  switch(type) {
    case 'search': return Search;
    case 'cart': return CreditCard;
    case 'box': return Package;
    default: return Activity;
  }
}

function StatCard({ label, value, subtext, icon: Icon, trend }: { label: string, value: string, subtext: string, icon: any, trend?: 'up' | 'down' }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-black transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
          <Icon className="w-4 h-4 text-slate-400 group-hover:text-black" />
        </div>
      </div>
      <p className="text-3xl font-display text-slate-900">{value}</p>
      <div className={`mt-2 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-slate-500'}`}>
        {subtext}
      </div>
    </div>
  );
}

function ActivityRow({ time, agent, action, icon: Icon, highlight }: { time: string, agent: string, action: string, icon: any, highlight?: boolean }) {
  return (
    <div className={`px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${highlight ? 'bg-green-50/50' : ''}`}>
      <div className="text-xs font-medium text-slate-400 w-16 shrink-0">{time}</div>
      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 truncate">
          <span className="font-semibold">{agent}</span> {action}
        </p>
      </div>
    </div>
  );
}

function ToolRow({ name, desc, active }: { name: string, desc: string, active?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
        <code className="text-sm font-medium text-slate-700 font-mono">{name}</code>
      </div>
      <span className="text-xs text-slate-400">{desc}</span>
    </div>
  );
}