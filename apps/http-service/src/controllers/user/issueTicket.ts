import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';
import type { IssueTicketRequest, IssueTicketResponse } from '@repo/validation';
import { redis } from '../../redis.js';

export const issueTicket = async (req: Request, res: Response) => {
  const { id, username, email } = req.body as IssueTicketRequest['body'];
  const ticket = uuidv4();

  await redis.set(
    `ws-ticket:${ticket}`,
    JSON.stringify({ id, username, email }),
    'EX',
    30,
  );

  const response: IssueTicketResponse = { ticket };

  res.status(200).json(response);
};
