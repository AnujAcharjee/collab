import { redis } from './redis.js';
import prisma, { MessageType } from './db.js';
import { type ChatMessagePayload, chatMessagePayloadSchema } from '@repo/validation';
import { logger } from './logger.js';

const STREAM_KEY = 'stream:chat-messages';
const GROUP_NAME = 'db-workers';
const CONSUMER_NAME = 'worker-1';

const BLOCK_MS = 500;
const BATCH_SIZE = 100;

type RedisStreamResponse = [string, [string, string[]][]][];
type MessageFields = Record<string, string>;

function parseFields(fields: string[]): MessageFields {
  const map: MessageFields = {};

  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];

    if (key === undefined || value === undefined) continue;

    map[key] = value;
  }

  return map;
}

function toPayload(fields: MessageFields): ChatMessagePayload {
  const rawPayload = fields.data ? JSON.parse(fields.data) : fields;
  return chatMessagePayloadSchema.parse(rawPayload);
}

export async function consumeAndBulkInsert(): Promise<void> {
  const results = (await redis.xreadgroup(
    'GROUP',
    GROUP_NAME,
    CONSUMER_NAME,
    'COUNT',
    BATCH_SIZE,
    'BLOCK',
    BLOCK_MS,
    'STREAMS',
    STREAM_KEY,
    '>',
  )) as RedisStreamResponse | null;

  if (!results || results.length === 0) return;

  const stream = results[0];
  if (!stream) return;

  const [, messages] = stream;

  if (!messages.length) return;

  const payloads: ChatMessagePayload[] = [];
  const successIds: string[] = [];
  const failedIds: string[] = [];

  for (const [id, fields] of messages) {
    try {
      const fieldMap = parseFields(fields);
      const payload = toPayload(fieldMap);

      payloads.push(payload);
      successIds.push(id);
    } catch (err) {
      console.error(`Failed to parse message ${id}`, err);
      failedIds.push(id);
    }
  }

  if (payloads.length === 0) return;

  try {
    await prisma.chatMessage.createMany({
      data: payloads.map((p) => ({
        id: p.id,
        type: MessageType.TEXT,
        parentId: p.parentId ?? null,
        userId: p.sender,
        roomId: p.roomId,
        text: p.text ?? '',
        attachments: p.attachments ? JSON.parse(p.attachments) : null,
        createdAt: new Date(p.createdAt),
      })),
      skipDuplicates: true,
    });

    if (successIds.length > 0) {
      await redis.xack(STREAM_KEY, GROUP_NAME, ...successIds);
      console.log(`Inserted and acked ${successIds.length} messages`);
    }
  } catch (err) {
    console.error('Bulk insert failed. Messages remain in PEL for retry.', err);
  }

  if (failedIds.length > 0) {
    console.warn(`${failedIds.length} messages failed validation`, failedIds);
  }
}

export async function ensureGroup() {
  try {
    await redis.xinfo('GROUPS', STREAM_KEY);

    // logger.info('Consumer group already exists');
  } catch {
    await redis.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '$', 'MKSTREAM');

    // logger.info('Consumer group created');
  }
}
