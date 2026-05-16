import { handleLeadEndpoint } from "./_shared.js";

export default function handler(req, res) {
  return handleLeadEndpoint(req, res, "contact");
}
