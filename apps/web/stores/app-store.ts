import { create, type StateCreator } from "zustand"
import { devtools, persist } from "zustand/middleware"

import type {
  UserRecord,
  RoomRecord,
  ChatMessagePayload,
} from "@repo/validation"

export type RoomMessage = ChatMessagePayload & {
  senderUsername?: string
  senderAvatarUrl?: string
  isDeleted?: boolean
}

export type RoomUiOptions = {
  pinned: boolean
  muted: boolean
  unread: boolean
}

/**
 * Here only User and rooms are stored in Indexed Db
 */

interface UserState {
  user: UserRecord | null
  setUser: (user: UserRecord | null) => void
}

interface RoomsState {
  rooms: RoomRecord[]
  activeRoom: string | null
  roomUiOptions: Record<string, RoomUiOptions>
  setRooms: (rooms: RoomRecord[]) => void
  upsertRoom: (room: RoomRecord) => void
  removeRoom: (roomId: string) => void
  toggleRoomPinned: (roomId: string) => void
  toggleRoomMuted: (roomId: string) => void
  toggleRoomUnread: (roomId: string) => void
  clearRoomUnread: (roomId: string) => void
  updateRoomLastMessage: (roomId: string, message: ChatMessagePayload) => void
  updateRoomInfo: (roomId: string, data: Partial<RoomRecord>) => void
  setActiveRoom: (roomId: string | null) => void
}

interface MessagesState {
  messages: Record<string, RoomMessage[]>
  addMessage: (roomId: string, msg: RoomMessage) => void
  setMessages: (roomId: string, msgs: RoomMessage[]) => void
  clearMessages: (roomId: string) => void
}

interface HydrationState {
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
}

interface AppActions {
  hydrateUserState: (payload: { user: UserRecord; rooms: RoomRecord[] }) => void
  resetAppState: () => void
}

type AppState = UserState &
  RoomsState &
  MessagesState &
  HydrationState &
  AppActions

function getNextActiveRoomId(
  rooms: RoomRecord[],
  currentActiveRoom: string | null
) {
  if (!rooms.length) {
    return null
  }

  if (
    currentActiveRoom &&
    rooms.some((room) => room.id === currentActiveRoom)
  ) {
    return currentActiveRoom
  }

  return rooms[0].id
}

function mergeRoomMessages(
  currentMessages: RoomMessage[],
  incomingMessages: RoomMessage[]
) {
  const mergedMessages = new Map(
    currentMessages.map((message) => [message.id, message])
  )

  for (const message of incomingMessages) {
    mergedMessages.set(message.id, message)
  }

  return [...mergedMessages.values()].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  )
}

// Slices

const createUserSlice: StateCreator<AppState, [], [], UserState> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
})

const createRoomsSlice: StateCreator<AppState, [], [], RoomsState> = (set) => ({
  rooms: [],
  activeRoom: null,
  roomUiOptions: {},
  setRooms: (rooms) =>
    set((state) => ({
      rooms,
      activeRoom: getNextActiveRoomId(rooms, state.activeRoom),
      roomUiOptions: rooms.reduce<Record<string, RoomUiOptions>>(
        (acc, room) => {
          acc[room.id] = state.roomUiOptions[room.id] ?? {
            pinned: false,
            muted: false,
            unread: false,
          }

          return acc
        },
        {}
      ),
    })),
  upsertRoom: (room) =>
    set((state) => {
      const roomExists = state.rooms.some(
        (existingRoom) => existingRoom.id === room.id
      )
      const rooms = roomExists
        ? state.rooms.map((existingRoom) =>
            existingRoom.id === room.id ? room : existingRoom
          )
        : [...state.rooms, room]

      return {
        rooms,
        activeRoom: state.activeRoom ?? room.id,
        roomUiOptions: {
          ...state.roomUiOptions,
          [room.id]: state.roomUiOptions[room.id] ?? {
            pinned: false,
            muted: false,
            unread: false,
          },
        },
      }
    }),
  removeRoom: (roomId) =>
    set((state) => {
      const rooms = state.rooms.filter((room) => room.id !== roomId)
      const roomUiOptions = { ...state.roomUiOptions }
      delete roomUiOptions[roomId]

      return {
        rooms,
        activeRoom: getNextActiveRoomId(rooms, state.activeRoom),
        roomUiOptions,
      }
    }),
  toggleRoomPinned: (roomId) =>
    set((state) => ({
      roomUiOptions: {
        ...state.roomUiOptions,
        [roomId]: {
          pinned: !(state.roomUiOptions[roomId]?.pinned ?? false),
          muted: state.roomUiOptions[roomId]?.muted ?? false,
          unread: state.roomUiOptions[roomId]?.unread ?? false,
        },
      },
    })),
  toggleRoomMuted: (roomId) =>
    set((state) => ({
      roomUiOptions: {
        ...state.roomUiOptions,
        [roomId]: {
          pinned: state.roomUiOptions[roomId]?.pinned ?? false,
          muted: !(state.roomUiOptions[roomId]?.muted ?? false),
          unread: state.roomUiOptions[roomId]?.unread ?? false,
        },
      },
    })),
  toggleRoomUnread: (roomId) =>
    set((state) => ({
      roomUiOptions: {
        ...state.roomUiOptions,
        [roomId]: {
          pinned: state.roomUiOptions[roomId]?.pinned ?? false,
          muted: state.roomUiOptions[roomId]?.muted ?? false,
          unread: !(state.roomUiOptions[roomId]?.unread ?? false),
        },
      },
    })),
  clearRoomUnread: (roomId) =>
    set((state) => ({
      roomUiOptions: {
        ...state.roomUiOptions,
        [roomId]: {
          pinned: state.roomUiOptions[roomId]?.pinned ?? false,
          muted: state.roomUiOptions[roomId]?.muted ?? false,
          unread: false,
        },
      },
    })),

  updateRoomLastMessage: (roomId, message) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, lastMessage: message } : room
      ),
    })),

  updateRoomInfo: (roomId, data) => {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, ...data } : room
      ),
    }))
  },

  setActiveRoom: (roomId) => set({ activeRoom: roomId }),
})

const createMessagesSlice: StateCreator<AppState, [], [], MessagesState> = (
  set
) => ({
  messages: {},

  addMessage: (roomId, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: mergeRoomMessages(state.messages[roomId] ?? [], [msg]),
      },
    })),

  setMessages: (roomId, msgs) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: mergeRoomMessages(state.messages[roomId] ?? [], msgs),
      },
    })),

  clearMessages: (roomId) =>
    set((state) => {
      const messages = { ...state.messages }

      delete messages[roomId]

      return { messages }
    }),
})

const createHydrationSlice: StateCreator<AppState, [], [], HydrationState> = (
  set
) => ({
  hasHydrated: false,
  setHasHydrated: (v) => set({ hasHydrated: v }),
})

const createAppActionsSlice: StateCreator<AppState, [], [], AppActions> = (
  set
) => ({
  hydrateUserState: ({ user, rooms }) =>
    set((state) => ({
      user,
      rooms,
      activeRoom: getNextActiveRoomId(rooms, state.activeRoom),
    })),
  resetAppState: () =>
    set({
      user: null,
      rooms: [],
      activeRoom: null,
      roomUiOptions: {},
      messages: {},
    }),
})

// Store

const useAppStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createRoomsSlice(...a),
        ...createMessagesSlice(...a),
        ...createHydrationSlice(...a),
        ...createAppActionsSlice(...a),
      }),
      {
        name: "collab-store",
        partialize: (state) => ({
          user: state.user,
          rooms: state.rooms,
          activeRoom: state.activeRoom,
          roomUiOptions: state.roomUiOptions,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true)
        },
      }
    )
  )
)

export default useAppStore
