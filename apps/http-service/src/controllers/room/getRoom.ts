import type { Request, Response } from 'express';
import type { GetRoomRequest, RoomRecord } from '@repo/validation';
import { grpcUnary, type ChatRoom, type GetRoomRequest as GetRoomRpcRequest } from '@repo/proto';
import { dbGrpcClient } from '../../lib/grpc.js';
import { toGrpcAppError, toRoomRecord } from '../@helpers.js';

function fetchRoom(id: string): Promise<RoomRecord> {
  const request: GetRoomRpcRequest = { id };

  return grpcUnary<ChatRoom>((callback) => dbGrpcClient.getRoom(request, callback))
    .then((response) => toRoomRecord(response))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

export const getRoom = async (req: Request, res: Response) => {
  const { id } = req.params as GetRoomRequest['params'];
  const room = await fetchRoom(id);

  return res.status(200).json({
    success: true,
    data: { room },
  });
};
