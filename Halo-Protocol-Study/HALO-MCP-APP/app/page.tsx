'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Globe, Code2, ArrowRight } from 'lucide-react';

const PlatformCard = ({ icon: Icon, name, description, id }: { icon: any, name: string, description: string, id: string }) => {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.push(`/connect/${id}`)}
      className="flex flex-col items-start p-6 bg-white border border-slate-200 rounded-xl hover:border-black hover:shadow-lg active:scale-95 transition-all duration-200 group text-left w-full h-full"
    >
      <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-display text-slate-900 mb-2">{name}</h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed flex-1">{description}</p>
      <div className="mt-auto flex items-center text-black text-sm font-medium opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        Select Platform <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  );
};

export default function PlatformSelect() {
  return (
    <div className="max-w-4xl mx-auto pt-4 md:pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10 md:mb-16 px-4">
        <h1 className="text-3xl md:text-5xl font-display text-slate-900 mb-4 md:mb-6 tracking-tight leading-tight">
          Choose your commerce platform
        </h1>
        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We'll automatically scan your store and generate a custom MCP server so AI agents can discover and purchase your products.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4">
        <PlatformCard 
          icon={ShoppingBag}
          name="Shopify"
          id="shopify"
          description="Connect your store via OAuth. We support all Shopify plans."
        />
        <PlatformCard 
          icon={Globe}
          name="WooCommerce"
          id="woocommerce"
          description="Connect your WordPress site via API keys."
        />
        <PlatformCard 
          icon={Code2}
          name="Custom API"
          id="custom"
          description="Connect any custom backend using our standardized schema."
        />
      </div>

      <div className="mt-12 md:mt-16 text-center pb-8">
        <p className="text-sm text-slate-400">
          Don't see your platform? <a href="#" className="text-black font-medium hover:underline">Request integration</a>
        </p>
      </div>
    </div>
  );
}