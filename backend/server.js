require("dotenv").config();
const express = require("express");
const cors = require("cors");

const reviewRoutes = require("./routes/reviews");
const standardRoutes = require("./routes/standards");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ---- CORS ----------------------------------------------------------
// Accept a comma-separated list of allowed origins from .env so the
// same code works for local dev and a deployed frontend URL.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like curl/Postman/mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json({ limit: "5mb" }));

// ---- Routes ----------------------------------------------------------
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected", message: err.message });
  }
});

app.use("/api/reviews", reviewRoutes);
app.use("/api/standards", standardRoutes);

// ---- 404 + error handling --------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Lease Review Assistant API running on http://localhost:${PORT}`);
});
