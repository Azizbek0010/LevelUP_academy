import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { createBindToken } from './telegram.controller.js';

const router = Router();

router.post('/bind-token', authenticate, createBindToken);

export default router;
