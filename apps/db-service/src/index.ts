import 'dotenv/config';
import { ensureGroup, consumeAndBulkInsert } from './consumeAndBulkWrite.js';
import { logger } from './logger.js';
import { Server, ServerCredentials } from '@grpc/grpc-js';
import { DbService } from '@repo/proto';
import { chatRoom, roomMembers, user } from './grpc/index.js';

const GRPC_PORT = process.env.GRPC_PORT || 5051;

const grpc = new Server();
grpc.addService(DbService, {
  ...roomMembers,
  ...chatRoom,
  ...user,
});

grpc.bindAsync(`0.0.0.0:${GRPC_PORT}`, ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    logger.error(err, 'Failed to bind gRPC server');
    process.exit(1);
  }
  logger.info(`gRPC server listening on port: ${port}`);
});

async function startWorker(): Promise<void> {
  await ensureGroup();

  while (true) {
    try {
      await consumeAndBulkInsert();
    } catch (err) {
      logger.error(err, 'Worker crashed');
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

startWorker();
