import Link from "next/link"
import { Icon } from "@/components/Icon"
import type { SalesState } from "@/lib/sales"

// Tells a host whether their paid tickets can go on sale, and what to do if not.
export function SalesNotice({ s, style }: { s: SalesState; style?: React.CSSProperties }) {
  return (
    <div className={`alert alert--${s.tone}`} role="status" style={style}>
      <Icon name={s.icon} />
      <span><b>{s.title}</b> {s.text}</span>
      {s.cta && <Link href={s.cta.href} className="alert__link">{s.cta.label}</Link>}
    </div>
  )
}
