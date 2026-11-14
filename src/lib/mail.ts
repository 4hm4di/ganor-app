import "server-only"

// Transactional email through Brevo's API. Quietly does nothing until BREVO_API_KEY is set in Vercel,
// so RSVPs never fail because of email. The sender must be a verified Brevo sender.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

export const emailEnabled = () => Boolean(process.env.BREVO_API_KEY)

export async function sendTicketEmail(m: { to: string; name: string; event: string; when: string; venue: string; ticket: string; code: string; link: string }) {
  const key = process.env.BREVO_API_KEY
  if (!key) return false
  const first = m.name.split(/\s+/)[0] || "there"
  const html = `<!doctype html><html><body style="margin:0;background:#F6F5FB;font-family:Arial,Helvetica,sans-serif;color:#15132A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #E7E5F0">
<tr><td style="padding:28px 28px 8px"><p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6B6880">Your ticket</p>
<h1 style="margin:8px 0 4px;font-size:22px;line-height:28px">${esc(m.event)}</h1>
<p style="margin:0;color:#6B6880;font-size:15px">${esc(m.when)}<br>${esc(m.venue)}</p></td></tr>
<tr><td style="padding:16px 28px"><p style="margin:0 0 12px;font-size:15px">Hi ${esc(first)}, you&rsquo;re on the list (${esc(m.ticket)}). Open your ticket and show the QR code at the gate.</p>
<a href="${esc(m.link)}" style="display:inline-block;background:#15132A;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px">Open my ticket</a>
<p style="margin:16px 0 0;font-size:13px;color:#6B6880">Ticket code: <b style="font-family:monospace;letter-spacing:.1em;color:#15132A">${esc(m.code)}</b><br>Keep this email. Anyone with the link can open your ticket.</p></td></tr>
<tr><td style="padding:12px 28px 24px;font-size:12px;color:#8A879C">Sent by Ganor for the event host. Questions? Reply to this email.</td></tr>
</table></td></tr></table></body></html>`
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Ganor", email: process.env.BREVO_SENDER ?? "support@ganor.ng" },
        to: [{ email: m.to, name: m.name }],
        replyTo: { email: "support@ganor.ng" },
        subject: `Your ticket: ${m.event}`,
        htmlContent: html,
        textContent: `Hi ${first}, you're on the list for ${m.event} (${m.when}, ${m.venue}).\nOpen your ticket: ${m.link}\nTicket code: ${m.code}`,
        tags: ["ticket"],
      }),
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}
