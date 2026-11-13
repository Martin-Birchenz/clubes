const bookingRepository = require("../repositories/booking.repository.js");

class BookingController {
  getAllowedDisciplines(req) {
    if (["superadmin", "club_admin"].includes(req.user.roleCode)) return null;
    return req.user.permissions?.discipline_ids || null;
  }

  async listDisciplines(req, res, next) {
    try {
      const data = await bookingRepository.getDisciplines(
        req.tenantId,
        this.getAllowedDisciplines(req),
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createDiscipline(req, res, next) {
    try {
      const created = await bookingRepository.createDiscipline(
        req.tenantId,
        req.body,
      );
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  async listFacilities(req, res, next) {
    try {
      const data = await bookingRepository.getFacilities(
        req.tenantId,
        this.getAllowedDisciplines(req),
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createFacility(req, res, next) {
    try {
      const created = await bookingRepository.createFacility(
        req.tenantId,
        req.body,
      );
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  async listReservations(req, res, next) {
    try {
      const { date, disciplineId, facilityId } = req.query;
      const data = await bookingRepository.getReservations(
        req.tenantId,
        { date, disciplineId, facilityId },
        this.getAllowedDisciplines(req),
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createReservation(req, res, next) {
    try {
      const result = await bookingRepository.createReservationAcid(
        req.tenantId,
        req.user.userId,
        req.body,
        this.getAllowedDisciplines(req),
      );
      return res.status(201).json({
        success: true,
        message: "Reserva registrada correctamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReservation(req, res, next) {
    try {
      const { status, paymentStatus } = req.body;
      await bookingRepository.updateReservationStatus(
        req.tenantId,
        Number(req.params.id),
        status,
        paymentStatus,
      );
      return res
        .status(200)
        .json({ success: true, message: "Turno actualizado" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
