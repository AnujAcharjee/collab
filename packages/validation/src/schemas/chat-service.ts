import { z } from 'zod';

export const chatMessageSchema = z.object({
  body: z.object({
    sender: z.string({ message: 'Sender must be a string' }),
    text: z
      .string({ message: 'Message text must be a string' })
      .min(1, { message: 'Message text must be at least 1 character' })
      .max(500, { message: 'Message text must be at most 500 characters' }),
    receiver: z.string({ message: 'Receiver must be a string' }),
  }),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
