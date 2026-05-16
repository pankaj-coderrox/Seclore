import { connectDatabase, isDatabaseConfigured } from "../../server/db.js";
import { Lead } from "../../server/models/Lead.js";
import { verifyRecaptchaToken } from "../../server/recaptcha.js";
import { validateLead } from "../../server/validation.js";

const headers = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, message: "Method not allowed." });
  }

  let body;

  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { ok: false, message: "Invalid JSON payload." });
  }

  const result = validateLead(body, "demo");

  if (!result.valid) {
    return json(400, {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: result.errors
    });
  }

  const recaptcha = await verifyRecaptchaToken(body.recaptchaToken, event.headers["x-forwarded-for"]);

  if (!recaptcha.ok) {
    return json(400, {
      ok: false,
      message: recaptcha.message || "Please complete the reCAPTCHA.",
      errors: { recaptcha: recaptcha.message || "Please complete the reCAPTCHA." }
    });
  }

  if (!isDatabaseConfigured()) {
    console.info("Demo request accepted without database storage:", result.lead);
    return json(202, {
      ok: true,
      message: "Demo request received."
    });
  }

  try {
    await connectDatabase();
    const savedLead = await Lead.create(result.lead);

    return json(201, {
      ok: true,
      message: "Demo request received.",
      leadId: savedLead._id
    });
  } catch (error) {
    console.error(error);
    return json(500, {
      ok: false,
      message: "We could not save your request. Please try again shortly."
    });
  }
}
