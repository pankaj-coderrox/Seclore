import "dotenv/config";
import { connectDatabase, databaseErrorMessage, isDatabaseConfigured } from "../../server/db.js";
import { Lead } from "../../server/models/Lead.js";
import { verifyRecaptchaToken } from "../../server/recaptcha.js";
import { validateLead } from "../../server/validation.js";

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: responseHeaders(event), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(event, 405, { ok: false, message: "Method not allowed." });
  }

  let body;

  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(event, 400, { ok: false, message: "Invalid JSON payload." });
  }

  const result = validateLead(body, "demo");

  if (!result.valid) {
    return json(event, 400, {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: result.errors
    });
  }

  const recaptcha = await verifyRecaptchaToken(body.recaptchaToken, event.headers["x-forwarded-for"]);

  if (!recaptcha.ok) {
    return json(event, 400, {
      ok: false,
      message: recaptcha.message || "Please complete the reCAPTCHA.",
      errors: { recaptcha: recaptcha.message || "Please complete the reCAPTCHA." }
    });
  }

  if (!isDatabaseConfigured()) {
    console.info("Demo request accepted without database storage:", result.lead);
    return json(event, 202, {
      ok: true,
      message: "Demo request received."
    });
  }

  try {
    await connectDatabase();
    const savedLead = await Lead.create(result.lead);

    return json(event, 201, {
      ok: true,
      message: "Demo request received.",
      leadId: savedLead._id
    });
  } catch (error) {
    console.error(error);
    return json(event, 500, {
      ok: false,
      message: databaseErrorMessage(error)
    });
  }
}
