import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './videos.controller.js';
import { videoIdParamSchema } from './videos.schemas.js';

const router = Router();

// auth: authenticate + authorize('student') навешаны в student.routes.js
router.get('/', ctrl.listVideos);
router.get('/:videoId/stream-url', validate({ params: videoIdParamSchema }), ctrl.getStreamUrl);

export default router;
