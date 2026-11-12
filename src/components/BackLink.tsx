import Link from "next/link"
import { Icon } from "./Icon"

// "← My events" style link above a page title, for pages you reach from somewhere else.
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="backlink"><Icon name="arrow-right" size={16} />{label}</Link>
  )
}

// Round × for focused tasks (new event, scanner): leaves without saving.
export function CloseLink({ href, label = "Close" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="closebtn" aria-label={label} title={label}><Icon name="close-circle" size={22} /></Link>
  )
}
