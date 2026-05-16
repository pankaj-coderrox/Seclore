import "dotenv/config";
import { connectDatabase, databaseErrorMessage, isDatabaseConfigured } from "../server/db.js";
import { Lead } from "../server/models/Lead.js";
import { verifyRecaptchaToken } from "../server/recaptcha.js";
import { validateDealRegistration, validateLead, validatePartnerRegistration } from "../server/validation.js";

const localDevOriginPattern = /^https?:\/\/(127\.0\.0\.1|localhost|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):\d+$/;

function splitOrigins(value) {
  return String(value || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function getConfiguredOrigins() {
  return [
    ...splitOrigins(process.env.CLIENT_ORIGIN),
    ...splitOrigins(process.env.URL),
    ...splitOrigins(process.env.DEPLOY_URL),
    ...splitOrigins(process.env.DEPLOY_PRIME_URL),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "",
    "https://seclore.vercel.app"
  ].filter(Boolean);
}

function getRequestOrigin(req) {
  return String(req.headers?.origin || req.headers?.Origin || "").replace(/\/$/, "");
}

function allowedOrigin(req) {
  const origin = getRequestOrigin(req);
  const configuredOrigins = getConfiguredOrigins();

  if (!origin) {
    return configuredOrigins[0] || "*";
  }

  if (configuredOrigins.includes(origin) || localDevOriginPattern.test(origin)) {
    return origin;
  }

  console.warn("Blocked API request from unconfigured origin:", origin);
  return configuredOrigins[0] || "null";
}

function applyHeaders(req, res) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin(req));
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Vary", "Origin");
}

function sendJson(req, res, statusCode, body) {
  applyHeaders(req, res);
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

function sendNoContent(req, res) {
  applyHeaders(req, res);
  res.statusCode = 204;
  res.end("");
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return req.body ? JSON.parse(req.body) : {};
    } catch {
      return null;
    }
  }

  if (typeof req.on !== "function") {
    return {};
  }

  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

function getRemoteIp(req) {
  const forwardedFor = req.headers?.["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim();
  }

  return req.socket?.remoteAddress || "";
}

async function saveLead(req, res, lead, successMessage) {
  if (!isDatabaseConfigured()) {
    console.info("Lead accepted without database storage:", {
      type: lead.type,
      email: lead.email,
      source: lead.source
    });
    return sendJson(req, res, 202, { ok: true, message: successMessage });
  }

  try {
    await connectDatabase();
    const savedLead = await Lead.create(lead);
    return sendJson(req, res, 201, { ok: true, message: successMessage, leadId: savedLead._id });
  } catch (error) {
    console.error("Lead save failed:", error);
    return sendJson(req, res, 500, { ok: false, message: databaseErrorMessage(error) });
  }
}

async function handleLead(req, res, body, type) {
  const result = validateLead(body, type);

  if (!result.valid) {
    return sendJson(req, res, 400, {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: result.errors
    });
  }

  if (type === "demo") {
    const recaptcha = await verifyRecaptchaToken(body.recaptchaToken, getRemoteIp(req));

    if (!recaptcha.ok) {
      return sendJson(req, res, 400, {
        ok: false,
        message: recaptcha.message || "Please complete the reCAPTCHA.",
        errors: { recaptcha: recaptcha.message || "Please complete the reCAPTCHA." }
      });
    }
  }

  return saveLead(req, res, result.lead, type === "demo" ? "Demo request received." : "Message received.");
}

function handlePartnerLogin(req, res, body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || !password) {
    return sendJson(req, res, 400, { ok: false, message: "Enter your email address and password to sign in." });
  }

  return sendJson(req, res, 200, {
    ok: true,
    message: "Signed in to the partner portal preview.",
    user: { email }
  });
}

function handlePartnerPasswordReset(req, res, body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return sendJson(req, res, 400, { ok: false, message: "Enter a valid email address to reset your password." });
  }

  return sendJson(req, res, 200, { ok: true, message: "Password reset instructions sent." });
}

async function handlePartnerRegister(req, res, body) {
  const result = validatePartnerRegistration(body);

  if (!result.valid) {
    return sendJson(req, res, 400, {
      ok: false,
      message: "Please complete the required fields.",
      errors: result.errors
    });
  }

  return saveLead(req, res, result.lead, "Partner request received.");
}

async function handleDealRegistration(req, res, body) {
  const result = validateDealRegistration(body);

  if (!result.valid) {
    return sendJson(req, res, 400, {
      ok: false,
      message: "Please complete the required deal registration fields.",
      errors: result.errors
    });
  }

  return saveLead(req, res, result.lead, "Deal registration received.");
}

export function handleHealth(req, res) {
  if (req.method === "OPTIONS") {
    return sendNoContent(req, res);
  }

  if (req.method !== "GET") {
    return sendJson(req, res, 405, { ok: false, message: "Method not allowed." });
  }

  return sendJson(req, res, 200, {
    ok: true,
    databaseConfigured: isDatabaseConfigured()
  });
}

export async function handleLeadEndpoint(req, res, type) {
  if (req.method === "OPTIONS") {
    return sendNoContent(req, res);
  }

  if (req.method !== "POST") {
    return sendJson(req, res, 405, { ok: false, message: "Method not allowed." });
  }

  const body = await parseBody(req);

  if (!body) {
    return sendJson(req, res, 400, { ok: false, message: "Invalid JSON payload." });
  }

  return handleLead(req, res, body, type);
}

export async function handlePartnerEndpoint(req, res, type) {
  if (req.method === "OPTIONS") {
    return sendNoContent(req, res);
  }

  if (req.method !== "POST") {
    return sendJson(req, res, 405, { ok: false, message: "Method not allowed." });
  }

  const body = await parseBody(req);

  if (!body) {
    return sendJson(req, res, 400, { ok: false, message: "Invalid JSON payload." });
  }

  if (type === "login") return handlePartnerLogin(req, res, body);
  if (type === "password-reset") return handlePartnerPasswordReset(req, res, body);
  if (type === "register") return handlePartnerRegister(req, res, body);
  if (type === "deal") return handleDealRegistration(req, res, body);

  return sendJson(req, res, 404, { ok: false, message: "Route not found." });
}
