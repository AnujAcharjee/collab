"use client"

import { useParams } from "next/navigation"
import useAppStore from "@/stores/app-store"
import { useHydrate } from "@/hooks/useHydrate"

export function useHomePage() {
  const { userid } = useParams<{ userid: string }>()
  const { hasHydrated, fetch, user, rooms } = useHydrate(userid)

  const activeRoomId = useAppStore((s) => s.activeRoom)
  const isCurrentUser = user?.id === userid

  const storeRooms = useAppStore((s) => s.rooms)
  const activeRoom =
    rooms.find((r) => r.id === activeRoomId) ??
    storeRooms.find((r) => r.id === activeRoomId) ??
    null

  return {
    userid,
    hasHydrated,
    fetch,
    user,
    isCurrentUser,
    activeRoom,
  }
}
