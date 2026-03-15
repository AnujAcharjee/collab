import { credentials } from '@grpc/grpc-js';
import { DbClient } from '@repo/proto';

const GRPC_PORT = process.env.GRPC_PORT ?? 5051;

export const dbClient = new DbClient(`localhost:${GRPC_PORT}`, credentials.createInsecure());
