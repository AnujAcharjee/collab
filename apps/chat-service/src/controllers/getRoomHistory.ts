import type { Request, Response } from 'express';
import { logger } from '../logger.js';
import { getRoomMessages } from '../grpc/index.js';
import type { ChatMessageRecord } from './@helpers.js';

export const getRoomHistory = async (req: Request, res: Response) => {
  const roomIdParam = req.params.roomId;
  const roomId = Array.isArray(roomIdParam) ? roomIdParam[0]?.trim() : roomIdParam?.trim();

  if (!roomId) {
    return res.status(400).json({ success: false, error: 'Room id is required' });
  }

  logger.debug({ roomId }, 'Chat history requested');

  const messages: ChatMessageRecord[] = await getRoomMessages(roomId, 80);

  return res.status(200).json({
    success: true,
    data: {
      roomId,
      messages,
    },
  });
};
