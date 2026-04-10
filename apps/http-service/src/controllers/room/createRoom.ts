import type { Request, Response } from 'express';
import type { CreateRoomInput, RoomRecord } from '@repo/validation';
import { grpcUnary, type ChatRoom, type CreateRoomRequest as CreateRoomRpcRequest } from '@repo/proto';
import { dbGrpcClient } from '../../lib/grpc.js';
import { toGrpcAppError, toRoomRecord } from '../@helpers.js';

function pushRoom(input: CreateRoomInput, creatorId: string): Promise<RoomRecord> {
  const request: CreateRoomRpcRequest = {
    name: input.name,
    description: input.description,
    isPrivate: input.isPrivate,
    creatorId,
  };

  return grpcUnary<ChatRoom>((callback) => dbGrpcClient.createRoom(request, callback))
    .then((response) => toRoomRecord(response))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

export const createRoom = async (req: Request, res: Response) => {
  const data = req.body as CreateRoomInput;
  const creatorId = req.user?.id;

  if (!creatorId) {
    return res.status(401).json({
      success: false,
      error: 'Authenticated user is required',
    });
  }

  const persistedRoom = await pushRoom(data, creatorId);

  return res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: { room: persistedRoom },
  });
};
