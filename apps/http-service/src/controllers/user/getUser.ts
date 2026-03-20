import type { Request, Response } from 'express';
import type { GetUserRequest, UserRecord } from '@repo/validation';
import { grpcUnary, type GetUserRequest as GetUserRpcRequest, type User } from '@repo/proto';
import { dbGrpcClient } from '../../grpc/client.js';
import { toGrpcAppError, toUserRecord } from '../@helpers.js';

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

  return grpcUnary<User>((callback) => dbGrpcClient.getUser(request, callback))
    .then((response) => toUserRecord(response))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'User')));
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
