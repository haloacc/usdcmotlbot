import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Halo MVP running on port ${PORT}`);
    const stripeKeyLoaded = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
    console.log(`🔑 Stripe API key loaded: ${stripeKeyLoaded ? 'YES' : 'NO'}`);
});