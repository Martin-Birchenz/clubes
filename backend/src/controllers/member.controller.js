const memberRepository = require("../repositories/member.repository.js");
const memberImportService = require("../services/memberImport.service.js");

class MemberController {
  async list(req, res, next) {
    try {
      const { search = "", status = "" } = req.query;
      const members = await memberRepository.findAllByTenant(
        req.tenantId,
        search,
        status,
      );
      return res.status(200).json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  async listCategories(req, res, next) {
    try {
      const categories = await memberRepository.getCategoriesByTenant(
        req.tenantId,
      );
      return res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req, res, next) {
    try {
      const memberId = Number(req.params.id);
      const {
        amount,
        monthsCovered = 1,
        paymentMethod = "efectivo",
      } = req.body;

      const result = await memberRepository.registerPaymentAcid({
        tenantId: req.tenantId,
        memberId,
        userId: req.user.userId,
        amount: Number(amount),
        monthsCovered: Number(monthsCovered),
        paymentMethod,
      });

      return res.status(201).json({
        success: true,
        message: "Cobro registrado y cuota actualizada",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async importExcel(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          message: "Debés adjuntar un archivo .xlsx o .csv",
        });
      }

      const report = await memberImportService.importFromBuffer(
        req.tenantId,
        req.file.buffer,
      );

      return res.status(200).json({
        success: true,
        message: `Importación finalizada: ${report.imported} nuevos, ${report.updated} actualizados, ${report.failed} con errores`,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MemberController();
