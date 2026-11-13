const pool = require("../config/db.js");

class AccessRepository {
  async verifyAndLogAccess({ tenantId, code, checkpoint }) {
    const cleanCode = String(code || "").trim();

    // Permite escanear por qr_token (UUID) o ingresar manualmente el DNI
    const [rows] = await pool.query(
      `SELECT 
         m.id, m.member_number, m.dni, m.first_name, m.last_name,
         m.photo_url, m.status, m.paid_until,
         mc.name AS category_name, mc.is_exempt
       FROM members m
       JOIN member_categories mc ON m.category_id = mc.id
       WHERE m.tenant_id = ? AND (m.qr_token = ? OR m.dni = ?)
       LIMIT 1`,
      [tenantId, cleanCode, cleanCode],
    );

    if (rows.length === 0) {
      return {
        found: false,
        granted: false,
        reason: "Código QR o DNI no registrado en el padrón del club",
      };
    }

    const member = rows[0];
    const today = new Date().toISOString().split("T")[0];
    const paidUntilStr = member.paid_until
      ? new Date(member.paid_until).toISOString().split("T")[0]
      : null;

    const isValidDate = !paidUntilStr || paidUntilStr >= today;
    const granted =
      Boolean(member.is_exempt) || (member.status === "active" && isValidDate);

    let reason = "Acceso habilitado — Cuota al día";
    if (!granted) {
      reason =
        member.status === "suspended"
          ? "Socio suspendido por administración"
          : "Cuota vencida o con deuda pendiente";
    }

    // Registrar auditoría de ingreso
    await pool.query(
      "INSERT INTO access_logs (tenant_id, member_id, checkpoint, access_granted) VALUES (?, ?, ?, ?)",
      [tenantId, member.id, checkpoint, granted ? 1 : 0],
    );

    return {
      found: true,
      granted,
      reason,
      member: {
        id: member.id,
        memberNumber: member.member_number,
        dni: member.dni,
        fullName: `${member.last_name}, ${member.first_name}`,
        photoUrl: member.photo_url,
        categoryName: member.category_name,
        paidUntil: paidUntilStr,
      },
    };
  }

  async getRecentLogs(tenantId) {
    const [rows] = await pool.query(
      `SELECT 
         al.id, al.checkpoint, al.access_granted, al.scanned_at,
         m.member_number, m.dni, m.first_name, m.last_name
       FROM access_logs al
       JOIN members m ON al.member_id = m.id
       WHERE al.tenant_id = ?
       ORDER BY al.scanned_at DESC
       LIMIT 20`,
      [tenantId],
    );
    return rows;
  }
}

module.exports = new AccessRepository();
