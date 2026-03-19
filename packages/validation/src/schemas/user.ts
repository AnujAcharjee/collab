import { z } from 'zod';

const optionalTrimmedString = z
  .string({ message: 'Value must be a string' })
  .trim()
  .min(1, { message: 'Value cannot be empty' })
  .optional();

const uuidSchema = (message: string) => z.string().uuid({ message });
const isoDatetimeSchema = (message: string) => z.string().datetime({ message });

const userBaseSchema = z.object({
  email: z
    .string()
    .email({ message: 'email must be valid' })
    .transform((value) => value.toLowerCase()),
  username: z
    .string({ message: 'username must be a string' })
    .trim()
    .min(1, { message: 'username is required' })
    .max(50, { message: 'username must be at most 50 characters' }),
  name: optionalTrimmedString.refine(
    (value) => value === undefined || value.length <= 100,
    'name must be at most 100 characters',
  ),
  bio: optionalTrimmedString.refine(
    (value) => value === undefined || value.length <= 255,
    'bio must be at most 255 characters',
  ),
  avatarUrl: optionalTrimmedString.refine(
    (value) => value === undefined || z.string().url().safeParse(value).success,
    'avatarUrl must be a valid URL',
  ),
});

export const createUserFromSchema = userBaseSchema;

export const createUserSchema = z.object({
  body: createUserFromSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];

export const signinUserFromSchema = z.object({
  email: z
    .string()
    .email({ message: 'email must be valid' })
    .transform((value) => value.toLowerCase()),
  username: z
    .string({ message: 'username must be a string' })
    .trim()
    .min(1, { message: 'username is required' })
    .max(50, { message: 'username must be at most 50 characters' }),
});

export type SigninUserForm = z.infer<typeof signinUserFromSchema>;

const editUserBodySchema = userBaseSchema.partial().superRefine((body, ctx) => {
  if (
    body.email === undefined &&
    body.username === undefined &&
    body.name === undefined &&
    body.bio === undefined &&
    body.avatarUrl === undefined
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide at least one field to update',
    });
  }
});

export const editUserSchema = z.object({
  params: z.object({
    id: uuidSchema('id must be a valid UUID'),
  }),
  body: editUserBodySchema,
});

export type EditUserRequest = z.infer<typeof editUserSchema>;

export const deleteUserSchema = z.object({
  params: z.object({
    id: uuidSchema('id must be a valid UUID'),
  }),
});

export type DeleteUserRequest = z.infer<typeof deleteUserSchema>;

export const getUserSchema = z
  .object({
    params: z.object({
      id: uuidSchema('id must be a valid UUID').optional(),
    }),
    query: z.object({
      id: uuidSchema('id must be a valid UUID').optional(),
      email: z.string().email({ message: 'email must be valid' }).optional(),
      username: z.string().trim().min(1, { message: 'username cannot be empty' }).optional(),
    }),
  })
  .superRefine(({ params, query }, ctx) => {
    if (!params.id && !query.id && !query.email && !query.username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide one of id, email, or username to fetch a user',
      });
    }
  });

export type GetUserRequest = z.infer<typeof getUserSchema>;

export const issueTicketSchema = z.object({
  body: z.object({
    id: uuidSchema('user id must be a valid UUID'),
    username: z
      .string({ message: 'username must be a string' })
      .trim()
      .min(1, { message: 'username is required' })
      .max(50, { message: 'username must be at most 50 characters' }),
    email: z
      .string()
      .email({ message: 'email must be valid' })
      .transform((value) => value.toLowerCase()),
  }),
});

export type IssueTicketRequest = z.infer<typeof issueTicketSchema>;

export const issueTicketResponseSchema = z.object({
  ticket: uuidSchema('ticket must be a valid UUID'),
});

export type IssueTicketResponse = z.infer<typeof issueTicketResponseSchema>;

export const userResponseSchema = userBaseSchema.extend({
  id: uuidSchema('id must be a valid UUID'),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  lastLogin: isoDatetimeSchema('lastLogin must be a valid ISO datetime').nullable(),
  createdAt: isoDatetimeSchema('createdAt must be a valid ISO datetime'),
  updatedAt: isoDatetimeSchema('updatedAt must be a valid ISO datetime'),
});

export type UserRecord = z.infer<typeof userResponseSchema>;
