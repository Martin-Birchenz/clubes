const { z } = require("zod");

const createDisciplineSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .trim(),
  hasBookings: z.boolean().default(true),
  hasClasses: z.boolean().default(false),
});

const createFacilitySchema = z.object({
  disciplineId: z.number().int().positive(),
  name: z.string().min(2).max(120).trim(),
  pricingType: z.enum(["hourly", "event"]).default("hourly"),
  defaultPrice: z.number().nonnegative(),
  memberDiscountPercent: z.number().int().min(0).max(100).default(0),
});

const createReservationSchema = z.object({
  facilityId: z.number().int().positive(),
  memberId: z.number().int().positive().nullable().optional(),
  clientName: z.string().min(2).max(120).trim(),
  clientPhone: z.string().min(6).max(40).trim(),
  reservationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora inicio inválida"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora fin inválida"),
  reservationType: z
    .enum(["casual", "fixed_weekly", "event"])
    .default("casual"),
  customPrice: z.number().nonnegative().optional(),
  paymentStatus: z.enum(["pending", "partial", "paid"]).default("pending"),
  notes: z.string().max(255).optional().nullable(),
});

module.exports = {
  createDisciplineSchema,
  createFacilitySchema,
  createReservationSchema,
};
