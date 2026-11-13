const publicMemberRepository = require("../repositories/publicMember.repository.js");

class PublicMemberController {
  async lookupByDni(req, res, next) {
    try {
      const cleanDni = String(req.params.dni || "")
        .replace(/\D/g, "")
        .trim();

      if (cleanDni.length < 6 || cleanDni.length > 12) {
        return res.status(400).json({
          success: false,
          message: "Ingresá un DNI válido (sin puntos ni espacios)",
        });
      }

      const member = await publicMemberRepository.findByTenantAndDni(
        req.tenantId,
        cleanDni,
      );

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "No encontramos ningún socio registrado con ese DNI en este club",
        });
      }

      return res.status(200).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PublicMemberController();
