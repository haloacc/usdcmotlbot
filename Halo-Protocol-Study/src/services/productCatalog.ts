/**
 * Product Catalog Service
 * Maps natural language items to SKU IDs and pricing
 * Based on real merchant inventory patterns
 */

export interface Product {
  id: string; // SKU
  name: string;
  basePrice: number; // in cents
  description?: string;
  image?: string;
}

const PRODUCT_CATALOG: Record<string, Product> = {
  'nike shoes': {
    id: 'sku_nike_air_max',
    name: 'Nike Air Max 90',
    basePrice: 12000,
    description: 'Classic Nike Air Max 90 sneakers',
    image: 'https://example.com/products/nike-air-max.jpg',
  },
  'book': {
    id: 'sku_book_001',
    name: 'Programming Book',
    basePrice: 2500,
    description: 'Technical programming book',
    image: 'https://example.com/products/book.jpg',
  },
  'rolex watch': {
    id: 'sku_rolex_submariner',
    name: 'Rolex Submariner',
    basePrice: 450000,
    description: 'Swiss luxury watch',
    image: 'https://example.com/products/rolex.jpg',
  },
  'iphones': {
    id: 'sku_apple_iphone_15',
    name: 'Apple iPhone 15',
    basePrice: 79900,
    description: 'Latest iPhone model',
    image: 'https://example.com/products/iphone15.jpg',
  },
  'gaming laptops': {
    id: 'sku_gaming_laptop_pro',
    name: 'Gaming Laptop Pro',
    basePrice: 150000,
    description: 'High-performance gaming laptop',
    image: 'https://example.com/products/gaming-laptop.jpg',
  },
};

export function lookupProduct(itemName: string): Product {
  const normalized = itemName.toLowerCase().trim();
  
  // Try exact match
  if (PRODUCT_CATALOG[normalized]) {
    return PRODUCT_CATALOG[normalized];
  }

  // Try fuzzy match
  for (const [key, product] of Object.entries(PRODUCT_CATALOG)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return product;
    }
  }

  // Fallback: generate from item name
  return {
    id: `sku_${normalized.replace(/\s+/g, '_')}`,
    name: itemName,
    basePrice: 10000, // $100 default
    description: itemName,
  };
}
