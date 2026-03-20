import type { Request, Response } from 'express';
import type { EditUserRequest as EditUserInput, UserRecord } from '@repo/validation';
import { grpcUnary, type EditUserRequest as EditUserRpcRequest, type User } from '@repo/proto';
import { dbGrpcClient } from '../../grpc/client.js';
import { toGrpcAppError, toUserRecord } from '../@helpers.js';

function updateUser(id: string, input: EditUserInput['body']): Promise<UserRecord> {
  const request: EditUserRpcRequest = {
    id,
    email: input.email,
    username: input.username,
    name: input.name,
    bio: input.bio,
    avatarUrl: input.avatarUrl,
  };

  return grpcUnary<User>((callback) => dbGrpcClient.editUser(request, callback))
    .then((response) => toUserRecord(response))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'User')));
}

export const editUser = async (req: Request, res: Response) => {
  const data = req.body as EditUserInput['body'];
  const { id } = req.params as EditUserInput['params'];
  const updatedUser = await updateUser(id, data);

  return res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser },
  });
};
