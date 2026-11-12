"use server"

import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/supabase/server"

export type RateState = { status: "idle" | "ok" | "error"; message?: string }

export async function rateHost(_prev: RateState, fd: FormData): Promise<RateState> {
  const { supabase, userId } = await getUserId()
  if (!userId) return { status: "error", message: "Sign in to rate the host." }
  const eventId = String(fd.get("event_id") ?? "")
  const slug = String(fd.get("slug") ?? "")
  const stars = Number(fd.get("stars"))
  const comment = String(fd.get("comment") ?? "").trim()
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { status: "error", message: "Choose from 1 to 5 stars." }
  if (comment.length > 280) return { status: "error", message: "Keep your comment to 280 characters." }

  const { error } = await supabase
    .from("event_ratings")
    .upsert({ event_id: eventId, stars, comment }, { onConflict: "event_id,user_id" })
  if (error) {
    return { status: "error", message: "Ratings open after the event ends, and hosts can't rate their own events." }
  }
  revalidatePath(`/e/${slug}`)
  revalidatePath("/dashboard")
  return { status: "ok", message: "Thanks. Your rating is saved." }
}
