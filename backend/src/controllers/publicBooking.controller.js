const pool = require("../config/db.js");

class PublicBookingController {
  async getAvailability(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const date = req.query.date || new Date().toISOString().split("T")[0];

      const [disciplines] = await pool.query(
        "SELECT id, name, slug FROM disciplines WHERE tenant_id = ? AND has_bookings = 1 AND is_active = 1 ORDER BY name ASC",
        [tenantId],
      );

      const [facilities] = await pool.query(
        `SELECT f.id, f.discipline_id, f.name, f.pricing_type, f.default_price, f.member_discount_percent
         FROM facilities f
         JOIN disciplines d ON f.discipline_id = d.id
         WHERE f.tenant_id = ? AND f.is_active = 1 AND d.has_bookings = 1
         ORDER BY f.name ASC`,
        [tenantId],
      );

      // Solo horarios ocupados (privacidad de datos de terceros)
      const [occupiedSlots] = await pool.query(
        `SELECT facility_id, start_time, end_time
         FROM reservations
         WHERE tenant_id = ? AND reservation_date = ? AND status != 'cancelled'
         ORDER BY start_time ASC`,
        [tenantId, date],
      );

      return res.status(200).json({
        success: true,
        data: { date, disciplines, facilities, occupiedSlots },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PublicBookingController();
