import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import paymentController from './controllers/paymentController';
import { processAgenticPayment, processCompletePayment } from './controllers/agenticPaymentController';
import { OrchestrationController } from './controllers/orchestrationController';
import protocolController from './controllers/protocolController';
import { validateACP } from './middleware/validation';
import { authController } from './controllers/authController';
import { userController } from './controllers/userController';
import { paymentMethodController } from './controllers/paymentMethodController';
import { cryptoWalletController } from './controllers/cryptoWalletController';
import { OauthController } from './controllers/oauthController';
import merchantApiController from './controllers/merchantApiController';
const oauthController = new OauthController();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request Logger for debugging
app.use((req, res, next) => {
    const originalSend = res.send;

    res.send = function (body: any) {
        if (res.statusCode >= 400) {
            console.log(`[Backend API] ${req.method} ${req.path} -> ${res.statusCode}`);
            try {
                const bodyStr = typeof body === 'object' ? JSON.stringify(body) : body;
                console.log(`[Backend API] Response Body: ${bodyStr}`);
            } catch (e) { }
        }
        return originalSend.apply(res, [body] as any);
    } as any;
    next();
});

// Serve static chat UI
app.use(express.static(path.join(__dirname, '../public')));

// Initialize orchestration controller
const orchestrationController = new OrchestrationController();

// ========== Authentication & User Management Endpoints ==========

// Auth endpoints
app.post('/api/auth/signup', (req, res) => authController.signup(req, res));
app.post('/api/auth/send-otp', (req, res) => authController.sendOTPBeforeSignup(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));
app.get('/api/auth/verify-email', (req, res) => authController.verifyEmail(req, res)); // Email link
app.post('/api/auth/verify-email', (req, res) => authController.verifyEmail(req, res)); // API call
app.post('/api/auth/verify-mobile', (req, res) => authController.verifyMobile(req, res));
app.post('/api/auth/resend-otp', (req, res) => authController.resendOTP(req, res));
app.post('/api/auth/logout', (req, res) => authController.logout(req, res));
app.get('/api/auth/me', (req, res) => authController.getCurrentUser(req, res));

// User profile endpoints
app.get('/api/users/profile', (req, res) => userController.getProfile(req, res));
app.patch('/api/users/profile', (req, res) => userController.updateProfile(req, res));

// Payment method endpoints
app.post('/api/payment-methods', (req, res) => paymentMethodController.addPaymentMethod(req, res));
app.get('/api/payment-methods', (req, res) => paymentMethodController.getPaymentMethods(req, res));
app.get('/api/payment-methods/:id', (req, res) => paymentMethodController.getPaymentMethodById(req, res));
app.post('/api/payment-methods/:id/verify', (req, res) => paymentMethodController.verifyPaymentMethod(req, res));
app.post('/api/payment-methods/:id/resend-otp', (req, res) => paymentMethodController.resendOTP(req, res));
app.patch('/api/payment-methods/:id/set-default', (req, res) => paymentMethodController.setDefault(req, res));
app.delete('/api/payment-methods/:id', (req, res) => paymentMethodController.removePaymentMethod(req, res));

// Removed: /api/payments/charge - now using /halo/agentic-checkout for protocol-compliant payments

// Crypto wallet endpoints
app.post('/api/crypto-wallets', (req, res) => cryptoWalletController.addCryptoWallet(req, res));
app.get('/api/crypto-wallets', (req, res) => cryptoWalletController.getCryptoWallets(req, res));
app.patch('/api/crypto-wallets/:id/set-default', (req, res) => cryptoWalletController.setDefaultWallet(req, res));
app.delete('/api/crypto-wallets/:id', (req, res) => cryptoWalletController.removeWallet(req, res));

// ========== MERCHANT API ENDPOINTS (Simulates separate merchant server) ==========
// In production, these would be at https://merchant.com/...
// For MVP, we simulate merchant responses following protocol schemas

app.get('/merchant/catalog', merchantApiController.getCatalog);
app.post('/merchant/cart', merchantApiController.updateCart);
app.get('/merchant/cart/:id', merchantApiController.getCart);
app.post('/merchant/checkout', merchantApiController.createCheckout);
app.post('/merchant/payment', merchantApiController.processPayment);

// ========== Universal Orchestration Endpoints (NEW) ==========

// POST /halo/orchestrate - Auto-detect agent protocol and translate to merchant protocol
app.post('/halo/orchestrate', orchestrationController.orchestrate);

// POST /halo/orchestrate/:agentProtocol/:merchantProtocol - Explicit protocol specification
app.post('/halo/orchestrate/:agentProtocol/:merchantProtocol', orchestrationController.orchestrateExplicit);

// GET /halo/protocols - List all supported protocols
app.get('/halo/protocols', orchestrationController.listProtocols);

// POST /halo/detect - Detect protocol from request
app.post('/halo/detect', orchestrationController.detectProtocol);

// POST /halo/process-natural-language - Process natural language from chat UI
app.post('/halo/process-natural-language', orchestrationController.processNaturalLanguage);

// POST /halo/agentic-checkout - TRUE AGENTIC: Agent pays on behalf of user
// This is the core value prop - no checkout links, agent executes payment!
app.post('/halo/agentic-checkout', orchestrationController.agenticCheckout);

// ========== Legacy Endpoints (Backward Compatibility) ==========

// POST endpoint for processing ACP payloads (structured JSON)
app.post('/halo/process-acp', validateACP, (req, res) => {
    paymentController.processACP(req, res);
});

// POST endpoint for processing agentic payments (natural language prompts)
app.post('/halo/process-payment', (req, res) => {
    processAgenticPayment(req, res);
});

// POST endpoint for complete payment flow with card details (ACP Schema 3)
app.post('/halo/complete-payment', (req, res) => {
    processCompletePayment(req, res);
});

// ========== Protocol-Compliant Endpoints (Full Implementation) ==========
// These implement the complete ACP, UCP, x402 specifications
app.use('/api', protocolController);

// ========== Stripe Checkout Callback Routes ==========

// Payment success page
app.get('/payment-success', (req, res) => {
    const { session_id, halo_session } = req.query;
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Successful - Halo</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                       display: flex; justify-content: center; align-items: center; height: 100vh; 
                       background: linear-gradient(135deg, #10b981 0%, #059669 100%); margin: 0; }
                .card { background: white; padding: 3rem; border-radius: 16px; text-align: center; 
                        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-width: 500px; }
                h1 { color: #10b981; margin-bottom: 1rem; }
                p { color: #6b7280; margin: 0.5rem 0; }
                code { background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
                .icon { font-size: 4rem; margin-bottom: 1rem; }
                a { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; 
                    background: #10b981; color: white; text-decoration: none; border-radius: 8px; }
                a:hover { background: #059669; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">✅</div>
                <h1>Payment Successful!</h1>
                <p>Your payment has been processed by <strong>Halo</strong>.</p>
                <p>Stripe Session: <code>${session_id || 'N/A'}</code></p>
                <p>Halo Session: <code>${halo_session || 'N/A'}</code></p>
                <a href="/">← Back to Halo</a>
            </div>
        </body>
        </html>
    `);
});

// Payment cancelled page
app.get('/payment-cancelled', (req, res) => {
    const { halo_session } = req.query;
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Cancelled - Halo</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                       display: flex; justify-content: center; align-items: center; height: 100vh; 
                       background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); margin: 0; }
                .card { background: white; padding: 3rem; border-radius: 16px; text-align: center; 
                        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-width: 500px; }
                h1 { color: #f59e0b; margin-bottom: 1rem; }
                p { color: #6b7280; margin: 0.5rem 0; }
                code { background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
                .icon { font-size: 4rem; margin-bottom: 1rem; }
                a { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; 
                    background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; }
                a:hover { background: #d97706; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">⚠️</div>
                <h1>Payment Cancelled</h1>
                <p>You cancelled the payment.</p>
                <p>Halo Session: <code>${halo_session || 'N/A'}</code></p>
                <a href="/">← Try Again</a>
            </div>
        </body>
        </html>
    `);
});

// Root route - serve chat UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/api/auth/google', (req, res) => oauthController.googleSignIn(req, res));

export default app;