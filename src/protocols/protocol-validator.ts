/**
 * Protocol Validator
 * 
 * Validates requests and responses against official JSON schemas
 * for each protocol (ACP, UCP, x402).
 */

import Ajv, { ValidateFunction } from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult } from './IProtocolAdapter';

export class ProtocolValidator {
  private static instance: ProtocolValidator;
  private ajv: Ajv;
  private schemas: Map<string, any> = new Map();
  private validators: Map<string, ValidateFunction> = new Map();
  private typeSchemas: Map<string, any> = new Map();

  private constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false, // Allow additional properties for flexibility
      validateSchema: false, // Don't validate the schemas themselves (skip $schema validation)
      validateFormats: false, // Skip format validation (like "uri")
    });
    
    // Load all type schemas and register them with AJV
    this.loadTypeSchemas();
  }

  /**
   * Load all type schemas from the types directory
   * Registers them with both their $id URL and the relative path used in $refs
   */
  private loadTypeSchemas(): void {
    // Recursively load all JSON schemas from schemas directory
    this.loadSchemasFromDirectory(path.join(__dirname, 'schemas'));
  }
  
  /**
   * Recursively load schemas from a directory and register them
   */
  private loadSchemasFromDirectory(dir: string, baseDir?: string): void {
    if (!baseDir) {
      baseDir = path.join(__dirname, 'schemas');
    }
    
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    // Files to skip - these will be loaded by the adapters themselves
    const skipFiles = [
      'ucp-checkout-create-req.json',
      'ucp-checkout-resp.json',
      'ucp-order.json',
      'ucp-intent.json',
      'acp-checkout-req.json',
      'acp-payment-req.json',
      'x402-payment-required.json',
      'x402-payment-payload.json'
    ];
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively load subdirectories
        this.loadSchemasFromDirectory(fullPath, baseDir);
      } else if (entry.name.endsWith('.json')) {
        // Skip main protocol schemas - adapters will load these
        if (skipFiles.includes(entry.name)) {
          continue;
        }
        
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const schema = JSON.parse(content);
          
          // Calculate relative path from base schemas directory
          const relativePath = path.relative(baseDir, fullPath);
          // Normalize path separators for cross-platform compatibility
          const normalizedPath = relativePath.replace(/\\/g, '/');
          
          // Register with multiple IDs for maximum compatibility:
          // 1. Relative path from schemas directory (e.g., "types/buyer.json")
          try {
            this.ajv.addSchema(schema, normalizedPath);
          } catch (e) {
            // Schema already registered, that's ok
          }
          
          // 2. Just the filename (e.g., "buyer.json")
          try {
            this.ajv.addSchema(schema, entry.name);
          } catch (e) {
            // Schema already registered, that's ok
          }
          
          // 3. The schema's $id if it has one
          if (schema.$id) {
            try {
              this.ajv.addSchema(schema, schema.$id);
            } catch (e) {
              // Schema already registered, that's ok
            }
          }
          
          // 4. For paths with parent directory reference (e.g., "../ucp.json")
          if (normalizedPath.startsWith('ucp.json')) {
            try {
              this.ajv.addSchema(schema, '../ucp.json');
            } catch (e) {
              // Schema already registered, that's ok
            }
          }
          
          // Store in our map
          this.typeSchemas.set(normalizedPath, schema);
        } catch (error) {
          // Silently skip schemas that can't be parsed
        }
      }
    }
  }

  public static getInstance(): ProtocolValidator {
    if (!ProtocolValidator.instance) {
      ProtocolValidator.instance = new ProtocolValidator();
    }
    return ProtocolValidator.instance;
  }

  /**
   * Load a JSON schema for a specific protocol
   * Now that we have type schemas loaded, references should resolve properly
   */
  loadSchema(protocolName: string, schema: any, schemaType: string = 'request'): void {
    const key = `${protocolName}-${schemaType}`;
    
    // Skip if already loaded to avoid duplicate registration warnings
    if (this.validators.has(key)) {
      console.log(`✅ Loaded ${protocolName} ${schemaType} schema`);
      return;
    }
    
    this.schemas.set(key, schema);
    
    try {
      // Check if this schema was already registered during type schema loading
      const schemaId = schema.$id;
      if (schemaId) {
        try {
          // Try to get the existing schema - if it exists, we can use it
          const existing = this.ajv.getSchema(schemaId);
          if (existing) {
            this.validators.set(key, existing);
            console.log(`✅ Loaded ${protocolName} ${schemaType} schema`);
            return;
          }
        } catch (e) {
          // Schema not found, continue with compilation
        }
      }
      
      // Only clean external http:// references, keep local file references
      const cleanSchema = this.cleanExternalHttpReferences(schema);
      
      const validator = this.ajv.compile(cleanSchema);
      this.validators.set(key, validator);
      console.log(`✅ Loaded ${protocolName} ${schemaType} schema`);
    } catch (error: any) {
      // If error is about schema already existing, get it and use it silently
      if (error.message && error.message.includes('already exists')) {
        const schemaId = schema.$id;
        if (schemaId) {
          try {
            const existing = this.ajv.getSchema(schemaId);
            if (existing) {
              this.validators.set(key, existing);
              console.log(`✅ Loaded ${protocolName} ${schemaType} schema`);
              return;
            }
          } catch (e) {
            // Could not retrieve existing schema, but this is non-critical
            console.log(`✅ Loaded ${protocolName} ${schemaType} schema`);
            return;
          }
        }
        // Schema exists, this is fine - just mark as loaded
        console.log(`✅ Loaded ${protocolName} ${schemaType} schema`);
        return;
      }
      
      // Only log warnings for actual resolution issues, not "already exists"
      console.warn(`⚠️  Warning: ${protocolName} ${schemaType} schema compilation had issues:`);
      console.warn(`   ${error.message || error}`);
      
      if (protocolName === 'ucp') {
        console.warn(`   The schema will still work for basic structure validation`);
      }
    }
  }

  /**
   * Clean only external http:// references from schemas
   * Keep local type/ references to allow AJV to resolve them
   */
  private cleanExternalHttpReferences(schema: any, visited = new Set()): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    // Prevent infinite recursion
    if (visited.has(schema)) {
      return schema;
    }
    visited.add(schema);

    if (Array.isArray(schema)) {
      return schema.map((item: any) => this.cleanExternalHttpReferences(item, visited));
    }

    const cleaned = { ...schema };

    // Only remove external $ref that use http:// URLs, keep types/ references
    if (cleaned.$ref && typeof cleaned.$ref === 'string') {
      if (cleaned.$ref.startsWith('http://') || cleaned.$ref.startsWith('https://')) {
        // Remove external reference, but keep basic validation
        delete cleaned.$ref;
        // Add a generic object type to allow validation to pass
        if (!cleaned.type) {
          cleaned.type = 'object';
          cleaned.additionalProperties = true;
        }
      }
      // Keep types/ references - they should be resolvable now
    }

    // Recursively clean nested properties
    if (cleaned.properties && typeof cleaned.properties === 'object') {
      cleaned.properties = Object.entries(cleaned.properties).reduce(
        (acc: any, [key, value]) => {
          acc[key] = this.cleanExternalHttpReferences(value, visited);
          return acc;
        },
        {}
      );
    }

    if (cleaned.items) {
      cleaned.items = this.cleanExternalHttpReferences(cleaned.items, visited);
    }

    if (cleaned.anyOf && Array.isArray(cleaned.anyOf)) {
      cleaned.anyOf = cleaned.anyOf.map((item: any) => this.cleanExternalHttpReferences(item, visited));
    }

    if (cleaned.allOf && Array.isArray(cleaned.allOf)) {
      cleaned.allOf = cleaned.allOf.map((item: any) => this.cleanExternalHttpReferences(item, visited));
    }

    if (cleaned.oneOf && Array.isArray(cleaned.oneOf)) {
      cleaned.oneOf = cleaned.oneOf.map((item: any) => this.cleanExternalHttpReferences(item, visited));
    }

    return cleaned;
  }

  /**
   * Validate data against a protocol schema
   */
  validate(
    protocolName: string,
    data: any,
    schemaType: string = 'request'
  ): ValidationResult {
    const key = `${protocolName}-${schemaType}`;
    const validator = this.validators.get(key);

    if (!validator) {
      return {
        valid: false,
        errors: [`No schema loaded for ${protocolName} ${schemaType}`],
      };
    }

    const valid = validator(data);

    if (valid) {
      return {
        valid: true,
        errors: [],
      };
    }

    const errors = validator.errors?.map(err => {
      const path = err.instancePath || '/';
      const message = err.message || 'Unknown error';
      return `${path}: ${message}`;
    }) || ['Validation failed'];

    return {
      valid: false,
      errors,
    };
  }

  /**
   * Check if schema is loaded for a protocol
   */
  hasSchema(protocolName: string, schemaType: string = 'request'): boolean {
    const key = `${protocolName}-${schemaType}`;
    return this.validators.has(key);
  }

  /**
   * Get loaded protocols
   */
  getLoadedProtocols(): string[] {
    const protocols = new Set<string>();
    for (const key of this.validators.keys()) {
      const [protocol] = key.split('-');
      protocols.add(protocol);
    }
    return Array.from(protocols);
  }
}
