import type { Request, Response } from 'express';
import type { CreateRoomInput, RoomRecord } from '@repo/validation';
import { grpcUnary, type ChatRoom, type CreateRoomRequest as CreateRoomRpcRequest } from '@repo/proto';
import { dbGrpcClient } from '../../grpc/client.js';
import { toGrpcAppError, toRoomRecord } from '../@helpers.js';

function pushRoom(input: CreateRoomInput): Promise<RoomRecord> {
  const request: CreateRoomRpcRequest = {
    name: input.name,
    description: input.description,
    isPrivate: input.isPrivate,
    creatorId: input.creatorId,
  };

  return grpcUnary<ChatRoom>((callback) => dbGrpcClient.createRoom(request, callback))
    .then((response) => toRoomRecord(response))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

export const createRoom = async (req: Request, res: Response) => {
  const data = req.body as CreateRoomInput;
  const persistedRoom = await pushRoom(data);

  return res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: { room: persistedRoom },
  });
};
