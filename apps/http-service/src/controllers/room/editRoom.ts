import type { Request, Response } from 'express';
import type { EditRoomRequest as EditRoomInput, RoomRecord } from '@repo/validation';
import { grpcUnary, type ChatRoom, type EditRoomRequest as EditRoomRpcRequest } from '@repo/proto';
import { dbGrpcClient } from '../../grpc/client.js';
import { toGrpcAppError, toRoomRecord } from '../@helpers.js';

function updateRoom(id: string, input: EditRoomInput['body']): Promise<RoomRecord> {
  const request: EditRoomRpcRequest = {
    id,
    name: input.name,
    description: input.description,
    isPrivate: input.isPrivate,
  };

  return grpcUnary<ChatRoom>((callback) => dbGrpcClient.editRoom(request, callback))
    .then((response) => toRoomRecord(response))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

export const editRoom = async (req: Request, res: Response) => {
  const data = req.body as EditRoomInput['body'];
  const { id } = req.params as EditRoomInput['params'];
  const updatedRoom = await updateRoom(id, data);

  return res.status(200).json({
    success: true,
    message: 'Room updated successfully',
    data: { room: updatedRoom },
  });
};
