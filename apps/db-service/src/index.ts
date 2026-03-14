import 'dotenv/config';
import { ensureGroup, consumeAndBulkInsert } from './consumeAndBulkWrite.js';
import { logger } from './logger.js';

async function startWorker(): Promise<void> {
  while (true) {
    await ensureGroup();

    try {
      await consumeAndBulkInsert();
    } catch (err) {
      logger.error(err, 'Worker crashed');
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

startWorker();
