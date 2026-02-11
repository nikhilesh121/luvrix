import { getUser, updateUser, deleteUser } from "../../../lib/db";
import { withCSRFProtection } from "../../../lib/csrf";

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === "GET") {
      const user = await getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json(user);
    }
    
    if (req.method === "PUT") {
      await updateUser(id, req.body);
      return res.status(200).json({ success: true });
    }
    
    if (req.method === "DELETE") {
      await deleteUser(id);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("User API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withCSRFProtection(handler);
