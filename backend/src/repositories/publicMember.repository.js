const pool = require("../config/db.js");

class PublicMemberRepository {
  async findByTenantAndDni(tenantId, dni) {
    const [rows] = await pool.query(
      `SELECT 
         m.id, m.member_number, m.dni, m.first_name, m.last_name,
         m.photo_url, m.qr_token, m.status, m.paid_until,
         mc.name AS category_name, mc.monthly_fee, mc.is_exempt,
         tc.bank_alias, tc.bank_cbu, tc.bank_holder_name,
         tc.whatsapp_secretary, tc.mp_public_key
       FROM members m
       JOIN member_categories mc ON m.category_id = mc.id
       JOIN tenant_config tc ON tc.tenant_id = m.tenant_id
       WHERE m.tenant_id = ? AND m.dni = ?
       LIMIT 1`,
      [tenantId, dni],
    );
    return rows[0] || null;
  }
}

module.exports = new PublicMemberRepository();
