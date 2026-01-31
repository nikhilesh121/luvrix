import crypto from 'crypto';
import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, productInfo, firstName, email, phone, userId, posts } = req.body;
    
    if (!amount || !productInfo || !firstName || !email || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDb();
    
    // Get PayU config from main settings
    const settings = await db.collection('settings').findOne({ _id: 'main' });
    
    const merchantKey = settings?.payuMerchantKey || process.env.PAYU_MERCHANT_KEY;
    const merchantSalt = settings?.payuMerchantSalt || process.env.PAYU_MERCHANT_SALT;
    const isTestMode = settings?.payuTestMode ?? (process.env.PAYU_TEST_MODE === 'true');
    
    if (!merchantKey || !merchantSalt) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    // Generate unique transaction ID
    const txnId = `LUV${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create hash
    const hashString = `${merchantKey}|${txnId}|${amount}|${productInfo}|${firstName}|${email}|||||||||||${merchantSalt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    
    // Save payment record
    await db.collection('payments').insertOne({
      txnId,
      userId,
      amount: parseFloat(amount),
      posts: parseInt(posts) || 0,
      productInfo,
      firstName,
      email,
      phone: phone || '',
      status: 'initiated',
      createdAt: new Date()
    });
    
    // PayU URLs
    const payuUrl = isTestMode 
      ? 'https://sandboxsecure.payu.in/_payment'
      : 'https://secure.payu.in/_payment';
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://luvrix.com';
    
    return res.status(200).json({
      success: true,
      txnId,
      hash,
      key: merchantKey,
      payuUrl,
      surl: `${siteUrl}/api/payu/success`,
      furl: `${siteUrl}/api/payu/failure`,
      curl: `${siteUrl}/api/payu/cancel`
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    return res.status(500).json({ error: 'Failed to initiate payment' });
  }
}
