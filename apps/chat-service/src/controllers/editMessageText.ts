import type { Request, Response } from 'express';
import type { EditMessageTextInput } from '@repo/validation';
import { editMessageText as editMessageTextRpc } from '../grpc/index.js';
import { logger } from '../lib/logger.js';
import { toHttpError } from './@helpers.js';

export const editMessageText = async (req: Request, res: Response) => {
  const { id } = req.params as EditMessageTextInput['params'];
  const { text } = req.body as EditMessageTextInput['body'];

  try {
    const message = await editMessageTextRpc(id, text);

    return res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: { message },
    });
  } catch (error) {
    logger.error({ error, id }, 'Edit message text failed');
    const httpError = toHttpError(error);

    return res.status(httpError.statusCode).json({
      success: false,
      error: httpError.message,
    });
  }
};
