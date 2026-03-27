import { randomUUID } from 'crypto';
import { logger } from '../logger.js';
import prisma, { RoomMemberRole as PrismaRoomMemberRole } from '../db.js';
import { ServerUnaryCall, sendUnaryData, status } from '@grpc/grpc-js';
import { RoomMemberRole } from '@repo/proto';
import type {
  ChatRoom,
  GetRoomMemberIdsRequest,
  GetRoomMemberIdsResponse,
  GetRoomMembersRequest,
  GetRoomMembersResponse,
  AddRoomMemberRequest,
  CreateRoomRequest,
  DeleteRoomRequest,
  DeleteRoomResponse,
  EditRoomRequest,
  EditRoomMemberRequest,
  GetRoomRequest,
  RemoveRoomMemberRequest,
  ChatRoomMember,
  RemoveRoomMemberResponse,
  User,
} from '@repo/proto';

const roleMap: Record<PrismaRoomMemberRole, RoomMemberRole> = {
  [PrismaRoomMemberRole.MEMBER]: RoomMemberRole.MEMBER,
  [PrismaRoomMemberRole.ADMIN]: RoomMemberRole.ADMIN,
  [PrismaRoomMemberRole.OWNER]: RoomMemberRole.OWNER,
};

export const roomInclude = {
  creator: true,
  chatRoomMembers: {
    orderBy: { createdAt: 'asc' },
    include: { user: true },
  },
} as const;

const roomMemberInclude = {
  user: true,
} as const;

function isPrismaError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string';
}

function normalizeRequiredString(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalString(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function validateRoomName(name: string): string | null {
  const normalized = name.trim();
  if (normalized.length === 0 || normalized.length > 100) return null;
  return normalized;
}

function validateRoomDescription(description: string | null | undefined): string | null | undefined {
  if (description === undefined) return undefined;
  if (description === null) return null;

  const normalized = description.trim();
  if (normalized.length === 0) return null;
  if (normalized.length > 255) return undefined;

  return normalized;
}

function toProtoUser(
  user:
    | {
        id: string;
        email: string;
        username: string;
        name: string | null;
        bio: string | null;
        avatarUrl: string | null;
        lastLogin: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }
    | null
    | undefined,
): User | undefined {
  if (!user) return undefined;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name ?? undefined,
    bio: user.bio ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    lastLogin: user.lastLogin ?? undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toProtoRoomMember(member: {
  id: string;
  roomId: string;
  userId: string;
  role: PrismaRoomMemberRole;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    username: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}): ChatRoomMember {
  return {
    id: member.id,
    roomId: member.roomId,
    userId: member.userId,
    role: roleMap[member.role],
    createdAt: member.createdAt,
    user: toProtoUser(member.user),
  };
}

export function toProtoRoom(room: {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  creatorId: string | null;
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    id: string;
    email: string;
    username: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  chatRoomMembers?: Array<{
    id: string;
    roomId: string;
    userId: string;
    role: PrismaRoomMemberRole;
    createdAt: Date;
    user?: {
      id: string;
      email: string;
      username: string;
      name: string | null;
      bio: string | null;
      avatarUrl: string | null;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }>;
}): ChatRoom {
  return {
    id: room.id,
    name: room.name,
    description: room.description ?? undefined,
    isPrivate: room.isPrivate,
    creatorId: room.creatorId ?? undefined,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    creator: toProtoUser(room.creator),
    members: room.chatRoomMembers?.map(toProtoRoomMember) ?? [],
  };
}

function toPrismaRoomMemberRole(role: RoomMemberRole): PrismaRoomMemberRole | null {
  switch (role) {
    case RoomMemberRole.MEMBER:
      return PrismaRoomMemberRole.MEMBER;
    case RoomMemberRole.ADMIN:
      return PrismaRoomMemberRole.ADMIN;
    case RoomMemberRole.OWNER:
      return PrismaRoomMemberRole.OWNER;
    default:
      return null;
  }
}

export const chatRoom = {
  getRoom: async (call: ServerUnaryCall<GetRoomRequest, ChatRoom>, callback: sendUnaryData<ChatRoom>) => {
    const roomId = normalizeRequiredString(call.request.id);

    if (!roomId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: roomInclude,
      });

      if (!room) {
        return callback({
          code: status.NOT_FOUND,
          message: `Room ${roomId} not found`,
        });
      }

      return callback(null, toProtoRoom(room));
    } catch (err) {
      logger.error({ err, roomId }, 'GetRoom failed');
      return callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
  createRoom: async (
    call: ServerUnaryCall<CreateRoomRequest, ChatRoom>,
    callback: sendUnaryData<ChatRoom>,
  ) => {
    const name = validateRoomName(call.request.name);
    const creatorId = normalizeRequiredString(call.request.creatorId);
    const description = validateRoomDescription(normalizeOptionalString(call.request.description));

    if (!name) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'name must be between 1 and 100 characters',
      });
    }

    if (!creatorId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'creatorId is required',
      });
    }

    if (call.request.description !== undefined && description === undefined) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'description must be at most 255 characters',
      });
    }

    try {
      const createdRoom = await prisma.chatRoom.create({
        data: {
          id: randomUUID(),
          name,
          description,
          isPrivate: call.request.isPrivate,
          creatorId,
          updatedAt: new Date(),
          chatRoomMembers: {
            create: {
              id: randomUUID(),
              userId: creatorId,
              role: PrismaRoomMemberRole.OWNER,
            },
          },
        },
        include: roomInclude,
      });

      return callback(null, toProtoRoom(createdRoom));
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2003') {
        return callback({
          code: status.NOT_FOUND,
          message: `Creator ${creatorId} not found`,
        });
      }

      logger.error({ err, creatorId, name }, 'CreateRoom failed');
      return callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
  editRoom: async (call: ServerUnaryCall<EditRoomRequest, ChatRoom>, callback: sendUnaryData<ChatRoom>) => {
    const roomId = normalizeRequiredString(call.request.id);
    const hasUpdates =
      call.request.name !== undefined ||
      call.request.description !== undefined ||
      call.request.isPrivate !== undefined;

    if (!roomId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    if (!hasUpdates) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'At least one field must be provided to update',
      });
    }

    let name: string | undefined;
    if (call.request.name !== undefined) {
      const nextName = validateRoomName(call.request.name);

      if (!nextName) {
        return callback({
          code: status.INVALID_ARGUMENT,
          message: 'name must be between 1 and 100 characters',
        });
      }

      name = nextName;
    }

    let description: string | null | undefined;
    if (call.request.description !== undefined) {
      description = validateRoomDescription(normalizeOptionalString(call.request.description));

      if (description === undefined) {
        return callback({
          code: status.INVALID_ARGUMENT,
          message: 'description must be at most 255 characters',
        });
      }
    }

    try {
      const updatedRoom = await prisma.chatRoom.update({
        where: { id: roomId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(call.request.isPrivate !== undefined ? { isPrivate: call.request.isPrivate } : {}),
          updatedAt: new Date(),
        },
        include: roomInclude,
      });

      return callback(null, toProtoRoom(updatedRoom));
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2025') {
        return callback({
          code: status.NOT_FOUND,
          message: `Room ${roomId} not found`,
        });
      }

      logger.error({ err, roomId }, 'EditRoom failed');
      return callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
  deleteRoom: async (
    call: ServerUnaryCall<DeleteRoomRequest, DeleteRoomResponse>,
    callback: sendUnaryData<DeleteRoomResponse>,
  ) => {
    const roomId = normalizeRequiredString(call.request.id);

    if (!roomId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    try {
      await prisma.chatRoom.delete({
        where: { id: roomId },
      });

      return callback(null, {
        success: true,
        id: roomId,
      });
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2025') {
        return callback({
          code: status.NOT_FOUND,
          message: `Room ${roomId} not found`,
        });
      }

      logger.error({ err, roomId }, 'DeleteRoom failed');
      return callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },

  // ------- Members --------

  getRoomMemberIds: async (
    call: ServerUnaryCall<GetRoomMemberIdsRequest, GetRoomMemberIdsResponse>,
    callback: sendUnaryData<GetRoomMemberIdsResponse>,
  ) => {
    const roomId = normalizeRequiredString(call.request.roomId);

    if (!roomId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'roomId is required',
      });
    }

    try {
      const members = await prisma.chatRoomMember.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        select: { userId: true },
      });

      if (members.length === 0) {
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
      }

      return callback(null, {
        memberIds: members.map((member) => member.userId),
      });
    } catch (err) {
      logger.error({ err, roomId }, 'GetRoomMemberIds failed');
      return callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  getRoomMembers: async (
    call: ServerUnaryCall<GetRoomMembersRequest, GetRoomMembersResponse>,
    callback: sendUnaryData<GetRoomMembersResponse>,
  ) => {
    const roomId = normalizeRequiredString(call.request.roomId);

    if (!roomId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'roomId is required',
      });
    }

    try {
      const members = await prisma.chatRoomMember.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        include: roomMemberInclude,
      });

      if (members.length === 0) {
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
      }

      return callback(null, {
        members: members.map(toProtoRoomMember),
      });
    } catch (err) {
      logger.error({ err, roomId }, 'GetRoomMembers failed');
      return callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  addRoomMember: async (
    call: ServerUnaryCall<AddRoomMemberRequest, ChatRoomMember>,
    callback: sendUnaryData<ChatRoomMember>,
  ) => {
    const roomId = normalizeRequiredString(call.request.roomId);
    const userId = normalizeRequiredString(call.request.userId);
    const role = toPrismaRoomMemberRole(call.request.role);

    if (!roomId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'roomId is required',
      });
    }

    if (!userId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'userId is required',
      });
    }

    if (!role) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'role must be a valid RoomMemberRole',
      });
    }

    try {
      const [room, user] = await Promise.all([
        prisma.chatRoom.findUnique({ where: { id: roomId }, select: { id: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      ]);

      if (!room) {
        return callback({
          code: status.NOT_FOUND,
          message: `Room ${roomId} not found`,
        });
      }

      if (!user) {
        return callback({
          code: status.NOT_FOUND,
          message: `User ${userId} not found`,
        });
      }

      const member = await prisma.chatRoomMember.create({
        data: {
          id: randomUUID(),
          roomId,
          userId,
          role,
        },
        include: roomMemberInclude,
      });

      return callback(null, toProtoRoomMember(member));
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2002') {
        return callback({
          code: status.ALREADY_EXISTS,
          message: `User ${userId} is already a member of room ${roomId}`,
        });
      }

      logger.error({ err, roomId, userId }, 'AddRoomMember failed');
      return callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  editRoomMember: async (
    call: ServerUnaryCall<EditRoomMemberRequest, ChatRoomMember>,
    callback: sendUnaryData<ChatRoomMember>,
  ) => {
    const memberId = normalizeRequiredString(call.request.id);
    const role = toPrismaRoomMemberRole(call.request.role);

    if (!memberId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    if (!role) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'role must be a valid RoomMemberRole',
      });
    }

    try {
      const updatedMember = await prisma.chatRoomMember.update({
        where: { id: memberId },
        data: { role },
        include: roomMemberInclude,
      });

      return callback(null, toProtoRoomMember(updatedMember));
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2025') {
        return callback({
          code: status.NOT_FOUND,
          message: `Room member ${memberId} not found`,
        });
      }

      logger.error({ err, memberId }, 'EditRoomMember failed');
      return callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  removeRoomMember: async (
    call: ServerUnaryCall<RemoveRoomMemberRequest, RemoveRoomMemberResponse>,
    callback: sendUnaryData<RemoveRoomMemberResponse>,
  ) => {
    const memberId = normalizeRequiredString(call.request.id);

    if (!memberId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    try {
      await prisma.chatRoomMember.delete({
        where: { id: memberId },
      });

      return callback(null, {
        success: true,
        id: memberId,
      });
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2025') {
        return callback({
          code: status.NOT_FOUND,
          message: `Room member ${memberId} not found`,
        });
      }

      logger.error({ err, memberId }, 'RemoveRoomMember failed');
      return callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },
};
