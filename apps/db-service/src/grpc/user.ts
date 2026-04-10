import { randomUUID } from 'crypto';
import { logger } from '../lib/logger.js';
import prisma from '../db.js';
import { ServerUnaryCall, sendUnaryData, status } from '@grpc/grpc-js';
import type {
  CreateUserRequest,
  DeleteUserRequest,
  DeleteUserResponse,
  EditUserRequest,
  GetUserRequest,
  HydrateUserResponse,
  User,
} from '@repo/proto';
import { roomInclude, toProtoRoom } from './chatRoom.js';

type UserLookup = { id: string } | { email: string } | { username: string };

function toProtoUser(user: {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
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

function nullableStringUpdate(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value === '' ? null : value;
}

function isPrismaError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string';
}

function resolveUserLookup(request: GetUserRequest): UserLookup | null {
  if (request.id !== undefined) return { id: request.id };
  if (request.email !== undefined) return { email: request.email.toLowerCase() };
  if (request.username !== undefined) return { username: request.username };
  return null;
}

export const user = {
  createUser: async (call: ServerUnaryCall<CreateUserRequest, User>, callback: sendUnaryData<User>) => {
    try {
      if (!call.request.email || !call.request.username) {
        return callback({ code: status.INVALID_ARGUMENT, message: 'email and username are required' });
      }

      const createdUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: call.request.email.toLowerCase(),
          username: call.request.username,
          name: nullableStringUpdate(call.request.name),
          bio: nullableStringUpdate(call.request.bio),
          avatarUrl: nullableStringUpdate(call.request.avatarUrl),
          updatedAt: new Date(),
        },
      });

      callback(null, toProtoUser(createdUser));
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2002') {
        return callback({
          code: status.ALREADY_EXISTS,
          message: 'User with the same email or username already exists',
        });
      }
      logger.error(err, 'CreateUser failed');
      callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  editUser: async (call: ServerUnaryCall<EditUserRequest, User>, callback: sendUnaryData<User>) => {
    try {
      if (!call.request.id) {
        return callback({ code: status.INVALID_ARGUMENT, message: 'id is required' });
      }

      const hasUpdates =
        call.request.email !== undefined ||
        call.request.username !== undefined ||
        call.request.name !== undefined ||
        call.request.bio !== undefined ||
        call.request.avatarUrl !== undefined ||
        call.request.lastLogin !== undefined;

      if (!hasUpdates) {
        return callback({
          code: status.INVALID_ARGUMENT,
          message: 'At least one field must be provided to update',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: call.request.id },
        data: {
          email: call.request.email?.toLowerCase(),
          username: call.request.username,
          name: nullableStringUpdate(call.request.name),
          bio: nullableStringUpdate(call.request.bio),
          avatarUrl: nullableStringUpdate(call.request.avatarUrl),
          lastLogin: call.request.lastLogin,
          updatedAt: new Date(),
        },
      });

      callback(null, toProtoUser(updatedUser));
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2025') {
        return callback({ code: status.NOT_FOUND, message: `User ${call.request.id} not found` });
      }
      if (isPrismaError(err) && err.code === 'P2002') {
        return callback({
          code: status.ALREADY_EXISTS,
          message: 'User with the same email or username already exists',
        });
      }
      logger.error(err, 'EditUser failed');
      callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  deleteUser: async (
    call: ServerUnaryCall<DeleteUserRequest, DeleteUserResponse>,
    callback: sendUnaryData<DeleteUserResponse>,
  ) => {
    try {
      if (!call.request.id) {
        return callback({ code: status.INVALID_ARGUMENT, message: 'id is required' });
      }

      await prisma.user.delete({ where: { id: call.request.id } });

      callback(null, { success: true, id: call.request.id });
    } catch (err) {
      if (isPrismaError(err) && err.code === 'P2025') {
        return callback({ code: status.NOT_FOUND, message: `User ${call.request.id} not found` });
      }
      logger.error(err, 'DeleteUser failed');
      callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  getUser: async (call: ServerUnaryCall<GetUserRequest, User>, callback: sendUnaryData<User>) => {
    try {
      const lookup = resolveUserLookup(call.request);

      if (!lookup) {
        return callback({ code: status.INVALID_ARGUMENT, message: 'Provide one of id, email, or username' });
      }

      const foundUser = await prisma.user.findFirst({ where: lookup });

      if (!foundUser) {
        return callback({ code: status.NOT_FOUND, message: 'User not found' });
      }

      callback(null, toProtoUser(foundUser));
    } catch (err) {
      logger.error(err, 'GetUser failed');
      callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  hydrateUser: async (
    call: ServerUnaryCall<GetUserRequest, HydrateUserResponse>,
    callback: sendUnaryData<HydrateUserResponse>,
  ) => {
    try {
      const lookup = resolveUserLookup(call.request);

      if (!lookup) {
        return callback({ code: status.INVALID_ARGUMENT, message: 'Provide one of id, email, or username' });
      }

      const foundUser = await prisma.user.findFirst({ where: lookup });

      if (!foundUser) {
        return callback({ code: status.NOT_FOUND, message: 'User not found' });
      }

      const rooms = await prisma.chatRoom.findMany({
        where: {
          members: {
            some: { userId: foundUser.id },
          },
        },
        include: roomInclude,
        orderBy: { createdAt: 'asc' },
      });

      callback(null, {
        user: toProtoUser(foundUser),
        rooms: rooms.map(toProtoRoom),
      });
    } catch (err) {
      logger.error(err, 'HydrateUser failed');
      callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },
};
