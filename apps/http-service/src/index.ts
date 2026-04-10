import 'dotenv/config';

import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { roomRouter } from './routes/room.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { userRouter } from './routes/user.js';
import { loggingMiddleware } from './middleware/loggingMiddleware.js';
import { authenticateRequest } from './middleware/authenticateRequest.js';

const PORT = process.env.PORT ?? 3003;

const app = express();

app.use(
  cors({
    origin: process.env.WEB_APP_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(loggingMiddleware);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/rooms', authenticateRequest, roomRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`HTTP service running on port: ${PORT}`);
});
