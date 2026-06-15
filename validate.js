import crypto from 'crypto';

const TOKEN_SECRET = process.env.TOKEN_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token required' });
    }

    // Split token into payload and signature
    const parts = token.split('.');
    if (parts.length !== 2) {
      return res.status(400).json({ valid: false, error: 'Invalid token format' });
    }

    const [payloadB64, signatureB64] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (signatureB64 !== expectedSignature) {
      return res.status(400).json({ valid: false, error: 'Invalid signature' });
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return res.status(400).json({ valid: false, error: 'Token expired' });
    }

    res.status(200).json({
      valid: true,
      expiry: payload.exp,
      expiresIn: payload.exp - now,
    });
  } catch (error) {
    console.error('Validate error:', error);
    res.status(500).json({ valid: false, error: error.message });
  }
}
