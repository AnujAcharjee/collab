import type { Request, Response } from 'express';
import type { RequestJoinRoomRequest as RequestJoinRoomInput, RoomRecord } from '@repo/validation';
import {
  grpcUnary,
  type ChatRoom,
  type RequestJoinRoomRequest as RequestJoinRoomRpcRequest,
  type RequestJoinRoomResponse,
} from '@repo/proto';
import { dbGrpcClient } from '../../lib/grpc.js';
import { toGrpcAppError, toRoomRecord } from '../@helpers.js';

type RequestJoinRoomResult = {
  room: RoomRecord | null;
  joined: boolean;
  pending: boolean;
};

function requestJoinRoom(roomId: string, userId: string): Promise<RequestJoinRoomResult> {
  const request: RequestJoinRoomRpcRequest = {
    roomId,
    userId,
  };

  return grpcUnary<RequestJoinRoomResponse>((callback) => dbGrpcClient.requestJoinRoom(request, callback))
    .then((response) => ({
      room: response.room ? toRoomRecord(response.room as ChatRoom) : null,
      joined: response.joined,
      pending: response.pending,
    }))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

export const requestJoinRoomController = async (req: Request, res: Response) => {
  const { id: roomId } = req.params as RequestJoinRoomInput['params'];
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authenticated user is required',
    });
  }

  const result = await requestJoinRoom(roomId, userId);

  return res.status(200).json({
    success: true,
    message: result.joined ? 'Joined room successfully' : 'Join request sent',
    data: result,
  });
};
