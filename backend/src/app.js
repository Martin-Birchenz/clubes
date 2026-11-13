const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middlewares/error.middleware.js");

const coreRoutes = require("./routes/core.routes.js");
const adminRoutes = require("./routes/admin.routes.js");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "Core Deportivo SaaS API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", coreRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(errorHandler);

module.exports = app;
