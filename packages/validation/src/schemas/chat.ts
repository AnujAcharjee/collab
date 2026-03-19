import { z } from 'zod';

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const uuidV4Schema = (message: string) => z.string({ message }).regex(uuidV4Regex, { message });
const isoDatetimeSchema = (message: string) => z.string().datetime({ message });
const messageTypeSchema = z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']);

const charMessageBaseSchema = z.object({
  sender: z.string({ message: 'Sender must be a string' }),
  text: z
    .string({ message: 'Message text must be a string' })
    .min(1, { message: 'Message text must be at least 1 character' })
    .max(500, { message: 'Message text must be at most 500 characters' })
    .optional(), // for attachments-only messages
  attachments: z.string({ message: 'Attachments must be a string' }).optional(), // JSON string
  roomId: z.string({ message: 'Room id must be a string' }),
  parentId: uuidV4Schema('Parent id must be a valid uuidv4').optional(),
});

const messageContentSchema = charMessageBaseSchema.superRefine((body, ctx) => {
  if (body.text === undefined && body.attachments === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either text or attachments must be provided',
    });
  }
});

const createMessageBodySchema = charMessageBaseSchema
  .extend({
    type: messageTypeSchema.optional(),
  })
  .superRefine((body, ctx) => {
    if (body.text === undefined && body.attachments === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either text or attachments must be provided',
      });
    }
  });

export const chatMessageSchema = z.object({
  body: messageContentSchema,
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatMessagePayloadSchema = charMessageBaseSchema.extend({
  id: uuidV4Schema('Message id must be a valid uuidv4'),
  createdAt: isoDatetimeSchema('Created at must be a valid ISO datetime'),
});

export type ChatMessagePayload = z.infer<typeof chatMessagePayloadSchema>;

export const chatMessagePayloadAndReceiversSchema = chatMessagePayloadSchema.extend({
  receivers: z
    .array(z.string(), { message: 'Receivers must be an array of strings' })
    .min(1, { message: 'At least one receiver is required' }),
});

export type ChatMessagePayloadAndReceivers = z.infer<typeof chatMessagePayloadAndReceiversSchema>;

export const createMessageSchema = z.object({
  body: createMessageBodySchema,
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const editMessageTextSchema = z.object({
  params: z.object({
    id: uuidV4Schema('Message id must be a valid uuidv4'),
  }),
  body: z.object({
    text: z
      .string({ message: 'Message text must be a string' })
      .trim()
      .min(1, { message: 'Message text must be at least 1 character' })
      .max(500, { message: 'Message text must be at most 500 characters' }),
  }),
});

export type EditMessageTextInput = z.infer<typeof editMessageTextSchema>;

export const deleteMessageSchema = z.object({
  params: z.object({
    id: uuidV4Schema('Message id must be a valid uuidv4'),
  }),
});

export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;

export const getRoomMessagesSchema = z.object({
  params: z.object({
    roomId: uuidV4Schema('Room id must be a valid uuidv4'),
  }),
  query: z.object({
    limit: z.coerce.number().int().positive().max(200).optional(),
  }),
});

export type GetRoomMessagesInput = z.infer<typeof getRoomMessagesSchema>;
