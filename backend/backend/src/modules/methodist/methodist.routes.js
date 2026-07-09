import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  createTestSchema,
  updateTestSchema,
  createHomeworkSchema,
  updateHomeworkSchema,
  idParam,
} from './methodist.schemas.js';
import {
  createTrainingTypeSchema,
  updateTrainingTypeSchema,
  createTopicSchema,
  updateTopicSchema,
  createLessonSchema,
  updateLessonSchema,
  createQuestionSchema,
  updateQuestionSchema,
  createQuestionsBatchSchema,
  copyLessonSchema,
} from './content.schemas.js';
import * as ctrl from './methodist.controller.js';

/**
 * METHODIST — создаёт методики, тесты, задания.
 * Видит все филиалы, группы, студентов в своей организации.
 * НЕ видит финансовую информацию (выручка, долги, зарплаты).
 */
const router = Router();

router.use(authenticate, authorize('methodist'));

// --- Типы обучения (Training Types) ---
router.post('/training-types', validate({ body: createTrainingTypeSchema }), ctrl.createTrainingType);
router.get('/training-types', ctrl.listTrainingTypes);
router.patch('/training-types/:id', validate({ params: idParam, body: updateTrainingTypeSchema }), ctrl.updateTrainingType);
router.post('/training-types/:id/archive', validate({ params: idParam }), ctrl.archiveTrainingType);

// --- Темы (Topics) внутри типа обучения ---
router.post('/topics', validate({ body: createTopicSchema }), ctrl.createTopic);
router.get('/training-types/:trainingTypeId/topics', validate({ params: idParam }), ctrl.listTopics);
router.patch('/topics/:id', validate({ params: idParam, body: updateTopicSchema }), ctrl.updateTopic);
router.post('/topics/:id/archive', validate({ params: idParam }), ctrl.archiveTopic);

// --- Уроки (тест / практика) внутри темы ---
router.post('/lessons', validate({ body: createLessonSchema }), ctrl.createLesson);
router.get('/topics/:topicId/lessons', validate({ params: idParam }), ctrl.listLessons);
router.get('/lessons/:id', validate({ params: idParam }), ctrl.getLesson);
router.patch('/lessons/:id', validate({ params: idParam, body: updateLessonSchema }), ctrl.updateLesson);
router.post('/lessons/:id/archive', validate({ params: idParam }), ctrl.archiveLesson);
router.post('/lessons/:id/copy', validate({ params: idParam, body: copyLessonSchema }), ctrl.copyLesson);

// --- Вопросы (A/B/C/D) внутри урока ---
router.post('/questions', validate({ body: createQuestionSchema }), ctrl.createQuestion);
router.post('/questions/batch', validate({ body: createQuestionsBatchSchema }), ctrl.createQuestionsBatch);
router.get('/lessons/:lessonId/questions', validate({ params: idParam }), ctrl.listQuestions);
router.patch('/questions/:id', validate({ params: idParam, body: updateQuestionSchema }), ctrl.updateQuestion);
router.delete('/questions/:id', validate({ params: idParam }), ctrl.deleteQuestion);

// --- аналитика (студенты, группы, сложности) ---
router.get('/students', ctrl.getStudents);
router.get('/groups', ctrl.getGroups);
router.get('/difficulty', ctrl.getDifficultyReport);

export default router;
