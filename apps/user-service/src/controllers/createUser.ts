import type { Request, Response } from 'express';
import type { CreateUserInput, UserRecord } from '@repo/validation';
import { grpcUnary, type CreateUserRequest, type User } from '@repo/proto';
import { dbGrpcClient } from '../grpc/client.js';
import { toAppError, toUserRecord } from './@helpers.js';

function pushUser(input: CreateUserInput): Promise<UserRecord> {
  const request: CreateUserRequest = {
    email: input.email,
    username: input.username,
    name: input.name,
    bio: input.bio,
    avatarUrl: input.avatarUrl,
  };

  return grpcUnary<User>((callback) => dbGrpcClient.createUser(request, callback))
    .then((response) => toUserRecord(response))
    .catch((error) => Promise.reject(toAppError(error)));
}

export const createUser = async (req: Request, res: Response) => {
  const data = req.body as CreateUserInput;
  const persistedUser = await pushUser(data);

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: persistedUser },
  });
};
