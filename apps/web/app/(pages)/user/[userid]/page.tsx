"use client"

import { useParams } from "next/navigation"
import { useEffect, useSyncExternalStore } from "react"
import useAppStore from "@/stores/app-store"
import ChatSection from "./chatSection"
import RoomsSection from "./roomsSection"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { wsClient } from "@/ws"
import { useHydrate } from "@/hooks/useHydrate"

const largeScreenQuery = "(min-width: 1024px)"

function subscribeToLargeScreen(callback: () => void) {
  const mediaQuery = window.matchMedia(largeScreenQuery)
  mediaQuery.addEventListener("change", callback)

  return () => mediaQuery.removeEventListener("change", callback)
}

function getLargeScreenSnapshot() {
  return window.matchMedia(largeScreenQuery).matches
}

export default function HomePage() {
  const { userid } = useParams<{ userid: string }>()
  const { hasHydrated, fetch, user, rooms } = useHydrate(userid)
  const activeRoomId = useAppStore((state) => state.activeRoom)
  const isCurrentUser = user?.id === userid
  const visibleRooms = isCurrentUser ? rooms : []

  const isLg = useSyncExternalStore(
    subscribeToLargeScreen,
    getLargeScreenSnapshot,
    () => false
  )

  const activeRoom =
    visibleRooms.find((room) => room.id === activeRoomId) ?? null

  // Hydrate
  useEffect(() => {
    if (!hasHydrated) return // wait for persist

    void fetch()
  }, [fetch, hasHydrated])

  // Connect Ws
  useEffect(() => {
    if (!isCurrentUser || !user?.id) return
    wsClient.connect(user)
    return () => wsClient.close()
  }, [isCurrentUser, user])

  return (
    <div className="h-svh w-full">
      <ResizablePanelGroup className="h-full w-full rounded-lg">
        {(isLg || !activeRoom) && (
          <>
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full overflow-auto">
                {isCurrentUser && <RoomsSection />}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="h-full overflow-auto">
            <ChatSection room={activeRoom} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
