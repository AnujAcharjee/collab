import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authentication, oauthCallBack } from '../controllers/user/authentication.js';

export const authRouter: Router = Router();

authRouter.get('/pramaan', asyncHandler(authentication));
authRouter.get('/pramaan/callback', asyncHandler(oauthCallBack));
