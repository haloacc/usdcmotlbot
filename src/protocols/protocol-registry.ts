/**
 * Protocol Registry
 * 
 * Central registry for all protocol adapters.
 * Allows dynamic protocol discovery and instantiation.
 */

import { IProtocolAdapter } from './IProtocolAdapter';

export class ProtocolRegistry {
  private static instance: ProtocolRegistry;
  private adapters: Map<string, IProtocolAdapter> = new Map();
  private aliasMap: Map<string, string> = new Map(); // protocol aliases

  private constructor() {}

  public static getInstance(): ProtocolRegistry {
    if (!ProtocolRegistry.instance) {
      ProtocolRegistry.instance = new ProtocolRegistry();
    }
    return ProtocolRegistry.instance;
  }

  /**
   * Register a protocol adapter
   */
  register(adapter: IProtocolAdapter, aliases?: string[]): void {
    const key = this.normalizeProtocolName(adapter.protocolName);
    this.adapters.set(key, adapter);

    // Register aliases
    if (aliases) {
      aliases.forEach(alias => {
        this.aliasMap.set(this.normalizeProtocolName(alias), key);
      });
    }

    console.log(`✅ Registered protocol: ${adapter.protocolName} v${adapter.version}`);
  }

  /**
   * Get protocol adapter by name
   */
  get(protocolName: string): IProtocolAdapter | null {
    const key = this.normalizeProtocolName(protocolName);
    
    // Check direct match
    if (this.adapters.has(key)) {
      return this.adapters.get(key)!;
    }

    // Check aliases
    if (this.aliasMap.has(key)) {
      const realKey = this.aliasMap.get(key)!;
      return this.adapters.get(realKey) || null;
    }

    return null;
  }

  /**
   * Detect protocol from raw request
   */
  detect(raw: any): string | null {
    // Try explicit protocol field
    if (raw.protocol) {
      const adapter = this.get(raw.protocol);
      if (adapter) return adapter.protocolName;
    }

    // Try each adapter's canHandle() method
    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle && adapter.canHandle(raw)) {
        return adapter.protocolName;
      }
    }

    return null;
  }

  /**
   * List all registered protocols
   */
  list(): string[] {
    return Array.from(this.adapters.values()).map(adapter => adapter.protocolName);
  }

  /**
   * Check if protocol is registered
   */
  has(protocolName: string): boolean {
    return this.get(protocolName) !== null;
  }

  /**
   * Unregister a protocol (for testing)
   */
  unregister(protocolName: string): void {
    const key = this.normalizeProtocolName(protocolName);
    this.adapters.delete(key);
  }

  /**
   * Clear all protocols (for testing)
   */
  clear(): void {
    this.adapters.clear();
    this.aliasMap.clear();
  }

  /**
   * Normalize protocol name (case-insensitive)
   */
  private normalizeProtocolName(name: string): string {
    return name.toLowerCase().trim();
  }
}
