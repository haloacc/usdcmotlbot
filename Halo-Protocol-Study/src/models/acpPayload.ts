export interface ACPPayload {
  protocol: string;
  payload: {
    total_amount: number;
    currency: string;
    country: string;
    payment_provider: string;
    shipping_type: string;
    [key: string]: any; // Allow additional fields
  };
}