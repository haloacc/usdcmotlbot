# Protocol-Based Architecture

## Overview

**Everything in Halo uses payment protocols for communication.** No direct API calls, no shortcuts - all interactions follow standardized protocol schemas.

## Architecture Components

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   User/AI   │         │     HALO     │         │  Merchant   │
│   Agent     │ ◄─────► │   (Router)   │ ◄─────► │   Server    │
└─────────────┘         └──────────────┘         └─────────────┘
     UCP                  UCP ↔ ACP                    ACP
  (Request)               Translation              (Response)
```

### 1. User/AI Agent (UCP Speaker)
- Sends **UCP (Universal Commerce Protocol)** requests
- Natural language → UCP format
- Receives UCP responses
- **No direct Stripe/payment API knowledge**

### 2. Halo Router (Protocol Translator)
- Receives UCP requests
- Detects agent protocol (UCP, ACP, x402)
- Translates to merchant protocol
- Routes to appropriate adapter
- Transforms merchant responses back to agent format

### 3. Merchant Server (ACP Speaker)
- **Separate service** (not embedded in Halo)
- Exposes ACP endpoints
- Returns ACP-compliant responses
- Handles:
  - Checkout session creation
  - Payment processing
  - Order confirmation
  - Fulfillment status

## Complete Protocol Flow

### Step 0: Catalog Browsing
```javascript
// Frontend requests product catalog from merchant
GET /merchant/catalog

// Merchant returns protocol-compliant catalog
{
  "merchant": {
    "id": "cybershop_demo",
    "name": "CyberShop",
    "description": "Premium Electronics"
  },
  "products": [{
    "id": "laptop_001",
    "name": "Gaming Laptop Pro",
    "price": { "amount": 1500, "currency": "USD" },
    "in_stock": true,
    "images": ["💻"],
    "metadata": { "brand": "TechPro", "warranty": "2 years" }
  }],
  "capabilities": {
    "supports_cart": true,
    "payment_methods": ["card", "crypto"],
    "currencies": ["USD", "EUR"]
  }
}
```

### Step 0.5: Cart Management
```javascript
// User adds items to cart via merchant API
POST /merchant/cart

{
  "cart_id": "cart_123" || null, // null creates new cart
  "buyer_id": "user_456",
  "items": [{
    "product_id": "laptop_001",
    "quantity": 2,
    "price": 1500
  }]
}

// Merchant returns cart with totals
{
  "success": true,
  "cart": {
    "id": "cart_123",
    "items": [...],
    "totals": {
      "subtotal": { "amount": 3000, "currency": "usd" },
      "tax": { "amount": 240, "currency": "usd" },
      "total": { "amount": 3240, "currency": "usd" }
    }
  }
}
```

### Step 1: Intent → UCP Request
```javascript
// User: "Buy laptop for $1500 x 2"
// Parsed to UCP:
{
  "line_items": [{
    "item": {
      "id": "laptop_001",
      "name": "Gaming Laptop",
      "price": { "amount": 1500, "currency": "USD" }
    },
    "quantity": 2
  }],
  "intent": {
    "action": "checkout",
    "items": [...]
  },
  "buyer": {
    "preferences": {
      "shipping_speed": "standard",
      "country": "US"
    }
  },
  "capabilities": {
    "supportedPaymentMethods": ["card", "crypto"],
    "supportedCurrencies": ["USD", "EUR"]
  }
}
```

### Step 2: UCP → ACP Translation
```javascript
// Halo Router transforms UCP to ACP
// Sends to Merchant (ACP endpoint)
POST https://merchant.example.com/acp/checkout

{
  "items": [{
    "id": "laptop_001",
    "quantity": 2
  }],
  "payment_flow": "redirect",
  "fulfillment_options": ["standard", "express"],
  "agent_capabilities": {
    "payment_methods": ["card", "crypto"],
    "currencies": ["USD", "EUR"]
  }
}
```

### Step 3: Merchant ACP Response
```javascript
// Merchant returns ACP checkout session
{
  "id": "checkout_session_abc123",
  "status": "ready_for_payment",
  "currency": "usd",
  "line_items": [{
    "id": "li_xyz",
    "item": { "id": "laptop_001", "quantity": 2 },
    "unit_price": { "amount": 1500, "currency": "usd" },
    "total": { "amount": 3000, "currency": "usd" }
  }],
  "totals": {
    "subtotal": { "amount": 3000, "currency": "usd" },
    "tax": { "amount": 240, "currency": "usd" },
    "total": { "amount": 3240, "currency": "usd" }
  },
  "seller_capabilities": {
    "payment_methods": ["card"],
    "auth_requirements": ["3ds"],
    "supported_wallets": []
  },
  "payment_url": "https://checkout.stripe.com/pay/..."
}
```

### Step 4: Capability Negotiation
```javascript
// Halo performs capability negotiation
const agentCan = ["card", "crypto"];
const merchantCan = ["card"];
const compatible = agentCan.some(m => merchantCan.includes(m));
// Result: compatible = true (both support "card")
```

### Step 5: Risk Evaluation
```javascript
// Halo Risk Engine evaluates (still protocol-based)
{
  "score": 35,
  "decision": "approve", // or "challenge", "block"
  "factors": {
    "high_value": false,
    "unusual_pattern": false,
    "known_good_merchant": true
  }
}
```

### Step 6: Payment Execution
```javascript
// If approved, Halo executes payment using delegated credentials
// Still sends via protocol (ACP payment confirmation format)
POST https://merchant.example.com/acp/payment

{
  "checkout_session_id": "checkout_session_abc123",
  "payment_method": {
    "type": "card",
    "token": "pm_stripe_token_xyz", // Saved payment method token
    "card_brand": "visa",
    "card_last4": "4242"
  },
  "billing_address": {...}
}
```

### Step 7: Payment Confirmation (ACP)
```javascript
// Merchant returns ACP completion response
{
  "id": "checkout_session_abc123",
  "status": "completed",
  "order": {
    "id": "order_12345",
    "status": "confirmed",
    "permalink_url": "https://merchant.com/orders/12345",
    "receipt_url": "https://merchant.com/receipts/12345"
  },
  "payment": {
    "id": "pi_stripe_xyz",
    "status": "succeeded",
    "amount": { "value": 3240, "currency": "usd" },
    "payment_method": {
      "type": "card",
      "brand": "visa",
      "last4": "4242"
    },
    "created_at": "2026-02-03T10:30:00Z"
  },
  "fulfillment": {
    "status": "pending",
    "expectations": [{
      "type": "shipping",
      "window": {
        "start": "2026-02-04T00:00:00Z",
        "end": "2026-02-08T23:59:59Z"
      },
      "tracking_available": false
    }]
  },
  "line_items": [...]
}
```

### Step 8: ACP → UCP Translation
```javascript
// Halo transforms merchant ACP response back to UCP
// Returns to user/agent in their protocol
{
  "success": true,
  "payment_completed": true,
  "order": {
    "id": "order_12345",
    "status": "confirmed",
    "receipt_url": "..."
  },
  "payment": {
    "status": "succeeded",
    "amount": 3240,
    "currency": "USD"
  },
  "protocol_used": "UCP → ACP"
}
```

## Key Principles

### ✅ Always Use Protocols
- **Intent parsing** → UCP format
- **Payment requests** → Protocol format (UCP/ACP)
- **Merchant communication** → ACP format
- **Confirmations** → Protocol format
- **Receipts** → Protocol-derived data
- **Emails** → Generated from protocol data

### ✅ Merchant is Separate
In production:
```
Agent → Halo Router → [Network] → Merchant Server
         (UCP)          (ACP)        (ACP Response)
```

In MVP (simulated):
```
Agent → Halo Router → Merchant Simulator
         (UCP)       (generates ACP response)
```

The **merchant simulator** mimics what a real merchant server would return. It's not "cheating" - it's following the exact ACP schema that a real merchant would use.

### ✅ No Direct API Calls
**Wrong:**
```javascript
// ❌ Direct Stripe API call
const payment = await stripe.paymentIntents.create({...});
```

**Correct:**
```javascript
// ✅ Protocol-based flow
const ucpRequest = buildUCPRequest(order);
const acpResponse = await haloRouter.orchestrate(ucpRequest, {
  merchantProtocol: 'acp'
});
// ACP adapter internally uses Stripe, but interface is protocol-based
```

## Real-World Deployment

### Merchant Integration
```javascript
// Real merchant exposes ACP endpoint
// Example: CyberShop merchant server

app.post('/acp/checkout', async (req, res) => {
  const acpRequest = req.body; // ACP CREATE REQUEST schema
  
  // Merchant's internal logic
  const order = await db.orders.create({...});
  const checkoutSession = await stripe.checkout.sessions.create({...});
  
  // Return ACP CREATE RESPONSE schema
  res.json({
    id: checkoutSession.id,
    status: 'ready_for_payment',
    currency: 'usd',
    line_items: [...],
    totals: {...},
    seller_capabilities: {...},
    payment_url: checkoutSession.url
  });
});

app.post('/acp/payment', async (req, res) => {
  // Handle payment confirmation
  // Return ACP COMPLETION schema
  res.json({
    id: req.body.checkout_session_id,
    status: 'completed',
    order: {...},
    payment: {...},
    fulfillment: {...}
  });
});
```

### Halo Communicates With Merchant
```javascript
// Halo Router makes HTTP request to merchant
const merchantResponse = await fetch('https://cybershop.com/acp/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/acp+json' },
  body: JSON.stringify(acpRequest)
});

const acpCheckoutSession = await merchantResponse.json();
// Process ACP response...
```

## Benefits

1. **Interoperability**: Any ACP-compliant merchant works with Halo
2. **Protocol Evolution**: Update protocols without changing core logic
3. **Multi-Protocol**: Support UCP, ACP, x402, future protocols
4. **Standardization**: Industry-standard communication
5. **Testability**: Mock protocol responses for testing
6. **Auditability**: Full protocol-level logging and compliance

## Current Implementation

### What's Protocol-Based ✅
- Intent parsing → UCP
- Checkout session creation → ACP
- Capability negotiation → Protocol schemas
- Risk evaluation → Protocol metadata
- Payment execution → Protocol-wrapped
- Completion responses → ACP format

### What Needs Fixing ❌
- Direct Stripe calls should be wrapped in protocol layer
- Email confirmations should use protocol data structures
- Receipt generation should consume ACP completion response
- Order tracking should follow protocol fulfillment schema

## Next Steps

1. Ensure **all** Stripe interactions go through ACPAdapter
2. Merchant simulator returns **pure ACP responses**
3. Email service consumes **ACP completion responses**
4. Receipt page parses **ACP order data**
5. Add merchant server example for real deployment
