import { logger } from '../logger.js';
import prisma, { RoomMemberRole as PrismaRoomMemberRole } from '../db.js';
import { ServerUnaryCall, sendUnaryData, status } from '@grpc/grpc-js';
import { RoomMemberRole } from '@repo/proto';
import type {
  GetRoomMemberIdsRequest,
  GetRoomMemberIdsResponse,
  GetRoomMembersRequest,
  GetRoomMembersResponse,
  AddRoomMemberRequest,
  EditRoomMemberRequest,
  RemoveRoomMemberRequest,
  ChatRoomMember,
  RemoveRoomMemberResponse,
} from '@repo/proto';

const roleMap: Record<PrismaRoomMemberRole, RoomMemberRole> = {
  [PrismaRoomMemberRole.MEMBER]: RoomMemberRole.MEMBER,
  [PrismaRoomMemberRole.ADMIN]: RoomMemberRole.ADMIN,
  [PrismaRoomMemberRole.OWNER]: RoomMemberRole.OWNER,
};

export const roomMembers = {
  getRoomMemberIds: async (
    call: ServerUnaryCall<GetRoomMemberIdsRequest, GetRoomMemberIdsResponse>,
    callback: sendUnaryData<GetRoomMemberIdsResponse>,
  ) => {
    try {
      const members = await prisma.chatRoomMember.findMany({
        where: { roomId: call.request.roomId },
      });

      if (!members.length) {
        return callback({
          code: status.NOT_FOUND,
          message: `No members found for the room: ${call.request.roomId}`,
        });
      }

      callback(null, {
        memberIds: members.map((m) => m.id),
      });
    } catch (err) {
      logger.error(err, 'GetRoomMembers failed');
      callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  getRoomMembers: async (
    call: ServerUnaryCall<GetRoomMembersRequest, GetRoomMembersResponse>,
    callback: sendUnaryData<GetRoomMembersResponse>,
  ) => {
    try {
      const members = await prisma.chatRoomMember.findMany({
        where: { roomId: call.request.roomId },
      });

      if (!members.length) {
        return callback({
          code: status.NOT_FOUND,
          message: `No members found for the room: ${call.request.roomId}`,
        });
      }

      callback(null, {
        members: members.map((m) => ({
          ...m,
          role: roleMap[m.role],
          createdAt: m.createdAt,
        })),
      });
    } catch (err) {
      logger.error(err, 'GetRoomMembers failed');
      callback({ code: status.INTERNAL, message: 'Internal server error' });
    }
  },

  addRoomMember: async (
    call: ServerUnaryCall<AddRoomMemberRequest, ChatRoomMember>,
    callback: sendUnaryData<ChatRoomMember>,
  ) => {},

  editRoomMember: async (
    call: ServerUnaryCall<EditRoomMemberRequest, ChatRoomMember>,
    callback: sendUnaryData<ChatRoomMember>,
  ) => {},

  removeRoomMember: async (
    call: ServerUnaryCall<RemoveRoomMemberRequest, RemoveRoomMemberResponse>,
    callback: sendUnaryData<RemoveRoomMemberResponse>,
  ) => {},
};
