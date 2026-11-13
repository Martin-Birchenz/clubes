const pool = require("../config/db.js");

const resolvePublicTenant = async (req, res, next) => {
  try {
    const slug = (req.params.slug || req.headers["x-tenant-slug"] || "")
      .toLowerCase()
      .trim();

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Identificador del club (slug) requerido",
      });
    }

    const [rows] = await pool.query(
      "SELECT id, name, short_name, slug, subscription_status, is_active FROM tenants WHERE slug = ? LIMIT 1",
      [slug],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "El club solicitado no existe",
      });
    }

    const tenant = rows[0];

    if (!tenant.is_active || tenant.subscription_status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "El portal de este club se encuentra temporalmente suspendido",
      });
    }

    req.tenantId = tenant.id;
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};

const requireAdminTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "No autenticado" });
    }

    // SuperAdmin puede inspeccionar o configurar cualquier club vía header x-tenant-id
    if (req.user.roleCode === "superadmin") {
      const targetTenantId = Number(req.headers["x-tenant-id"]);
      if (!targetTenantId) {
        return res.status(400).json({
          success: false,
          message: "SuperAdmin debe enviar el header x-tenant-id",
        });
      }
      req.tenantId = targetTenantId;
      return next();
    }

    if (!req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin club asignado",
      });
    }

    // Verificamos en tiempo real que el club no haya sido suspendido por mora
    const [rows] = await pool.query(
      "SELECT is_active, subscription_status FROM tenants WHERE id = ? LIMIT 1",
      [req.user.tenantId],
    );

    if (
      rows.length === 0 ||
      !rows[0].is_active ||
      rows[0].subscription_status === "suspended"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Acceso pausado: suscripción del club suspendida por administración",
      });
    }

    req.tenantId = req.user.tenantId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { resolvePublicTenant, requireAdminTenant };
