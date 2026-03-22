import { create, type StateCreator } from "zustand"
import { devtools, persist } from "zustand/middleware"

import type {
  UserRecord,
  RoomRecord,
  ChatMessagePayload,
} from "@repo/validation"

interface UserState {
  user: UserRecord | null
  setUser: (user: UserRecord) => void
}

interface RoomsState {
  rooms: RoomRecord[]
  setRooms: (rooms: RoomRecord[]) => void
  updateRoomLastMessage: (roomId: string, message: ChatMessagePayload) => void
}

interface MessagesState {
  messages: Record<string, ChatMessagePayload[]>
  addMessage: (roomId: string, msg: ChatMessagePayload) => void
  setMessages: (roomId: string, msgs: ChatMessagePayload[]) => void
}

type AppState = UserState & RoomsState & MessagesState

// Slices

const createUserSlice: StateCreator<AppState, [], [], UserState> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
})

const createRoomsSlice: StateCreator<AppState, [], [], RoomsState> = (set) => ({
  rooms: [],
  setRooms: (rooms) => set({ rooms }),

  updateRoomLastMessage: (roomId, message) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, lastMessage: message } : room
      ),
    })),
})

const createMessagesSlice: StateCreator<AppState, [], [], MessagesState> = (
  set
) => ({
  messages: {},

  addMessage: (roomId, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] ?? []), msg],
      },
    })),

  setMessages: (roomId, msgs) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: msgs,
      },
    })),
})

// Store

const useAppStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createRoomsSlice(...a),
        ...createMessagesSlice(...a),
      }),
      {
        name: "collab-store",
        partialize: (state) => ({
          user: state.user,
          rooms: state.rooms,
        }),
      }
    )
  )
)

export default useAppStore
