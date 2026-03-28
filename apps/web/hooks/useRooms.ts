"use client"

import { useCallback } from "react"
import axios from "axios"

import { roomsApiUrl } from "@/constants/apiUrls"
import type { CreateRoomInput, RoomRecord } from "@repo/validation"

type CreateRoomResponse = {
  data?: {
    room?: RoomRecord
  }
  error?: string
  message?: string
}

export const useRooms = () => {
  const createRoom = useCallback(async (payload: CreateRoomInput) => {
    const res = await axios.post<CreateRoomResponse>(roomsApiUrl, payload)
    const room = res.data.data?.room

    if (!room) {
      throw new Error("Room was not returned")
    }

    return room
  }, [])

  return {
    createRoom,
  }
}
