"use client"

import { useEffect } from "react"
import ChatSection from "./chatSection"
import RoomsSection from "./roomsSection"
import { useIsLargeScreen } from "@/hooks/useIsLargeScreen"
import { useHomePage } from "@/hooks/useHomePage"
import { useUserWs } from "@/hooks/useUserWs"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function HomeLayout() {
  const { hasHydrated, fetch, user, isCurrentUser, activeRoom } = useHomePage()
  const isLg = useIsLargeScreen()

  useUserWs(isCurrentUser ? user : null)

  // hydrate
  useEffect(() => {
    if (!hasHydrated) return
    void fetch()
  }, [fetch, hasHydrated])

  if (!hasHydrated) {
    return (
      <div className="flex h-svh w-full items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  const showSidebar = isLg || !activeRoom
  const showChat = isLg || !!activeRoom

  return (
    <div className="h-svh w-full">
      <ResizablePanelGroup className="h-full w-full rounded-lg">
        {showSidebar && (
          <>
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full overflow-auto">
                <RoomsSection />
              </div>
            </ResizablePanel>
            {isLg && showChat && <ResizableHandle withHandle />}
          </>
        )}
        {showChat && (
          <ResizablePanel defaultSize={isLg ? 70 : 100} minSize={40}>
            <div className="h-full overflow-auto">
              <ChatSection room={activeRoom} />
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
