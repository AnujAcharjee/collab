import { Router } from 'express';
import { healthCheck } from '../controllers/healthCheck.js';

export const healthRouter: Router = Router();

healthRouter.get('/health', healthCheck);
