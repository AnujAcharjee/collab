import { Router } from 'express';
import { createRoomSchema, deleteRoomSchema, editRoomSchema, getRoomSchema } from '@repo/validation';
import { createRoom } from '../controllers/room/createRoom.js';
import { deleteRoom } from '../controllers/room/deleteRoom.js';
import { editRoom } from '../controllers/room/editRoom.js';
import { getRoom } from '../controllers/room/getRoom.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const roomRouter: Router = Router();

roomRouter.post('/', validateRequest(createRoomSchema), asyncHandler(createRoom));
roomRouter.get('/:id', validateRequest(getRoomSchema), asyncHandler(getRoom));
roomRouter.patch('/:id', validateRequest(editRoomSchema), asyncHandler(editRoom));
roomRouter.delete('/:id', validateRequest(deleteRoomSchema), asyncHandler(deleteRoom));
