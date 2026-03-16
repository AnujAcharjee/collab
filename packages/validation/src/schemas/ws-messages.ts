import { z } from 'zod';
import { chatMessagePayloadSchema } from './chat';

const notificationPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  timestamp: z.number(),
});

export const wsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chat_message'),
    payload: chatMessagePayloadSchema,
  }),
  z.object({
    type: z.literal('notification'),
    payload: notificationPayloadSchema,
  }),
]);

export type WsMessage = z.infer<typeof wsMessageSchema>;
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
