import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TOKEN_SECRET = process.env.TOKEN_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Determine duration based on price
    const priceId = session.line_items.data[0].price.id;
    const duration24h = [
      'price_1Tid2s1sBFQIZzS4Ssk8MyUZ',
      'price_1Tid5M1sBFQIZzS4TSqWlpOR',
      'price_1Tid4f1sBFQIZzS44SARu9D6',
    ].includes(priceId);

    // Token expiry: 24h = 86400 seconds, 30d = 2592000 seconds
    const expiresIn = duration24h ? 86400 : 2592000;
    const expiry = Math.floor(Date.now() / 1000) + expiresIn;

    // Create signed token
    const payload = JSON.stringify({ exp: expiry, sid: session_id });
    const signature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('base64url');
    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;

    res.status(200).json({
      success: true,
      token,
      expiry,
      duration: duration24h ? '24h' : '30d',
    });
  } catch (error) {
    console.error('Confirm error:', error);
    res.status(500).json({ error: error.message });
  }
}
