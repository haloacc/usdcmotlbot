export interface RiskResult {
    risk_score: number;
    decision: 'approve' | 'challenge' | 'block';
    factors?: {
        high_value?: boolean;
        international?: boolean;
        express_shipping?: boolean;
    };
}

export function computeRiskScore(normalizedPayload: any): RiskResult {
    const { halo_normalized } = normalizedPayload;
    
    let score = 0;
    const factors: any = {};

    // More granular scoring based on amount
    if (halo_normalized.total_cents > 100000) {  // > $1000
        score += 50;
        factors.very_high_value = true;
    } else if (halo_normalized.total_cents > 50000) {  // > $500
        score += 35;
        factors.high_value = true;
    } else if (halo_normalized.total_cents > 10000) {  // > $100
        score += 20;
        factors.moderate_value = true;
    } else if (halo_normalized.total_cents > 5000) {  // > $50
        score += 10;
        factors.elevated_value = true;
    }

    // +20 if country != "US"
    if (halo_normalized.country !== "US") {
        score += 20;
        factors.international = true;
    }

    // +10 if express shipping
    if (halo_normalized.shipping_speed === "express") {
        score += 10;
        factors.express_shipping = true;
    }

    // Determine decision based on transaction risk
    let decision: 'approve' | 'challenge' | 'block';
    if (score < 30) {
        decision = "approve";      // Low risk - no verification needed
    } else if (score < 60) {
        decision = "challenge";    // Medium risk - requires OTP/3DS
    } else {
        decision = "block";        // High risk - transaction blocked
    }

    return { risk_score: score, decision, factors };
}