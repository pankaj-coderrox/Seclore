import { handlePartnerEndpoint } from "./_shared.js";

export default function handler(req, res) {
  return handlePartnerEndpoint(req, res, "register");
}
