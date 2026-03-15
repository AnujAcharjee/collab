import 'dotenv/config';

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { redis } from './redis.js';
import { logger } from './logger.js';
import { validateRequest } from './middleware/validation.js';
import {
  chatMessageSchema,
  type ChatMessage,
  type ChatMessagePayloadAndReceivers,
  type ChatMessagePayload,
} from '@repo/validation';
import { errorHandler } from './middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { credentials } from '@grpc/grpc-js';
import { DbClient } from '@repo/proto';
import { getRoomMemberIds } from './grpc/index.js';

const PORT = process.env.PORT ?? 3001;
const GRPC_PORT = process.env.GRPC_PORT ?? 5051;
const REDIS_CHANNEL = 'chat-messages';
const CHAT_STREAM = 'stream:chat-messages';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// gRPC client
export const dbClient = new DbClient(`localhost:${GRPC_PORT}`, credentials.createInsecure());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Publish message to Redis channel
app.post('/publish', validateRequest(chatMessageSchema), async (req: Request, res: Response) => {
  const message = req.body as ChatMessage['body'];

  // generate payload
  const id = uuidv4();
  const chatMessagePayload: ChatMessagePayload = {
    ...message,
    id,
    createdAt: new Date().toISOString(),
  };

  try {
    // fetch receivers
    const receivers = await getRoomMemberIds(chatMessagePayload.roomId);
    logger.debug(receivers, 'Message Receivers');

    // redis actions
    const pipeline = redis
      .pipeline()
      .xadd(CHAT_STREAM, 'MAXLEN', '~', 100000, '*', 'data', JSON.stringify(chatMessagePayload));

    if (receivers.length > 0) {
      const chatMessageAndReceiversPayload: ChatMessagePayloadAndReceivers = {
        ...chatMessagePayload,
        receivers,
      };

      pipeline.publish(REDIS_CHANNEL, JSON.stringify(chatMessageAndReceiversPayload));
    }

    const pipelineResults = await pipeline.exec();

    if (!pipelineResults) {
      throw new Error('Redis pipeline returned no results');
    }

    const pipelineError = pipelineResults.find(([error]) => error);

    if (pipelineError) {
      throw pipelineError[0];
    }

    logger.info({ message }, `Message published to Redis channel ${REDIS_CHANNEL}`);
    res
      .status(200)
      .json({ success: true, message: 'Message sent successfully', data: { message, status: 'sent' } });
  } catch (error) {
    logger.error({ error }, 'Failed to publish message to Redis');
    res.status(500).json({ success: false, error: 'Failed to publish message' });
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Chat service running on port ${PORT}`);
});
