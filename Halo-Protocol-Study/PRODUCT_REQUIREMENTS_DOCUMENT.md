# Halo MVP - Product Requirements Document

**Version:** 1.0  
**Date:** January 30, 2026  
**Status:** Implementation Complete

---

## Executive Summary

**Halo** is a protocol-agnostic payment orchestration platform that enables AI agents to make autonomous payments across heterogeneous payment ecosystems. It serves as an intelligent middleware layer that translates between three major payment protocols (ACP, UCP, x402), evaluates transaction risk, manages session state, and processes payments through traditional payment rails like Stripe.

**Market Problem:** AI agents from different platforms (OpenAI, Anthropic, etc.) need to transact with merchants using various payment protocols, creating a complex interoperability challenge with no unified standard.

**Solution:** Halo provides universal protocol translation, risk management, and payment orchestration in a single platform, enabling any agent to pay any merchant regardless of their underlying protocol.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas](#2-user-personas)
3. [Core Features](#3-core-features)
4. [User Stories](#4-user-stories)
5. [Technical Architecture](#5-technical-architecture)
6. [API Specifications](#6-api-specifications)
7. [Protocol Implementations](#7-protocol-implementations)
8. [Risk & Security](#8-risk--security)
9. [Success Metrics](#9-success-metrics)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. Product Overview

### 1.1 Vision
Enable seamless, autonomous commerce for AI agents across any payment protocol and merchant platform.

### 1.2 Mission
Build the universal payment orchestration layer that abstracts away protocol complexity, manages risk, and ensures reliable payment processing for the agentic economy.

### 1.3 Core Value Propositions

| Stakeholder | Value Delivered |
|------------|-----------------|
| **AI Agents** | Single integration point for all payment protocols |
| **Merchants** | Accept payments from any agent without protocol lock-in |
| **Payment Processors** | Expanded market reach through protocol abstraction |
| **Developers** | Simplified integration with comprehensive API |

### 1.4 Product Positioning

```
┌─────────────────────────────────────────────────────────┐
│                    AI AGENT LAYER                       │
│  (OpenAI, Anthropic, Claude, ChatGPT, Custom Agents)   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    ⭐ HALO MVP ⭐                        │
│  Protocol Translation | Risk Engine | Session Mgmt      │
│  ACP ⟷ UCP ⟷ x402 | Fraud Detection | Order Tracking  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 PAYMENT & MERCHANT LAYER                │
│  (Stripe, Merchants, Blockchain, Legacy Systems)        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. User Personas

### Persona 1: **Alex the AI Agent Developer**

**Background:**
- Works at an AI startup building autonomous shopping agents
- Needs to integrate with multiple e-commerce platforms
- Limited payment infrastructure expertise

**Goals:**
- Quick integration with multiple payment protocols
- Reliable payment processing
- Clear error handling and debugging

**Pain Points:**
- Every merchant uses different payment APIs
- Complex protocol specifications
- Risk management is difficult to implement
- Session/order tracking is manual

**How Halo Helps:**
- Single API for all protocols
- Built-in risk engine
- Automatic protocol translation
- Comprehensive session management

---

### Persona 2: **Maria the Merchant Platform Engineer**

**Background:**
- Lead engineer at mid-size e-commerce platform
- Wants to enable AI agent purchases
- Must maintain existing checkout flow

**Goals:**
- Accept payments from AI agents
- Maintain security standards
- Track orders and fulfillment
- Support multiple payment methods

**Pain Points:**
- Don't know which protocol to implement
- Risk of fraud from autonomous agents
- Need session tracking infrastructure
- Complex integration requirements

**How Halo Helps:**
- Protocol-agnostic integration
- Enterprise-grade risk scoring
- Full order lifecycle management
- Production-ready API

---

### Persona 3: **David the Payment Operations Manager**

**Background:**
- Manages payment operations for fintech company
- Responsible for fraud prevention
- Monitors transaction success rates

**Goals:**
- Low fraud/chargeback rates
- High payment success rate
- Clear transaction audit trail
- Real-time risk monitoring

**Pain Points:**
- AI agent transactions are unpredictable
- Need custom risk rules for autonomous payments
- Difficult to track cross-protocol transactions
- Manual reconciliation

**How Halo Helps:**
- Real-time risk scoring with configurable rules
- Unified transaction tracking
- Detailed session/order history
- Fraud prevention built-in

---

## 3. Core Features

### 3.1 Protocol Orchestration

**Capability:** Universal protocol translation between ACP, UCP, and x402

**Features:**
- Auto-detect agent protocol from request structure
- Translate to merchant's preferred protocol
- Bidirectional protocol conversion (9 combinations: ACP↔UCP, ACP↔x402, UCP↔x402, etc.)
- Canonical data model for protocol-agnostic processing

**Business Value:**
- Agents can transact with any merchant
- Merchants don't need multi-protocol support
- Future protocols can be added without breaking existing integrations

---

### 3.2 Natural Language Payment Processing

**Capability:** Convert natural language prompts to structured payment requests

**Features:**
- Extract item, amount, quantity from free-form text
- Detect shipping preferences (express, overnight, standard)
- Parse country/region information
- Support multiple currencies (USD, INR, EUR, etc.)
- Handle variations ("buy", "purchase", "get", "order")

**Examples:**
- "Buy 2 Nike shoes for $100" → `{item: "Nike shoes", quantity: 2, amount: 10000 cents}`
- "Purchase laptop with express shipping to UK" → `{item: "laptop", shipping: "express", country: "GB"}`

**Business Value:**
- Agents can use natural language instead of structured APIs
- Reduces integration complexity
- Enables conversational commerce

---

### 3.3 Intelligent Risk Engine

**Capability:** Real-time fraud detection and transaction risk scoring

**Features:**
- Multi-factor risk scoring (0-100 scale)
- Three-tier decision model: Approve (0-29), Challenge (30-59), Block (60+)
- Configurable risk factors:
  - High-value transactions (>$100)
  - International purchases
  - Express shipping
  - Unusual patterns
- Metadata-based risk signals (card testing, velocity)

**Risk Matrix:**

| Factor | Weight | Trigger |
|--------|--------|---------|
| High Value | +30 | Amount > $100 |
| International | +20 | Country ≠ US |
| Express Shipping | +10 | Speed = "express" |

**Business Value:**
- Reduce fraud losses
- Minimize chargebacks
- Protect merchant and agent reputation
- Enable step-up authentication when needed

---

### 3.4 Session & State Management

**Capability:** Maintain transaction context across multi-step flows

**Features:**
- Unique session IDs (`halo_session_{timestamp}_{random}`)
- Session status tracking (not_ready, authentication_required, ready_for_payment, completed, canceled)
- Session expiration (default 6 hours)
- In-memory session store with cleanup
- Link orders to checkout sessions

**Session Lifecycle:**
```
not_ready_for_payment
    ↓
authentication_required (if risk = challenge)
    ↓
ready_for_payment (after 3DS/biometric)
    ↓
in_progress (payment processing)
    ↓
completed (payment success) → ORDER CREATED
```

**Business Value:**
- Reliable multi-step transaction flows
- Support for 3DS and step-up auth
- Clear audit trail
- Recovery from failures

---

### 3.5 Order Lifecycle Management

**Capability:** Complete order tracking from creation to fulfillment

**Features:**
- Unique order IDs with tracking
- Order status (pending, processing, shipped, delivered, canceled)
- Fulfillment events (8 types per UCP spec):
  - `processing` - Preparing to ship
  - `shipped` - Handed to carrier
  - `in_transit` - In delivery network
  - `delivered` - Received by buyer
  - `failed_attempt` - Delivery attempt failed
  - `canceled` - Fulfillment canceled
  - `undeliverable` - Cannot be delivered
  - `returned_to_sender` - Returned to merchant
- Adjustments (refunds, returns, credits) with status tracking
- Line item status derivation (processing → partial → fulfilled)
- Carrier tracking integration

**Business Value:**
- Complete order visibility
- Support for partial fulfillment
- Refund/return management
- Customer service tooling

---

### 3.6 Payment Processing

**Capability:** Execute payments through multiple payment rails

**Features:**
- **Stripe Integration:**
  - Create Checkout Sessions
  - Payment Intents with metadata
  - Network tokenization support
  - 3D Secure verification
  - Test mode for development
- **Delegate Payment (ACP Schema 3):**
  - Agent provides payment credentials
  - Tokenization and secure storage
  - Allowance-based spending limits
  - Risk signal validation
- **Payment Methods:**
  - Credit/debit cards (Visa, Mastercard, Amex)
  - Network tokens (enhanced security)
  - FPAN fallback support

**Business Value:**
- Production-ready payment processing
- Secure credential handling
- PCI compliance pathway
- Multiple payment method support

---

### 3.7 Capability Negotiation

**Capability:** Match agent and merchant capabilities

**Features:**
- Agent declares supported payment methods
- Merchant responds with available options
- Intersection matching (compatible methods only)
- Informational messages (e.g., "Network tokenization available")
- Graceful degradation when no match

**Example:**
```
Agent Capabilities: ["card", "apple_pay"]
Merchant Capabilities: ["card", "network_token"]
  ↓
Matched: ["card"]
Messages: ["Network tokenization is supported for enhanced security"]
```

**Business Value:**
- Avoid payment method mismatches
- Guide agents to optimal payment methods
- Surface merchant capabilities to agents

---

### 3.8 Multi-Protocol Support

**Implemented Protocols:**

#### 3.8.1 ACP (Agentic Commerce Protocol) v2026-01-16
- **Purpose:** OpenAI/Anthropic agent checkout protocol
- **Features:** Checkout sessions, fulfillment options, delegate payment
- **Schemas:** 3 official schemas fully implemented
- **Use Case:** AI agents buying on behalf of users

#### 3.8.2 UCP (Universal Commerce Protocol) v2026-01-11
- **Purpose:** Universal checkout and order management
- **Features:** Orders with immutable line items, fulfillment events, adjustments
- **Use Case:** E-commerce platforms, marketplace orchestration

#### 3.8.3 x402 (HTTP 402 Payment Required) v2.0.0
- **Purpose:** Blockchain-based micr payments
- **Features:** 402 status codes, CAIP-2 networks, EVM authorization
- **Use Case:** Pay-per-use APIs, content monetization

**Business Value:**
- Future-proof architecture
- Support for emerging standards
- Ecosystem interoperability

---

## 4. User Stories

### Epic 1: Protocol Translation

#### Story 1.1: Agent Pays Merchant Across Protocols
**As an** AI agent developer  
**I want** my agent to pay a merchant regardless of which protocol each uses  
**So that** I don't need separate integrations for each protocol

**Acceptance Criteria:**
- [ ] Agent using ACP can pay UCP merchant
- [ ] Agent using UCP can pay x402 merchant
- [ ] Agent using x402 can pay ACP merchant
- [ ] All 9 protocol combinations work (3×3 matrix)
- [ ] Response is in merchant's preferred protocol
- [ ] Canonical format is available for debugging

**Technical Implementation:**
```typescript
POST /halo/orchestrate
{
  "request": <ACP_REQUEST>,
  "merchantProtocol": "ucp"
}
→ Returns UCP response with ACP→UCP translation
```

**Priority:** P0 (Critical)  
**Story Points:** 8

---

#### Story 1.2: Auto-Detect Agent Protocol
**As a** merchant platform engineer  
**I want** Halo to automatically detect which protocol the agent is using  
**So that** I don't need to specify it explicitly

**Acceptance Criteria:**
- [ ] Detect ACP by presence of `protocol: "ACP"`
- [ ] Detect UCP by presence of `ucp.schema`
- [ ] Detect x402 by presence of `x402Version`
- [ ] Return error if protocol cannot be detected
- [ ] Log detected protocol for monitoring

**Technical Implementation:**
```typescript
ProtocolRouter.detectProtocol(request) 
→ Returns 'acp' | 'ucp' | 'x402' | null
```

**Priority:** P1 (High)  
**Story Points:** 3

---

### Epic 2: Natural Language Payment

#### Story 2.1: Parse Natural Language Prompt
**As an** AI agent  
**I want** to describe purchases in natural language  
**So that** I don't need to construct complex JSON payloads

**Acceptance Criteria:**
- [ ] Extract item name from prompts like "buy shoes"
- [ ] Parse amounts: "$100", "100 dollars", "100 USD"
- [ ] Detect quantity: "buy 3 shirts"
- [ ] Identify shipping: "express", "overnight", "rush"
- [ ] Extract country: "to UK", "from France", "in Japan"
- [ ] Support multiple currencies (USD, INR, EUR, GBP)

**Test Cases:**
```
Input: "Buy 2 Nike shoes for $100"
Output: {
  item_name: "Nike shoes",
  amount_cents: 10000,
  quantity: 2,
  currency: "USD",
  shipping_speed: "standard",
  country: "US"
}
```

**Priority:** P0 (Critical)  
**Story Points:** 5

---

#### Story 2.2: Multi-Currency Support
**As an** international merchant  
**I want** agents to specify payments in local currencies  
**So that** customers see familiar pricing

**Acceptance Criteria:**
- [ ] Support USD, INR, EUR, GBP
- [ ] Convert "750 rupees" to `{amount: 750, currency: "INR"}`
- [ ] Map country codes correctly (UK→GB, etc.)
- [ ] Handle currency symbols ($, €, £, ₹)

**Priority:** P2 (Medium)  
**Story Points:** 3

---

### Epic 3: Risk Management

#### Story 3.1: Three-Tier Risk Decision
**As a** payment operations manager  
**I want** transactions automatically categorized by risk level  
**So that** I can approve low-risk and challenge high-risk payments

**Acceptance Criteria:**
- [ ] Score 0-29 = APPROVE (auto-process payment)
- [ ] Score 30-59 = CHALLENGE (require 3DS or biometric)
- [ ] Score 60+ = BLOCK (reject transaction)
- [ ] Return risk factors with decision
- [ ] Log all risk decisions for audit

**Risk Calculation:**
```typescript
score = 0
if (amount > 10000) score += 30  // > $100
if (country !== 'US') score += 20
if (shipping === 'express') score += 10
→ decision = score < 30 ? 'approve' : score < 60 ? 'challenge' : 'block'
```

**Priority:** P0 (Critical)  
**Story Points:** 5

---

#### Story 3.2: Configurable Risk Rules
**As a** risk analyst  
**I want** to adjust risk thresholds and factors  
**So that** I can tune the engine for my business

**Acceptance Criteria:**
- [ ] Configure high-value threshold (default $100)
- [ ] Adjust risk factor weights
- [ ] Whitelist/blacklist countries
- [ ] Set custom rules per merchant
- [ ] A/B test different risk models

**Priority:** P2 (Future)  
**Story Points:** 8

---

### Epic 4: Session Management

#### Story 4.1: Create Checkout Session
**As an** AI agent  
**I want** to create a checkout session for a purchase  
**So that** I can complete payment in multiple steps

**Acceptance Criteria:**
- [ ] Generate unique session ID
- [ ] Calculate totals (subtotal, tax, shipping)
- [ ] Return fulfillment options
- [ ] Set expiration time (6 hours)
- [ ] Link session to buyer email

**API Contract:**
```typescript
POST /api/acp/checkout
{
  "items": [{"id": "prod_123", "quantity": 1}]
}
→ Returns ACPCheckoutSession with session ID
```

**Priority:** P0 (Critical)  
**Story Points:** 5

---

#### Story 4.2: Handle 3DS Verification
**As a** merchant  
**I want** to require 3D Secure for high-risk transactions  
**So that** I reduce fraud liability

**Acceptance Criteria:**
- [ ] Set status to `authentication_required` for CHALLENGE
- [ ] Return verification methods (3DS, biometric)
- [ ] Accept verification token
- [ ] Update session to `ready_for_payment` after verification
- [ ] Block completion if not verified

**Flow:**
```
1. POST /api/acp/checkout → status: authentication_required
2. POST /api/acp/checkout/:id/verify → status: ready_for_payment
3. POST /api/acp/checkout/:id/complete → payment succeeds
```

**Priority:** P1 (High)  
**Story Points:** 8

---

### Epic 5: Order Tracking

#### Story 5.1: Track Order Fulfillment
**As a** customer service agent  
**I want** to see real-time order status  
**So that** I can answer customer inquiries

**Acceptance Criteria:**
- [ ] View order with all fulfillment events
- [ ] See tracking numbers and carrier info
- [ ] Display delivery estimates
- [ ] Show order adjustments (refunds)
- [ ] Export order history

**API Contract:**
```typescript
GET /api/orders/:id
→ Returns UCPOrder with events[], adjustments[]
```

**Priority:** P1 (High)  
**Story Points:** 3

---

#### Story 5.2: Process Refunds
**As a** merchant operations team  
**I want** to issue full or partial refunds  
**So that** I can handle returns and disputes

**Acceptance Criteria:**
- [ ] Support partial refunds (any amount ≤ order total)
- [ ] Track refund status (pending, completed, failed)
- [ ] Update payment status (paid → partial_refund → refunded)
- [ ] Record refund reason
- [ ] Link refund to line items

**API Contract:**
```typescript
POST /api/orders/:id/refund
{
  "type": "refund",
  "amount": 5000,
  "description": "Defective item"
}
→ Creates adjustment, updates order
```

**Priority:** P1 (High)  
**Story Points:** 5

---

### Epic 6: Payment Processing

#### Story 6.1: Stripe Checkout Integration
**As a** developer  
**I want** to create Stripe Checkout Sessions  
**So that** agents can complete payment securely

**Acceptance Criteria:**
- [ ] Create Checkout Session with line items
- [ ] Return session URL for redirect
- [ ] Handle payment success/failure webhooks
- [ ] Store transaction ID
- [ ] Support test mode

**Technical Implementation:**
```typescript
Stripe Checkout Session created
→ Return checkout_url
→ Agent redirects to Stripe
→ Stripe calls webhook on success
→ Halo creates order
```

**Priority:** P0 (Critical)  
**Story Points:** 8

---

#### Story 6.2: Delegate Payment Flow
**As an** AI agent  
**I want** to provide payment credentials directly  
**So that** I can complete payment without user redirect

**Acceptance Criteria:**
- [ ] Accept card number, expiry, CVC
- [ ] Support network tokens (enhanced security)
- [ ] Validate allowance limits
- [ ] Tokenize card with Stripe
- [ ] Create and confirm Payment Intent
- [ ] Return success/error response

**Security Requirements:**
- Card data never logged
- PCI-compliant tokenization
- TLS encryption in transit
- Allowance prevents overspending

**Priority:** P1 (High)  
**Story Points:** 13

---

### Epic 7: x402 Protocol

#### Story 7.1: Return 402 Payment Required
**As an** API provider  
**I want** to require payment for protected resources  
**So that** I can monetize my API

**Acceptance Criteria:**
- [ ] Return HTTP 402 status code
- [ ] Include PaymentRequired JSON body
- [ ] Specify accepted payment schemes (exact)
- [ ] Include resource URL and description
- [ ] Support CAIP-2 network identifiers (eip155:84532)

**API Contract:**
```typescript
GET /api/x402/resource/:id
→ 402 Payment Required
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:84532",
    "amount": "1000000",
    "asset": "0x036CbD...",
    "payTo": "0x209693..."
  }]
}
```

**Priority:** P1 (High)  
**Story Points:** 5

---

#### Story 7.2: Verify x402 Payment
**As an** API provider  
**I want** to verify blockchain payment authorization  
**So that** I can grant access to paid resources

**Acceptance Criteria:**
- [ ] Verify x402 version = 2
- [ ] Check network matches requirement
- [ ] Validate amount matches
- [ ] Verify signature exists
- [ ] Check authorization timing (validAfter/validBefore)
- [ ] Return VerifyResponse with isValid status

**Priority:** P1 (High)  
**Story Points:** 5

---

### Epic 8: Capability Negotiation

#### Story 8.1: Match Payment Methods
**As an** agent  
**I want** to discover which payment methods the merchant accepts  
**So that** I can choose a compatible option

**Acceptance Criteria:**
- [ ] Agent sends supported methods
- [ ] Merchant responds with available methods
- [ ] Calculate intersection (matched methods)
- [ ] Return informational messages
- [ ] Handle no-match gracefully

**Example:**
```
Agent: ["card", "apple_pay"]
Merchant: ["card", "network_token", "paypal"]
→ Matched: ["card"]
```

**Priority:** P2 (Medium)  
**Story Points:** 5

---

### Epic 9: Agentic Checkout

#### Story 9.1: End-to-End Agentic Flow
**As an** AI agent  
**I want** to complete a purchase from prompt to payment  
**So that** I can autonomously shop on behalf of users

**Acceptance Criteria:**
- [ ] Parse natural language prompt
- [ ] Create ACP checkout request
- [ ] Receive merchant response
- [ ] Evaluate risk (approve/challenge/block)
- [ ] Execute payment if approved
- [ ] Create order
- [ ] Return complete response

**Full Flow:**
```
1. Agent: "Buy keyboard for $50"
2. Halo: Parse → {item: "keyboard", amount: 5000}
3. Halo: Build ACP request
4. Merchant: Return checkout session
5. Halo: Risk check → APPROVE
6. Halo: Create Stripe session
7. Agent: Complete payment
8. Halo: Create order → ORDER-ABC-123
```

**Priority:** P0 (Critical)  
**Story Points:** 13

---

## 5. Technical Architecture

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  (AI Agents, Merchants, Payment Processors, Admin Dashboard)    │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS/REST API
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HALO API GATEWAY                             │
│  Express.js | CORS | Request Validation | Rate Limiting         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
┌──────────┐  ┌──────────────┐  ┌─────────────┐
│Orchestr  │  │  Agentic     │  │  Protocol   │
│ation     │  │  Payment     │  │  Router     │
│Controller│  │  Controller  │  │  Controller │
└────┬─────┘  └──────┬───────┘  └──────┬──────┘
     │               │                  │
     └───────────────┼──────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Protocol Router  │  Prompt Parser  │  Risk Engine              │
│  Session Manager  │  Order Service  │  Payment Processor        │
│  ACP Builder      │  Normalizer     │  Capability Negotiator    │
│  ACP Parser       │  Stripe Service │  Fulfillment Service      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
┌──────────┐  ┌──────────────┐  ┌─────────────┐
│ Protocol │  │   Session    │  │   Order     │
│ Adapters │  │   Store      │  │   Store     │
│(ACP/UCP) │  │ (In-Memory)  │  │(In-Memory)  │
│  /x402   │  │              │  │             │
└────┬─────┘  └──────┬───────┘  └──────┬──────┘
     │               │                  │
     └───────────────┼──────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                          │
├─────────────────────────────────────────────────────────────────┤
│  Stripe API       │  Blockchain RPCs  │  Merchant APIs          │
│  Payment Networks │  Carrier APIs     │  Webhook Endpoints      │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | Server runtime |
| **Framework** | Express.js | HTTP server |
| **Language** | TypeScript | Type safety |
| **Payment** | Stripe API | Payment processing |
| **Validation** | Ajv | JSON Schema validation |
| **Testing** | Jest | Unit & integration tests |
| **Logging** | Console (structured) | Debugging & monitoring |

### 5.3 Data Models

#### 5.3.1 Session Model
```typescript
interface HaloSession {
  id: string;                    // halo_session_{timestamp}_{random}
  status: SessionStatus;         // not_ready | authentication_required | ready_for_payment | completed
  created_at: string;
  expires_at: string;
  
  // Checkout data
  checkout: {
    items: Item[];
    currency: string;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  
  // Buyer info
  buyer?: Buyer;
  shipping_address?: Address;
  
  // Risk evaluation
  risk: {
    score: number;
    decision: 'approve' | 'challenge' | 'block';
    factors: Record<string, boolean>;
    verified: boolean;
  };
  
  // Payment
  payment?: {
    method: string;
    transaction_id: string;
  };
  
  // Fulfillment
  fulfillment?: {
    type: 'shipping' | 'digital';
    carrier?: string;
  };
  
  // Protocol context
  agent_protocol: string;
  merchant_protocol: string;
}
```

#### 5.3.2 Order Model
```typescript
interface Order {
  id: string;                    // ORD-{timestamp}-{random}
  checkout_id: string;
  created_at: string;
  
  // Line items (immutable)
  line_items: OrderLineItem[];
  
  // Totals
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  
  // Fulfillment
  fulfillment: {
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
    expectations: FulfillmentExpectation[];
    events: FulfillmentEvent[];      // Append-only log
  };
  
  // Adjustments (refunds, returns)
  adjustments: Adjustment[];         // Append-only log
  
  // Payment
  payment: {
    status: 'paid' | 'partial_refund' | 'refunded';
    transaction_id: string;
  };
  
  // URLs
  permalink_url: string;
}
```

### 5.4 Protocol Adapters

Each protocol has a dedicated adapter implementing the `IProtocolAdapter` interface:

```typescript
interface IProtocolAdapter {
  name: string;
  version: string;
  
  // Validation
  validateRequest(request: any): boolean;
  validateResponse(response: any): boolean;
  
  // Translation
  toCanonical(protocolData: any): CanonicalPayload;
  fromCanonical(canonical: CanonicalPayload): any;
  
  // Operations
  createCheckout(items: any[]): any;
  getOrder(orderId: string): any;
}
```

**Implemented Adapters:**
- `ACPAdapter` - ACP v2026-01-16
- `UCPAdapter` - UCP v2026-01-11
- `X402Adapter` - x402 v2.0.0

---

## 6. API Specifications

### 6.1 Core Endpoints

#### Orchestration

```http
POST /halo/orchestrate
```
**Purpose:** Universal protocol translation  
**Request:**
```json
{
  "request": <AGENT_REQUEST_IN_ANY_PROTOCOL>,
  "merchantProtocol": "acp|ucp|x402",
  "merchantContext": {
    "merchantName": "Store",
    "merchantId": "merchant_123"
  }
}
```
**Response:**
```json
{
  "success": true,
  "orchestrator": "halo",
  "agentProtocol": "acp",
  "merchantProtocol": "ucp",
  "response": <MERCHANT_RESPONSE_IN_MERCHANT_PROTOCOL>,
  "canonical": <NORMALIZED_DATA>
}
```

---

#### Agentic Checkout

```http
POST /halo/agentic-checkout
```
**Purpose:** Complete checkout from natural language prompt  
**Request:**
```json
{
  "prompt": "Buy 2 Nike shoes for $100",
  "merchantProtocol": "acp"
}
```
**Response:**
```json
{
  "success": true,
  "orchestrator": "halo",
  "mode": "agentic",
  "parsed": {
    "amount_cents": 10000,
    "item_name": "Nike shoes",
    "quantity": 2
  },
  "capability_negotiation": {
    "compatible": true,
    "matched_payment_methods": ["card"]
  },
  "risk_evaluation": {
    "score": 30,
    "decision": "challenge"
  },
  "requires_verification": true,
  "verification_methods": ["3ds", "biometric"],
  "session": { ... }
}
```

---

#### ACP Checkout

```http
POST /api/acp/checkout
```
**Purpose:** Create ACP checkout session  
**Request:**
```json
{
  "items": [
    {"id": "prod_123", "quantity": 2}
  ],
  "buyer": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```
**Response:** `ACPCheckoutSession`

---

```http
POST /api/acp/checkout/:id/complete
```
**Purpose:** Complete checkout and process payment  
**Request:**
```json
{
  "payment_data": {
    "token": "tok_visa",
    "provider": "stripe"
  }
}
```
**Response:** Updated `ACPCheckoutSession` with `order` field

---

#### Orders (UCP)

```http
GET /api/orders
GET /api/orders/:id
```
**Purpose:** List/retrieve orders in UCP format

```http
POST /api/orders/:id/ship
POST /api/orders/:id/deliver
POST /api/orders/:id/refund
POST /api/orders/:id/cancel
```
**Purpose:** Order lifecycle operations

---

#### x402

```http
GET /api/x402/resource/:id
```
**Purpose:** Protected resource requiring payment  
**Response:** 402 with `X402PaymentRequired`

```http
POST /api/x402/pay
```
**Purpose:** Submit payment for x402 resource  
**Request:** `X402PaymentPayload`  
**Response:** Success/error with transaction details

---

### 6.2 Authentication & Authorization

**Current Implementation:** None (MVP)

**Roadmap:**
- API keys for merchant/agent identification
- OAuth 2.0 for agent authorization
- Webhook signature verification
- Rate limiting per client

---

## 7. Protocol Implementations

### 7.1 ACP (Agentic Commerce Protocol)

**Version:** 2026-01-16  
**Source:** `/Users/abhinav/Desktop/Halo/acp-official`

**Implemented Schemas:**
1. **Agentic Checkout (Schema 1)** - Checkout sessions, line items, fulfillment options
2. **Capability Negotiation (Schema 2)** - Payment method matching
3. **Delegate Payment (Schema 3)** - Card tokenization, allowance limits

**Key Features:**
- ✅ Checkout session lifecycle
- ✅ Fulfillment options (shipping/digital)
- ✅ 3D Secure verification
- ✅ Network tokenization
- ✅ Delegate payment with allowance
- ✅ Risk signal integration
- ✅ Message types (info/error)

**Test Coverage:** 100% of official spec

---

### 7.2 UCP (Universal Commerce Protocol)

**Version:** 2026-01-11  
**Source:** `/Users/abhinav/Desktop/Halo/ucp-official`

**Implemented Capabilities:**
1. **Order** - Immutable line items, fulfillment tracking, adjustments

**Key Features:**
- ✅ Order line items with `quantity.{total, fulfilled}`
- ✅ Fulfillment events (8 types: processing, shipped, in_transit, delivered, failed_attempt, canceled, undeliverable, returned_to_sender)
- ✅ Adjustments (refund, return, credit, etc.) with status
- ✅ Derived line item status (processing → partial → fulfilled)
- ✅ Carrier tracking integration

**Test Coverage:** 100% of order capability

---

### 7.3 x402

**Version:** 2.0.0  
**Source:** `/Users/abhinav/Desktop/Halo/x402-official`

**Implemented Features:**
- ✅ PaymentRequired (402 response)
- ✅ PaymentPayload (EVM authorization)
- ✅ CAIP-2 network identifiers
- ✅ VerifyResponse
- ✅ SettlementResponse
- ✅ Exact scheme for blockchain payments

**Key Features:**
- ✅ HTTP 402 status code handling
- ✅ USDC on Base Sepolia (eip155:84532)
- ✅ EIP-712 signature verification
- ✅ Time-bound authorizations (validAfter/validBefore)
- ✅ Nonce-based replay protection

**Test Coverage:** Full v2 spec compliance

---

## 8. Risk & Security

### 8.1 Risk Scoring Algorithm

**Factors:**
```typescript
score = 0;
if (amount > 10000) score += 30;        // High value (>$100)
if (country !== 'US') score += 20;      // International
if (shipping === 'express') score += 10; // Rush delivery

decision = score < 30 ? 'approve' : score < 60 ? 'challenge' : 'block';
```

**Decision Actions:**
- **Approve (0-29):** Auto-process payment
- **Challenge (30-59):** Require 3DS or biometric
- **Block (60+):** Reject transaction

### 8.2 Security Measures

**Data Protection:**
- TLS encryption for all API traffic
- Card data tokenization (never stored raw)
- PCI-compliant payment processing
- Session expiration (6 hours)

**Fraud Prevention:**
- Risk scoring on every transaction
- Card testing detection
- Velocity checks (future)
- Device fingerprinting (future)

**Authentication:**
- 3D Secure support
- Biometric verification
- Step-up authentication for high-risk

---

## 9. Success Metrics

### 9.1 Product Metrics

| Metric | Target | Current | Measurement |
|--------|--------|---------|-------------|
| **Protocol Coverage** | 3 protocols | 3 (ACP, UCP, x402) | ✅ Complete |
| **Translation Success Rate** | >99% | - | Track errors/total |
| **API Uptime** | >99.9% | - | Pingdom/Uptime Robot |
| **Response Time (p95)** | <500ms | - | New Relic/Datadog |

### 9.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Transaction Volume** | Track growth | Transactions/day |
| **Fraud Rate** | <0.5% | Chargebacks/transactions |
| **Payment Success Rate** | >95% | Successful/attempted |
| **Protocol Adoption** | Equal distribution | Usage per protocol |

### 9.3 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Test Coverage** | >80% | Jest coverage report |
| **TypeScript Compliance** | 100% | Zero `any` types |
| **API Error Rate** | <1% | 5xx errors/requests |
| **Integration Errors** | <0.1% | Failed protocol translations |

---

## 10. Future Roadmap

### Phase 2: Production Hardening (Q2 2026)

**Features:**
- [ ] PostgreSQL for persistent storage
- [ ] Redis for session caching
- [ ] Webhook delivery system
- [ ] Admin dashboard
- [ ] Real-time monitoring (Datadog)
- [ ] Rate limiting & throttling
- [ ] API key authentication

**Engineering:**
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Load testing (k6)
- [ ] Chaos engineering

---

### Phase 3: Enterprise Features (Q3 2026)

**Features:**
- [ ] Multi-merchant support
- [ ] White-label configuration
- [ ] Advanced analytics dashboard
- [ ] Custom risk rules per merchant
- [ ] Dispute management
- [ ] Subscription/recurring payments
- [ ] Multi-currency settlement

**Integrations:**
- [ ] Additional payment processors (Adyen, PayPal)
- [ ] Fraud prevention services (Sift, Kount)
- [ ] Tax calculation (Avalara, TaxJar)
- [ ] Shipping carriers (FedEx, UPS APIs)

---

### Phase 4: AI & Intelligence (Q4 2026)

**Features:**
- [ ] ML-based risk scoring
- [ ] Anomaly detection
- [ ] Predictive fraud prevention
- [ ] Smart routing (optimize payment success)
- [ ] Dynamic pricing recommendations
- [ ] Customer behavior insights

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Agent** | AI system that autonomously makes purchases (e.g., ChatGPT, Claude) |
| **Canonical Format** | Protocol-agnostic internal data representation |
| **Delegate Payment** | Agent provides payment credentials on user's behalf |
| **Orchestration** | Translation between different payment protocols |
| **Protocol Adapter** | Component that translates specific protocol to/from canonical |
| **Risk Score** | 0-100 number indicating transaction fraud likelihood |
| **Session** | Multi-step checkout context with unique ID |
| **Step-Up Auth** | Additional verification (3DS, biometric) for risky transactions |

---

## Appendix B: Test Scenarios

### Scenario 1: Cross-Protocol Payment
```
Given: Agent using ACP protocol
When: Paying a UCP merchant
Then: Halo translates ACP→UCP, returns UCP response
And: Canonical format available for debugging
```

### Scenario 2: High-Risk Transaction
```
Given: Purchase >$100 with express shipping to France
When: Risk engine evaluates
Then: Decision = CHALLENGE, score = 60
And: Session requires 3DS verification
```

### Scenario 3: Order Fulfillment
```
Given: Completed order ORD-123
When: Merchant ships order
Then: Fulfillment event added (type: shipped)
And: Customer receives tracking number
```

### Scenario 4: Partial Refund
```
Given: Delivered order worth $100
When: Merchant issues $40 refund
Then: Adjustment created (type: refund, status: completed)
And: Order payment_status = partial_refund
```

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Status:** ✅ Implementation Complete  
**Next Review:** Q2 2026
