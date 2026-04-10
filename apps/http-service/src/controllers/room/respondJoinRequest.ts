import type { Request, Response } from 'express';
import type { RespondJoinRequestRequest as RespondJoinRequestInput, RoomRecord } from '@repo/validation';
import {
  grpcUnary,
  type ChatRoom,
  type RespondJoinRequestRequest as RespondJoinRequestRpcRequest,
  type RespondJoinRequestResponse,
} from '@repo/proto';
import { dbGrpcClient } from '../../lib/grpc.js';
import { toGrpcAppError, toRoomRecord } from '../@helpers.js';

type RespondJoinRequestResult = {
  success: boolean;
  requestId: string;
  room: RoomRecord | null;
};

function respondJoinRequest(
  requestId: string,
  actorUserId: string,
  approve: boolean,
): Promise<RespondJoinRequestResult> {
  const request: RespondJoinRequestRpcRequest = {
    requestId,
    actorUserId,
    approve,
  };

  return grpcUnary<RespondJoinRequestResponse>((callback) =>
    dbGrpcClient.respondJoinRequest(request, callback),
  )
    .then((response) => ({
      success: response.success,
      requestId: response.requestId,
      room: response.room ? toRoomRecord(response.room as ChatRoom) : null,
    }))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Join request')));
}

export const respondJoinRequestController = async (req: Request, res: Response) => {
  const { requestId } = req.params as RespondJoinRequestInput['params'];
  const { approve } = req.body as RespondJoinRequestInput['body'];
  const actorUserId = req.user?.id;

  if (!actorUserId) {
    return res.status(401).json({
      success: false,
      error: 'Authenticated user is required',
    });
  }

  const result = await respondJoinRequest(requestId, actorUserId, approve);

  return res.status(200).json({
    success: true,
    message: approve ? 'Join request approved' : 'Join request rejected',
    data: result,
  });
};
