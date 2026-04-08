import type { Request, Response } from 'express';
import type { ChatMessagePayloadAndReceivers, CreateMessageInput } from '@repo/validation';
import { MessageType } from '@repo/proto';
import { createMessage as createMessageRpc, getRoomMemberIds } from '../grpc/index.js';
import { logger } from '../logger.js';
import { redis } from '../redis.js';
import { toHttpError } from './@helpers.js';

const messageTypeMap = {
  TEXT: MessageType.TEXT,
  IMAGE: MessageType.IMAGE,
  FILE: MessageType.FILE,
  SYSTEM: MessageType.SYSTEM,
} as const;
const REDIS_CHANNEL = 'chat-messages';

export const createMessage = async (req: Request, res: Response) => {
  const { sender, text, attachments, roomId, parentId, type } = req.body as CreateMessageInput['body'];

  try {
    const receivers = await getRoomMemberIds(roomId);
    const isRoomMember = receivers.includes(sender);

    if (!isRoomMember) {
      return res.status(403).json({
        success: false,
        error: 'You are no longer a member of this room',
      });
    }

    const message = await createMessageRpc({
      userId: sender,
      roomId,
      text,
      attachments,
      parentId,
      type: messageTypeMap[type ?? 'TEXT'],
    });

    try {
      if (receivers.length > 0) {
        const wsPayload: ChatMessagePayloadAndReceivers = {
          id: message.id,
          sender: message.userId,
          text: message.text,
          attachments: message.attachments,
          roomId: message.roomId,
          parentId: message.parentId,
          createdAt: message.createdAt,
          receivers,
        };

        await redis.publish(REDIS_CHANNEL, JSON.stringify(wsPayload));
      }
    } catch (publishError) {
      logger.error({ publishError, messageId: message.id }, 'Message created but live publish failed');
    }

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
