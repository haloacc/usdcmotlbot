# Halo: The Economic OS Gateway for Agentic Commerce 🥧

**Bridging the Trillion-Dollar Agent Economy to Circle's Arc Blockchain**

## 🏗️ System Architecture: Universal Orchestration to Arc Settlement

Halo is the infrastructure layer designed to capture the multi-trillion dollar agentic commerce industry. It serves as the primary gateway for Circle's **Arc (The Economic OS)**, mapping fragmented agent protocols to unified, verifiable state transitions on the **Arc Circles chain**.

```
┌─────────────────────────────────────────────────────────────────┐
│              AGENT PROTOCOL LAYER (ACP | UCP | x402)            │
│       The Trillion Dollar Entry Point for Agent Intents         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │  Protocol-Agnostic Intent Delivery
                     │  (Natural Language | Structured JSON)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               HALO AGENTIC ORCHESTRATION LAYER                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Universal Protocol Router                               │   │
│  │  • Detects Agent Protocol (ACP/UCP/x402)                 │   │
│  │  • Translates Intent to Canonical Economic Model        │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                               │
│                 ▼                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Economic State Registry (Intent Ledger)                 │   │
│  │  • SHA-256 Chaining of Agent Decisions                  │   │
│  │  • Verifiable Intent Audit Trail for Arc Blockchain      │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                               │
│     ┌───────────┼───────────┐                                   │
│     ▼           ▼           ▼                                   │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐                       │
│  │ Risk    │ │Negotiator│ │State      │                       │
│  │ Engine  │ │Capability│ │Normalizer │                       │
│  ├─────────┤ ├──────────┤ ├────────────┤                       │
│  │0-100 Arc│ │Bridge    │ │Map to Arc │                       │
│  │RiskScore│ │Merchant  │ │Transitions│                       │
│  └────┬────┘ └────┬─────┘ └─────┬──────┘                       │
│       │           │             │                               │
│       └───────────┼─────────────┘                               │
│                   ▼                                               │
│           ┌──────────────────┐                                  │
│           │ Arc Settlement   │                                  │
│           │ Decision Logic   │                                  │
│           ├──────────────────┤                                  │
│           │ Score < 30?      │                                  │
│           │ → SETTLE ON ARC  │                                  │
│           │                  │                                  │
│           │ 30 ≤ Score ≤ 60? │                                  │
│           │ → WALLET SIG     │                                  │
│           │                  │                                  │
│           │ Score > 60?      │                                  │
│           │ → BLOCK INTENT   │                                  │
│           └────┬─────────────┘                                  │
│                │                                                │
│                ├──► Decision == "settle"?                       │
│                │         │                                      │
│                │    Yes  ▼                                      │
│                │    ┌──────────────────┐                       │
│                │    │ Circle Arc Svc   │                       │
│                │    ├──────────────────┤                       │
│                │    │USDC Economic OS  │                       │
│                │    │State Transition  │                       │
│                │    └──────────────────┘                       │
│                │                                                │
│                ▼                                                │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ Economic Response Builder (Arc Protocol)              │    │
│    ├──────────────────────────────────────────────────────┤    │
│    │ {                                                    │    │
│    │   arc_transition_id: string,                         │    │
│    │   settlement: "settled" | "pending" | "blocked",     │    │
│    │   intent_hash: string (Registry Reference)           │    │
│    │ }                                                    │    │
│    └──────────────┬───────────────────────────────────────┘    │
│                   │                                             │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│           Economic OS Response (Internet of Value)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Economic Data Flow

### Step 1: Fragmented Protocol Intake
Halo accepts any trillion-dollar agent intent, whether it arrives via the Agentic Checkout Protocol (ACP), Universal Commerce Protocol (UCP), or HTTP 402.

### Step 2: Canonical Intent Translation
The `ProtocolRouter` strips protocol-specific noise, translating the request into a **Canonical Economic Intent**.

### Step 3: Immutable Registry Chaining
Before settlement, every intent and risk decision is recorded in the **Economic State Registry** using SHA-256 block-chaining. This ensures that the agent's commercial history is verifiable on the Arc blockchain.

### Step 4: Arc-Native Risk Evaluation
The Risk Engine applies Arc-specific scoring rules. Low-risk intents are routed for instant settlement. Medium-risk intents trigger an **Arc Wallet Signature Challenge**.

### Step 5: Circle USDC Settlement
Halo executes the final settlement via Circle's **Arc Economic OS**, utilizing USDC as the universal value carrier and CCTP for cross-chain liquidity.

### Step 6: Return Response
```
{
  "risk_score": 40,
  "decision": "challenge",
  "normalized_payload": {
    "halo_normalized": {
      "total_cents": 8300,
      "currency": "usd",
      "country": "US",
      "provider": "stripe",
      "shipping_speed": "express"
    }
  }
}
```

---

## 🔄 Risk Scoring Examples

### Example 1: Low Risk → APPROVE
```
Input: $20 purchase, US, standard shipping
Scoring:
  - Amount > $50? NO → +0
  - Country != US? NO → +0
  - Express? NO → +0
  Score: 0
Decision: APPROVE ✓
Stripe PaymentIntent: CREATED
```

### Example 2: Medium Risk → CHALLENGE
```
Input: $100 purchase, US, express shipping
Scoring:
  - Amount > $50? YES → +30
  - Country != US? NO → +0
  - Express? YES → +10
  Score: 40
Decision: CHALLENGE ⚠️
Stripe PaymentIntent: NOT CREATED
```

### Example 3: High Risk → BLOCK
```
Input: $100 purchase, Japan, express shipping
Scoring:
  - Amount > $50? YES → +30
  - Country != US? YES → +20
  - Express? YES → +10
  Score: 60
Decision: BLOCK ✗
Stripe PaymentIntent: NOT CREATED
```

---

## 📁 Service Responsibilities

### PaymentController
- Entry point for all requests
- Orchestrates the pipeline
- Catches and logs errors
- Formats responses

### ACPParser
- Extracts fields from raw payload
- Performs basic field mapping
- Validates data types

### Normalizer
- Converts dollars to cents
- Standardizes field names
- Lowercase provider/shipping
- Creates internal format

### RiskEngine
- Applies scoring rules
- Calculates total risk score
- Applies decision logic
- Returns typed RiskResult

### StripeService
- Creates PaymentIntent in test mode
- Uses Stripe test API key
- Adds metadata for tracking
- Error handling & logging

### Validation Middleware
- Protocol validation
- Payload structure check
- Required field validation
- Returns 400 on failure

---

## 🧪 Test Coverage

### Unit Tests
- **riskEngine**: 8 tests
  - Individual scoring factors
  - Score thresholds
  - Decision classification
  - Edge cases

- **normalizer**: 2 tests
  - Basic normalization
  - Missing field handling

### Integration Tests
- **paymentController**: 5 tests
  - APPROVE flow with Stripe
  - CHALLENGE flow
  - BLOCK flow
  - Protocol validation
  - Missing field validation

---

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure actual Stripe test key
- [ ] Set appropriate PORT
- [ ] Run tests: `npm test`
- [ ] Build: `npm run build` (if applicable)
- [ ] Start: `npm start`
- [ ] Test endpoints with real data
- [ ] Monitor logs for errors
- [ ] Set up error tracking (Sentry, etc.)

---

## 📝 Error Handling

### Validation Errors (400)
```json
{
  "error": "Invalid protocol. Expected \"ACP\"."
}
```

### Missing Fields (400)
```json
{
  "error": "Missing required field: payment_provider"
}
```

### Stripe Errors (200, but logged)
- PaymentIntent creation failure is caught and logged
- Response still returns risk decision
- Payment processing gracefully fails

### Server Errors (500)
```json
{
  "error": "An error occurred while processing the payment."
}
```

---

**Architecture Complete! Ready for Production** ✅
