import { getDb } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { txnid, error_Message } = req.body;
    
    const db = await getDb();
    
    // Update payment record
    await db.collection("payments").updateOne(
      { txnId: txnid },
      { 
        $set: { 
          status: "failed",
          errorMessage: error_Message || "Payment failed",
          completedAt: new Date()
        } 
      }
    );
    
    return res.redirect(`/payment-failed?txnId=${txnid}&reason=${encodeURIComponent(error_Message || "unknown")}`);
  } catch (error) {
    console.error("Payment failure handler error:", error);
    return res.redirect("/payment-failed?reason=server_error");
  }
}
