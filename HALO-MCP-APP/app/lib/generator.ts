import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { StoreData } from './store';

export const generateAndDownloadServer = async (store: StoreData) => {
  const zip = new JSZip();

  // 1. package.json
  const packageJson = {
    name: `mcp-server-${store.id}`,
    version: "1.0.0",
    type: "module",
    scripts: {
      "start": "node index.js"
    },
    dependencies: {
      "@modelcontextprotocol/sdk": "^0.6.0",
      "zod": "^3.22.4"
    }
  };
  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  // 2. README.md
  const readme = `# ${store.name} MCP Server

This is an auto-generated Model Context Protocol (MCP) server for **${store.name}**.
It exposes your product catalog and inventory to AI agents like Claude, ChatGPT, and others.

## Tools Included
- \`search_products\`: Semantic search for products.
- \`get_inventory\`: Check real-time stock.
- \`create_order\`: Initialize a purchase.

## Usage
1. \`npm install\`
2. \`npm start\`
`;
  zip.file("README.md", readme);

  // 3. index.js (The actual MCP Server code)
  const indexJs = `#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Mock Data (In a real scenario, this would fetch from ${store.platform === 'shopify' ? 'Shopify API' : 'your database'})
const INVENTORY = ${JSON.stringify(store.inventory, null, 2)};

const server = new Server(
  {
    name: "${store.name.toLowerCase().replace(/\s+/g, '-')}",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_products",
        description: "Search for products in the ${store.name} catalog",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query (e.g., 'red dress')" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_inventory",
        description: "Get stock level for a specific product ID",
        inputSchema: {
          type: "object",
          properties: {
            productId: { type: "string", description: "The ID of the product" },
          },
          required: ["productId"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_products") {
    const query = String(args.query).toLowerCase();
    const results = INVENTORY.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query)
    );
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  if (name === "get_inventory") {
    const product = INVENTORY.find(p => p.id === args.productId);
    if (!product) {
      return { content: [{ type: "text", text: "Product not found" }] };
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ id: product.id, stock: product.stock }, null, 2) }],
    };
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("${store.name} MCP Server running on stdio");
`;
  zip.file("index.js", indexJs);

  // 4. Generate Zip
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${store.name.toLowerCase().replace(/\s+/g, '-')}-mcp-server.zip`);
};
