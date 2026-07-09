import { Router } from 'express';
import * as ctrl from './home.controller.js';

const router = Router();

// auth: authenticate + authorize('student') навешаны в student.routes.js
router.get('/', ctrl.getDashboard);

export default router;
