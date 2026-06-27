import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID required' });
    }
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
     success_url: 'https://www.wordgallows.com?payment=success&session={CHECKOUT_SESSION_ID}',
cancel_url: 'https://www.wordgallows.com?payment=cancelled',
    });
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
}
