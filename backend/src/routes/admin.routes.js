const { Router } = require("express");
const multer = require("multer");
const memberController = require("../controllers/member.controller.js");
const { authenticate } = require("../middlewares/auth.middleware.js");
const { requireAdminTenant } = require("../middlewares/tenant.middleware.js");
const { requireModule } = require("../middlewares/rbac.middleware.js");
const bookingController = require("../controllers/booking.controller.js");
const { validate } = require("../middlewares/validate.middleware.js");
const accessController = require("../controllers/access.controller.js");
const {
  createDisciplineSchema,
  createFacilitySchema,
  createReservationSchema,
} = require("../schemas/booking.schema.js");
const posController = require("../controllers/pos.controller.js");

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Máx 5MB
});

// Todas las rutas /admin exigen JWT válido y Tenant activo
router.use(authenticate, requireAdminTenant);

// Módulo Socios y Tesorería
router.get("/members", requireModule("members"), (req, res, next) =>
  memberController.list(req, res, next),
);
router.get("/members/categories", requireModule("members"), (req, res, next) =>
  memberController.listCategories(req, res, next),
);
router.post(
  "/members/:id/payments",
  requireModule("members"),
  (req, res, next) => memberController.recordPayment(req, res, next),
);
router.post(
  "/members/import",
  requireModule("members"),
  upload.single("file"),
  (req, res, next) => memberController.importExcel(req, res, next),
);
router.get("/disciplines", requireModule("bookings"), (req, res, next) =>
  bookingController.listDisciplines(req, res, next),
);
router.post(
  "/disciplines",
  requireModule("bookings"),
  validate(createDisciplineSchema),
  (req, res, next) => bookingController.createDiscipline(req, res, next),
);

router.get("/facilities", requireModule("bookings"), (req, res, next) =>
  bookingController.listFacilities(req, res, next),
);
router.post(
  "/facilities",
  requireModule("bookings"),
  validate(createFacilitySchema),
  (req, res, next) => bookingController.createFacility(req, res, next),
);

router.get("/reservations", requireModule("bookings"), (req, res, next) =>
  bookingController.listReservations(req, res, next),
);
router.post(
  "/reservations",
  requireModule("bookings"),
  validate(createReservationSchema),
  (req, res, next) => bookingController.createReservation(req, res, next),
);
router.patch("/reservations/:id", requireModule("bookings"), (req, res, next) =>
  bookingController.updateReservation(req, res, next),
);

router.post("/access/scan", requireModule("members"), (req, res, next) =>
  accessController.scan(req, res, next),
);
router.get("/access/logs", requireModule("members"), (req, res, next) =>
  accessController.recentLogs(req, res, next),
);

router.get("/pos", requireModule("canteen"), (req, res, next) =>
  posController.listPos(req, res, next),
);
router.get("/pos/:posId/status", requireModule("canteen"), (req, res, next) =>
  posController.getStatus(req, res, next),
);
router.post("/pos/:posId/open", requireModule("canteen"), (req, res, next) =>
  posController.openRegister(req, res, next),
);
router.post(
  "/pos/registers/:registerId/close",
  requireModule("canteen"),
  (req, res, next) => posController.closeRegister(req, res, next),
);
router.post(
  "/pos/:posId/products",
  requireModule("canteen"),
  (req, res, next) => posController.createProduct(req, res, next),
);
router.post("/pos/:posId/sales", requireModule("canteen"), (req, res, next) =>
  posController.createSale(req, res, next),
);
router.post("/pos/expenses", requireModule("canteen"), (req, res, next) =>
  posController.createExpense(req, res, next),
);

module.exports = router;
