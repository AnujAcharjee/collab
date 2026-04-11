import type { Request, Response } from 'express';
import type { GetRoomMessagesInput } from '@repo/validation';
import { getRoomMemberIds, getRoomMessages as getRoomMessagesRpc } from '../grpc/index.js';
import { logger } from '../lib/logger.js';
import { toHttpError } from './@helpers.js';

export const getRoomMessages = async (req: Request, res: Response) => {
  const { roomId } = req.params as GetRoomMessagesInput['params'];
  const { limit } = req.query as GetRoomMessagesInput['query'];
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authenticated user is required',
    });
  }

  logger.debug({ roomId, userId, limit }, 'Chat messages requested');

  try {
    const memberIds = await getRoomMemberIds(roomId);

    if (!memberIds.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Only room members can view room messages',
      });
    }

    const messages = await getRoomMessagesRpc(roomId, limit);

    return res.status(200).json({
      success: true,
      data: {
        roomId,
        messages,
      },
    });
  } catch (error) {
    logger.error({ error, roomId, userId, limit }, 'Get room messages failed');
    const httpError = toHttpError(error);

    return res.status(httpError.statusCode).json({
      success: false,
      error: httpError.message,
    });
  }
};
