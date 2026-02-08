'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, Terminal, ShoppingBag } from 'lucide-react';
import { useStore } from '@/app/lib/store';

export default function TestAgent() {
  const router = useRouter();
  const { getActiveStore } = useStore();
  const store = getActiveStore();

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = { role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    // Dynamic response based on active store
    const response = generateMockResponse(query, store);
    
    // Stream the text response
    let currentText = '';
    const fullText = response.text;
    
    // Add initial empty message
    setMessages(prev => [...prev, { ...response, text: '' }]);
    setLoading(false);

    // Stream characters
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        currentText += fullText[i];
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = currentText;
          return newMsgs;
        });
        i++;
        scrollToBottom();
      } else {
        clearInterval(interval);
      }
    }, 20); // Typing speed
  };

  const prefill = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-display text-slate-900">Test Your MCP Server</h1>
            <p className="text-slate-500 text-sm">Simulate how AI agents will interact with <span className="font-semibold">{store.name}</span>.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Try these example queries</h3>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {getExampleQueries(store.id).map((q, i) => (
                  <ExampleBtn key={i} text={q} onClick={() => prefill(q)} />
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}>
                {msg.role === 'agent' && (
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-green-600 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Agent Response
                  </div>
                )}
                <p className={`text-sm ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                  {msg.text}
                </p>

                {msg.items && (
                  <div className="mt-4 space-y-3">
                    {msg.items.map((item: any, j: number) => (
                      <div key={j} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="w-12 h-12 bg-slate-200 rounded-md shrink-0 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          {item.variants && <p className="text-xs text-slate-500">Available in {item.variants.join(', ')}</p>}
                          <p className="text-sm font-bold text-slate-900 mt-1">{item.currency} {item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.tools && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                      <Terminal className="w-3 h-3" /> MCP Tools Used:
                    </div>
                    <div className="space-y-1">
                      {msg.tools.map((tool: string, k: number) => (
                        <code key={k} className="block text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {tool}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask the agent something..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
            />
            <button 
              type="submit"
              disabled={!query.trim() || loading}
              className="px-6 bg-black text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ExampleBtn({ text, onClick }: { text: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-black hover:text-black hover:bg-slate-50 transition-all"
    >
      {text}
    </button>
  );
}

// Helpers
function getExampleQueries(storeId: string) {
  if (storeId === 'tech') return ["Find gaming keyboards", "Show me high-end monitors", "Check stock for headset", "Create cart with monitor"];
  if (storeId === 'green') return ["Find indoor plants", "Show me pots under $50", "How much is fertilizer?", "Check Monstera stock"];
  return ["Find red dresses under $100", "Show me best selling items", "Check inventory for product #p1", "Complete a test purchase"];
}

function generateMockResponse(query: string, store: any) {
  // Simple keyword matching for demo
  const q = query.toLowerCase();
  let items = [];
  let text = "";

  if (q.includes('find') || q.includes('show') || q.includes('search')) {
    items = store.inventory.slice(0, 2);
    text = `I found ${store.inventory.length} items matching your request. Here are the top results:`;
  } else if (q.includes('stock') || q.includes('inventory')) {
    items = [store.inventory[0]];
    text = `Checking real-time inventory... ${items[0].name} has ${items[0].stock} units available.`;
  } else {
    text = "I can help you find products, check inventory, or place orders. What would you like to do?";
  }

  return {
    role: 'agent',
    text,
    items: items.length > 0 ? items : undefined,
    tools: [
      `search_products(query="${query}")`,
      `get_product_details(merchant_id="${store.id}")`
    ]
  };
}