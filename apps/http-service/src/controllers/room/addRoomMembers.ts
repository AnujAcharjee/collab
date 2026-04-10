import type { ServiceError } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import type { Request, Response } from 'express';
import {
  grpcUnary,
  RoomMemberRole,
  type AddRoomMemberRequest as AddRoomMemberRpcRequest,
  type ChatRoom,
  type ChatRoomMember,
  type GetRoomRequest as GetRoomRpcRequest,
  type GetUserRequest as GetUserRpcRequest,
  type User,
} from '@repo/proto';
import type {
  AddRoomMembersRequest as AddRoomMembersInput,
  RoomMemberRecord,
  RoomRecord,
} from '@repo/validation';
import { dbGrpcClient } from '../../lib/grpc.js';
import { toGrpcAppError, toRoomMemberRecord, toRoomRecord } from '../@helpers.js';

function fetchRoom(id: string): Promise<RoomRecord> {
  const request: GetRoomRpcRequest = { id };

  return grpcUnary<ChatRoom>((callback) => dbGrpcClient.getRoom(request, callback))
    .then((response) => toRoomRecord(response))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

function fetchUserByUsername(username: string): Promise<User> {
  const request: GetUserRpcRequest = { username };

  return grpcUnary<User>((callback) => dbGrpcClient.getUser(request, callback)).catch((error) =>
    Promise.reject(toGrpcAppError(error, 'User')),
  );
}

function addMember(roomId: string, userId: string): Promise<RoomMemberRecord | null> {
  const request: AddRoomMemberRpcRequest = {
    roomId,
    userId,
    role: RoomMemberRole.MEMBER,
  };

  return grpcUnary<ChatRoomMember>((callback) => dbGrpcClient.addRoomMember(request, callback))
    .then((response) => toRoomMemberRecord(response))
    .catch((error: ServiceError) => {
      if (error.code === status.ALREADY_EXISTS) {
        return Promise.resolve(null);
      }

      return Promise.reject(toGrpcAppError(error, 'Room member'));
    });
}

export const addRoomMembers = async (req: Request, res: Response) => {
  const { id: roomId } = req.params as AddRoomMembersInput['params'];
  const { usernames } = req.body as AddRoomMembersInput['body'];
  const normalizedUsernames = [
    ...new Set(usernames.map((username) => username.trim().replace(/^@+/, ''))),
  ].filter(Boolean);

  const users = await Promise.all(normalizedUsernames.map((username) => fetchUserByUsername(username)));
  const createdMembers = await Promise.all(users.map((user) => addMember(roomId, user.id)));
  const room = await fetchRoom(roomId);

  return res.status(201).json({
    success: true,
    message: 'Members added successfully',
    data: {
      room,
      addedCount: createdMembers.filter(Boolean).length,
    },
  });
};
