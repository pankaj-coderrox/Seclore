import "dotenv/config";
import { connectDatabase, databaseErrorMessage, isDatabaseConfigured } from "../../server/db.js";
import { Lead } from "../../server/models/Lead.js";
import { verifyRecaptchaToken } from "../../server/recaptcha.js";
import { validateDealRegistration, validateLead, validatePartnerRegistration } from "../../server/validation.js";

function allowedOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || "";
  const configuredOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.URL,
    process.env.DEPLOY_URL,
    process.env.DEPLOY_PRIME_URL
  ]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!origin) {
    return configuredOrigins[0] || "*";
  }

  const isLocalDevOrigin = /^http:\/\/(127\.0\.0\.1|localhost|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):\d+$/.test(origin);

  if (configuredOrigins.includes(origin) || isLocalDevOrigin) {
    return origin;
  }

  return configuredOrigins[0] || "null";
}

function responseHeaders(event) {
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigin(event),
    "Content-Type": "application/json",
    "Vary": "Origin"
  };
}

function json(event, statusCode, body) {
  return {
    statusCode,
    headers: responseHeaders(event),
    body: JSON.stringify(body)
  };
}

function routeFromEvent(event) {
  const path = event.path || "";
  const marker = "/.netlify/functions/api";

  if (path.startsWith(marker)) {
    return `/api${path.slice(marker.length) || "/health"}`;
  }

  return path;
}

function parseBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    return null;
  }
}

async function saveLead(event, lead, successMessage) {
  if (!isDatabaseConfigured()) {
    console.info("Lead accepted without database storage:", lead);
    return json(event, 202, { ok: true, message: successMessage });
  }

  try {
    await connectDatabase();
    const savedLead = await Lead.create(lead);
    return json(event, 201, { ok: true, message: successMessage, leadId: savedLead._id });
  } catch (error) {
    console.error(error);
    return json(event, 500, { ok: false, message: databaseErrorMessage(error) });
  }
}

async function handleLead(event, body, type) {
  const result = validateLead(body, type);

  if (!result.valid) {
    return json(event, 400, {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: result.errors
    });
  }

  if (type === "demo") {
    const recaptcha = await verifyRecaptchaToken(body.recaptchaToken, event.headers["x-forwarded-for"]);

    if (!recaptcha.ok) {
      return json(event, 400, {
        ok: false,
        message: recaptcha.message || "Please complete the reCAPTCHA.",
        errors: { recaptcha: recaptcha.message || "Please complete the reCAPTCHA." }
      });
    }
  }

  return saveLead(event, result.lead, type === "demo" ? "Demo request received." : "Message received.");
}

function handlePartnerLogin(event, body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || !password) {
    return json(event, 400, { ok: false, message: "Enter your email address and password to sign in." });
  }

  return json(event, 200, {
    ok: true,
    message: "Signed in to the partner portal preview.",
    user: { email }
  });
}

function handlePartnerPasswordReset(event, body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return json(event, 400, { ok: false, message: "Enter a valid email address to reset your password." });
  }

  return json(event, 200, { ok: true, message: "Password reset instructions sent." });
}

async function handlePartnerRegister(event, body) {
  const result = validatePartnerRegistration(body);

  if (!result.valid) {
    return json(event, 400, {
      ok: false,
      message: "Please complete the required fields.",
      errors: result.errors
    });
  }

  return saveLead(event, result.lead, "Partner request received.");
}

async function handleDealRegistration(event, body) {
  const result = validateDealRegistration(body);

  if (!result.valid) {
    return json(event, 400, {
      ok: false,
      message: "Please complete the required deal registration fields.",
      errors: result.errors
    });
  }

  return saveLead(event, result.lead, "Deal registration received.");
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: responseHeaders(event), body: "" };
  }

  const route = routeFromEvent(event);

  if (event.httpMethod === "GET" && route === "/api/health") {
    return json(event, 200, {
      ok: true,
      databaseConfigured: isDatabaseConfigured()
    });
  }

  if (event.httpMethod !== "POST") {
    return json(event, 405, { ok: false, message: "Method not allowed." });
  }

  const body = parseBody(event);

  if (!body) {
    return json(event, 400, { ok: false, message: "Invalid JSON payload." });
  }

  if (route === "/api/demo") return handleLead(event, body, "demo");
  if (route === "/api/contact") return handleLead(event, body, "contact");
  if (route === "/api/partner-login") return handlePartnerLogin(event, body);
  if (route === "/api/partner-password-reset") return handlePartnerPasswordReset(event, body);
  if (route === "/api/partner-register") return handlePartnerRegister(event, body);
  if (route === "/api/register-deal") return handleDealRegistration(event, body);

  return json(event, 404, { ok: false, message: "Route not found." });
}
