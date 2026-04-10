import { randomUUID } from 'crypto';
import { logger } from '../lib/logger.js';
import prisma, { MessageType as PrismaMessageType, Prisma } from '../db.js';
import { ServerUnaryCall, sendUnaryData, status } from '@grpc/grpc-js';
import { MessageType } from '@repo/proto';
import type {
  CreateMessageRequest,
  DeleteMessageRequest,
  DeleteMessageResponse,
  EditMessageTextRequest,
  GetRoomMessagesRequest,
  GetRoomMessagesResponse,
  RoomMessages,
} from '@repo/proto';

const DEFAULT_ROOM_MESSAGES_LIMIT = 80;
const MAX_ROOM_MESSAGES_LIMIT = 200;

const messageTypeMap: Record<PrismaMessageType, MessageType> = {
  [PrismaMessageType.TEXT]: MessageType.TEXT,
  [PrismaMessageType.IMAGE]: MessageType.IMAGE,
  [PrismaMessageType.FILE]: MessageType.FILE,
  [PrismaMessageType.SYSTEM]: MessageType.SYSTEM,
};

const roomMessageInclude = {
  user: {
    select: {
      username: true,
      avatarUrl: true,
    },
  },
} as const;

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_ROOM_MESSAGES_LIMIT;
  }

  return Math.min(Math.floor(limit), MAX_ROOM_MESSAGES_LIMIT);
}

function serializeAttachments(attachments: unknown): string | undefined {
  if (attachments == null) return undefined;
  return JSON.stringify(attachments);
}

function normalizeRequiredString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function isPrismaError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string';
}

async function isRoomMember(roomId: string, userId: string): Promise<boolean> {
  const member = await prisma.chatRoomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
    select: { id: true },
  });

  return Boolean(member);
}

function toPrismaMessageType(type: MessageType): PrismaMessageType | null {
  switch (type) {
    case MessageType.TEXT:
      return PrismaMessageType.TEXT;
    case MessageType.IMAGE:
      return PrismaMessageType.IMAGE;
    case MessageType.FILE:
      return PrismaMessageType.FILE;
    case MessageType.SYSTEM:
      return PrismaMessageType.SYSTEM;
    default:
      return null;
  }
}

function parseAttachments(
  attachments: string | undefined,
): { ok: true; value: Prisma.InputJsonValue | typeof Prisma.DbNull } | { ok: false; message: string } {
  const normalized = normalizeOptionalString(attachments);

  if (!normalized) {
    return { ok: true, value: Prisma.DbNull };
  }

  try {
    return { ok: true, value: JSON.parse(normalized) as Prisma.InputJsonValue };
  } catch {
    return {
      ok: false,
      message: 'attachments must be a valid JSON string',
    };
  }
}

async function getRoomMessageRecord(messageId: string): Promise<RoomMessageRecord | null> {
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: roomMessageInclude,
  });

  return message ?? null;
}

type RoomMessageRecord = {
  id: string;
  type: PrismaMessageType;
  parentId: string | null;
  userId: string;
  roomId: string;
  text: string;
  attachments: unknown;
  isDeleted: boolean;
  modifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    username: string;
    avatarUrl: string | null;
  };
};

function toRoomMessage(message: RoomMessageRecord): RoomMessages {
  return {
    id: message.id,
    type: messageTypeMap[message.type],
    parentId: message.parentId ?? undefined,
    userId: message.userId,
    roomId: message.roomId,
    text: message.text,
    attachments: serializeAttachments(message.attachments),
    isDeleted: message.isDeleted,
    modifiedAt: message.modifiedAt ?? undefined,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    senderUsername: message.user.username,      // user → lowercase
    senderAvatarUrl: message.user.avatarUrl ?? undefined,
  };
}

export const messages = {
  createMessage: async (
    call: ServerUnaryCall<CreateMessageRequest, RoomMessages>,
    callback: sendUnaryData<RoomMessages>,
  ) => {
    const userId = normalizeRequiredString(call.request.userId);
    const roomId = normalizeRequiredString(call.request.roomId);
    const parentId = normalizeOptionalString(call.request.parentId);
    const text = normalizeOptionalString(call.request.text);
    const messageType = toPrismaMessageType(call.request.type);
    const parsedAttachments = parseAttachments(call.request.attachments);

    if (!userId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'userId is required',
      });
    }

    if (!roomId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'roomId is required',
      });
    }

    if (!messageType) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'type must be a valid MessageType',
      });
    }

    if (!parsedAttachments.ok) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: parsedAttachments.message,
      });
    }

    if (!text && parsedAttachments.value === Prisma.DbNull) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Either text or attachments must be provided',
      });
    }

    if (text && text.length > 500) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'text must be at most 500 characters',
      });
    }

    try {
      const [user, room, parentMessage] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        }),
        prisma.chatRoom.findUnique({
          where: { id: roomId },
          select: { id: true },
        }),
        parentId ?
          prisma.chatMessage.findUnique({
            where: { id: parentId },
            select: { id: true, roomId: true },
          })
        : Promise.resolve(null),
      ]);

      if (!user) {
        return callback({
          code: status.NOT_FOUND,
          message: `User ${userId} not found`,
        });
      }

      if (!room) {
        return callback({
          code: status.NOT_FOUND,
          message: `Room ${roomId} not found`,
        });
      }

      const member = await isRoomMember(roomId, userId);

      if (!member) {
        return callback({
          code: status.PERMISSION_DENIED,
          message: 'Only room members can send messages',
        });
      }

      if (parentId && !parentMessage) {
        return callback({
          code: status.NOT_FOUND,
          message: `Parent message ${parentId} not found`,
        });
      }

      if (parentMessage && parentMessage.roomId !== roomId) {
        return callback({
          code: status.INVALID_ARGUMENT,
          message: 'parentId must reference a message in the same room',
        });
      }

      const createdMessage = await prisma.chatMessage.create({
        data: {
          id: randomUUID(),
          type: messageType,
          parentId: parentId ?? null,
          userId,
          roomId,
          text: text ?? '',
          attachments: parsedAttachments.value,
          updatedAt: new Date(),
        },
        select: { id: true },
      });

      const createdRoomMessage = await getRoomMessageRecord(createdMessage.id);

      if (!createdRoomMessage) {
        throw new Error(`Created message ${createdMessage.id} could not be reloaded`);
      }

      return callback(null, toRoomMessage(createdRoomMessage));
    } catch (error) {
      logger.error({ error, userId, roomId, parentId }, 'CreateMessage failed');

      return callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },

  editMessageText: async (
    call: ServerUnaryCall<EditMessageTextRequest, RoomMessages>,
    callback: sendUnaryData<RoomMessages>,
  ) => {
    const messageId = normalizeRequiredString(call.request.id);
    const text = normalizeRequiredString(call.request.text);

    if (!messageId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    if (!text) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'text is required',
      });
    }

    if (text.length > 500) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'text must be at most 500 characters',
      });
    }

    try {
      const existingMessage = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        select: { id: true, isDeleted: true },
      });

      if (!existingMessage) {
        return callback({
          code: status.NOT_FOUND,
          message: `Message ${messageId} not found`,
        });
      }

      if (existingMessage.isDeleted) {
        return callback({
          code: status.FAILED_PRECONDITION,
          message: `Message ${messageId} is deleted and cannot be edited`,
        });
      }

      const updatedMessage = await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          text,
          modifiedAt: new Date(),
          updatedAt: new Date(),
        },
        select: { id: true },
      });

      const updatedRoomMessage = await getRoomMessageRecord(updatedMessage.id);

      if (!updatedRoomMessage) {
        throw new Error(`Updated message ${updatedMessage.id} could not be reloaded`);
      }

      return callback(null, toRoomMessage(updatedRoomMessage));
    } catch (error) {
      logger.error({ error, messageId }, 'EditMessageText failed');

      return callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },

  deleteMessage: async (
    call: ServerUnaryCall<DeleteMessageRequest, DeleteMessageResponse>,
    callback: sendUnaryData<DeleteMessageResponse>,
  ) => {
    const messageId = normalizeRequiredString(call.request.id);

    if (!messageId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    try {
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          text: '',
          attachments: Prisma.DbNull,
          modifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return callback(null, {
        success: true,
        id: messageId,
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        return callback({
          code: status.NOT_FOUND,
          message: `Message ${messageId} not found`,
        });
      }

      logger.error({ error, messageId }, 'DeleteMessage failed');

      return callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },

  getRoomMessages: async (
    call: ServerUnaryCall<GetRoomMessagesRequest, GetRoomMessagesResponse>,
    callback: sendUnaryData<GetRoomMessagesResponse>,
  ) => {
    const roomId = call.request.roomId.trim();

    if (!roomId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'roomId is required',
      });
    }

    const limit = normalizeLimit(call.request.limit);

    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: { id: true },
      });

      if (!room) {
        return callback({
          code: status.NOT_FOUND,
          message: `Room ${roomId} not found`,
        });
      }

      const roomMessages = await prisma.chatMessage.findMany({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: roomMessageInclude,
      });

      return callback(null, {
        messages: roomMessages.map(toRoomMessage).reverse(),
      });
    } catch (error) {
      logger.error({ error, roomId, limit }, 'GetRoomMessages failed');

      return callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
};
