import { Router } from 'express';
import {
  chatMessageSchema,
  createMessageSchema,
  deleteMessageSchema,
  editMessageTextSchema,
  getRoomMessagesSchema,
} from '@repo/validation';
import { createMessage } from '../controllers/createMessage.js';
import { deleteMessage } from '../controllers/deleteMessage.js';
import { editMessageText } from '../controllers/editMessageText.js';
import { getRoomMessages } from '../controllers/getRoomMessages.js';
import { publishMessage } from '../controllers/publishMessage.js';
import { validateRequest } from '../middleware/validation.js';

export const chatRouter: Router = Router();

chatRouter.post('/messages', validateRequest(createMessageSchema), createMessage);
chatRouter.patch('/messages/:id/text', validateRequest(editMessageTextSchema), editMessageText);
chatRouter.delete('/messages/:id', validateRequest(deleteMessageSchema), deleteMessage);
chatRouter.get('/rooms/:roomId/messages', validateRequest(getRoomMessagesSchema), getRoomMessages);
chatRouter.post('/publish', validateRequest(chatMessageSchema), publishMessage);
chatRouter.get('/rooms/:roomId/history', validateRequest(getRoomMessagesSchema), getRoomMessages);
