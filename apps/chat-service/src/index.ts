import 'dotenv/config';

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { redisPub } from './redis.js';
import { logger } from './logger.js';
import { validateRequest } from './middleware/validation.js';
import { chatMessageSchema, type ChatMessage } from '@repo/validation';
import { errorHandler } from './middleware/errorHandler.js';

const redisChannel = 'chat-messages';

const app = express();

async function main() {
  try {
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.listen(process.env.PORT || 3001, () => {
      logger.info(`Chat service is running on port ${process.env.PORT || 3001}`);
    });

    logger.info('Server started successfully 🎉🎉');
  } catch (error) {
    logger.error({ error }, 'Failed to start service');
  }
}
main();

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Publish message to Redis channel
app.post('/publish', validateRequest(chatMessageSchema), async (req: Request, res: Response) => {
  const message = req.body as ChatMessage;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  try {
    await redisPub.publish(redisChannel, JSON.stringify(message));
    logger.info({ message }, `Message published to Redis channel ${redisChannel}`);
    res.status(200).json({ success: true, message: 'Message published successfully', data: { message } });
  } catch (error) {
    logger.error({ error }, 'Failed to publish message to Redis');
    res.status(500).json({ success: false, error: 'Failed to publish message' });
  }
});

app.use(errorHandler);
