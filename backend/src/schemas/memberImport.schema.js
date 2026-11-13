const { z } = require("zod");

// Normaliza encabezados flexibles de Excel (ej: "N° DNI" -> "dni", "Apellido y Nombre" -> "full_name")
const memberImportRowSchema = z.object({
  dni: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).replace(/\D/g, "").trim())
    .refine((val) => val.length >= 6 && val.length <= 12, {
      message: "DNI inválido (debe tener entre 6 y 12 dígitos)",
    }),

  member_number: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) =>
      val !== undefined && val !== null && String(val).trim() !== ""
        ? String(val).trim()
        : null,
    ),

  first_name: z
    .string({ required_error: "El nombre es obligatorio" })
    .trim()
    .min(2, "Nombre muy corto")
    .max(100),

  last_name: z
    .string({ required_error: "El apellido es obligatorio" })
    .trim()
    .min(2, "Apellido muy corto")
    .max(100),

  category_name: z
    .string()
    .optional()
    .default("Activo")
    .transform((val) => (val && val.trim() ? val.trim() : "Activo")),

  phone: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) =>
      val
        ? String(val)
            .replace(/[^\d+]/g, "")
            .trim()
        : null,
    ),

  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.includes("@") ? val.toLowerCase() : null)),

  status: z
    .string()
    .optional()
    .default("active")
    .transform((val) => {
      const clean = String(val || "")
        .toLowerCase()
        .trim();
      if (["moroso", "debe", "adeuda", "debtor", "vencido"].includes(clean))
        return "debtor";
      if (["baja", "inactivo", "inactive"].includes(clean)) return "inactive";
      if (["suspendido", "suspended"].includes(clean)) return "suspended";
      return "active";
    }),

  paid_until: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      const trimmed = String(val).trim();
      // Soporta YYYY-MM-DD o DD/MM/YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return null;
    }),
});

module.exports = { memberImportRowSchema };
