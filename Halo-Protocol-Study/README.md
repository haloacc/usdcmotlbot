# Halo MVP (Agentic Payments Orchestrator)

## Overview
Halo MVP is an orchestration layer designed to process Agentic Checkout Protocol (ACP) payloads, normalize them, evaluate risk, and optionally forward payments to Stripe. This project serves as a bridge between ACP and payment rails, providing a clear decision-making process for payment handling.

### What is Halo?
- ✅ An orchestration + risk + normalization layer
- ✅ A bridge between ACP agents and payment providers
- ❌ NOT an LLM
- ❌ NOT a merchant
- ❌ NOT Stripe itself
- ❌ NOT an ACP server

## Features
- Accepts real ACP checkout JSON as input
- Normalizes ACP payloads into Halo's internal model
- Implements basic fraud and risk logic with scoring rules
- Optionally forwards approved payments to Stripe in test mode
- Returns clear decisions: **approve**, **challenge**, or **block**
- Comprehensive validation and error handling

## Project Structure
```
halo-mvp/
├── src/
│   ├── index.ts                      # Server entry point
│   ├── app.ts                        # Express app configuration
│   ├── controllers/
│   │   └── paymentController.ts      # Processes ACP requests
│   ├── services/
│   │   ├── acpParser.ts              # Extracts fields from ACP payload
│   │   ├── normalizer.ts             # Converts to internal format
│   │   ├── riskEngine.ts             # Computes risk scores
│   │   └── stripeService.ts          # Creates Stripe PaymentIntents
│   ├── middleware/
│   │   └── validation.ts             # Validates protocol & required fields
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   ├── models/
│   └── utils/
│       └── constants.ts
├── tests/
│   ├── unit/
│   │   ├── riskEngine.test.ts
│   │   └── normalizer.test.ts
│   └── integration/
│       └── paymentController.test.ts
├── .env.example                      # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoint

### POST /halo/process-acp

Process an ACP checkout payload.

**Request (Real ACP Checkout Protocol):**
```json
{
  "protocol": "ACP",
  "payload": {
    "id": "cs_a8134a89e1",
    "status": "ready_for_payment",
    "currency": "usd",
    "payment_provider": {
      "provider": "stripe",
      "supported_payment_methods": ["card"]
    },
    "line_items": [
      {
        "id": "li_b00944e1d5",
        "item": {
          "id": "sku_mug_001",
          "quantity": 1
        },
        "base_amount": 1800,
        "discount": 0,
        "subtotal": 1800,
        "tax": 153,
        "total": 1953
      }
    ],
    "totals": [
      {
        "type": "items_base_amount",
        "display_text": "Item(s) total",
        "amount": 1800
      },
      {
        "type": "tax",
        "display_text": "Tax",
        "amount": 153
      },
      {
        "type": "shipping",
        "display_text": "Shipping",
        "amount": 599
      },
      {
        "type": "total",
        "display_text": "Total",
        "amount": 2552
      }
    ],
    "fulfillment_options": [
      {
        "type": "shipping",
        "id": "ship_econ",
        "title": "Economy (5–7 days)",
        "total": 599
      }
    ],
    "fulfillment_details": {
      "address": {
        "name": "John Doe",
        "line_one": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "country": "US",
        "postal_code": "94105"
      }
    }
  }
}
```

**Response (Success):**
```json
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

**Response (Validation Error):**
```json
{
  "error": "Invalid protocol. Expected \"ACP\"."
}
```

## Risk Scoring Rules

The risk engine scores payments based on three factors:

| Factor | Condition | Points |
|--------|-----------|--------|
| Amount | Total > $50 (5000 cents) | +30 |
| Country | Not "US" | +20 |
| Shipping | Express | +10 |

### Decision Logic

- **Score < 30** → `APPROVE` (creates Stripe PaymentIntent if API key configured)
- **30 ≤ Score ≤ 60** → `CHALLENGE` (requires manual review)
- **Score > 60** → `BLOCK` (rejected)

## Setup Instructions

### Prerequisites
- Node.js >= 12.0.0
- npm or yarn
- Google OAuth Client ID (for OAuth login)
- Stripe test API key (optional, for payment processing)
- Gmail App Password (optional, for email delivery)
- Twilio Account (optional, for SMS delivery)

### Installation

1. **Clone & install dependencies:**
   ```bash
   cd halo-mvp
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Google OAuth (required for Sign in with Google)
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   
   # Stripe (optional)
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY
   
   # Email/SMS (optional - logs to console in dev)
   # EMAIL_USER=your-email@gmail.com
   # EMAIL_PASSWORD=your-app-password
   # TWILIO_ACCOUNT_SID=your-sid
   ```

3. **Set up Google OAuth (Quick):**
   ```bash
   ./setup-oauth.sh
   ```
   
   Or manually:
   - Get Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Update `.env` with your `GOOGLE_CLIENT_ID`
   - Replace `YOUR_GOOGLE_CLIENT_ID` in `public/login.html` and `public/signup.html`
   - See [OAUTH_SETUP.md](OAUTH_SETUP.md) for detailed instructions

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Access the application:**
   - Homepage: http://localhost:3000
   - Sign Up: http://localhost:3000/signup.html
   - Login: http://localhost:3000/login.html
   - Dashboard: http://localhost:3000/dashboard.html (requires login)
   
   Server runs on `http://localhost:3000`

## Running Tests

### Run all tests:
```bash
npm test
```

### Run specific test suite:
```bash
npm test -- riskEngine.test.ts
npm test -- normalizer.test.ts
npm test -- paymentController.test.ts
```

## Example Requests

### Example 1: Approve Decision (Low Risk)
```bash
curl -X POST http://localhost:3000/halo/process-acp \
  -H "Content-Type: application/json" \
  -d '{
    "protocol": "ACP",
    "payload": {
      "id": "cs_low_risk_001",
      "status": "ready_for_payment",
      "currency": "usd",
      "payment_provider": {"provider": "stripe", "supported_payment_methods": ["card"]},
      "line_items": [{
        "id": "li_001",
        "item": {"id": "sku_001", "quantity": 1},
        "base_amount": 2000,
        "discount": 0,
        "subtotal": 2000,
        "tax": 170,
        "total": 2170
      }],
      "totals": [
        {"type": "items_base_amount", "display_text": "Items", "amount": 2000},
        {"type": "tax", "display_text": "Tax", "amount": 170},
        {"type": "total", "display_text": "Total", "amount": 2170}
      ],
      "fulfillment_options": [
        {"type": "shipping", "id": "ship_std", "title": "Standard", "total": 0}
      ],
      "fulfillment_details": {
        "address": {
          "name": "John Doe",
          "line_one": "123 Main St",
          "city": "San Francisco",
          "state": "CA",
          "country": "US",
          "postal_code": "94105"
        }
      }
    }
  }'
```

**Response:**
```json
{
  "risk_score": 0,
  "decision": "approve",
  "normalized_payload": {
    "halo_normalized": {
      "total_cents": 2170,
      "currency": "usd",
      "country": "US",
      "provider": "stripe",
      "shipping_speed": "standard"
    }
  }
}
```

### Example 2: Challenge Decision (Medium Risk)
```bash
curl -X POST http://localhost:3000/halo/process-acp \
  -H "Content-Type: application/json" \
  -d '{
    "protocol": "ACP",
    "payload": {
      "id": "cs_medium_risk_001",
      "status": "ready_for_payment",
      "currency": "usd",
      "payment_provider": {"provider": "stripe", "supported_payment_methods": ["card"]},
      "line_items": [{
        "id": "li_002",
        "item": {"id": "sku_002", "quantity": 2},
        "base_amount": 10000,
        "discount": 0,
        "subtotal": 10000,
        "tax": 850,
        "total": 10850
      }],
      "totals": [
        {"type": "items_base_amount", "display_text": "Items", "amount": 10000},
        {"type": "tax", "display_text": "Tax", "amount": 850},
        {"type": "shipping", "display_text": "Express", "amount": 1500},
        {"type": "total", "display_text": "Total", "amount": 12350}
      ],
      "fulfillment_options": [
        {"type": "shipping", "id": "ship_exp", "title": "Express (2-3 days)", "total": 1500}
      ],
      "selected_fulfillment_options": [
        {"type": "shipping", "shipping": {"option_id": "ship_exp", "item_ids": ["li_002"]}}
      ],
      "fulfillment_details": {
        "address": {
          "name": "Jane Smith",
          "line_one": "456 Oak Ave",
          "city": "New York",
          "state": "NY",
          "country": "US",
          "postal_code": "10001"
        }
      }
    }
  }'
```

**Response:**
```json
{
  "risk_score": 40,
  "decision": "challenge",
  "normalized_payload": {
    "halo_normalized": {
      "total_cents": 12350,
      "currency": "usd",
      "country": "US",
      "provider": "stripe",
      "shipping_speed": "express"
    }
  }
}
```

### Example 3: Block Decision (High Risk)
```bash
curl -X POST http://localhost:3000/halo/process-acp \
  -H "Content-Type: application/json" \
  -d '{
    "protocol": "ACP",
    "payload": {
      "id": "cs_high_risk_001",
      "status": "ready_for_payment",
      "currency": "usd",
      "payment_provider": {"provider": "stripe", "supported_payment_methods": ["card"]},
      "line_items": [{
        "id": "li_003",
        "item": {"id": "sku_premium", "quantity": 1},
        "base_amount": 15000,
        "discount": 0,
        "subtotal": 15000,
        "tax": 0,
        "total": 15000
      }],
      "totals": [
        {"type": "items_base_amount", "display_text": "Items", "amount": 15000},
        {"type": "shipping", "display_text": "Express International", "amount": 3000},
        {"type": "total", "display_text": "Total", "amount": 18000}
      ],
      "fulfillment_options": [
        {"type": "shipping", "id": "ship_intl", "title": "Express International", "total": 3000}
      ],
      "selected_fulfillment_options": [
        {"type": "shipping", "shipping": {"option_id": "ship_intl", "item_ids": ["li_003"]}}
      ],
      "fulfillment_details": {
        "address": {
          "name": "Pierre Dupont",
          "line_one": "123 Rue de Paris",
          "city": "Paris",
          "state": "Île-de-France",
          "country": "FR",
          "postal_code": "75001"
        }
      }
    }
  }'
```

**Response:**
```json
{
  "risk_score": 60,
  "decision": "block",
  "normalized_payload": {
    "halo_normalized": {
      "total_cents": 18000,
      "currency": "usd",
      "country": "FR",
      "provider": "stripe",
      "shipping_speed": "express"
    }
  }
}
```

## Service Architecture

### 1. Payment Controller (`paymentController.ts`)
- Entry point for requests
- Orchestrates the payment processing pipeline
- Validates protocol and delegates to services
- Returns structured decisions

### 2. ACP Parser (`acpParser.ts`)
- Extracts key fields from raw ACP payloads
- Handles field mapping and type coercion
- Provides clean parsed data to normalizer

### 3. Normalizer (`normalizer.ts`)
- Converts parsed ACP data to Halo's internal format
- Converts amounts to cents
- Maps provider and shipping type strings to lowercase

### 4. Risk Engine (`riskEngine.ts`)
- Computes risk score based on normalized payload
- Applies decision logic (approve/challenge/block)
- Returns structured RiskResult

### 5. Stripe Service (`stripeService.ts`)
- Creates PaymentIntent in Stripe test mode
- Uses normalized payload for amount and currency
- Stores transaction metadata
- Handles errors gracefully

## Validation Rules

All incoming ACP payloads must include:
- ✅ `protocol` = "ACP"
- ✅ `payload.total` (required)
- ✅ `payload.currency` (required)
- ✅ `payload.country` (required)
- ✅ `payload.payment_provider` (required)
- ✅ `payload.shipping_type` (required)

Invalid requests receive 400 error with descriptive message.

## Development

### Build:
```bash
npm run build
```

### Type Checking:
```bash
npx tsc --noEmit
```

## License
MIT

## Contact
For questions or support regarding the Halo MVP, please refer to project documentation.
   git clone <repository-url>
   cd halo-mvp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and add your Stripe API key.

4. Start the application:
   ```
   npm start
   ```

## Usage
To process an ACP payload, send a POST request to `/halo/process-acp` with the following JSON structure:
```json
{
  "protocol": "ACP",
  "payload": {
    // Your ACP payload here
  }
}
```

The response will include the risk score, decision, and normalized payload.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.