import type { Request, Response } from 'express';
import type { DeleteUserRequest as DeleteUserInput } from '@repo/validation';
import { grpcUnary, type DeleteUserRequest as DeleteUserRpcRequest, type DeleteUserResponse } from '@repo/proto';
import { dbGrpcClient } from '../grpc/client.js';
import { toAppError } from './@helpers.js';

function removeUser(id: string): Promise<void> {
  const request: DeleteUserRpcRequest = { id };

  return grpcUnary<DeleteUserResponse>((callback) => dbGrpcClient.deleteUser(request, callback))
    .then(() => undefined)
    .catch((error) => Promise.reject(toAppError(error)));
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
