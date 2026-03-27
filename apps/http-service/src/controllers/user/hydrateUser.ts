import type { Request, Response } from 'express';
import type { HydrateUserRequest, RoomRecord, UserRecord } from '@repo/validation';
import {
  grpcUnary,
  type GetUserRequest as HydrateUserRpcRequest,
  type HydrateUserResponse,
} from '@repo/proto';
import { dbGrpcClient } from '../../grpc/client.js';
import { toGrpcAppError, toRoomRecord, toUserRecord } from '../@helpers.js';
import { AppError } from '../../utils/appError.js';

type UserLookup = {
  id?: string;
  email?: string;
  username?: string;
};

type HydratedUserRecord = {
  user: UserRecord;
  rooms: RoomRecord[];
};

function fetchHydratedUser(lookup: UserLookup): Promise<HydratedUserRecord> {
  const request: HydrateUserRpcRequest = {
    id: lookup.id,
    email: lookup.email,
    username: lookup.username,
  };

  return grpcUnary<HydrateUserResponse>((callback) => dbGrpcClient.hydrateUser(request, callback))
    .catch((error) => Promise.reject(toGrpcAppError(error, 'User')))
    .then((response) => {
      if (!response.user) {
        throw new AppError('Hydrate user response was missing user data', 500);
      }

      return {
        user: toUserRecord(response.user),
        rooms: response.rooms.map(toRoomRecord),
      };
    });
}

export const hydrateUser = async (req: Request, res: Response) => {
  const validatedRequest = {
    params: req.params,
    query: req.query,
  } as HydrateUserRequest;

  const data: UserLookup = {
    id: validatedRequest.params.id ?? validatedRequest.query.id,
    email: validatedRequest.query.email?.toLowerCase(),
    username: validatedRequest.query.username,
  };

  const hydratedUser = await fetchHydratedUser(data);

  return res.status(200).json({
    success: true,
    data: hydratedUser,
  });
};
