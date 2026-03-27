import {
  chatMessagePayloadSchema,
  notificationPayloadSchema,
} from "@repo/validation"
import useAppStore from "@/stores/app-store"

export const handlers: Record<string, (payload: unknown) => void> = {
  chat_message: (payload) => {
    try {
      const message = chatMessagePayloadSchema.parse(payload)
      const { addMessage, updateRoomLastMessage } = useAppStore.getState()

      console.log(message)
      addMessage(message.roomId, message)
      updateRoomLastMessage(message.roomId, message)
    } catch {}
  },
  notification: (payload) => {
    try {
      notificationPayloadSchema.parse(payload)
    } catch {}
  },
}
