import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const NODE_ENV = process.env.NODE_ENV;
const NEON_PG_DATABASE_URL = process.env.NEON_PG_DATABASE_URL;

if (!NODE_ENV) throw new Error('NEON_ENV is required');
if (!NEON_PG_DATABASE_URL) throw new Error('NEON_PG_DATABASE_URL is required');

const adapter = new PrismaPg({ connectionString: NEON_PG_DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : [],
});

export async function checkDbConnection() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

let isShuttingDown = false;
const handleShutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // logger.info('Shutting down database connection');
  await prisma.$disconnect();
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

export default prisma;
