const { Router } = require("express");
const tenantController = require("../controllers/tenant.controller.js");
const { authenticate } = require("../middlewares/auth.middleware.js");
const { requireSuperAdmin } = require("../middlewares/rbac.middleware.js");
const { validate } = require("../middlewares/validate.middleware.js");
const {
  loginSchema,
  createTenantSchema,
} = require("../schemas/tenant.schema.js");
const { resolvePublicTenant } = require("../middlewares/tenant.middleware.js");
const publicMemberController = require("../controllers/publicMember.controller.js");

const router = Router();

// Auth
router.post("/auth/login", validate(loginSchema), (req, res, next) =>
  tenantController.login(req, res, next),
);

// Público (Modo Camaleón + Feature Flags)
router.get("/public/c/:slug/bootstrap", (req, res, next) =>
  tenantController.getPublicBootstrap(req, res, next),
);

// SuperAdmin (Tu consola comercial)
router.get(
  "/superadmin/tenants",
  authenticate,
  requireSuperAdmin,
  (req, res, next) => tenantController.listTenants(req, res, next),
);
router.post(
  "/superadmin/tenants",
  authenticate,
  requireSuperAdmin,
  validate(createTenantSchema),
  (req, res, next) => tenantController.createTenant(req, res, next),
);
router.patch(
  "/superadmin/tenants/:id/status",
  authenticate,
  requireSuperAdmin,
  (req, res, next) => tenantController.updateStatus(req, res, next),
);
router.get(
  "/public/c/:slug/members/:dni",
  resolvePublicTenant,
  (req, res, next) => publicMemberController.lookupByDni(req, res, next),
);

module.exports = router;
