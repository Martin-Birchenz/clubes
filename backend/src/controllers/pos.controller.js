const posRepository = require("../repositories/pos.repository.js");

class PosController {
  async listPos(req, res, next) {
    try {
      const list = await posRepository.getPointsOfSale(req.tenantId);
      return res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const posId = Number(req.params.posId);
      const [register, products] = await Promise.all([
        posRepository.getOpenRegister(req.tenantId, posId),
        posRepository.getProducts(req.tenantId, posId),
      ]);

      const summary = register
        ? await posRepository.getRegisterSummary(req.tenantId, register.id)
        : null;

      return res.status(200).json({
        success: true,
        data: { register, products, summary },
      });
    } catch (error) {
      next(error);
    }
  }

  async openRegister(req, res, next) {
    try {
      const posId = Number(req.params.posId);
      const { openingAmount = 0 } = req.body;
      const reg = await posRepository.openRegister({
        tenantId: req.tenantId,
        posId,
        userId: req.user.userId,
        openingAmount: Number(openingAmount),
      });
      return res.status(201).json({ success: true, data: reg });
    } catch (error) {
      next(error);
    }
  }

  async closeRegister(req, res, next) {
    try {
      const registerId = Number(req.params.registerId);
      const { declaredCash } = req.body;
      await posRepository.closeRegister({
        tenantId: req.tenantId,
        registerId,
        userId: req.user.userId,
        declaredCash: Number(declaredCash),
      });
      return res
        .status(200)
        .json({ success: true, message: "Caja cerrada correctamente" });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const posId = Number(req.params.posId);
      const prod = await posRepository.createProduct(req.tenantId, {
        posId,
        ...req.body,
        price: Number(req.body.price),
        stock: Number(req.body.stock || 0),
      });
      return res.status(201).json({ success: true, data: prod });
    } catch (error) {
      next(error);
    }
  }

  async createSale(req, res, next) {
    try {
      const posId = Number(req.params.posId);
      const { items, paymentMethod } = req.body;
      const result = await posRepository.recordSaleAcid({
        tenantId: req.tenantId,
        posId,
        userId: req.user.userId,
        items,
        paymentMethod,
      });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createExpense(req, res, next) {
    try {
      const { registerId, category, description, amount } = req.body;
      await posRepository.recordExpenseAcid({
        tenantId: req.tenantId,
        registerId: registerId ? Number(registerId) : null,
        userId: req.user.userId,
        category,
        description,
        amount: Number(amount),
      });
      return res
        .status(201)
        .json({ success: true, message: "Egreso registrado" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PosController();
