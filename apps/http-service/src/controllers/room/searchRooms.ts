import type { Request, Response } from 'express';
import type { RoomRecord, SearchRoomsRequest } from '@repo/validation';
import { grpcUnary, type ChatRoom, type SearchRoomsRequest as SearchRoomsRpcRequest, type SearchRoomsResponse } from '@repo/proto';
import { dbGrpcClient } from '../../grpc/client.js';
import { toGrpcAppError, toRoomRecord } from '../@helpers.js';

function fetchRoomsByName(name: string): Promise<RoomRecord[]> {
  const request: SearchRoomsRpcRequest = { name };

  return grpcUnary<SearchRoomsResponse>((callback) => dbGrpcClient.searchRooms(request, callback))
    .then((response) => response.rooms.map((room: ChatRoom) => toRoomRecord(room)))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'Room')));
}

export const searchRooms = async (req: Request, res: Response) => {
  const { name } = req.query as SearchRoomsRequest['query'];
  const rooms = await fetchRoomsByName(name);

  return res.status(200).json({
    success: true,
    data: { rooms },
  });
};
