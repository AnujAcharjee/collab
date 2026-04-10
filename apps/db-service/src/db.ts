import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { logger } from './lib/logger.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : [],
});

export async function checkDbConnection() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error(error, 'Database connection failed');
  }
}

let isShuttingDown = false;
const handleShutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('Shutting down database connection');
  await prisma.$disconnect();
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

export * from '@prisma/client';
export default prisma;
