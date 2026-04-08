import { z } from 'zod';
import { chatMessagePayloadSchema } from './chat.js';

export const notificationPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  timestamp: z.number(),
});

export const roomMemberRemovedPayloadSchema = z.object({
  roomId: z.string().uuid({ message: 'roomId must be a valid UUID' }),
  removedUserId: z.string().uuid({ message: 'removedUserId must be a valid UUID' }),
  removedUsername: z.string().trim().min(1, { message: 'removedUsername is required' }),
});

export const roomMemberRemovedPayloadAndReceiversSchema = roomMemberRemovedPayloadSchema.extend({
  receivers: z.array(z.string(), { message: 'Receivers must be an array of strings' }).min(1),
});

export const wsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chat_message'),
    payload: chatMessagePayloadSchema,
  }),
  z.object({
    type: z.literal('room_member_removed'),
    payload: roomMemberRemovedPayloadSchema,
  }),
  z.object({
    type: z.literal('notification'),
    payload: notificationPayloadSchema,
  }),
]);

export type WsMessage = z.infer<typeof wsMessageSchema>;
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
export type RoomMemberRemovedPayload = z.infer<typeof roomMemberRemovedPayloadSchema>;
export type RoomMemberRemovedPayloadAndReceivers = z.infer<
  typeof roomMemberRemovedPayloadAndReceiversSchema
>;
