import { Request, Response, NextFunction } from 'express';

export const validateACP = (req: Request, res: Response, next: NextFunction) => {
    const { protocol, payload } = req.body;

    // Check protocol
    if (protocol !== 'ACP') {
        return res.status(400).json({ error: 'Invalid protocol. Expected "ACP".' });
    }

    if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Must be an object.' });
    }

    // Validate required ACP checkout session fields
    const requiredFields = ['id', 'status', 'currency', 'payment_provider', 'line_items', 'totals', 'fulfillment_options'];
    for (const field of requiredFields) {
        if (!(field in payload)) {
            return res.status(400).json({ error: `Missing required field: ${field}` });
        }
    }

    // Validate that totals array contains a 'total' entry
    if (!Array.isArray(payload.totals)) {
        return res.status(400).json({ error: 'Field totals must be an array.' });
    }

    const hasTotal = payload.totals.some((t: any) => t.type === 'total');
    if (!hasTotal) {
        return res.status(400).json({ error: 'Totals array must contain an entry with type="total".' });
    }

    // Validate payment_provider has provider field
    if (!payload.payment_provider || !payload.payment_provider.provider) {
        return res.status(400).json({ error: 'Payment provider must have a provider field.' });
    }

    // Validate line_items is an array
    if (!Array.isArray(payload.line_items)) {
        return res.status(400).json({ error: 'Field line_items must be an array.' });
    }

    // Validate fulfillment_options is an array
    if (!Array.isArray(payload.fulfillment_options)) {
        return res.status(400).json({ error: 'Field fulfillment_options must be an array.' });
    }

    next();
};