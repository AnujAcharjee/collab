import { Router } from 'express';
import {
  createUserSchema,
  deleteUserSchema,
  editUserSchema,
  getUserSchema,
  issueTicketSchema,
} from '@repo/validation';
import { createUser } from '../controllers/createUser.js';
import { deleteUser } from '../controllers/deleteUser.js';
import { editUser } from '../controllers/editUser.js';
import { getUser } from '../controllers/getUser.js';
import { issueTicket } from '../controllers/issueTicket.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userRouter: Router = Router();

userRouter.post('/', validateRequest(createUserSchema), asyncHandler(createUser));
userRouter.get('/', validateRequest(getUserSchema), asyncHandler(getUser));
userRouter.get('/:id', validateRequest(getUserSchema), asyncHandler(getUser));
userRouter.patch('/:id', validateRequest(editUserSchema), asyncHandler(editUser));
userRouter.delete('/:id', validateRequest(deleteUserSchema), asyncHandler(deleteUser));

userRouter.post('/ws-ticket', validateRequest(issueTicketSchema), asyncHandler(issueTicket));
