import { dbClient } from '../index.js';
import type { ServiceError } from '@grpc/grpc-js';
import type { GetRoomMemberIdsResponse } from '@repo/proto';

export function getRoomMemberIds(roomId: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    dbClient.getRoomMemberIds({ roomId }, (err: ServiceError | null, res: GetRoomMemberIdsResponse) => {
      if (err) return reject(err);
      resolve(res.memberIds);
    });
  });
}
