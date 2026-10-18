/**
 * POST /api/contact — general inquiries from the site's contact form.
 *
 * Every valid inquiry is stored as a Netlify Forms submission (visible in the
 * Netlify dashboard under Forms → "inquiry"), so nothing is lost while there is
 * no inbox yet. Email delivery switches on by itself once these environment
 * variables are set in Netlify (Site configuration → Environment variables):
 *
 *   CONTACT_TO_EMAIL    where inquiries go (placeholder: hosts@example.com)
 *   CONTACT_FROM_EMAIL  sender, on a domain verified with Resend
 *   RESEND_API_KEY      https://resend.com API key
 */

const PLACEHOLDER_RECIPIENT = "hosts@example.com";
const LIMITS = { name: 120, email: 200, message: 5000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body, status) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const clean = (value, limit) => (typeof value === "string" ? value.trim().slice(0, limit) : "");

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function recipient() {
  const configured = process.env.CONTACT_TO_EMAIL?.trim();
  if (!configured || configured === PLACEHOLDER_RECIPIENT || configured.endsWith("@example.com")) return null;
  return configured;
}

async function sendEmail(inquiry) {
  const to = recipient();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!to || !apiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL?.trim() || "Minpaku <hello@minpaku.ca>",
      to: [to],
      reply_to: inquiry.email,
      subject: `New inquiry from ${inquiry.name}`,
      text: `${inquiry.message}\n\n— ${inquiry.name} <${inquiry.email}> · site language: ${inquiry.language}`,
      html: `<p>${escapeHtml(inquiry.message).replace(/\n/g, "<br>")}</p><p>— ${escapeHtml(inquiry.name)} &lt;${escapeHtml(inquiry.email)}&gt; · site language: ${escapeHtml(inquiry.language)}</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend responded ${response.status}`);
  return true;
}

/** Saves the inquiry as a Netlify Forms submission (only possible on a deployed site). */
async function storeSubmission(inquiry) {
  const siteUrl = process.env.URL;
  if (!siteUrl) return false;
  const response = await fetch(`${siteUrl}/`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ "form-name": "inquiry", ...inquiry }).toString(),
  });
  return response.ok;
}

export default async function handler(request) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Bots fill the hidden "company" field; pretend all is well and drop it.
  if (clean(body.company, 200)) return json({ ok: true, delivered: false }, 200);

  const inquiry = {
    name: clean(body.name, LIMITS.name),
    email: clean(body.email, LIMITS.email),
    message: clean(body.message, LIMITS.message),
    language: body.language === "ja" ? "ja" : "en",
  };
  const fields = [];
  if (!inquiry.name) fields.push("name");
  if (!EMAIL_PATTERN.test(inquiry.email)) fields.push("email");
  if (!inquiry.message) fields.push("message");
  if (fields.length) return json({ ok: false, error: "invalid", fields }, 422);

  const [stored, delivered] = await Promise.all([
    storeSubmission(inquiry).catch((error) => {
      console.error("[contact] could not store submission", error);
      return false;
    }),
    sendEmail(inquiry).catch((error) => {
      console.error("[contact] email failed", error);
      return false;
    }),
  ]);
  console.log(`[contact] inquiry from ${inquiry.email} · stored: ${stored} · emailed: ${delivered}`);
  return json({ ok: true, delivered, stored }, 200);
}

export const config = { path: "/api/contact" };
