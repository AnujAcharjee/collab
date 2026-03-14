import { redis } from './redis.js';
import prisma, { MessageType } from './db.js';
import { type ChatMessagePayload, chatMessagePayloadSchema } from '@repo/validation';
import { logger } from './logger.js';

const STREAM_KEY = 'stream:chat-messages';
const DLQ_STREAM_KEY = 'stream:chat-messages-dlq';
const GROUP_NAME = 'db-workers';
const CONSUMER_NAME = process.env.INSTANCE_NAME!;

const BLOCK_MS = 500;
const BATCH_SIZE = 100;

type RedisStreamResponse = [string, [string, string[]][]][];
type MessageFields = Record<string, string>;
type FailedMessage = {
  id: string;
  fields: MessageFields;
  reason: string;
  error: unknown;
};
type ParsedMessage = {
  id: string;
  payload: ChatMessagePayload;
  fields: MessageFields;
};

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  return String(error);
}

async function moveToDlq(messages: FailedMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const pipeline = redis.pipeline();

  for (const message of messages) {
    pipeline.xadd(
      DLQ_STREAM_KEY,
      '*',
      'originalStream',
      STREAM_KEY,
      'originalId',
      message.id,
      'reason',
      message.reason,
      'error',
      getErrorMessage(message.error),
      'data',
      JSON.stringify(message.fields),
    );
  }

  pipeline.xack(STREAM_KEY, GROUP_NAME, ...messages.map((message) => message.id));

  const results = await pipeline.exec();

  if (!results) {
    throw new Error('DLQ pipeline returned no results');
  }

  const pipelineError = results.find(([error]) => error);

  if (pipelineError) {
    throw pipelineError[0];
  }
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

  const parsedMessages: ParsedMessage[] = [];
  const failedMessages: FailedMessage[] = [];

  for (const [id, fields] of messages) {
    const fieldMap = parseFields(fields);

    try {
      const payload = toPayload(fieldMap);

      parsedMessages.push({ id, payload, fields: fieldMap });
    } catch (err) {
      logger.error(err, `Failed to parse message ${id}`);
      failedMessages.push({
        id,
        fields: fieldMap,
        reason: 'validation_failed',
        error: err,
      });
    }
  }

  if (failedMessages.length > 0) {
    try {
      await moveToDlq(failedMessages);
      logger.warn(
        failedMessages.map((message) => message.id),
        `${failedMessages.length} messages moved to DLQ`,
      );
    } catch (err) {
      logger.error(err, 'Failed to move invalid messages to DLQ.');
    }
  }

  if (parsedMessages.length === 0) return;

  try {
    await prisma.chatMessage.createMany({
      data: parsedMessages.map(({ payload }) => ({
        id: payload.id,
        type: MessageType.TEXT,
        parentId: payload.parentId ?? null,
        userId: payload.sender,
        roomId: payload.roomId,
        text: payload.text ?? '',
        attachments: payload.attachments ? JSON.parse(payload.attachments) : null,
        createdAt: new Date(payload.createdAt),
      })),
      skipDuplicates: true,
    });

    const successIds = parsedMessages.map((message) => message.id);

    if (successIds.length > 0) {
      await redis.xack(STREAM_KEY, GROUP_NAME, ...successIds);
      logger.info(`Inserted and acked ${successIds.length} messages`);
    }
  } catch (err) {
    logger.error(err, 'Bulk insert failed. Moving batch to DLQ.');

    try {
      await moveToDlq(
        parsedMessages.map((message) => ({
          id: message.id,
          fields: message.fields,
          reason: 'db_insert_failed',
          error: err,
        })),
      );
      logger.warn(`${parsedMessages.length} messages moved to DLQ after insert failure`);
    } catch (dlqError) {
      logger.error(dlqError, 'Failed to move insert failures to DLQ.');
    }
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
