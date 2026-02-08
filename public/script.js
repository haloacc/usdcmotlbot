/**
 * Halo - Agentic Commerce Orchestrator
 * Frontend JavaScript
 */

// ===== DOM Elements =====
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatHistory = document.getElementById('chat-history');
const debugLog = document.getElementById('debug-log');
const clearDebugBtn = document.getElementById('clear-debug');
const merchantProtocolSelect = document.getElementById('merchant-protocol');
const agenticModeCheckbox = document.getElementById('agentic-mode');

// Modals
const verificationModal = document.getElementById('verification-modal');
const blockModal = document.getElementById('block-modal');
const processingOverlay = document.getElementById('processing-overlay');

// State
let pendingTransaction = null;
let selectedVerificationMethod = null;
let conversationState = null; // Track conversation flow

// ===== Utilities =====
function getCurrencySymbol(currency) {
    const symbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥' };
    return symbols[currency?.toUpperCase()] || '$';
}

function formatAmount(cents, currency = 'USD') {
    return `${getCurrencySymbol(currency)}${(cents / 100).toFixed(2)}`;
}

function clearWelcomeMessage() {
    const welcome = chatHistory.querySelector('.welcome-message');
    if (welcome) welcome.remove();
}

// Quick buy function for product cards
function quickBuy(productName, price) {
    const prompt = `Buy a ${productName} for ${price} dollars`;
    userInput.value = prompt;
    chatForm.dispatchEvent(new Event('submit'));
}

// Show sample confirmation (for demo)
function showSampleConfirmation() {
    clearWelcomeMessage();
    const sampleOrder = {
        orderNumber: 'ORD-12345678',
        items: [
            { name: 'Gaming Laptop', quantity: 1, price: 1500, emoji: '💻' },
            { name: 'Wireless Headphones', quantity: 2, price: 299, emoji: '🎧' }
        ],
        subtotal: 2098,
        shipping: 25,
        tax: 167.84,
        total: 2290.84,
        sessionId: 'cs_test_sample123',
        haloSession: 'halo_sample456'
    };
    displayOrderConfirmation(sampleOrder);
}

// ===== Event Listeners =====

// Check authentication before loading chat
window.addEventListener('load', async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('halo_token');
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
        return;
    }
    
    const pendingCheckout = localStorage.getItem('pending_checkout');
    if (pendingCheckout) {
        try {
            const checkout = JSON.parse(pendingCheckout);
            // Check if checkout was completed recently (within 5 minutes)
            if (Date.now() - checkout.timestamp < 5 * 60 * 1000) {
                // Simulate order data from localStorage cart
                const cart = JSON.parse(localStorage.getItem('halo_cart_backup') || '[]');
                if (cart.length > 0) {
                    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const shipping = 25;
                    const tax = subtotal * 0.08;
                    const total = subtotal + shipping + tax;

                    const orderData = {
                        orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
                        items: cart,
                        subtotal: subtotal,
                        shipping: shipping,
                        tax: tax,
                        total: total,
                        sessionId: checkout.sessionId,
                        haloSession: checkout.sessionId
                    };

                    clearWelcomeMessage();
                    displayOrderConfirmation(orderData);
                    
                    // Clear backup
                    localStorage.removeItem('halo_cart_backup');
                }
            }
            // Clear pending checkout
            localStorage.removeItem('pending_checkout');
        } catch (err) {
            console.error('Error checking pending checkout:', err);
        }
    }
});

// Example prompts
document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        userInput.value = btn.dataset.prompt;
        userInput.focus();
    });
});

// Clear debug log
clearDebugBtn?.addEventListener('click', () => {
    debugLog.innerHTML = `
        <div class="debug-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
            </svg>
            <p>Protocol traces will appear here</p>
        </div>
    `;
});

// Helper function to select a verification method (used by dynamically created buttons)
function selectVerification(method, btn) {
    document.querySelectorAll('.verify-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedVerificationMethod = method;
}

// Verification modal buttons (static for initial page load)
document.getElementById('verify-3ds')?.addEventListener('click', function() {
    document.querySelectorAll('.verify-btn').forEach(b => b.classList.remove('selected'));
    this.classList.add('selected');
    selectedVerificationMethod = '3ds';
});

document.getElementById('verify-biometric')?.addEventListener('click', function() {
    document.querySelectorAll('.verify-btn').forEach(b => b.classList.remove('selected'));
    this.classList.add('selected');
    selectedVerificationMethod = 'biometric';
});

document.getElementById('cancel-verification')?.addEventListener('click', () => {
    hideModal(verificationModal);
    pendingTransaction = null;
    addMessage('bot', createCancelledCard());
});

document.getElementById('confirm-verification')?.addEventListener('click', async () => {
    if (!selectedVerificationMethod) {
        alert('Please select a verification method');
        return;
    }
    
    hideModal(verificationModal);
    await processVerifiedTransaction();
});

document.getElementById('close-block-modal')?.addEventListener('click', () => {
    hideModal(blockModal);
});

document.getElementById('appeal-block')?.addEventListener('click', () => {
    hideModal(blockModal);
    addMessage('bot', '📝 Your appeal has been submitted. Our team will review it within 24 hours.');
});

// ===== Main Form Submit =====
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    console.log('✉️ submit text:', text, 'conversationState:', conversationState?.type);

    clearWelcomeMessage();
    addMessage('user', text);
    userInput.value = '';

    // Handle conversation flow responses
    if (conversationState) {
        await handleConversationResponse(text);
        return;
    }

    try {
        // Parse intent locally for display
        const intent = parseNaturalLanguageToUCP(text);
        
        if (!intent) {
            addMessage('bot', createErrorCard(
                'Could not understand request',
                "Try something like: 'Buy a keyboard for 50 dollars'"
            ));
            return;
        }

        // Check if quantity is specified
        const quantityMatch = text.match(/(\d+)\s*(?:x|units?|pieces?|items?|quantities?)/i);
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;

        // If no quantity specified, ask for it
        if (!quantity) {
            conversationState = {
                type: 'awaiting_quantity',
                intent: intent,
                originalText: text
            };
            addMessage('bot', createQuantityPrompt(intent.intent.params.item));
            return;
        }

        // Add quantity to intent
        intent.intent.params.quantity = quantity;

        // Ask for confirmation before processing
        conversationState = {
            type: 'awaiting_confirmation',
            intent: intent,
            quantity: quantity
        };
        addMessage('bot', createConfirmationCard(intent, quantity));

    } catch (error) {
        console.error(error);
        logDebug('error', 'Error', error.message);
        addMessage('bot', createErrorCard('Connection Error', error.message));
    }
});

// Handle conversation flow responses
async function handleConversationResponse(text) {
    console.log('🧭 handleConversationResponse called with state:', conversationState?.type, 'text:', text);
    if (conversationState.type === 'awaiting_quantity') {
        const quantity = parseInt(text);
        
        if (isNaN(quantity) || quantity < 1 || quantity > 99) {
            addMessage('bot', '❌ Please enter a valid quantity (1-99)');
            return;
        }

        conversationState.intent.intent.params.quantity = quantity;
        conversationState.type = 'awaiting_confirmation';
        conversationState.quantity = quantity;
        
        addMessage('bot', createConfirmationCard(conversationState.intent, quantity));
        
    } else if (conversationState.type === 'awaiting_confirmation') {
        const response = text.toLowerCase().trim();
        
        if (response === 'yes' || response === 'y' || response === 'confirm' || response === '✓') {
            // Instead of processing immediately, ask for payment method
            await askForPaymentMethod(conversationState.intent, conversationState.quantity);
        } else if (response === 'no' || response === 'n' || response === 'cancel') {
            addMessage('bot', '🚫 Order cancelled. What else can I help you with?');
            conversationState = null;
        } else {
            addMessage('bot', '❓ Please type "yes" to confirm or "no" to cancel.');
        }
    } else if (conversationState.type === 'awaiting_payment_method') {
        console.log('[awaiting_payment_method] raw text:', text);
        console.log('[awaiting_payment_method] stored methods:', conversationState.paymentMethods);

        const methods = Array.isArray(conversationState.paymentMethods) ? conversationState.paymentMethods : [];
        if (methods.length === 0) {
            console.warn('[awaiting_payment_method] No payment methods in state');
            addMessage('bot', '❌ No payment methods available. Please add one in your dashboard.');
            conversationState = null;
            return;
        }

        if (text.toLowerCase() === 'new') {
            addMessage('bot', '➕ Please go to your <a href="/dashboard.html" target="_blank">Dashboard</a> to add a new payment method, then come back here.');
            conversationState = null;
            return;
        }

        const selection = parseInt(text, 10);
        console.log('[awaiting_payment_method] parsed selection:', selection);

        if (Number.isNaN(selection) || selection < 1) {
            addMessage('bot', '❌ Please enter a valid payment method number or type "new" to add a new card.');
            return;
        }

        if (selection <= methods.length) {
            const selectedPM = methods[selection - 1];
            console.log('[awaiting_payment_method] Selected payment method:', selectedPM);
            addMessage('bot', '🔄 Processing payment with your card...');
            await processPaymentWithSavedMethod(conversationState.intent, conversationState.quantity, selectedPM);
            conversationState = null;
        } else {
            addMessage('bot', '❌ Invalid selection. Please choose a valid payment method number.');
        }
    }
}

// Ask user to select payment method
async function askForPaymentMethod(intent, quantity) {
    try {
        const token = localStorage.getItem('halo_token');
        console.log('🔑 Token exists:', !!token);
        
        if (!token) {
            addMessage('bot', '🔐 Please <a href="/login.html">login</a> to use saved payment methods.');
            conversationState = null;
            return;
        }

        // Fetch saved payment methods
        console.log('📤 Fetching payment methods from /api/payment-methods');
        const response = await fetch('http://localhost:3000/api/payment-methods', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📥 Payment methods response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ Failed to fetch payment methods:', errorData);
            throw new Error(errorData.error || 'Failed to fetch payment methods');
        }

        const data = await response.json();
        console.log('📥 Payment methods data:', data);
        const paymentMethods = data.payment_methods || [];
        console.log('💳 Number of payment methods:', paymentMethods.length);

        if (paymentMethods.length === 0) {
            // No saved payment methods - BLOCK and ask user to add one
            addMessage('bot', `
                <div class="bubble">
                    <div style="margin-bottom: 12px;">
                        <strong>❌ No Payment Methods Found</strong>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">
                        To use agentic checkout, you need to add a payment method first. I can't execute payments without stored credentials.
                    </div>
                    <a href="/dashboard.html" class="btn btn-primary" style="display: inline-block; text-decoration: none; text-align: center;">
                        ➕ Add Payment Method
                    </a>
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 12px;">
                        After adding a card, come back here and I'll handle the payment for you.
                    </div>
                </div>
            `);
            conversationState = null;
            return;
        }

        conversationState = {
            type: 'awaiting_payment_method',
            intent: intent,
            quantity: quantity,
            paymentMethods: paymentMethods
        };
        console.log('📌 Set state -> awaiting_payment_method with', paymentMethods.length, 'methods');

        const methodsHtml = paymentMethods.map((pm, index) => `
            <button class="payment-method-option" onclick="selectPaymentMethod(${index + 1})">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px;">${getCardIcon(pm.card_brand)}</div>
                    <div style="flex: 1; text-align: left;">
                        <div style="font-weight: 600; color: var(--text-primary);">${pm.card_brand.toUpperCase()} ••••${pm.card_last4}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Expires ${pm.card_exp_month}/${pm.card_exp_year}</div>
                    </div>
                    ${pm.is_default ? '<span style="background: var(--success); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">DEFAULT</span>' : ''}
                </div>
            </button>
        `).join('');

        addMessage('bot', `
            <div class="bubble">
                <div style="margin-bottom: 12px;">
                    <strong>💳 Select Payment Method</strong>
                </div>
                <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
                    I'll use this card to complete the purchase on your behalf
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                    ${methodsHtml}
                    <button class="payment-method-option" onclick="selectPaymentMethod('new')" style="border: 2px dashed var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 24px;">➕</div>
                            <div style="flex: 1; text-align: left;">
                                <div style="font-weight: 600; color: var(--text-primary);">Add New Card</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Go to dashboard to add</div>
                            </div>
                        </div>
                    </button>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); text-align: center;">
                    Click a card or type the number (e.g., "1")
                </div>
            </div>
        `);

    } catch (error) {
        console.error('❌ Error fetching payment methods:', error);
        
        // Check if it's an authentication error
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            addMessage('bot', '🔐 Session expired. Please <a href="/login.html" style="color: var(--primary); text-decoration: underline;">login again</a>.');
            conversationState = null;
            return;
        }
        
        addMessage('bot', `
            <div class="bubble">
                <div style="margin-bottom: 12px;">
                    <strong>❌ Failed to Load Payment Methods</strong>
                </div>
                <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">
                    ${error.message}
                </div>
                <div style="margin-top: 16px;">
                    <a href="/dashboard.html" style="display: inline-block; padding: 8px 16px; background: var(--primary); color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">
                        ➕ Go to Dashboard
                    </a>
                </div>
            </div>
        `);
        conversationState = null;
    }
}

// Helper to select payment method
function selectPaymentMethod(choice) {
    console.log('🟢 selectPaymentMethod called with choice:', choice, 'state:', conversationState?.type);
    userInput.value = choice.toString();
    chatForm.dispatchEvent(new Event('submit'));
}

// Get card icon based on brand
function getCardIcon(brand) {
    const icons = {
        'visa': '💳',
        'mastercard': '💳',
        'amex': '💳',
        'discover': '💳',
        'diners': '💳',
        'jcb': '💳',
        'unionpay': '💳'
    };
    return icons[brand?.toLowerCase()] || '💳';
}

// Process payment with saved method via AGENTIC PROTOCOL FLOW
// Uses full protocol orchestration: UCP → ACP → Stripe
async function processPaymentWithSavedMethod(intent, quantity, paymentMethod) {
    console.log('🚀 Starting payment processing...');
    console.log('Intent:', intent);
    console.log('Quantity:', quantity);
    console.log('Payment Method:', paymentMethod);
    
    try {
        addMessage('bot', createProcessingMessage(intent, quantity));

        const params = intent.intent.params;
        console.log('Params:', params);
        
        const itemTotal = params.amount * quantity;
        const shipping = params.shipping_speed === 'express' ? 25 : 10;
        const tax = itemTotal * 0.08;
        const total = itemTotal + shipping + tax;
        console.log('🧾 Price breakdown:', { itemTotal, shipping, tax, total });

        const token = localStorage.getItem('halo_token');
        
        showProcessing('Processing via Halo Protocol (UCP → ACP)...');

        const totalAmount = params.amount * quantity;
        const requestBody = {
            // Include verb + amount so promptParser extracts correct price and quantity
            prompt: `Buy ${quantity} ${params.item} for ${totalAmount} dollars with ${params.shipping_speed} shipping`,
            merchantProtocol: 'acp',
            delegatedPayment: {
                stripe_payment_method_id: paymentMethod.stripe_payment_method_id,
                card_brand: paymentMethod.card_brand,
                card_last4: paymentMethod.card_last4,
                card_exp_month: paymentMethod.card_exp_month,
                card_exp_year: paymentMethod.card_exp_year
            }
            // NOTE: Do NOT include verified:true on first call - let backend evaluate risk first
        };
        
        console.log('📤 Sending request to /halo/agentic-checkout:', requestBody);
        
        // Log to debug panel
        logDebug('out', 'POST /halo/agentic-checkout', requestBody);

        // Use AGENTIC CHECKOUT - full protocol orchestration
        const response = await fetch('http://localhost:3000/halo/agentic-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        // Log response to debug panel
        logDebug('in', 'Agentic Checkout Response', data);
        
        hideProcessing();

        // Remove processing message
        const lastBot = chatHistory.querySelector('.message.bot:last-child');
        if (lastBot?.querySelector('.processing-card')) lastBot.remove();

        // Log protocol translation to debug panel
        if (data.agentProtocol && data.merchantProtocol) {
            logDebug('trace', 'Protocol Translation', {
                agent: data.agentProtocol.toUpperCase(),
                merchant: data.merchantProtocol.toUpperCase()
            });
        }

        // Log risk evaluation to debug panel
        if (data.risk_evaluation) {
            logDebug('trace', 'Halo Risk Evaluation', {
                score: data.risk_evaluation.score,
                decision: data.risk_evaluation.decision,
                factors: data.risk_evaluation.factors
            });
        }

        // Handle verification requirements (3DS, step-up auth, etc.)
        if (data.requires_verification) {
            console.log('⚠️ Verification required, showing modal');
            // Store transaction context for verification flow
            pendingTransaction = {
                prompt: requestBody.prompt,
                merchantProtocol: requestBody.merchantProtocol,
                delegatedPayment: requestBody.delegatedPayment,
                intent: intent,
                quantity: quantity,
                paymentMethod: paymentMethod
            };
            showVerificationModal(data);
            return;
        }

        if (!response.ok || !data.success) {
            logDebug('error', 'Payment Failed', data.error || 'Unknown error');
            addMessage('bot', createErrorCard('Payment Failed', data.error || 'An error occurred while processing your payment.'));
            return;
        }

        // Log payment completion
        logDebug('trace', 'Payment Completed', {
            order_number: data.order_number,
            amount: data.payment?.amount_cents,
            currency: data.payment?.currency
        });

        // Payment completed successfully
        if (data.payment_completed) {
            // Log protocol trace and risk evaluation
            console.log('📊 Protocol Trace:', {
                agent: data.agentProtocol,
                merchant: data.merchantProtocol,
                risk_score: data.risk_evaluation?.score,
                risk_decision: data.risk_evaluation?.decision,
                capability_match: data.capability_negotiation?.compatible
            });

            // Display risk evaluation if present
            if (data.risk_evaluation) {
                const riskEmoji = data.risk_evaluation.score < 30 ? '🟢' : data.risk_evaluation.score < 60 ? '🟡' : '🔴';
                addMessage('bot', `
                    <div class="bubble" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-bottom: 8px;">
                        <div style="font-weight: 600; margin-bottom: 8px;">🛡️ Halo Risk Evaluation</div>
                        <div style="display: grid; gap: 6px; font-size: 13px;">
                            <div>${riskEmoji} Risk Score: ${data.risk_evaluation.score}/100</div>
                            <div>✓ Decision: ${data.risk_evaluation.decision.toUpperCase()}</div>
                            <div>🔄 Protocol: ${data.agentProtocol?.toUpperCase()} → ${data.merchantProtocol?.toUpperCase()}</div>
                            <div>🤝 Capabilities: ${data.capability_negotiation?.compatible ? 'MATCHED' : 'INCOMPATIBLE'}</div>
                        </div>
                    </div>
                `);
            }

            const orderData = {
                orderNumber: data.order_number || `ORD-${Date.now().toString().slice(-8)}`,
                items: [{
                    name: params.item,
                    quantity: quantity,
                    price: params.amount,
                    emoji: '📦'
                }],
                subtotal: itemTotal,
                shipping: shipping,
                tax: tax,
                total: total,
                sessionId: data.stripe_session_id || 'N/A',
                haloSession: data.halo_session_id || 'N/A',
                protocolUsed: `${data.agentProtocol || 'UCP'} → ${data.merchantProtocol || 'ACP'}`
            };

            displayOrderConfirmation(orderData);

            // Send confirmation email via protocol-aware service
            await fetch('http://localhost:3000/api/orders/send-confirmation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            }).catch(err => console.log('Email send failed:', err));
        }

    } catch (error) {
        console.error('Payment error:', error);
        hideProcessing();
        addMessage('bot', createErrorCard('Payment Error', error.message || 'Failed to process payment'));
    }
}

// Process confirmed order
async function processConfirmedOrder(intent, quantity) {
    try {
        logDebug('out', 'UCP Intent', intent);
        addMessage('bot', createProcessingMessage(intent, quantity));

        const merchantProtocol = merchantProtocolSelect.value;
        const agenticMode = agenticModeCheckbox.checked;
        const endpoint = agenticMode ? '/halo/agentic-checkout' : '/halo/process-natural-language';

        const prompt = `Buy ${quantity}x ${intent.intent.params.item} for ${intent.intent.params.amount} dollars${intent.intent.params.shipping_speed === 'express' ? ' with express shipping' : ''}`;

        logDebug('out', `POST ${endpoint}`, { prompt, merchantProtocol, agenticMode });
        showProcessing('Orchestrating checkout...');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, merchantProtocol })
        });

        const data = await response.json();
        logDebug('in', 'Response', data);
        hideProcessing();

        // Remove processing message
        const lastBot = chatHistory.querySelector('.message.bot:last-child');
        if (lastBot?.querySelector('.processing-card')) lastBot.remove();

        if (!data.success) {
            handleErrorResponse(data);
            return;
        }

        // Log protocol translation
        logDebug('trace', 'Protocol Translation', {
            agent: data.agentProtocol?.toUpperCase(),
            merchant: data.merchantProtocol?.toUpperCase()
        });

        // Check if verification is required
        if (data.requires_verification) {
            showVerificationModal(data);
            return;
        }

        // Handle based on risk decision (for already-processed transactions)
        const riskDecision = data.risk_evaluation?.decision || 'approve';

        if (riskDecision === 'block') {
            showBlockModal(data);
        } else {
            // Approved - show success
            if (data.mode === 'agentic' && data.payment?.status === 'completed') {
                displayAgenticSuccess(data);
            } else {
                displayCheckoutReady(data);
            }
        }

    } catch (error) {
        console.error(error);
        hideProcessing();
        logDebug('error', 'Error', error.message);
        addMessage('bot', createErrorCard('Connection Error', error.message));
    }
}

// Create quantity prompt
function createQuantityPrompt(itemName) {
    return `
        <div class="bubble">
            <div style="margin-bottom: 12px;">
                <strong>📦 How many ${escapeHtml(itemName)} would you like?</strong>
            </div>
            <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
                Please enter a quantity (1-99)
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="quantity-quick-btn" onclick="selectQuantity(1)">1</button>
                <button class="quantity-quick-btn" onclick="selectQuantity(2)">2</button>
                <button class="quantity-quick-btn" onclick="selectQuantity(3)">3</button>
                <button class="quantity-quick-btn" onclick="selectQuantity(5)">5</button>
                <button class="quantity-quick-btn" onclick="selectQuantity(10)">10</button>
            </div>
        </div>
    `;
}

// Select quantity helper
function selectQuantity(qty) {
    userInput.value = qty.toString();
    chatForm.dispatchEvent(new Event('submit'));
}

// Create confirmation card
function createConfirmationCard(intent, quantity) {
    const params = intent.intent.params;
    const itemTotal = params.amount * quantity;
    const shipping = params.shipping_speed === 'express' ? 25 : 10;
    const tax = itemTotal * 0.08;
    const total = itemTotal + shipping + tax;

    return `
        <div class="bubble">
            <div class="checkout-card" style="border-color: var(--accent-primary);">
                <div class="checkout-header" style="background: rgba(99, 102, 241, 0.1);">
                    <span>🛒 Order Summary</span>
                </div>
                <div class="checkout-details">
                    <div class="detail-row">
                        <span>Product:</span>
                        <strong>${escapeHtml(params.item)}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Quantity:</span>
                        <strong>${quantity}x</strong>
                    </div>
                    <div class="detail-row">
                        <span>Unit Price:</span>
                        <strong>${formatAmount(params.amount * 100, params.currency)}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Subtotal:</span>
                        <strong>${formatAmount(itemTotal * 100, params.currency)}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Shipping (${params.shipping_speed}):</span>
                        <strong>${formatAmount(shipping * 100, params.currency)}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Tax (8%):</span>
                        <strong>${formatAmount(tax * 100, params.currency)}</strong>
                    </div>
                    <hr style="border: none; border-top: 1px solid var(--border-color); margin: 12px 0;">
                    <div class="detail-row" style="font-size: 16px; font-weight: 700;">
                        <span>Total:</span>
                        <span style="color: var(--accent-primary);">${formatAmount(total * 100, params.currency)}</span>
                    </div>
                </div>
            </div>
            <div style="margin-top: 16px; padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <div style="font-weight: 600; margin-bottom: 8px;">✅ Ready to checkout?</div>
                <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">
                    Type <strong style="color: var(--accent-primary);">yes</strong> to confirm or <strong style="color: var(--error);">no</strong> to cancel
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="confirm-quick-btn yes" onclick="confirmOrder('yes')">✓ Yes, checkout</button>
                    <button class="confirm-quick-btn no" onclick="confirmOrder('no')">✗ No, cancel</button>
                </div>
            </div>
        </div>
    `;
}

// Confirm order helper
function confirmOrder(response) {
    userInput.value = response;
    chatForm.dispatchEvent(new Event('submit'));
}


// ===== Intent Parser =====
function parseNaturalLanguageToUCP(text) {
    const actionRegex = /(?:buy|get|purchase|order)\s+(?:a|an\s+)?/i;
    if (!actionRegex.test(text)) return null;

    let item = "Item";
    let amount = 100;
    let currency = "USD";

    // Extract amount and currency
    const usdMatch = text.match(/for\s+(\d+(?:\.\d+)?)\s*(?:dollars?|bucks?|usd)/i);
    const inrMatch = text.match(/for\s+(\d+(?:\.\d+)?)\s*(?:rupees?|inr|₹)/i);
    const eurMatch = text.match(/for\s+(\d+(?:\.\d+)?)\s*(?:euros?|eur|€)/i);
    const gbpMatch = text.match(/for\s+(\d+(?:\.\d+)?)\s*(?:pounds?|gbp|£)/i);
    const jpyMatch = text.match(/for\s+(\d+(?:\.\d+)?)\s*(?:yen|jpy|¥)/i);

    if (usdMatch) { amount = parseFloat(usdMatch[1]); currency = 'USD'; }
    else if (inrMatch) { amount = parseFloat(inrMatch[1]); currency = 'INR'; }
    else if (eurMatch) { amount = parseFloat(eurMatch[1]); currency = 'EUR'; }
    else if (gbpMatch) { amount = parseFloat(gbpMatch[1]); currency = 'GBP'; }
    else if (jpyMatch) { amount = parseFloat(jpyMatch[1]); currency = 'JPY'; }

    // Extract shipping
    const hasExpress = /express|overnight|rush|fast/i.test(text);

    // Extract item
    const cleanText = text
        .replace(actionRegex, '')
        .replace(/for\s+[\d.]+\s*\w+/gi, '')
        .replace(/from\s+.+?(?:\s+|$)/gi, '')
        .replace(/with\s+express\s+shipping/gi, '')
        .trim();
    
    if (cleanText) item = cleanText;

    return {
        protocol: 'UCP',
        intent: {
            action: 'buy',
            params: {
                item: item,
                amount: amount,
                currency: currency,
                shipping_speed: hasExpress ? 'express' : 'standard'
            }
        }
    };
}

// ===== Message Display =====
function addMessage(type, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    
    if (type === 'user') {
        msgDiv.innerHTML = `<div class="bubble">${escapeHtml(content)}</div>`;
    } else {
        msgDiv.innerHTML = typeof content === 'string' ? content : content;
    }
    
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createProcessingMessage(intent, quantity = 1) {
    return `
        <div class="bubble processing-card">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="processing-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
                <span>Processing: ${quantity}x ${escapeHtml(intent.intent.params.item)} for ${formatAmount(intent.intent.params.amount * 100, intent.intent.params.currency)} each</span>
            </div>
        </div>
    `;
}

function createErrorCard(title, message) {
    return `
        <div class="bubble">
            <div class="checkout-card" style="border-color: var(--error);">
                <div class="checkout-header" style="background: rgba(239, 68, 68, 0.1);">
                    <span>❌ ${escapeHtml(title)}</span>
                </div>
                <div class="checkout-details">
                    <p style="color: var(--text-secondary);">${escapeHtml(message)}</p>
                </div>
            </div>
        </div>
    `;
}

function createWarningCard(title, message, methods = []) {
    return `
        <div class="bubble">
            <div class="checkout-card" style="border-color: #f59e0b;">
                <div class="checkout-header" style="background: rgba(245, 158, 11, 0.1);">
                    <span>⚠️ ${escapeHtml(title)}</span>
                </div>
                <div class="checkout-details">
                    <p style="color: var(--text-secondary);">${escapeHtml(message)}</p>
                    ${methods.length > 0 ? `
                        <div style="margin-top: 12px;">
                            <strong>Available methods:</strong>
                            <ul style="margin: 8px 0; padding-left: 20px; color: var(--text-secondary);">
                                ${methods.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function createCancelledCard() {
    return `
        <div class="bubble">
            <div class="checkout-card">
                <div class="checkout-header">
                    <span>🚫 Transaction Cancelled</span>
                </div>
                <div class="checkout-details">
                    <p style="color: var(--text-secondary);">You cancelled the verification. No payment was made.</p>
                </div>
            </div>
        </div>
    `;
}

// ===== Success Displays =====
function displayAgenticSuccess(data) {
    const { payment, risk_evaluation, capability_negotiation, parsed } = data;
    const amount = formatAmount(payment.amount_cents, payment.currency);

    const html = `
        <div class="bubble">
            <div class="checkout-card">
                <div class="checkout-header">
                    <span>🤖 Halo Agentic Payment</span>
                    <div class="header-actions">
                        <span class="status-badge paid">PAID</span>
                        <button class="card-close-btn" onclick="dismissCard(this)" title="Dismiss">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="checkout-details">
                    <div class="detail-row highlight">
                        <span>Mode</span>
                        <strong style="color: var(--success);">✨ Agentic (Agent paid for you!)</strong>
                    </div>
                    <div class="detail-row">
                        <span>Item</span>
                        <strong>${escapeHtml(parsed.item_name)}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Amount</span>
                        <strong style="color: var(--success);">${amount}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Payment Method</span>
                        <strong>${payment.card_brand?.toUpperCase()} ****${payment.card_last4}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Transaction ID</span>
                        <code style="font-size: 11px; background: var(--bg-primary); padding: 4px 8px; border-radius: 4px;">${payment.transaction_id}</code>
                    </div>
                    <div class="detail-row">
                        <span>Risk Score</span>
                        <strong>${getRiskBadge(risk_evaluation?.score || 0)} ${risk_evaluation?.score || 0}/100</strong>
                    </div>
                    <div class="detail-row">
                        <span>Protocol</span>
                        <div class="protocol-flow">
                            <span class="protocol-tag">${data.agentProtocol?.toUpperCase()}</span>
                            <span class="protocol-arrow">→</span>
                            <span class="protocol-tag">${data.merchantProtocol?.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="payment-complete-banner">
                        ✅ Payment Complete! No further action needed.
                    </div>
                </div>
            </div>
        </div>
    `;
    addMessage('bot', html);
}

function displayCheckoutReady(data) {
    const session = data.canonical || data.checkout_session;
    const amount = formatAmount(session.amount_total, session.currency);

    const html = `
        <div class="bubble">
            <div class="checkout-card">
                <div class="checkout-header">
                    <span>🛒 Checkout Ready</span>
                    <div class="header-actions">
                        <span class="status-badge ready">READY</span>
                        <button class="card-close-btn" onclick="dismissCard(this)" title="Dismiss">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="checkout-details">
                    <div class="detail-row">
                        <span>Amount</span>
                        <strong>${amount}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Risk Score</span>
                        <strong>${getRiskBadge(session.halo_risk?.score || 0)} ${session.halo_risk?.score || 0}/100</strong>
                    </div>
                    <div class="detail-row">
                        <span>Protocol</span>
                        <div class="protocol-flow">
                            <span class="protocol-tag">${data.agentProtocol?.toUpperCase()}</span>
                            <span class="protocol-arrow">→</span>
                            <span class="protocol-tag">${data.merchantProtocol?.toUpperCase()}</span>
                        </div>
                    </div>
                    ${session.url ? `
                        <div class="payment-action">
                            <a href="${session.url}" target="_blank" class="checkout-btn" onclick="trackCheckoutClick('${session.id}', '${session.url}')">
                                Complete Payment →
                            </a>
                            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; text-align: center;">
                                💡 You'll receive a confirmation in chat after payment
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    addMessage('bot', html);
}

// Track when user clicks checkout (to show confirmation when they return)
function trackCheckoutClick(sessionId, url) {
    localStorage.setItem('pending_checkout', JSON.stringify({
        sessionId: sessionId,
        timestamp: Date.now()
    }));
    window.open(url, '_blank');
}

// Display order confirmation card in chat
function displayOrderConfirmation(orderData) {
    const html = `
        <div class="bubble">
            <div class="checkout-card" style="border-color: var(--success);">
                <div class="checkout-header" style="background: rgba(16, 185, 129, 0.1);">
                    <span>✅ Order Confirmed</span>
                    <div class="header-actions">
                        <span class="status-badge" style="background: var(--success);">COMPLETED</span>
                    </div>
                </div>
                <div class="checkout-details">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
                        <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
                        <h3 style="margin: 0 0 10px 0; color: var(--text-primary);">Payment Successful!</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">Order #${orderData.orderNumber}</p>
                        ${orderData.protocolUsed ? `
                            <p style="color: var(--text-tertiary); font-size: 12px; margin-top: 8px;">
                                🔄 Protocol: ${orderData.protocolUsed}
                            </p>
                        ` : ''}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 12px;">Order Items</h4>
                        ${orderData.items.map(item => `
                            <div class="detail-row" style="margin-bottom: 8px;">
                                <span>${item.emoji || '📦'} ${item.name} x${item.quantity}</span>
                                <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                            </div>
                        `).join('')}
                    </div>

                    <div style="padding-top: 15px; border-top: 1px solid var(--border-color);">
                        <div class="detail-row" style="color: var(--text-secondary); font-size: 14px;">
                            <span>Subtotal</span>
                            <span>$${orderData.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="detail-row" style="color: var(--text-secondary); font-size: 14px;">
                            <span>Shipping</span>
                            <span>$${orderData.shipping.toFixed(2)}</span>
                        </div>
                        <div class="detail-row" style="color: var(--text-secondary); font-size: 14px;">
                            <span>Tax</span>
                            <span>$${orderData.tax.toFixed(2)}</span>
                        </div>
                        <div class="detail-row" style="font-size: 18px; font-weight: 700; margin-top: 10px; padding-top: 10px; border-top: 2px solid var(--border-color);">
                            <span>Total Paid</span>
                            <span style="color: var(--success);">$${orderData.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 8px; border: 1px solid var(--border-color);">
                        <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 12px 0;">
                            📧 A confirmation email has been sent to your inbox
                        </p>
                        <div style="display: flex; gap: 8px;">
                            <a href="/receipt.html?session_id=${orderData.sessionId}&halo_session=${orderData.haloSession}" 
                               target="_blank" 
                               class="checkout-btn" 
                               style="flex: 1; text-align: center; padding: 10px; font-size: 14px;">
                                📄 View Receipt
                            </a>
                            <a href="/products.html" 
                               class="checkout-btn" 
                               style="flex: 1; text-align: center; padding: 10px; font-size: 14px; background: var(--bg-elevated); color: var(--text-primary);">
                                🛍️ Continue Shopping
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    addMessage('bot', html);
}

// ===== Modal Functions =====
function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

function showProcessing(text = 'Processing...') {
    document.getElementById('processing-text').textContent = text;
    processingOverlay.classList.add('active');
}

function hideProcessing() {
    processingOverlay.classList.remove('active');
}

function showVerificationModal(data) {
    pendingTransaction = data;
    selectedVerificationMethod = null;
    document.querySelectorAll('.verify-btn').forEach(b => b.classList.remove('selected'));

    const riskScore = data.risk_evaluation?.score || 0;
    const factors = data.risk_evaluation?.factors || {};
    const verificationMethods = data.verification_methods || ['3ds', 'biometric'];
    const isX402 = verificationMethods.includes('wallet_signature');

    document.getElementById('modal-risk-score').textContent = riskScore;
    document.getElementById('modal-risk-score').style.color = riskScore >= 50 ? 'var(--error)' : 'var(--warning)';

    const factorsHtml = Object.entries(factors)
        .filter(([_, v]) => v)
        .map(([k]) => `<span class="risk-factor">${formatFactor(k)}</span>`)
        .join('');
    document.getElementById('modal-risk-factors').innerHTML = factorsHtml;

    // Update verification buttons based on protocol
    const verifyBtnsContainer = document.querySelector('.verification-buttons');
    if (isX402) {
        // x402 crypto verification options
        verifyBtnsContainer.innerHTML = `
            <button class="verify-btn" id="verify-wallet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                    <circle cx="18" cy="14" r="2"/>
                </svg>
                <span>Wallet Signature</span>
                <small>Sign with your wallet</small>
            </button>
            <button class="verify-btn" id="verify-multisig">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Multi-Sig</span>
                <small>Require additional signers</small>
            </button>
        `;
        // Re-attach event listeners for x402 buttons
        document.getElementById('verify-wallet')?.addEventListener('click', function() {
            selectVerification('wallet_signature', this);
        });
        document.getElementById('verify-multisig')?.addEventListener('click', function() {
            selectVerification('multi_sig', this);
        });
    } else {
        // Card protocol verification options (3DS, biometric)
        verifyBtnsContainer.innerHTML = `
            <button class="verify-btn" id="verify-3ds">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>3D Secure</span>
                <small>Bank verification</small>
            </button>
            <button class="verify-btn" id="verify-biometric">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571"/>
                    <path d="M4.458 14.543a11.952 11.952 0 0 1-.458-3.276c0-5.523 3.582-10 8-10s8 4.477 8 10c0 .956-.096 1.891-.28 2.793"/>
                    <path d="M12 11c0-2.21.895-4.21 2.343-5.657"/>
                </svg>
                <span>Biometric</span>
                <small>Face ID / Touch ID</small>
            </button>
        `;
        // Re-attach event listeners for card buttons
        document.getElementById('verify-3ds')?.addEventListener('click', function() {
            selectVerification('3ds', this);
        });
        document.getElementById('verify-biometric')?.addEventListener('click', function() {
            selectVerification('biometric', this);
        });
    }

    const parsed = data.parsed;
    const amount = formatAmount(parsed.amount_cents, parsed.currency);
    document.getElementById('modal-transaction').innerHTML = `
        <h4>Transaction Details</h4>
        <div class="transaction-line">
            <span>${escapeHtml(parsed.item_name)}</span>
            <span>${formatAmount(parsed.amount_cents, parsed.currency)}</span>
        </div>
        <div class="transaction-line">
            <span>Tax (10%)</span>
            <span>${formatAmount(parsed.amount_cents * 0.1, parsed.currency)}</span>
        </div>
        <div class="transaction-line total">
            <span>Total</span>
            <span>${formatAmount(parsed.amount_cents * 1.1, parsed.currency)}</span>
        </div>
    `;

    showModal(verificationModal);
}

function showBlockModal(data) {
    const factors = data.risk_evaluation?.factors || {};
    const score = data.risk_evaluation?.score || 0;

    const factorsHtml = Object.entries(factors)
        .filter(([_, v]) => v)
        .map(([k]) => `
            <div class="block-factor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>${formatFactor(k)}</span>
            </div>
        `).join('');

    document.getElementById('block-reason').innerHTML = `
        <h4>Risk Score: ${score}/100</h4>
        <p style="margin-bottom: 16px; color: var(--text-secondary);">
            This transaction was blocked due to the following risk factors:
        </p>
        ${factorsHtml}
    `;

    showModal(blockModal);
    addMessage('bot', createBlockedCard(data));
}

function createBlockedCard(data) {
    return `
        <div class="bubble">
            <div class="checkout-card" style="border-color: var(--error);">
                <div class="checkout-header" style="background: rgba(239, 68, 68, 0.1);">
                    <span>🚫 Transaction Blocked</span>
                    <span class="status-badge blocked">BLOCKED</span>
                </div>
                <div class="checkout-details">
                    <div class="detail-row">
                        <span>Risk Score</span>
                        <strong style="color: var(--error);">${data.risk_evaluation?.score || 0}/100</strong>
                    </div>
                    <p style="color: var(--text-secondary); margin-top: 12px;">
                        This transaction was blocked for your protection. You can appeal this decision.
                    </p>
                </div>
            </div>
        </div>
    `;
}

async function processVerifiedTransaction() {
    if (!pendingTransaction) return;

    // Different messaging based on verification method
    const isWalletVerification = selectedVerificationMethod === 'wallet_signature' || selectedVerificationMethod === 'multi_sig';
    const processingMessage = isWalletVerification 
        ? 'Waiting for wallet signature...'
        : 'Completing 3D Secure verification...';
    
    showProcessing(processingMessage);
    
    // Simulate verification delay (would be real 3DS/wallet in production)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    showProcessing(isWalletVerification ? 'Broadcasting transaction...' : 'Processing payment...');
    logDebug('trace', `${selectedVerificationMethod?.toUpperCase()} Verification`, { status: 'verified' });

    try {
        // Re-submit with verified: true to actually process the payment
        const merchantProtocol = pendingTransaction.merchantProtocol || merchantProtocolSelect.value;
        const token = localStorage.getItem('halo_token');
        
        const response = await fetch('http://localhost:3000/halo/agentic-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt: pendingTransaction.prompt,
                merchantProtocol: merchantProtocol,
                delegatedPayment: pendingTransaction.delegatedPayment, // Include payment credentials
                verified: true // Step-up verification completed
            })
        });

        const data = await response.json();
        logDebug('in', 'Verified Payment Response', data);
        hideProcessing();

        if (!data.success) {
            addMessage('bot', createErrorCard('Payment Failed', data.error || 'Unknown error'));
            pendingTransaction = null;
            return;
        }

        // Show success
        if (data.mode === 'agentic' && data.payment?.status === 'completed') {
            // Show protocol info
            displayAgenticSuccess(data);
            
            // Also show full order confirmation with totals
            const parsed = data.parsed;
            const params = pendingTransaction.intent?.intent?.params || {};
            const quantity = pendingTransaction.quantity || 1;
            const itemTotal = params.amount * quantity;
            const shipping = params.shipping_speed === 'express' ? 25 : 10;
            const tax = itemTotal * 0.08;
            const total = itemTotal + shipping + tax;
            
            const orderData = {
                orderNumber: data.order_number || `ORD-${Date.now().toString().slice(-8)}`,
                items: [{
                    name: params.item || parsed?.item_name || 'Item',
                    quantity: quantity,
                    price: params.amount || (parsed?.amount_cents / 100) || 0,
                    emoji: '📦'
                }],
                subtotal: itemTotal,
                shipping: shipping,
                tax: tax,
                total: total,
                sessionId: data.stripe_session_id || 'N/A',
                haloSession: data.halo_session_id || 'N/A',
                protocolUsed: `${data.agentProtocol || 'UCP'} → ${data.merchantProtocol || 'ACP'}`
            };
            
            displayOrderConfirmation(orderData);
        } else {
            displayCheckoutReady(data);
        }
    } catch (error) {
        console.error(error);
        hideProcessing();
        addMessage('bot', createErrorCard('Verification Failed', error.message));
    }

    pendingTransaction = null;
}

// ===== Error Handling =====
function handleErrorResponse(data) {
    if (data.error?.includes('blocked')) {
        showBlockModal(data);
    } else {
        addMessage('bot', createErrorCard('Request Failed', data.error || 'Unknown error'));
    }
}

// ===== Debug Logging =====
function logDebug(type, label, data) {
    // Clear empty message if present
    const empty = debugLog.querySelector('.debug-empty');
    if (empty) empty.remove();

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'out' ? '↑' : type === 'in' ? '↓' : type === 'error' ? '✕' : '◆';
    
    let content = data;
    if (typeof data === 'object') {
        content = JSON.stringify(data, null, 2);
    }

    entry.innerHTML = `
        <div class="log-timestamp">${timestamp}</div>
        <div class="log-label">${icon} ${escapeHtml(label)}</div>
        <div class="log-content">${escapeHtml(content)}</div>
    `;
    
    debugLog.appendChild(entry);
    debugLog.scrollTop = debugLog.scrollHeight;
}

// ===== Helpers =====
function getRiskBadge(score) {
    if (score < 30) return '✅';
    if (score < 60) return '⚠️';
    return '🚫';
}

function formatFactor(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Dismiss checkout card
function dismissCard(btn) {
    const message = btn.closest('.message');
    if (message) {
        message.style.opacity = '0';
        message.style.transform = 'translateX(20px)';
        setTimeout(() => message.remove(), 200);
    }
}
// ===== Tab Navigation =====
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Hide all tabs
        document.getElementById('tab-checkout').style.display = 'none';
        document.getElementById('tab-sessions').style.display = 'none';
        document.getElementById('tab-orders').style.display = 'none';
        document.getElementById('tab-api').style.display = 'none';
        
        // Show selected tab
        const tabEl = document.getElementById(`tab-${tab}`);
        if (tabEl) {
            tabEl.style.display = 'flex';
            
            // Refresh data when switching tabs
            if (tab === 'sessions') refreshSessions();
            if (tab === 'orders') refreshOrders();
            if (tab === 'api') refreshStats();
        }
    });
});

// ===== Sessions =====
async function refreshSessions() {
    try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        const list = document.getElementById('sessions-list');
        
        if (!data.sessions || data.sessions.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>No active sessions</p>
                    <small>Sessions will appear here when you start a checkout</small>
                </div>
            `;
            return;
        }
        
        list.innerHTML = data.sessions.map(session => `
            <div class="session-card">
                <div class="session-header">
                    <span class="session-id">${session.id}</span>
                    <span class="session-status ${session.status}">${session.status}</span>
                </div>
                <div class="session-details">
                    <div class="detail-item">
                        <label>Total</label>
                        <span>${formatAmount(session.total, session.currency)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Risk</label>
                        <span>${getRiskBadge(session.risk_decision === 'approve' ? 20 : session.risk_decision === 'challenge' ? 50 : 80)} ${session.risk_decision}</span>
                    </div>
                    <div class="detail-item">
                        <label>Created</label>
                        <span>${new Date(session.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Expires</label>
                        <span>${new Date(session.expires_at).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to refresh sessions:', error);
    }
}

// ===== Orders =====
async function refreshOrders() {
    try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        const list = document.getElementById('orders-list');
        
        if (!data.orders || data.orders.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <p>No orders yet</p>
                    <small>Completed checkouts will appear here</small>
                </div>
            `;
            return;
        }
        
        list.innerHTML = data.orders.map(order => {
            const fulfillmentEvents = order.fulfillment?.events || [];
            const latestEvent = fulfillmentEvents[fulfillmentEvents.length - 1];
            const status = latestEvent?.type || 'pending';
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">${order.id}</span>
                        <span class="order-status ${status}">${status}</span>
                    </div>
                    <div class="order-details">
                        <div class="detail-item">
                            <label>Items</label>
                            <span>${order.line_items?.length || 0} items</span>
                        </div>
                        <div class="detail-item">
                            <label>Total</label>
                            <span>${formatAmount(order.totals?.find(t => t.type === 'total')?.amount || 0)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tracking</label>
                            <span>${order.fulfillment?.expectations?.[0]?.tracking_number || 'N/A'}</span>
                        </div>
                    </div>
                    ${fulfillmentEvents.length > 0 ? `
                        <div class="fulfillment-timeline">
                            ${fulfillmentEvents.map((evt, i) => `
                                <div class="timeline-event">
                                    <div class="timeline-dot ${i === fulfillmentEvents.length - 1 ? 'complete' : ''}"></div>
                                    <div class="timeline-content">
                                        <strong>${evt.type.charAt(0).toUpperCase() + evt.type.slice(1)}</strong>
                                        <small>${new Date(evt.occurred_at).toLocaleString()}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Failed to refresh orders:', error);
    }
}

// ===== API Explorer =====
async function refreshStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        document.getElementById('api-stats').innerHTML = `
            <div class="api-stat">
                <span>Sessions:</span>
                <span class="stat-value">${data.sessions?.active || 0}</span>
            </div>
            <div class="api-stat">
                <span>Orders:</span>
                <span class="stat-value">${data.orders?.total || 0}</span>
            </div>
            <div class="api-stat">
                <span>Uptime:</span>
                <span class="stat-value">${Math.floor(data.uptime || 0)}s</span>
            </div>
        `;
    } catch (error) {
        console.error('Failed to refresh stats:', error);
    }
}

async function testEndpoint(method, url, body = null) {
    const responseEl = document.getElementById('api-response');
    
    try {
        responseEl.textContent = `⏳ ${method} ${url}...`;
        
        // Handle placeholder {id}
        if (url.includes('{id}')) {
            const id = prompt('Enter ID:', 'demo');
            if (!id) return;
            url = url.replace('{id}', id);
        }
        
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        
        if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        const statusIcon = response.ok ? '✅' : '❌';
        responseEl.textContent = `${statusIcon} ${response.status} ${response.statusText}\n\n${JSON.stringify(data, null, 2)}`;
        
        // Also log to debug panel
        logDebug(response.ok ? 'in' : 'error', `${method} ${url}`, data);
        
    } catch (error) {
        responseEl.textContent = `❌ Error: ${error.message}`;
    }
}