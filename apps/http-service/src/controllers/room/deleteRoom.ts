import type { Request, Response } from 'express';
import type { DeleteRoomRequest as DeleteRoomInput } from '@repo/validation';
import {
  grpcUnary,
  type DeleteRoomRequest as DeleteRoomRpcRequest,
  type DeleteRoomResponse,
} from '@repo/proto';
import { dbGrpcClient } from '../../lib/grpc.js';
import { toGrpcAppError } from '../@helpers.js';

function removeRoom(id: string): Promise<void> {
  const request: DeleteRoomRpcRequest = { id };

  return grpcUnary<DeleteRoomResponse>((callback) => dbGrpcClient.deleteRoom(request, callback))
    .then(() => undefined)
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

export const deleteRoom = async (req: Request, res: Response) => {
  const { id } = req.params as DeleteRoomInput['params'];
  await removeRoom(id);

  return res.status(200).json({
    success: true,
    message: 'Room deleted successfully',
    data: { id },
  });
};
