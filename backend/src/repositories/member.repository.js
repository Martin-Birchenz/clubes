const pool = require("../config/db.js");

class MemberRepository {
  async findAllByTenant(tenantId, search = "", status = "") {
    let sql = `
      SELECT 
        m.id, m.member_number, m.dni, m.first_name, m.last_name,
        m.email, m.phone, m.status, m.paid_until, m.qr_token,
        mc.id AS category_id, mc.name AS category_name, mc.monthly_fee, mc.is_exempt
      FROM members m
      JOIN member_categories mc ON m.category_id = mc.id
      WHERE m.tenant_id = ?
    `;
    const params = [tenantId];

    if (search) {
      sql += ` AND (m.dni LIKE ? OR m.first_name LIKE ? OR m.last_name LIKE ? OR m.member_number LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      sql += ` AND m.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY m.last_name ASC, m.first_name ASC LIMIT 200`;

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async getCategoriesByTenant(tenantId) {
    const [rows] = await pool.query(
      "SELECT id, name, monthly_fee, is_exempt FROM member_categories WHERE tenant_id = ? AND is_active = 1 ORDER BY name ASC",
      [tenantId],
    );
    return rows;
  }

  async registerPaymentAcid({
    tenantId,
    memberId,
    userId,
    amount,
    monthsCovered,
    paymentMethod,
  }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Bloqueo de fila del socio para evitar cobros duplicados concurrentes
      const [members] = await conn.query(
        "SELECT id, paid_until FROM members WHERE id = ? AND tenant_id = ? FOR UPDATE",
        [memberId, tenantId],
      );

      if (members.length === 0) {
        const err = new Error("Socio no encontrado en este club");
        err.statusCode = 404;
        throw err;
      }

      // Calcular nueva fecha paid_until (si ya tenía fecha futura, suma meses sobre esa; si no, desde hoy)
      const [dateRows] = await conn.query(
        `SELECT DATE_ADD(
           GREATEST(COALESCE(?, CURDATE()), CURDATE()),
           INTERVAL ? MONTH
         ) AS next_paid_until`,
        [members[0].paid_until, monthsCovered],
      );
      const newPaidUntil = dateRows[0].next_paid_until;

      await conn.query(
        `INSERT INTO member_payments 
          (tenant_id, member_id, recorded_by_user_id, amount, months_covered, new_paid_until, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          memberId,
          userId,
          amount,
          monthsCovered,
          newPaidUntil,
          paymentMethod,
        ],
      );

      await conn.query(
        "UPDATE members SET status = 'active', paid_until = ? WHERE id = ? AND tenant_id = ?",
        [newPaidUntil, memberId, tenantId],
      );

      await conn.commit();
      return { memberId, newPaidUntil };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = new MemberRepository();
