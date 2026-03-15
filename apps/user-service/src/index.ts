import 'dotenv/config';

import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { logger } from './logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { userRouter } from './routes/user.js';
import { dbClient } from './grpc/client.js';

const PORT = process.env.PORT ?? 3003;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/users', userRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`User service running on port: ${PORT}`);
});
