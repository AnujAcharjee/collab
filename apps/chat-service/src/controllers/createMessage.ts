import type { Request, Response } from 'express';
import type { CreateMessageInput } from '@repo/validation';
import { MessageType } from '@repo/proto';
import { createMessage as createMessageRpc } from '../grpc/index.js';
import { logger } from '../logger.js';
import { toHttpError } from './@helpers.js';

const messageTypeMap = {
  TEXT: MessageType.TEXT,
  IMAGE: MessageType.IMAGE,
  FILE: MessageType.FILE,
  SYSTEM: MessageType.SYSTEM,
} as const;

export const createMessage = async (req: Request, res: Response) => {
  const { sender, text, attachments, roomId, parentId, type } = req.body as CreateMessageInput['body'];

  try {
    const message = await createMessageRpc({
      userId: sender,
      roomId,
      text,
      attachments,
      parentId,
      type: messageTypeMap[type ?? 'TEXT'],
    });

    return res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: { message },
    });
  } catch (error) {
    logger.error({ error }, 'Create message failed');
    const httpError = toHttpError(error);

    return res.status(httpError.statusCode).json({
      success: false,
      error: httpError.message,
    });
  }
};
