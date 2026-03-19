import type { Request, Response } from 'express';
import type { DeleteMessageInput } from '@repo/validation';
import { deleteMessage as deleteMessageRpc } from '../grpc/index.js';
import { logger } from '../logger.js';
import { toHttpError } from './@helpers.js';

export const deleteMessage = async (req: Request, res: Response) => {
  const { id } = req.params as DeleteMessageInput['params'];

  try {
    const result = await deleteMessageRpc(id);

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: result,
    });
  } catch (error) {
    logger.error({ error, id }, 'Delete message failed');
    const httpError = toHttpError(error);

    return res.status(httpError.statusCode).json({
      success: false,
      error: httpError.message,
    });
  }
};
