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
const pool = require("../config/db.js");
const cloudinary = require("../config/cloudinary.js");
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

router.put("/site-content", requireModule("all"), async (req, res, next) => {
  try {
    const {
      heroBannerUrl,
      heroSubtitle,
      foundedYear,
      historyTitle,
      historyText,
      historyImageUrl,
      address,
      bankAlias,
      whatsappSecretary,
    } = req.body;

    await pool.query(
      `UPDATE tenant_config SET
         hero_banner_url = COALESCE(?, hero_banner_url),
         hero_subtitle = ?,
         founded_year = ?,
         history_title = ?,
         history_text = ?,
         history_image_url = COALESCE(?, history_image_url),
         address = ?,
         bank_alias = ?,
         whatsapp_secretary = ?
       WHERE tenant_id = ?`,
      [
        heroBannerUrl || null,
        heroSubtitle || null,
        foundedYear || null,
        historyTitle || null,
        historyText || null,
        historyImageUrl || null,
        address || null,
        bankAlias || null,
        whatsappSecretary || null,
        req.tenantId,
      ],
    );

    return res
      .status(200)
      .json({ success: true, message: "Sitio institucional actualizado" });
  } catch (error) {
    next(error);
  }
});

// 1. Subida directa de imágenes a Cloudinary (escudo, portada, historia, disciplinas)
router.post("/upload", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No se envió ninguna imagen" });
    }
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `core_deportivo/tenant_${req.tenantId}`,
      transformation: [{ width: 1400, height: 1400, crop: "limit" }],
    });
    return res.status(200).json({ success: true, url: result.secure_url });
  } catch (error) {
    next(error);
  }
});

// 2. Actualizar foto/descripción/horarios de una disciplina para la web pública
router.patch(
  "/disciplines/:id/cms",
  requireModule("all"),
  async (req, res, next) => {
    try {
      const { description, imageUrl, scheduleInfo } = req.body;
      await pool.query(
        `UPDATE disciplines SET description = ?, image_url = COALESCE(?, image_url), schedule_info = ?
       WHERE id = ? AND tenant_id = ?`,
        [
          description || null,
          imageUrl || null,
          scheduleInfo || null,
          Number(req.params.id),
          req.tenantId,
        ],
      );
      return res
        .status(200)
        .json({ success: true, message: "Disciplina actualizada" });
    } catch (error) {
      next(error);
    }
  },
);

// 3. Gestión de Preguntas Frecuentes (FAQs) del club
router.get("/faqs", requireModule("all"), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, question, answer FROM tenant_faqs WHERE tenant_id = ? ORDER BY sort_order ASC, id ASC",
      [req.tenantId],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/faqs", requireModule("all"), async (req, res, next) => {
  try {
    const { question, answer } = req.body;
    const [ins] = await pool.query(
      "INSERT INTO tenant_faqs (tenant_id, question, answer) VALUES (?, ?, ?)",
      [req.tenantId, question, answer],
    );
    return res
      .status(201)
      .json({ success: true, data: { id: ins.insertId, question, answer } });
  } catch (error) {
    next(error);
  }
});

router.delete("/faqs/:id", requireModule("all"), async (req, res, next) => {
  try {
    await pool.query("DELETE FROM tenant_faqs WHERE id = ? AND tenant_id = ?", [
      Number(req.params.id),
      req.tenantId,
    ]);
    return res.status(200).json({ success: true, message: "FAQ eliminada" });
  } catch (error) {
    next(error);
  }
});

// 4. Dashboard Ejecutivo del Club (Métricas consolidadas en vivo)
router.get("/dashboard/summary", async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const [membersStats] = await pool.query(
      `SELECT 
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS active_count,
         COALESCE(SUM(CASE WHEN status = 'debtor' THEN 1 ELSE 0 END), 0) AS debtor_count
       FROM members WHERE tenant_id = ?`,
      [tenantId],
    );

    const [monthlyFees] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_collected
       FROM member_payments
       WHERE tenant_id = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`,
      [tenantId],
    );

    const [todayReservations] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM reservations
       WHERE tenant_id = ? AND reservation_date = CURDATE() AND status != 'cancelled'`,
      [tenantId],
    );

    const [openCanteen] = await pool.query(
      `SELECT COALESCE(SUM(expected_cash), 0) AS cash_in_registers, COUNT(*) AS open_boxes
       FROM cash_registers
       WHERE tenant_id = ? AND status = 'open'`,
      [tenantId],
    );

    return res.status(200).json({
      success: true,
      data: {
        members: membersStats[0],
        monthlyFeesCollected: Number(monthlyFees[0]?.total_collected || 0),
        todayReservationsCount: Number(todayReservations[0]?.count || 0),
        canteen: openCanteen[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
