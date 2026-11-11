import Link from "next/link"
import { Icon } from "@/components/Icon"

export default function NotFound() {
  return (
    <div className="wrap--narrow">
      <div className="card empty" style={{ marginTop: 48 }}>
        <Icon name="search" size={48} />
        <h2>We couldn&rsquo;t find that page</h2>
        <p>The event may have been unpublished, or the link is mistyped.</p>
        <Link href="/" className="btn btn--primary"><span>Go home</span><span className="btn__arrow" aria-hidden="true"><Icon name="arrow" /></span></Link>
      </div>
    </div>
  )
}
