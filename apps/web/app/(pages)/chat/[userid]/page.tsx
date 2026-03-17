"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import ChatSection from "./chatSection"
import RoomsSection from "./roomsSection"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import axios from "axios"
import { UserRecord } from "@repo/validation"
import { wsClient } from "@/app/ws"

export default function HomePage() {
  const userArvUrl = process.env.NEXT_PUBLIC_USER_SRV_URL
  const router = useRouter()
  const { userid } = useParams<{ userid: string }>()

  const [user, setUser] = useState<UserRecord | null>(null)

  const getUser = async () => {
    try {
      const res = await axios.get(`${userArvUrl}?id=${userid}`)
      setUser(res.data.data.user as UserRecord)
    } catch (error) {
      router.push("/auth")
    }
  }

  useEffect(() => {
    if (!userid) return
    ;(async () => await getUser())()
  }, [userid])

  useEffect(() => {
    if (!user) return
    wsClient.connect(user)
    return () => wsClient.close()
  }, [user?.id])

  return (
    <div className="h-svh w-full">
      <ResizablePanelGroup
        // direction="horizontal"
        className="h-full w-full rounded-lg"
      >
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full overflow-auto">
            <RoomsSection />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="h-full overflow-auto">
            <ChatSection />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
