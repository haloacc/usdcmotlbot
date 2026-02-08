# Halo: The Universal Economic Gateway for Circle’s Arc 🥧 🌀

**Bridging the Multi-Trillion Dollar Agent Economy to Circle's Arc (The Economic OS)**

Halo is a protocol-agnostic payment orchestration platform that enables AI agents to make autonomous payments across heterogeneous ecosystems. It serves as an intelligent middleware layer that translates between major payment protocols (ACP, UCP, x402) and **settles all economic transitions natively via Circle USDC on the Arc blockchain**.

---

## 🏆 #USDCHackathon Submission

### 🌍 The Problem: Trillion-Dollar Fragmentation
The agentic economy is exploding, but it is trapped in silos. Agents from OpenAI (ACP), independent developers (x402), and global marketplaces (UCP) cannot talk to each other. Halo solves the fragmentation that holds the entire industry back by acting as the **Universal Translator** for the agentic web.

### 🌀 Halo: The Economic OS Transition Layer
Halo is the infrastructure bridge for **Circle’s Arc (The Economic OS)**. It is designed to capture agentic commerce volume by normalizing fragmented intents into unified, verifiable state transitions on the **Arc Circles chain.**

### 🛠 Key Innovations
*   **Universal Protocol Bridging**: The only orchestrator that seamlessly translates between **ACP, UCP, and x402**.
*   **Secure USDC Delegation (MPC)**: Leveraging **Circle Programmable Wallets**, Halo provides a secure, compliant pathway for humans to delegate purchasing power to agents without exposing private keys.
*   **Encrypted State Registry**: Halo implements a **Privacy-Preserving Registry** on the Arc blockchain. We anchor SHA-256 block-chained intents to Arc, ensuring every decision is verifiable while keeping sensitive merchant/item data encrypted.
*   **Arc-Native Security**: Halo’s Risk Engine automates protection via **Arc Wallet Signature Challenges**, the blockchain-native successor to 3D Secure.

### 📊 The Use Case: End-to-End Autonomy
1.  **Intent**: An OpenAI agent delivers a purchase intent via ACP.
2.  **Orchestration**: Halo normalizes it, performs risk scoring (0-100), and translates it for an Arc-native merchant.
3.  **Settlement**: Halo executes a **USDC Economic Transition** via the Circle Arc Economic OS.
4.  **State Registry**: The successful transaction is anchored to the Arc Circles chain as an encrypted state record—immutable, private, and audit-ready.

---

## 🚀 Installation & Setup Guide

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Circle API Key** (for USDC settlement)
- **Stripe API Key** (for legacy payment fallback)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/haloacc/usdcmotlbot.git
cd usdcmotlbot

# Install root dependencies
npm install

# Install frontend dependencies
cd react-frontend
npm install
cd ..
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development

# Circle Configuration
CIRCLE_API_KEY=your_circle_api_key

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=sk_test_...

# Google OAuth (Optional for Dashboard)
GOOGLE_CLIENT_ID=your_client_id
```

### 3. Start the Platform
```bash
# Run both backend and frontend concurrently
npm run dev

# Or start them separately
npm start         # Starts Express Backend on :3000
npm run client    # Starts Next.js Frontend on :3001
```

---

## 🏗️ Project Structure
```
usdcmotlbot/
├── src/
│   ├── index.ts                      # Server entry point
│   ├── controllers/
│   │   ├── orchestrationController.ts # Universal Protocol Router
│   │   └── paymentController.ts       # Arc Economic Transitions
│   ├── services/
│   │   ├── circle/CircleService.ts    # Circle Arc & CCTP Integration
│   │   ├── riskEngine.ts              # Arc-Native Risk Scoring
│   │   └── normalizer.ts              # Canonical Intent Mapper
│   ├── protocols/
│   │   └── adapters/                  # ACP, UCP, and x402 Adapters
├── react-frontend/                   # Next.js Dashboard & Registry UI
├── tests/                             # Full Integration & Unit Test Suite
└── README.md
```

## 🧪 Running Tests
```bash
# Run full suite (74 passing tests)
npm test
```

---

## 🔗 Resources
*   **Design System**: `https://github.com/JaideepCherukuri/halo-design-system`
*   **Vision**: We are building the **Economic Registry for the Internet of Value.**

**#USDC #AgenticWeb #CircleArc #EconomicOS #HaloProject #ArcCirclesChain**
