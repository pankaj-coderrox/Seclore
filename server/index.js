import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDatabase, databaseState, isDatabaseConfigured } from "./db.js";
import { Lead } from "./models/Lead.js";
import { validateDealRegistration, validateLead, validatePartnerRegistration } from "./validation.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://127.0.0.1:4321";

app.use(helmet());
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "32kb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    databaseConfigured: isDatabaseConfigured(),
    databaseState: databaseState()
  });
});

async function createLead(req, res, type) {
  const result = validateLead(req.body || {}, type);

  if (!result.valid) {
    return res.status(400).json({
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: result.errors
    });
  }

  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      message: "Lead storage is not configured. Add MONGO_URI to .env and restart the server."
    });
  }

  try {
    await connectDatabase();
    const savedLead = await Lead.create(result.lead);

    return res.status(201).json({
      ok: true,
      message: type === "demo" ? "Demo request received." : "Message received.",
      leadId: savedLead._id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "We could not save your request. Please try again shortly."
    });
  }
}

app.post("/api/contact", (req, res) => createLead(req, res, "contact"));
app.post("/api/demo", (req, res) => createLead(req, res, "demo"));

app.post("/api/partner-login", (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || !password) {
    return res.status(400).json({
      ok: false,
      message: "Enter your email address and password to sign in."
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Signed in to the partner portal preview.",
    user: { email }
  });
});

app.post("/api/partner-password-reset", (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return res.status(400).json({
      ok: false,
      message: "Enter a valid email address to reset your password."
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Password reset instructions sent."
  });
});

app.post("/api/partner-register", async (req, res) => {
  const result = validatePartnerRegistration(req.body || {});

  if (!result.valid) {
    return res.status(400).json({
      ok: false,
      message: "Please complete the required fields.",
      errors: result.errors
    });
  }

  if (!isDatabaseConfigured()) {
    return res.status(202).json({
      ok: true,
      message: "Partner request received."
    });
  }

  try {
    await connectDatabase();
    const savedLead = await Lead.create(result.lead);

    return res.status(201).json({
      ok: true,
      message: "Partner request received.",
      leadId: savedLead._id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "We could not save your request. Please try again shortly."
    });
  }
});

app.post("/api/register-deal", async (req, res) => {
  const result = validateDealRegistration(req.body || {});

  if (!result.valid) {
    return res.status(400).json({
      ok: false,
      message: "Please complete the required deal registration fields.",
      errors: result.errors
    });
  }

  if (!isDatabaseConfigured()) {
    return res.status(202).json({
      ok: true,
      message: "Deal registration received."
    });
  }

  try {
    await connectDatabase();
    const savedLead = await Lead.create(result.lead);

    return res.status(201).json({
      ok: true,
      message: "Deal registration received.",
      leadId: savedLead._id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "We could not save your deal registration. Please try again shortly."
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, message: "Route not found." });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, message: "Unexpected server error." });
});

connectDatabase()
  .then(() => {
    if (isDatabaseConfigured()) {
      console.log("✅ MongoDB connected successfully");
    }
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`API server running on http://127.0.0.1:${port}`);
    });
  });
