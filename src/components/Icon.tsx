// Line-duotone icons from the Ganor library (public/icons/sprite.svg).
export function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={`i ${className}`} width={size} height={size} aria-hidden="true" focusable="false">
      <use href={`/icons/sprite.svg#i-${name}`} />
    </svg>
  )
}
