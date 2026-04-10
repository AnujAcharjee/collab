import type { Request, Response } from 'express';
import type {
  GetPendingJoinRequestsRequest as GetPendingJoinRequestsInput,
  RoomJoinRequestRecord,
} from '@repo/validation';
import {
  grpcUnary,
  type ChatRoomJoinRequest,
  type GetPendingJoinRequestsRequest as GetPendingJoinRequestsRpcRequest,
  type GetPendingJoinRequestsResponse,
} from '@repo/proto';
import { dbGrpcClient } from '../../lib/grpc.js';
import { toGrpcAppError, toRoomJoinRequestRecord } from '../@helpers.js';

function fetchPendingJoinRequests(roomId: string, actorUserId: string): Promise<RoomJoinRequestRecord[]> {
  const request: GetPendingJoinRequestsRpcRequest = {
    roomId,
    actorUserId,
  };

  return grpcUnary<GetPendingJoinRequestsResponse>((callback) =>
    dbGrpcClient.getPendingJoinRequests(request, callback),
  )
    .then((response) =>
      response.requests.map((joinRequest: ChatRoomJoinRequest) => toRoomJoinRequestRecord(joinRequest)),
    )
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Join request')));
}

export const getPendingJoinRequestsController = async (req: Request, res: Response) => {
  const { id: roomId } = req.params as GetPendingJoinRequestsInput['params'];
  const actorUserId = req.user?.id;

  if (!actorUserId) {
    return res.status(401).json({
      success: false,
      error: 'Authenticated user is required',
    });
  }

  const requests = await fetchPendingJoinRequests(roomId, actorUserId);

  return res.status(200).json({
    success: true,
    data: { requests },
  });
};
