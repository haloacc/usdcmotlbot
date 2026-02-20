// Simple in-memory cache for velocity checks
// In production, use Redis or a database
export const recentTransactions = new Map<string, { count: number; last_ts: number }>();

export interface RiskResult {
    risk_score: number;
    decision: 'approve' | 'challenge' | 'block';
    factors?: {
        high_value?: boolean;
        international?: boolean;
        express_shipping?: boolean;
        velocity_alert?: boolean;
        suspicious_provider?: boolean;
    };
}

export function computeRiskScore(normalizedPayload: any, ip?: string): RiskResult {
    const { halo_normalized } = normalizedPayload;
    
    let score = 0;
    const factors: any = {};

    // 1. Amount-based scoring
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

    // 2. Geographic risk
    if (halo_normalized.country !== "US") {
        score += 20;
        factors.international = true;
    }

    // 3. Shipping speed risk
    if (halo_normalized.shipping_speed === "express") {
        score += 10;
        factors.express_shipping = true;
    }

    // 4. Velocity Check (Security Improvement)
    if (ip) {
        const now = Date.now();
        const stats = recentTransactions.get(ip) || { count: 0, last_ts: 0 };
        
        // Reset count if last transaction was more than 10 minutes ago
        if (now - stats.last_ts > 10 * 60 * 1000) {
            stats.count = 1;
        } else {
            stats.count += 1;
        }
        stats.last_ts = now;
        recentTransactions.set(ip, stats);

        if (stats.count > 5) {
            score += 30; // High velocity alert
            factors.velocity_alert = true;
        } else if (stats.count > 3) {
            score += 15;
            factors.velocity_alert = true;
        }
    }

    // 5. Provider Reputation
    const suspiciousProviders = ['unknown', 'unsupported'];
    if (suspiciousProviders.includes(halo_normalized.provider?.toLowerCase())) {
        score += 25;
        factors.suspicious_provider = true;
    }

    // Final Decision Logic
    let decision: 'approve' | 'challenge' | 'block';
    if (score < 30) {
        decision = "approve";
    } else if (score < 60) {
        decision = "challenge";
    } else {
        decision = "block";
    }

    return { risk_score: score, decision, factors };
}
