'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, Loader2, Server, ShoppingCart, Box, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/app/lib/store';

export default function AutoConfig() {
  const router = useRouter();
  const params = useParams();
  const platform = params?.platform as string;
  const { getActiveStore } = useStore();
  
  const [step, setStep] = useState(0);
  const store = getActiveStore(); // Get current store data

  const steps = [
    { icon: Server, text: `Connecting to ${store.name} API...` },
    { icon: Box, text: `Scanning catalog (${store.stats.products.toLocaleString()} items found)...` },
    { icon: ShoppingCart, text: 'Configuring checkout flows...' },
    { icon: Zap, text: 'Generating MCP server endpoints...' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => {
        if (s >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(() => router.push(`/payment/${platform || 'shopify'}`), 1000);
          return s;
        }
        return s + 1;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [platform, router]);

  return (
    <div className="max-w-2xl mx-auto pt-12">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center mb-8">
        <h1 className="text-2xl font-display text-slate-900 mb-2">Building your MCP Server</h1>
        <p className="text-slate-500 mb-8">Please wait while we auto-configure your agentic infrastructure.</p>

        <div className="space-y-6 text-left max-w-md mx-auto">
          {steps.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: i <= step ? 1 : 0.5, x: 0 }}
              className={`flex items-center p-4 rounded-lg border transition-colors ${
                i === step ? 'bg-black/5 border-black/10' : 
                i < step ? 'bg-green-50 border-green-200' : 
                'bg-slate-50 border-slate-100'
              }`}
            >
              {i < step ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
              ) : i === step ? (
                <Loader2 className="w-5 h-5 text-black animate-spin mr-3" />
              ) : (
                <div className="w-5 h-5 mr-3" />
              )}
              
              <span className={`font-medium ${
                i < step ? 'text-green-900' : 
                i === step ? 'text-black' : 
                'text-slate-400'
              }`}>
                {s.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}