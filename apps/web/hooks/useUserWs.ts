"use client"

import { useEffect } from "react"
import { wsClient } from "@/ws"

function isWsUser(user: any): user is {
  id: string
  username: string
  email: string
} {
  return !!user?.id && !!user?.username && !!user?.email
}

export function useUserWs(user: any) {
  useEffect(() => {
    if (!isWsUser(user)) return

    wsClient.connect(user)

    return () => wsClient.close()
  }, [user])
}
