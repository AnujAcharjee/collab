import 'dotenv/config';

import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { roomRouter } from './routes/room.js';
import { logger } from './logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { userRouter } from './routes/user.js';
import { loggingMiddleware } from './middleware/loggingMiddleware.js';

const PORT = process.env.PORT ?? 3003;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(loggingMiddleware);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/rooms', roomRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`HTTP service running on port: ${PORT}`);
});
