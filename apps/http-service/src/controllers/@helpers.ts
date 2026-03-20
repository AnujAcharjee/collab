import type { ServiceError } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import type { User } from '@repo/proto';
import type { UserRecord } from '@repo/validation';
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

export function toAppError(error: ServiceError): AppError {
  switch (error.code) {
    case status.INVALID_ARGUMENT:
      return new AppError(error.details || 'Invalid request', 400);
    case status.NOT_FOUND:
      return new AppError(error.details || 'User not found', 404);
    case status.ALREADY_EXISTS:
      return new AppError(error.details || 'User already exists', 409);
    default:
      return new AppError(error.details || 'Internal server error', 500);
  }
}
