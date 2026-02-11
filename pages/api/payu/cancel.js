import { getDb } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { txnid } = req.body;
    
    const db = await getDb();
    
    // Update payment record
    await db.collection("payments").updateOne(
      { txnId: txnid },
      { 
        $set: { 
          status: "cancelled",
          completedAt: new Date()
        } 
      }
    );
    
    return res.redirect("/payment/cancelled");
  } catch (error) {
    console.error("Payment cancel handler error:", error);
    return res.redirect("/payment/cancelled");
  }
}
