const accessRepository = require("../repositories/access.repository.js");

class AccessController {
  async scan(req, res, next) {
    try {
      const { code, checkpoint = "Portería Principal" } = req.body;
      if (!code || !String(code).trim()) {
        return res.status(400).json({
          success: false,
          message: "Ingresá o escaneá un código QR o DNI",
        });
      }

      const result = await accessRepository.verifyAndLogAccess({
        tenantId: req.tenantId,
        code,
        checkpoint,
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async recentLogs(req, res, next) {
    try {
      const logs = await accessRepository.getRecentLogs(req.tenantId);
      return res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccessController();
