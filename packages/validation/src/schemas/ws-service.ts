import { z } from 'zod';
import { chatMessagePayloadSchema } from './chat.js';

export const pubSubMessageSchema = z.object({
  text: z.string(),
  receiver: z.array(z.string()).length(1, { message: 'At least one receiver is required' }),
  sender: z.string(),
  room: z.string().optional(),
  timestamp: z.number(),
});

export type PubSubMessage = z.infer<typeof pubSubMessageSchema>;

// WS message payload schemas
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
