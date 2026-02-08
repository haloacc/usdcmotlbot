export interface NormalizedPayload {
  halo_normalized: {
    total_cents: number;
    currency: string;
    country: string;
    provider: string;
    shipping_speed: string;
  };
}