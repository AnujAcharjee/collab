import {
  grpcUnary,
  type CreateMessageRequest,
  type DeleteMessageResponse,
  type EditMessageTextRequest,
  type GetRoomMemberIdsResponse,
  type GetRoomMessagesResponse,
  type RoomMessages,
} from '@repo/proto';
import { dbGrpcClient } from './client.js';
import { toChatMessageRecord, type ChatMessageRecord } from '../controllers/@helpers.js';

export function getRoomMemberIds(roomId: string): Promise<string[]> {
  return grpcUnary<GetRoomMemberIdsResponse>((callback) =>
    dbGrpcClient.getRoomMemberIds({ roomId }, callback),
  ).then((response) => response.memberIds);
}

export function createMessage(request: CreateMessageRequest): Promise<ChatMessageRecord> {
  return grpcUnary<RoomMessages>((callback) => dbGrpcClient.createMessage(request, callback)).then(
    toChatMessageRecord,
  );
}

export function editMessageText(id: string, text: string): Promise<ChatMessageRecord> {
  const request: EditMessageTextRequest = { id, text };

  return grpcUnary<RoomMessages>((callback) => dbGrpcClient.editMessageText(request, callback)).then(
    toChatMessageRecord,
  );
}

export function deleteMessage(id: string): Promise<DeleteMessageResponse> {
  return grpcUnary<DeleteMessageResponse>((callback) => dbGrpcClient.deleteMessage({ id }, callback));
}

export function getRoomMessages(roomId: string, limit = 80): Promise<ChatMessageRecord[]> {
  return grpcUnary<GetRoomMessagesResponse>((callback) =>
    dbGrpcClient.getRoomMessages({ roomId, limit }, callback),
  ).then((response) => response.messages.map(toChatMessageRecord));
}
