import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  variants?: string[];
  image?: string;
};

export type StoreData = {
  id: string;
  name: string;
  domain: string;
  platform: 'shopify' | 'woocommerce' | 'custom';
  industry: string;
  color: string; // Tailwind color name like 'blue', 'green', 'purple'
  stats: {
    products: number;
    visits: number;
    revenue: string;
  };
  inventory: Product[];
  recentActivity: {
    agent: string;
    action: string;
    time: string;
    icon: 'search' | 'cart' | 'view' | 'box';
  }[];
};

export const MOCK_STORES: Record<string, StoreData> = {
  'sarah': {
    id: 'sarah',
    name: "Sarah's Boutique",
    domain: "boutique-sarah.myshopify.com",
    platform: 'shopify',
    industry: 'Fashion',
    color: 'emerald',
    stats: { products: 1247, visits: 23, revenue: "$1,840" },
    inventory: [
      { id: 'p1', name: 'Floral Maxi Dress', price: 89.99, currency: 'USD', category: 'Dresses', stock: 15, variants: ['S', 'M', 'L'] },
      { id: 'p2', name: 'Cotton Sundress', price: 54.99, currency: 'USD', category: 'Dresses', stock: 42, variants: ['XS', 'S', 'M', 'L', 'XL'] },
      { id: 'p3', name: 'Denim Jacket', price: 129.50, currency: 'USD', category: 'Outerwear', stock: 8, variants: ['M', 'L'] },
      { id: 'p4', name: 'Leather Sandals', price: 45.00, currency: 'USD', category: 'Shoes', stock: 20, variants: ['36', '37', '38', '39'] },
    ],
    recentActivity: [
      { agent: 'Perplexity', action: 'searched "summer dresses"', time: '2m ago', icon: 'search' },
      { agent: 'Claude', action: 'purchased Floral Maxi Dress', time: '8m ago', icon: 'cart' },
      { agent: 'ChatGPT', action: 'checked inventory for #p3', time: '15m ago', icon: 'box' },
    ]
  },
  'tech': {
    id: 'tech',
    name: "TechNexus",
    domain: "technexus.io",
    platform: 'custom',
    industry: 'Electronics',
    color: 'blue',
    stats: { products: 8560, visits: 142, revenue: "$12,450" },
    inventory: [
      { id: 't1', name: 'Quantum Headset X1', price: 299.99, currency: 'USD', category: 'Audio', stock: 120, variants: ['Black', 'Silver'] },
      { id: 't2', name: 'DevDeck Mechanical Keyboard', price: 159.00, currency: 'USD', category: 'Peripherals', stock: 5, variants: ['Red Switch', 'Blue Switch'] },
      { id: 't3', name: '4K Ultra Monitor', price: 499.00, currency: 'USD', category: 'Monitors', stock: 12 },
    ],
    recentActivity: [
      { agent: 'Devin', action: 'queried API specs', time: '1m ago', icon: 'view' },
      { agent: 'GPT-4o', action: 'compared monitor prices', time: '5m ago', icon: 'search' },
      { agent: 'Gemini', action: 'purchased DevDeck Keyboard', time: '12m ago', icon: 'cart' },
    ]
  },
  'green': {
    id: 'green',
    name: "Green Earth Organics",
    domain: "greenearth.woo.store",
    platform: 'woocommerce',
    industry: 'Home & Garden',
    color: 'green',
    stats: { products: 340, visits: 89, revenue: "$4,200" },
    inventory: [
      { id: 'g1', name: 'Monstera Deliciosa', price: 45.00, currency: 'USD', category: 'Plants', stock: 8 },
      { id: 'g2', name: 'Ceramic Pot Set', price: 32.50, currency: 'USD', category: 'Pots', stock: 150 },
      { id: 'g3', name: 'Organic Fertilizer', price: 12.00, currency: 'USD', category: 'Care', stock: 500 },
    ],
    recentActivity: [
      { agent: 'Claude', action: 'asked about plant care', time: '10m ago', icon: 'search' },
      { agent: 'Pi', action: 'checked Monstera stock', time: '22m ago', icon: 'box' },
    ]
  }
};

type StoreState = {
  activeStoreId: string;
  setActiveStore: (id: string) => void;
  getActiveStore: () => StoreData;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      activeStoreId: 'sarah', // Default
      setActiveStore: (id) => set({ activeStoreId: id }),
      getActiveStore: () => MOCK_STORES[get().activeStoreId] || MOCK_STORES['sarah'],
    }),
    {
      name: 'halo-store-storage',
    }
  )
);
