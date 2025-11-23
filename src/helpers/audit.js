const db = require('../models/db');

module.exports = {
  record: async (userId, action, ip) => {
    try {
      await db.run(
        `INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)`,
        [userId || null, action, ip]
      );
    } catch (err) {
      console.error("Audit logging error:", err.message);
    }
  }
};
