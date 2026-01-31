import crypto from 'crypto';
import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { txnid, amount, productinfo, firstname, email, status, hash, mihpayid } = req.body;
    
    const db = await getDb();
    
    // Get PayU config from main settings
    const settings = await db.collection('settings').findOne({ _id: 'main' });
    const merchantKey = settings?.payuMerchantKey || process.env.PAYU_MERCHANT_KEY;
    const merchantSalt = settings?.payuMerchantSalt || process.env.PAYU_MERCHANT_SALT;
    
    // Verify hash (reverse hash for response)
    const reverseHashString = `${merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${merchantKey}`;
    const calculatedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');
    
    if (hash !== calculatedHash) {
      console.error('Hash mismatch');
      return res.redirect('/payment/failed?reason=hash_mismatch');
    }
    
    // Update payment record
    const payment = await db.collection('payments').findOne({ txnId: txnid });
    
    if (payment) {
      await db.collection('payments').updateOne(
        { txnId: txnid },
        { 
          $set: { 
            status: 'success',
            mihpayid,
            completedAt: new Date()
          } 
        }
      );
      
      // Add extra posts to user
      if (payment.posts && payment.userId) {
        await db.collection('users').updateOne(
          { _id: payment.userId },
          { $inc: { extraPosts: payment.posts } }
        );
      }
    }
    
    return res.redirect(`/payment/success?txnId=${txnid}`);
  } catch (error) {
    console.error('Payment success handler error:', error);
    return res.redirect('/payment/failed?reason=server_error');
  }
}
