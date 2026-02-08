import Stripe from 'stripe';

// Support both STRIPE_API_KEY and STRIPE_SECRET_KEY for flexibility
const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeKey, {
  apiVersion: '2020-08-27',
});

export const createPaymentIntent = async (normalizedPayload: any): Promise<any | null> => {
  try {
    const { halo_normalized } = normalizedPayload;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: halo_normalized.total_cents,
      currency: halo_normalized.currency,
      metadata: {
        country: halo_normalized.country,
        provider: halo_normalized.provider,
        shipping_speed: halo_normalized.shipping_speed
      }
    });

    console.log('Stripe PaymentIntent created:', paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error('Error creating Stripe PaymentIntent:', error);
    return null;
  }
};