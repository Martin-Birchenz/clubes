const XLSX = require("xlsx");
const crypto = require("crypto");
const pool = require("../config/db.js");
const { memberImportRowSchema } = require("../schemas/memberImport.schema.js");

class MemberImportService {
  /**
   * Mapea columnas con nombres variados de Excel al formato estándar del schema
   */
  normalizeRawRow(raw) {
    const keys = Object.keys(raw).reduce((acc, k) => {
      acc[k.toLowerCase().trim()] = raw[k];
      return acc;
    }, {});

    // Si el Excel trae "nombre y apellido" en una sola columna
    let firstName = keys.nombre || keys.first_name || "";
    let lastName = keys.apellido || keys.last_name || "";

    if (
      !firstName &&
      !lastName &&
      (keys["apellido y nombre"] || keys["nombre y apellido"])
    ) {
      const full = String(
        keys["apellido y nombre"] || keys["nombre y apellido"],
      ).trim();
      const parts = full.split(/\s+/);
      lastName = parts[0] || "";
      firstName = parts.slice(1).join(" ") || parts[0] || "";
    }

    return {
      dni: keys.dni ?? keys.documento ?? keys["n° documento"],
      member_number:
        keys.socio ??
        keys.numero_socio ??
        keys["n° socio"] ??
        keys.member_number,
      first_name: firstName,
      last_name: lastName,
      category_name: keys.categoria ?? keys.category ?? "Activo",
      phone: keys.telefono ?? keys.celular ?? keys.whatsapp ?? keys.phone,
      email: keys.email ?? keys.correo,
      status: keys.estado ?? keys.situacion ?? keys.status ?? "active",
      paid_until:
        keys.vencimiento ?? keys.pagado_hasta ?? keys.paid_until ?? null,
    };
  }

  async importFromBuffer(tenantId, fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: "",
    });

    if (rawRows.length === 0) {
      const error = new Error("La planilla está vacía");
      error.statusCode = 400;
      throw error;
    }

    // Cache de categorías existentes del club para evitar N+1 queries
    const [existingCats] = await pool.query(
      "SELECT id, LOWER(name) AS lower_name FROM member_categories WHERE tenant_id = ?",
      [tenantId],
    );
    const categoryMap = new Map(existingCats.map((c) => [c.lower_name, c.id]));

    const report = {
      totalRows: rawRows.length,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rawRows.length; i++) {
      const rowNumber = i + 2; // Fila real en Excel (considerando encabezado en fila 1)
      const normalized = this.normalizeRawRow(rawRows[i]);
      const parsed = memberImportRowSchema.safeParse(normalized);

      if (!parsed.success) {
        report.failed++;
        report.errors.push({
          row: rowNumber,
          dni: normalized.dni || "S/D",
          reasons: parsed.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`,
          ),
        });
        continue;
      }

      const data = parsed.data;

      try {
        // 1. Obtener o crear categoría dinámicamente para este club
        const catKey = data.category_name.toLowerCase();
        let categoryId = categoryMap.get(catKey);

        if (!categoryId) {
          const [catRes] = await pool.query(
            "INSERT INTO member_categories (tenant_id, name, monthly_fee) VALUES (?, ?, 0)",
            [tenantId, data.category_name],
          );
          categoryId = catRes.insertId;
          categoryMap.set(catKey, categoryId);
        }

        // 2. Upsert por (tenant_id, dni): si ya existe actualiza datos, si no inserta con QR nuevo
        const memberNumber = data.member_number || `SOC-${data.dni}`;
        const qrToken = crypto.randomUUID();

        const [upsertRes] = await pool.query(
          `INSERT INTO members 
            (tenant_id, category_id, member_number, dni, first_name, last_name, email, phone, qr_token, status, paid_until)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            category_id = VALUES(category_id),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            email = COALESCE(VALUES(email), email),
            phone = COALESCE(VALUES(phone), phone),
            status = VALUES(status),
            paid_until = COALESCE(VALUES(paid_until), paid_until)`,
          [
            tenantId,
            categoryId,
            memberNumber,
            data.dni,
            data.first_name,
            data.last_name,
            data.email,
            data.phone,
            qrToken,
            data.status,
            data.paid_until,
          ],
        );

        // affectedRows === 1 -> INSERT nuevo | affectedRows === 2 -> UPDATE existente
        if (upsertRes.affectedRows === 1) report.imported++;
        else report.updated++;
      } catch (dbErr) {
        report.failed++;
        report.errors.push({
          row: rowNumber,
          dni: data.dni,
          reasons: [dbErr.message],
        });
      }
    }

    return report;
  }
}

module.exports = new MemberImportService();
