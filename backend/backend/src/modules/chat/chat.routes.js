import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRoomAccess } from '../../middlewares/roomAccess.js';
import * as ctrl from './chat.controller.js';

const router = Router();

// authenticate + проверка членства в комнате (closes TODO(Karis)):
// global — все кроме студентов; parent:<id> — сам родитель или staff; group:<id> — участник группы.
router.get('/:roomKey/messages', authenticate, requireRoomAccess, ctrl.getMessages);

export default router;
