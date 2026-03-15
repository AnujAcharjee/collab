import type { Request, Response } from 'express';
import type { DeleteUserRequest as DeleteUserInput } from '@repo/validation';
import type { DeleteUserRequest as DeleteUserRpcRequest } from '@repo/proto';
import { dbClient } from '../grpc/client.js';
import { toAppError } from './@helpers.js';

function removeUser(id: string): Promise<void> {
  const request: DeleteUserRpcRequest = { id };

  return new Promise((resolve, reject) => {
    dbClient.deleteUser(request, (error) => {
      if (error) return reject(toAppError(error));
      resolve();
    });
  });
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params as DeleteUserInput['params'];
  await removeUser(id);

  return res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: { id },
  });
};
