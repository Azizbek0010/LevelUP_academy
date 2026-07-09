import { Router } from 'express';
import { createRateLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import { leadSubmitSchema } from './main.schemas.js';
import * as ctrl from './main.controller.js';

const router = Router();

// ПУБЛИЧНЫЙ приём заявки с лендинга — без токена, поэтому жёсткий rate-limit
// (защита от спама формы): 5 заявок в минуту с одного адреса.
const submitLimiter = createRateLimiter({ keyPrefix: 'rl:leads', points: 5, duration: 60 });

router.post('/', submitLimiter, validate({ body: leadSubmitSchema }), ctrl.submitLead);

export default router;
