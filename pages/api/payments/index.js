import { getAllPayments, getUserPayments, createPayment } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      
      if (userId) {
        const payments = await getUserPayments(userId);
        return res.status(200).json(payments);
      }
      
      const payments = await getAllPayments();
      return res.status(200).json(payments);
    }
    
    if (req.method === 'POST') {
      const payment = await createPayment(req.body);
      return res.status(201).json(payment);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Payments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
