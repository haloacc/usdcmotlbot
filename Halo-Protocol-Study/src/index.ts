import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`🚀 Halo MVP running on port ${PORT}`);
    const stripeKeyLoaded = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
    logger.info(`🔑 Stripe API key loaded: ${stripeKeyLoaded ? 'YES' : 'NO'}`);
});