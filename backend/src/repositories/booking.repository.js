const pool = require("../config/db.js");

class BookingRepository {
  async getDisciplines(tenantId, allowedDisciplineIds = null) {
    let sql = "SELECT * FROM disciplines WHERE tenant_id = ? AND is_active = 1";
    const params = [tenantId];

    if (
      Array.isArray(allowedDisciplineIds) &&
      allowedDisciplineIds.length > 0
    ) {
      sql += " AND id IN (?)";
      params.push(allowedDisciplineIds);
    }

    sql += " ORDER BY name ASC";
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async createDiscipline(tenantId, data) {
    const [res] = await pool.query(
      "INSERT INTO disciplines (tenant_id, name, slug, has_bookings, has_classes) VALUES (?, ?, ?, ?, ?)",
      [
        tenantId,
        data.name,
        data.slug,
        data.hasBookings ? 1 : 0,
        data.hasClasses ? 1 : 0,
      ],
    );
    return { id: res.insertId, ...data };
  }

  async getFacilities(tenantId, allowedDisciplineIds = null) {
    let sql = `
      SELECT f.*, d.name AS discipline_name, d.slug AS discipline_slug
      FROM facilities f
      JOIN disciplines d ON f.discipline_id = d.id
      WHERE f.tenant_id = ? AND f.is_active = 1
    `;
    const params = [tenantId];

    if (
      Array.isArray(allowedDisciplineIds) &&
      allowedDisciplineIds.length > 0
    ) {
      sql += " AND f.discipline_id IN (?)";
      params.push(allowedDisciplineIds);
    }

    sql += " ORDER BY d.name ASC, f.name ASC";
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async createFacility(tenantId, data) {
    const [res] = await pool.query(
      `INSERT INTO facilities (tenant_id, discipline_id, name, pricing_type, default_price, member_discount_percent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        data.disciplineId,
        data.name,
        data.pricingType,
        data.defaultPrice,
        data.memberDiscountPercent,
      ],
    );
    return { id: res.insertId, ...data };
  }

  async getReservations(
    tenantId,
    { date, disciplineId, facilityId },
    allowedDisciplineIds = null,
  ) {
    let sql = `
      SELECT 
        r.*, f.name AS facility_name, f.discipline_id,
        d.name AS discipline_name, m.dni AS member_dni
      FROM reservations r
      JOIN facilities f ON r.facility_id = f.id
      JOIN disciplines d ON f.discipline_id = d.id
      LEFT JOIN members m ON r.member_id = m.id
      WHERE r.tenant_id = ?
    `;
    const params = [tenantId];

    if (
      Array.isArray(allowedDisciplineIds) &&
      allowedDisciplineIds.length > 0
    ) {
      sql += " AND f.discipline_id IN (?)";
      params.push(allowedDisciplineIds);
    }
    if (date) {
      sql += " AND r.reservation_date = ?";
      params.push(date);
    }
    if (disciplineId) {
      sql += " AND f.discipline_id = ?";
      params.push(Number(disciplineId));
    }
    if (facilityId) {
      sql += " AND r.facility_id = ?";
      params.push(Number(facilityId));
    }

    sql += " ORDER BY r.reservation_date DESC, r.start_time ASC";
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async createReservationAcid(
    tenantId,
    userId,
    payload,
    allowedDisciplineIds = null,
  ) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Verificar instalación y permisos de subcomisión
      const [facRows] = await conn.query(
        "SELECT id, discipline_id, default_price, member_discount_percent FROM facilities WHERE id = ? AND tenant_id = ? AND is_active = 1 FOR UPDATE",
        [payload.facilityId, tenantId],
      );

      if (facRows.length === 0) {
        const err = new Error("Instalación no encontrada en este club");
        err.statusCode = 404;
        throw err;
      }

      const facility = facRows[0];
      if (
        Array.isArray(allowedDisciplineIds) &&
        allowedDisciplineIds.length > 0 &&
        !allowedDisciplineIds.includes(facility.discipline_id)
      ) {
        const err = new Error(
          "No tenés permisos para operar reservas en esta disciplina",
        );
        err.statusCode = 403;
        throw err;
      }

      // 2. Control anti-solapamiento horario (RN-002)
      const [overlap] = await conn.query(
        `SELECT id FROM reservations
         WHERE tenant_id = ? AND facility_id = ? AND reservation_date = ? AND status != 'cancelled'
           AND (? < end_time AND ? > start_time)`,
        [
          tenantId,
          payload.facilityId,
          payload.reservationDate,
          payload.startTime,
          payload.endTime,
        ],
      );

      if (overlap.length > 0) {
        const err = new Error(
          "La cancha/espacio ya se encuentra ocupado en ese rango horario",
        );
        err.statusCode = 409;
        throw err;
      }

      // 3. Cálculo inteligente de tarifa (customPrice > descuento socio activo > tarifa base)
      let finalPrice = Number(facility.default_price);
      if (payload.customPrice !== undefined) {
        finalPrice = Number(payload.customPrice);
      } else if (payload.memberId && facility.member_discount_percent > 0) {
        const [memRows] = await conn.query(
          "SELECT status FROM members WHERE id = ? AND tenant_id = ? LIMIT 1",
          [payload.memberId, tenantId],
        );
        if (memRows.length > 0 && memRows[0].status === "active") {
          finalPrice = Math.round(
            finalPrice * (1 - facility.member_discount_percent / 100),
          );
        }
      }

      const [ins] = await conn.query(
        `INSERT INTO reservations 
          (tenant_id, facility_id, member_id, created_by_user_id, client_name, client_phone,
           reservation_date, start_time, end_time, reservation_type, final_price, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          payload.facilityId,
          payload.memberId || null,
          userId,
          payload.clientName,
          payload.clientPhone,
          payload.reservationDate,
          payload.startTime,
          payload.endTime,
          payload.reservationType,
          finalPrice,
          payload.paymentStatus,
          payload.notes || null,
        ],
      );

      await conn.commit();
      return { id: ins.insertId, finalPrice };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async updateReservationStatus(
    tenantId,
    reservationId,
    status,
    paymentStatus,
  ) {
    const fields = [];
    const params = [];

    if (status) {
      fields.push("status = ?");
      params.push(status);
    }
    if (paymentStatus) {
      fields.push("payment_status = ?");
      params.push(paymentStatus);
    }
    if (fields.length === 0) return false;

    params.push(reservationId, tenantId);
    const [res] = await pool.query(
      `UPDATE reservations SET ${fields.join(", ")} WHERE id = ? AND tenant_id = ?`,
      params,
    );
    return res.affectedRows > 0;
  }
}

module.exports = new BookingRepository();
