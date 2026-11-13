const requireModule = (moduleCode) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "No autenticado" });
    }

    // SuperAdmin y Administrador General del club tienen pase completo
    if (["superadmin", "club_admin"].includes(req.user.roleCode)) {
      return next();
    }

    const allowedModules = req.user.permissions?.modules || [];

    if (!allowedModules.includes(moduleCode)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: no tenés permisos para el módulo '${moduleCode}'`,
      });
    }

    next();
  };
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.roleCode !== "superadmin") {
    return res.status(403).json({
      success: false,
      message:
        "Acceso restringido exclusivamente al administrador de la plataforma",
    });
  }
  next();
};

module.exports = { requireModule, requireSuperAdmin };
