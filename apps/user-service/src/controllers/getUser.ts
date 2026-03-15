import type { Request, Response } from 'express';
import type { GetUserRequest } from '@repo/validation';
import type { GetUserRequest as GetUserRpcRequest, User } from '@repo/proto';
import { dbClient } from '../grpc/client.js';
import type { UserRecord } from '@repo/validation';
import { toAppError, toUserRecord } from './@helpers.js';

type UserLookup = {
  id?: string;
  email?: string;
  username?: string;
};

function fetchUser(lookup: UserLookup): Promise<UserRecord> {
  const request: GetUserRpcRequest = {
    id: lookup.id,
    email: lookup.email,
    username: lookup.username,
  };

  return new Promise((resolve, reject) => {
    dbClient.getUser(request, (error, response) => {
      if (error) return reject(toAppError(error));
      resolve(toUserRecord(response));
    });
  });
}

export const getUser = async (req: Request, res: Response) => {
  const validatedRequest = {
    params: req.params,
    query: req.query,
  } as GetUserRequest;

  const data: UserLookup = {
    id: validatedRequest.params.id ?? validatedRequest.query.id,
    email: validatedRequest.query.email?.toLowerCase(),
    username: validatedRequest.query.username,
  };

  const user = await fetchUser(data);

  return res.status(200).json({
    success: true,
    data: { user },
  });
};
