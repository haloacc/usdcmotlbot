import { ParsedACP } from './acpParser';

export function normalizePayload(parsedData: ParsedACP) {
    const normalizedPayload = {
        halo_normalized: {
            total_cents: parsedData.total_cents,
            currency: parsedData.currency.toLowerCase(),
            country: parsedData.country.toUpperCase(),
            provider: parsedData.payment_provider.toLowerCase(),
            shipping_speed: parsedData.shipping_speed.toLowerCase()
        }
    };
    return normalizedPayload;
}