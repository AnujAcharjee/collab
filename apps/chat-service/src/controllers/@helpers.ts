import type { ServiceError } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import { MessageType, type RoomMessages } from '@repo/proto';

export type ChatMessageRecord = {
  id: string;
  type: keyof typeof MessageType;
  userId: string;
  roomId: string;
  text?: string;
  attachments?: string;
  parentId?: string;
  isDeleted: boolean;
  modifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  senderUsername: string;
  senderAvatarUrl?: string;
};

export function toChatMessageRecord(message: RoomMessages): ChatMessageRecord {
  return {
    id: message.id,
    type: MessageType[message.type] as keyof typeof MessageType,
    userId: message.userId,
    roomId: message.roomId,
    text: message.text || undefined,
    attachments: message.attachments,
    parentId: message.parentId,
    isDeleted: message.isDeleted,
    modifiedAt: message.modifiedAt?.toISOString(),
    createdAt: message.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: message.updatedAt?.toISOString() ?? new Date(0).toISOString(),
    senderUsername: message.senderUsername,
    senderAvatarUrl: message.senderAvatarUrl,
  };
}

export function toHttpError(error: unknown): { statusCode: number; message: string } {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const grpcError = error as ServiceError;

    switch (grpcError.code) {
      case status.INVALID_ARGUMENT:
        return { statusCode: 400, message: grpcError.details || 'Invalid request' };
      case status.NOT_FOUND:
        return { statusCode: 404, message: grpcError.details || 'Resource not found' };
      case status.ALREADY_EXISTS:
        return { statusCode: 409, message: grpcError.details || 'Resource already exists' };
      case status.FAILED_PRECONDITION:
        return { statusCode: 412, message: grpcError.details || 'Request cannot be completed' };
      default:
        return { statusCode: 500, message: grpcError.details || 'Internal server error' };
    }
  }

  if (error instanceof Error) {
    return { statusCode: 500, message: error.message };
  }

  return { statusCode: 500, message: 'Internal server error' };
}
