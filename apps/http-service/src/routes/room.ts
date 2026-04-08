import { Router } from 'express';
import {
  addRoomMembersSchema,
  createRoomSchema,
  deleteRoomSchema,
  editRoomSchema,
  getRoomSchema,
  removeRoomMemberSchema,
} from '@repo/validation';
import { addRoomMembers } from '../controllers/room/addRoomMembers.js';
import { createRoom } from '../controllers/room/createRoom.js';
import { deleteRoom } from '../controllers/room/deleteRoom.js';
import { editRoom } from '../controllers/room/editRoom.js';
import { getRoom } from '../controllers/room/getRoom.js';
import { removeRoomMember } from '../controllers/room/removeRoomMember.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const roomRouter: Router = Router();

roomRouter.post('/', validateRequest(createRoomSchema), asyncHandler(createRoom));
roomRouter.get('/:id', validateRequest(getRoomSchema), asyncHandler(getRoom));
roomRouter.post('/:id/members', validateRequest(addRoomMembersSchema), asyncHandler(addRoomMembers));
roomRouter.delete(
  '/:id/members/:memberId',
  validateRequest(removeRoomMemberSchema),
  asyncHandler(removeRoomMember),
);
roomRouter.patch('/:id', validateRequest(editRoomSchema), asyncHandler(editRoom));
roomRouter.delete('/:id', validateRequest(deleteRoomSchema), asyncHandler(deleteRoom));
