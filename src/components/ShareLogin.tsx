"use client"

import { useState } from "react"

// Sign-in details for a new or reset login: copy each part, copy everything, or send on WhatsApp.
export function ShareLogin({ name, username, password, url, what }: { name: string; username: string; password: string; url: string; what: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const text = `${what} sign-in for ${name}\nLink: ${url}\nUsername: ${username}\nPassword: ${password}`
  const copy = (k: string, v: string) => { navigator.clipboard?.writeText(v); setCopied(k); setTimeout(() => setCopied(null), 1600) }
  const rows: [string, string, string][] = [["link", "Sign-in link", url], ["user", "Username", username], ["pass", "Password", password]]
  return (
    <div className="creds" role="status">
      <p className="small"><b>Share these with {name} privately.</b> You won&rsquo;t see the password again after you leave this page.</p>
      <dl className="creds__list">
        {rows.map(([k, label, v]) => (
          <div key={k}>
            <dt>{label}</dt>
            <dd><code>{v}</code><button type="button" className="linkbtn" onClick={() => copy(k, v)}>{copied === k ? "Copied" : "Copy"}</button></dd>
          </div>
        ))}
      </dl>
      <div className="actions" style={{ gap: 8 }}>
        <button type="button" className="btn btn--ghost btn--xs btn--plain" onClick={() => copy("all", text)}>{copied === "all" ? "Copied" : "Copy all details"}</button>
        <a className="btn btn--primary btn--xs btn--plain" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>
      </div>
    </div>
  )
}
