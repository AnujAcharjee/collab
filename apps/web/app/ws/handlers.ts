import {
  chatMessagePayloadSchema,
  notificationPayloadSchema,
} from "@repo/validation"

export const handlers: Record<string, (payload: unknown) => void> = {
  chat_message: (payload) => {
    try {
      chatMessagePayloadSchema.parse(payload)
    } catch (error) {}
  },
  notification: (payload) => {
    try {
      notificationPayloadSchema.parse(payload)
    } catch (error) {}
  },
}
