require("dotenv").config();
const app = require("./src/app.js");
const pool = require("./src/config/db.js");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL (Aiven) conectado correctamente");
    conn.release();

    app.listen(PORT, () => {
      console.log(
        `🚀 Core Deportivo API corriendo en http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("❌ Error fatal al iniciar servidor:", error.message);
    process.exit(1);
  }
}

startServer();
