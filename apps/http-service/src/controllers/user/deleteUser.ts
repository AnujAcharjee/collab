import type { Request, Response } from 'express';
import type { DeleteUserRequest as DeleteUserInput } from '@repo/validation';
import {
  grpcUnary,
  type DeleteUserRequest as DeleteUserRpcRequest,
  type DeleteUserResponse,
} from '@repo/proto';
import { dbGrpcClient } from '../../lib/grpc.js';
import { toGrpcAppError } from '../@helpers.js';

function removeUser(id: string): Promise<void> {
  const request: DeleteUserRpcRequest = { id };

  return grpcUnary<DeleteUserResponse>((callback) => dbGrpcClient.deleteUser(request, callback))
    .then(() => undefined)
    .catch((error) => Promise.reject(toGrpcAppError(error, 'User')));
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params as DeleteUserInput['params'];

  if (req.user?.id !== id) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: You cannot delete another user\'s profile',
    });
  }

  await removeUser(id);

  return res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: { id },
  });
};
