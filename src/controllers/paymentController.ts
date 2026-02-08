import { Request, Response } from 'express';
import { parseACP } from '../services/acpParser';
import { normalizePayload } from '../services/normalizer';
import { computeRiskScore } from '../services/riskEngine';
import { createPaymentIntent } from '../services/stripeService';
import { ACPCheckoutSession } from '../types/index';
import Stripe from 'stripe';
import { paymentMethods } from '../services/paymentMethodService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || '', {
    apiVersion: '2020-08-27',
});

export class PaymentController {
    public async processACP(req: Request, res: Response): Promise<Response> {
        try {
            // Validate protocol
            const { protocol, payload: acpPayload } = req.body;
            
            if (protocol !== 'ACP') {
                return res.status(400).json({ error: 'Invalid protocol. Expected "ACP".' });
            }

            // Parse ACP checkout session
            const parsedData = parseACP(acpPayload as ACPCheckoutSession);
            
            // Normalize to internal format
            const normalizedData = normalizePayload(parsedData);

            // Compute risk score
            const { risk_score, decision } = computeRiskScore(normalizedData);

            // If approved, create Economic Transition record (Arc Blockchain)
            if (decision === 'approve') {
                console.log(`💎 [ARC] ACP Request Approved. Initializing Circle Arc Economic Transition...`);
                // For direct ACP flow, we still use Stripe for legacy compatibility but record intent for Arc
                await createPaymentIntent(normalizedData);
            }

            return res.json({
                risk_score,
                decision,
                normalized_payload: normalizedData
            });
        } catch (error) {
            console.error('Error processing ACP:', error);
            return res.status(500).json({ error: 'An error occurred while processing the payment.' });
        }
    }

    // Charge a saved payment method
    // Removed: chargeSavedPaymentMethod - now using full protocol orchestration via /halo/agentic-checkout
    // All payments go through the protocol layer (UCP → ACP → Stripe) for compliance
}

export default new PaymentController();