"use client"

import { useRouter } from "next/navigation"
import { NewEventChooser } from "@/components/NewEventChooser"

// Direct visits to /dashboard/events/new without a kind get the same chooser.
export function ChooseKind() {
  const router = useRouter()
  return <NewEventChooser open onClose={() => router.push("/dashboard/events")} />
}
