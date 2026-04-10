import type { ServiceError } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import {
  JoinRequestStatus,
  RoomMemberRole,
  type ChatRoom,
  type ChatRoomJoinRequest,
  type ChatRoomMember,
  type User,
} from '@repo/proto';
import type { RoomJoinRequestRecord, RoomMemberRecord, RoomRecord, UserRecord } from '@repo/validation';
import { AppError } from '../utils/appError.js';

export function toUserRecord(user: User): UserRecord {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name ?? null,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    lastLogin: user.lastLogin?.toISOString() ?? null,
    createdAt: user.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: user.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

function toRoomMemberRole(role: RoomMemberRole): RoomMemberRecord['role'] {
  switch (role) {
    case RoomMemberRole.ADMIN:
      return 'ADMIN';
    case RoomMemberRole.OWNER:
      return 'OWNER';
    case RoomMemberRole.MEMBER:
    default:
      return 'MEMBER';
  }
}

export function toRoomMemberRecord(member: ChatRoomMember): RoomMemberRecord {
  return {
    id: member.id,
    roomId: member.roomId,
    userId: member.userId,
    role: toRoomMemberRole(member.role),
    createdAt: member.createdAt?.toISOString() ?? new Date(0).toISOString(),
    user: member.user ? toUserRecord(member.user) : null,
  };
}

function toJoinRequestStatus(status: JoinRequestStatus): RoomJoinRequestRecord['status'] {
  switch (status) {
    case JoinRequestStatus.PENDING:
    default:
      return 'PENDING';
  }
}

export function toRoomJoinRequestRecord(joinRequest: ChatRoomJoinRequest): RoomJoinRequestRecord {
  return {
    id: joinRequest.id,
    roomId: joinRequest.roomId,
    userId: joinRequest.userId,
    status: toJoinRequestStatus(joinRequest.status),
    createdAt: joinRequest.createdAt?.toISOString() ?? new Date(0).toISOString(),
    user: joinRequest.user ? toUserRecord(joinRequest.user) : null,
  };
}

export function toRoomRecord(room: ChatRoom): RoomRecord {
  return {
    id: room.id,
    name: room.name,
    description: room.description ?? null,
    isPrivate: room.isPrivate,
    creatorId: room.creatorId ?? null,
    createdAt: room.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: room.updatedAt?.toISOString() ?? new Date(0).toISOString(),
    creator: room.creator ? toUserRecord(room.creator) : null,
    members: room.members.map(toRoomMemberRecord),
  };
}

export function toGrpcAppError(error: ServiceError, resourceName = 'Resource'): AppError {
  switch (error.code) {
    case status.INVALID_ARGUMENT:
      return new AppError(error.details || 'Invalid request', 400);
    case status.NOT_FOUND:
      return new AppError(error.details || `${resourceName} not found`, 404);
    case status.ALREADY_EXISTS:
      return new AppError(error.details || `${resourceName} already exists`, 409);
    default:
      return new AppError(error.details || 'Internal server error', 500);
  }
}
