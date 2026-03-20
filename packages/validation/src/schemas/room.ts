import { z } from 'zod';
import { userResponseSchema } from './user.js';

const uuidSchema = (message: string) => z.string().uuid({ message });
const isoDatetimeSchema = (message: string) => z.string().datetime({ message });

const roomNameSchema = z
  .string({ message: 'name must be a string' })
  .trim()
  .min(1, { message: 'name is required' })
  .max(100, { message: 'name must be at most 100 characters' });

const roomDescriptionSchema = z
  .string({ message: 'description must be a string' })
  .trim()
  .max(255, { message: 'description must be at most 255 characters' });

export const createRoomSchema = z.object({
  body: z.object({
    name: roomNameSchema,
    description: roomDescriptionSchema.optional(),
    isPrivate: z.boolean({ message: 'isPrivate must be a boolean' }),
    creatorId: uuidSchema('creatorId must be a valid UUID'),
  }),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>['body'];

const editRoomBodySchema = z
  .object({
    name: roomNameSchema.optional(),
    description: roomDescriptionSchema.optional(),
    isPrivate: z.boolean({ message: 'isPrivate must be a boolean' }).optional(),
  })
  .superRefine((body, ctx) => {
    if (body.name === undefined && body.description === undefined && body.isPrivate === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one field to update',
      });
    }
  });

export const editRoomSchema = z.object({
  params: z.object({
    id: uuidSchema('id must be a valid UUID'),
  }),
  body: editRoomBodySchema,
});

export type EditRoomRequest = z.infer<typeof editRoomSchema>;

export const deleteRoomSchema = z.object({
  params: z.object({
    id: uuidSchema('id must be a valid UUID'),
  }),
});

export type DeleteRoomRequest = z.infer<typeof deleteRoomSchema>;

export const getRoomSchema = z.object({
  params: z.object({
    id: uuidSchema('id must be a valid UUID'),
  }),
});

export type GetRoomRequest = z.infer<typeof getRoomSchema>;

export const roomMemberRoleSchema = z.enum(['MEMBER', 'ADMIN', 'OWNER']);

export const roomMemberResponseSchema = z.object({
  id: uuidSchema('id must be a valid UUID'),
  roomId: uuidSchema('roomId must be a valid UUID'),
  userId: uuidSchema('userId must be a valid UUID'),
  role: roomMemberRoleSchema,
  createdAt: isoDatetimeSchema('createdAt must be a valid ISO datetime'),
  user: userResponseSchema.nullable(),
});

export type RoomMemberRecord = z.infer<typeof roomMemberResponseSchema>;

export const roomResponseSchema = z.object({
  id: uuidSchema('id must be a valid UUID'),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  creatorId: uuidSchema('creatorId must be a valid UUID').nullable(),
  createdAt: isoDatetimeSchema('createdAt must be a valid ISO datetime'),
  updatedAt: isoDatetimeSchema('updatedAt must be a valid ISO datetime'),
  creator: userResponseSchema.nullable(),
  members: z.array(roomMemberResponseSchema),
});

export type RoomRecord = z.infer<typeof roomResponseSchema>;
