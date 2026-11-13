const tenantService = require("../services/tenant.service.js");
const tenantRepository = require("../repositories/tenant.repository.js");

class TenantController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await tenantService.login(email, password);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getPublicBootstrap(req, res, next) {
    try {
      const data = await tenantService.getPublicBootstrap(req.params.slug);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async listTenants(req, res, next) {
    try {
      const tenants = await tenantRepository.getAllTenants();
      return res.status(200).json({ success: true, data: tenants });
    } catch (error) {
      next(error);
    }
  }

  async createTenant(req, res, next) {
    try {
      const created = await tenantService.createTenantWithSeed(req.body);
      return res.status(201).json({
        success: true,
        message: "Club dado de alta con roles, categorías y admin inicial",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { subscriptionStatus, nextBillingDate } = req.body;
      await tenantRepository.updateSubscriptionStatus(
        id,
        subscriptionStatus,
        nextBillingDate,
      );
      return res
        .status(200)
        .json({ success: true, message: "Estado de suscripción actualizado" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TenantController();
