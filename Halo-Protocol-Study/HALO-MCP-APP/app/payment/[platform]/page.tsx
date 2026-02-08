'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CreditCard, ShieldCheck, ArrowRight, Wallet } from 'lucide-react';

export default function PaymentSetup() {
  const router = useRouter();
  const params = useParams();
  const platform = params?.platform as string;
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      router.push(`/success/${platform}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-12">
      <h1 className="text-3xl font-bold text-slate-900 text-center mb-4">Enable AI Agent Payments</h1>
      <p className="text-center text-slate-500 mb-12">Choose how you want to handle transactions from autonomous agents.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <button
          onClick={() => setSelected('halo')}
          className={`relative p-8 rounded-2xl border-2 text-left transition-all ${
            selected === 'halo'
              ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          {selected === 'halo' && (
            <div className="absolute top-4 right-4 text-blue-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
          )}
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Halo Payments</h3>
          <p className="text-sm text-slate-500 mb-4">
            Virtual cards, instant settlement, and fraud protection designed for agentic commerce.
          </p>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            RECOMMENDED
          </span>
        </button>

        <button
          onClick={() => setSelected('manual')}
          className={`relative p-8 rounded-2xl border-2 text-left transition-all ${
            selected === 'manual'
              ? 'border-slate-900 bg-slate-50 shadow-lg'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          {selected === 'manual' && (
            <div className="absolute top-4 right-4 text-slate-900">
              <ShieldCheck className="w-6 h-6" />
            </div>
          )}
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
            <Wallet className="w-6 h-6 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Manual Review</h3>
          <p className="text-sm text-slate-500 mb-4">
            Approve each agent transaction manually. Good for low volume or high-value items.
          </p>
        </button>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}