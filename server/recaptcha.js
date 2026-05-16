export async function verifyRecaptchaToken(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY || "";

  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, message: "Please complete the reCAPTCHA." };
  }

  const body = new URLSearchParams({
    secret,
    response: token
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const result = await response.json();

    if (!result.success) {
      return { ok: false, message: "reCAPTCHA verification failed. Please try again." };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "We could not verify reCAPTCHA. Please try again shortly." };
  }
}
