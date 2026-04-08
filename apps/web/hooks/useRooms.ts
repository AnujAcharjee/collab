"use client"

import { useCallback } from "react"
import axios from "axios"

import { roomsApiUrl } from "@/constants/apiUrls"
import type {
  CreateRoomInput,
  EditRoomRequest,
  RoomRecord,
} from "@repo/validation"

type RoomResponse = {
  data?: {
    room?: RoomRecord
  }
  error?: string
  message?: string
}

type DeleteRoomResponse = {
  data?: {
    id?: string
  }
  error?: string
  message?: string
}

export const useRooms = () => {
  const createRoom = useCallback(async (payload: CreateRoomInput) => {
    const res = await axios.post<RoomResponse>(roomsApiUrl, payload)
    const room = res.data.data?.room

    if (!room) {
      throw new Error("Room was not returned")
    }

    return room
  }, [])

  const updateRoom = useCallback(
    async (roomId: string, payload: EditRoomRequest["body"]) => {
      const res = await axios.patch<RoomResponse>(
        `${roomsApiUrl}/${roomId}`,
        payload
      )
      const room = res.data.data?.room

      if (!room) {
        throw new Error("Room was not returned")
      }

      return room
    },
    []
  )

  const deleteRoom = useCallback(async (roomId: string) => {
    const res = await axios.delete<DeleteRoomResponse>(
      `${roomsApiUrl}/${roomId}`
    )
    const deletedRoomId = res.data.data?.id

    if (!deletedRoomId) {
      throw new Error("Room was not returned")
    }

    return deletedRoomId
  }, [])

  return {
    createRoom,
    updateRoom,
    deleteRoom,
  }
}
