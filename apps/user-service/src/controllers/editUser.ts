import type { Request, Response } from 'express';
import type { EditUserRequest as EditUserInput, UserRecord } from '@repo/validation';
import type { EditUserRequest as EditUserRpcRequest } from '@repo/proto';
import { dbClient } from '../grpc/client.js';
import { toAppError, toUserRecord } from './@helpers.js';

function updateUser(id: string, input: EditUserInput['body']): Promise<UserRecord> {
  const request: EditUserRpcRequest = {
    id,
    email: input.email,
    username: input.username,
    name: input.name,
    bio: input.bio,
    avatarUrl: input.avatarUrl,
  };

  return new Promise((resolve, reject) => {
    dbClient.editUser(request, (error, response) => {
      if (error) return reject(toAppError(error));
      resolve(toUserRecord(response));
    });
  });
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
