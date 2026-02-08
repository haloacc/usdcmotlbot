/**
 * ACP Builder Service
 * Creates a minimal ACP CREATE REQUEST to send to merchant
 * Following the official ACP specification (2026-01-16)
 */

import { ACPCreateRequest } from '../types/index';
import { ParsedPrompt } from './promptParser';
import { lookupProduct } from './productCatalog';
import { getDefaultAgentCapabilities } from './capabilityNegotiator';

export interface ACPRequestWithItemId {
  itemId: string;
  request: ACPCreateRequest;
}

export function buildACPCreateRequest(parsed: ParsedPrompt, includeCapabilities: boolean = true): ACPRequestWithItemId {
  // Look up real SKU from product catalog instead of generating random ID
  const product = lookupProduct(parsed.item_name);

  const request: ACPCreateRequest = {
    items: [
      {
        id: product.id,
        quantity: parsed.quantity,
      },
    ],
  };

  // Include agent capabilities for Schema 2 negotiation
  if (includeCapabilities) {
    request.agent_capabilities = getDefaultAgentCapabilities();
  }

  return {
    itemId: product.id,
    request,
  };
}

/**
 * Alias for buildACPCreateRequest for backwards compatibility
 */
export function buildACP(parsed: ParsedPrompt): ACPRequestWithItemId {
  return buildACPCreateRequest(parsed);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}


