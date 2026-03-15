import { logger } from '../logger.js';
import prisma from '../db.js';
import { ServerUnaryCall, sendUnaryData, status } from '@grpc/grpc-js';

export const chatRoom = {
  getRoom: async (call: ServerUnaryCall<any, any>, callback: sendUnaryData<any>) => {
    try {
      const group = await prisma.chatRoom.findUnique({
        where: { id: call.request.id },
      });

      if (!group) {
        return callback({
          code: status.NOT_FOUND,
          message: `Group ${call.request.id} not found`,
        });
      }

      callback(null, group);
    } catch (err) {
      logger.error(err, 'GetGroup failed');
      callback({
        code: status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
  createRoom: (call: ServerUnaryCall<any, any>, callback: sendUnaryData<any>) => {},
  editRoom: (call: ServerUnaryCall<any, any>, callback: sendUnaryData<any>) => {},
  deleteRoom: (call: ServerUnaryCall<any, any>, callback: sendUnaryData<any>) => {},
};
