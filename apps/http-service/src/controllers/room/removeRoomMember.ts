import type { Request, Response } from 'express';
import type { RemoveRoomMemberRequest as RemoveRoomMemberInput, RoomRecord } from '@repo/validation';
import {
  grpcUnary,
  type ChatRoom,
  type GetRoomRequest as GetRoomRpcRequest,
  type RemoveRoomMemberRequest as RemoveRoomMemberRpcRequest,
  type RemoveRoomMemberResponse,
} from '@repo/proto';
import { v4 as uuidv4 } from 'uuid';
import { dbGrpcClient } from '../../grpc/client.js';
import { logger } from '../../logger.js';
import { redis } from '../../redis.js';
import { toGrpcAppError, toRoomRecord } from '../@helpers.js';

const REDIS_CHANNEL = 'chat-messages';

function fetchRoom(id: string): Promise<RoomRecord> {
  const request: GetRoomRpcRequest = { id };

  return grpcUnary<ChatRoom>((callback) => dbGrpcClient.getRoom(request, callback))
    .then((response) => toRoomRecord(response))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

function removeMember(memberId: string): Promise<void> {
  const request: RemoveRoomMemberRpcRequest = { id: memberId };

  return grpcUnary<RemoveRoomMemberResponse>((callback) => dbGrpcClient.removeRoomMember(request, callback))
    .then(() => undefined)
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room member')));
}

export const removeRoomMember = async (req: Request, res: Response) => {
  const { id: roomId, memberId } = req.params as RemoveRoomMemberInput['params'];
  const roomBeforeRemoval = await fetchRoom(roomId);
  const removedMember = roomBeforeRemoval.members.find((member) => member.id === memberId);

  await removeMember(memberId);
  const room = await fetchRoom(roomId);

  if (removedMember) {
    const removedUsername = removedMember.user?.username ?? 'A user';

    try {
      const remainingReceivers = room.members.map((member) => member.userId);
      if (remainingReceivers.length > 0) {
        await redis.publish(
          REDIS_CHANNEL,
          JSON.stringify({
            id: uuidv4(),
            sender: removedMember.userId,
            text: `${removedUsername} was removed from the group`,
            roomId,
            createdAt: new Date().toISOString(),
            receivers: remainingReceivers,
          }),
        );
      }

      await redis.publish(
        REDIS_CHANNEL,
        JSON.stringify({
          roomId,
          removedUserId: removedMember.userId,
          removedUsername,
          receivers: [removedMember.userId],
        }),
      );
    } catch (publishError) {
      logger.error({ publishError, roomId, memberId }, 'Room member removed but WS publish failed');
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Member removed successfully',
    data: {
      room,
      id: memberId,
    },
  });
};
