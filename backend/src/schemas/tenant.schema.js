const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const createTenantSchema = z.object({
  name: z.string().min(3, "Nombre institucional requerido").max(150).trim(),
  shortName: z.string().min(2, "Nombre corto requerido").max(60).trim(),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "El slug solo permite minúsculas, números y guiones")
    .trim(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(100).default("Entre Ríos"),
  contactEmail: z.string().email("Email de contacto inválido").trim(),
  contactPhone: z.string().min(6, "Teléfono requerido").max(40).trim(),
  planTier: z.enum(["base", "pro", "full"]).default("base"),
  monthlyFeeArs: z.number().nonnegative().default(35000),
  // Branding inicial (Modo Camaleón)
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#111827"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#DC2626"),
  // Feature Flags del plan contratado
  flags: z
    .object({
      hasMemberships: z.boolean().default(true),
      hasCanteen: z.boolean().default(false),
      hasBookings: z.boolean().default(true),
      hasStore: z.boolean().default(false),
      hasColonia: z.boolean().default(false),
      hasQrAccess: z.boolean().default(false),
      hasSubcommissions: z.boolean().default(false),
    })
    .default({}),
  // Usuario administrador inicial del club
  adminUser: z.object({
    fullName: z.string().min(3).max(120).trim(),
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(6, "Mínimo 6 caracteres para la clave inicial"),
  }),
});

module.exports = { loginSchema, createTenantSchema };
