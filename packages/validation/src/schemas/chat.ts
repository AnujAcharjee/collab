import { string, z } from 'zod';

const charMessageBaseSchema = z.object({
  sender: z.string({ message: 'Sender must be a string' }),
  text: z
    .string({ message: 'Message text must be a string' })
    .min(1, { message: 'Message text must be at least 1 character' })
    .max(500, { message: 'Message text must be at most 500 characters' })
    .optional(), // for attachments-only messages
  attachments: z.string({ message: 'Attachments must be a string' }).optional(), // JSON string
  roomId: z.string({ message: 'Room id must be a string' }),
  parentId: z.uuidv4({ message: 'Parent id must be a valid uuidv4' }).optional(),
});

export const chatMessageSchema = z.object({
  body: charMessageBaseSchema,
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatMessagePayloadSchema = charMessageBaseSchema.extend({
  id: z.uuidv4({ message: 'Message id must be a valid uuidv4' }),
  createdAt: z.iso.datetime({ message: 'Created at must be a valid ISO datetime' }),
});

export type ChatMessagePayload = z.infer<typeof chatMessagePayloadSchema>;

export const chatMessagePayloadAndReceiversSchema = chatMessagePayloadSchema.extend({
  receivers: z
    .array(z.string(), { message: 'Receivers must be an array of strings' })
    .min(1, { message: 'At least one receiver is required' }),
});

export type ChatMessagePayloadAndReceivers = z.infer<typeof chatMessagePayloadAndReceiversSchema>;
