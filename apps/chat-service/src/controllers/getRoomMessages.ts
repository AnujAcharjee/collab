import type { Request, Response } from 'express';
import type { GetRoomMessagesInput } from '@repo/validation';
import { getRoomMessages as getRoomMessagesRpc } from '../grpc/index.js';
import { logger } from '../logger.js';
import { toHttpError } from './@helpers.js';

export const getRoomMessages = async (req: Request, res: Response) => {
  const { roomId } = req.params as GetRoomMessagesInput['params'];
  const limit =
    typeof req.query.limit === 'string' ? Number(req.query.limit)
    : typeof req.query.limit === 'number' ? req.query.limit
    : undefined;

  logger.debug({ roomId, limit }, 'Chat messages requested');

  try {
    const messages = await getRoomMessagesRpc(roomId, limit);

    return res.status(200).json({
      success: true,
      data: {
        roomId,
        messages,
      },
    });
  } catch (error) {
    logger.error({ error, roomId, limit }, 'Get room messages failed');
    const httpError = toHttpError(error);

    return res.status(httpError.statusCode).json({
      success: false,
      error: httpError.message,
    });
  }
};
