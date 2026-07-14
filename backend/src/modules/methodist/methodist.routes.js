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

// NOTE (docs gap): methodist.controller.js also exports createTest/listTests/getTest/
// updateTest/archiveTest and createHomework/listHomework/updateHomework/archiveHomework
// (using createTestSchema/updateTestSchema/createHomeworkSchema/updateHomeworkSchema,
// imported above), but none of them are wired to a router.METHOD() call below — they
// are unreachable dead code from the HTTP API's perspective and are intentionally left
// undocumented here (no route exists to document).

/**
 * @openapi
 * /api/methodist/training-types:
 *   post:
 *     tags: [Methodist]
 *     summary: Create a training type (organization-level content root)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateTrainingTypeRequest' }
 *     responses:
 *       201:
 *         description: Training type created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/TrainingType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Methodist]
 *     summary: List training types of the organization (with topic counts)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of training types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/TrainingType' }
 *                       - type: object
 *                         properties: { topics_count: { type: integer } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/training-types', validate({ body: createTrainingTypeSchema }), ctrl.createTrainingType);
router.get('/training-types', ctrl.listTrainingTypes);

/**
 * @openapi
 * /api/methodist/training-types/{id}:
 *   patch:
 *     tags: [Methodist]
 *     summary: Update a training type (partial)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateTrainingTypeRequest' }
 *     responses:
 *       200:
 *         description: Updated training type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/TrainingType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Training type not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/training-types/:id', validate({ params: idParam, body: updateTrainingTypeSchema }), ctrl.updateTrainingType);

/**
 * @openapi
 * /api/methodist/training-types/{id}/archive:
 *   post:
 *     tags: [Methodist]
 *     summary: Archive a training type
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Archived (no data payload)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/training-types/:id/archive', validate({ params: idParam }), ctrl.archiveTrainingType);

/**
 * @openapi
 * /api/methodist/topics:
 *   post:
 *     tags: [Methodist]
 *     summary: Create a topic inside a training type
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateTopicRequest' }
 *     responses:
 *       201:
 *         description: Topic created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Topic' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Training type not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/topics', validate({ body: createTopicSchema }), ctrl.createTopic);

/**
 * @openapi
 * /api/methodist/training-types/{id}/topics:
 *   get:
 *     tags: [Methodist]
 *     summary: List topics of a training type (with lesson counts)
 *     description: Path parameter is named `id` in the route but read as `trainingTypeId` by the controller.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: List of topics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/Topic' }
 *                       - type: object
 *                         properties: { lessons_count: { type: integer } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Training type not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/training-types/:trainingTypeId/topics', validate({ params: idParam }), ctrl.listTopics);

/**
 * @openapi
 * /api/methodist/topics/{id}:
 *   patch:
 *     tags: [Methodist]
 *     summary: Update a topic (partial)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateTopicRequest' }
 *     responses:
 *       200:
 *         description: Updated topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Topic' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Topic not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/topics/:id', validate({ params: idParam, body: updateTopicSchema }), ctrl.updateTopic);

/**
 * @openapi
 * /api/methodist/topics/{id}/archive:
 *   post:
 *     tags: [Methodist]
 *     summary: Archive a topic
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Archived (no data payload)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/topics/:id/archive', validate({ params: idParam }), ctrl.archiveTopic);

/**
 * @openapi
 * /api/methodist/lessons:
 *   post:
 *     tags: [Methodist]
 *     summary: Create a lesson (test or practical) inside a topic
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateLessonRequest' }
 *     responses:
 *       201:
 *         description: Lesson created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Lesson' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Topic not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/lessons', validate({ body: createLessonSchema }), ctrl.createLesson);

/**
 * @openapi
 * /api/methodist/topics/{id}/lessons:
 *   get:
 *     tags: [Methodist]
 *     summary: List lessons of a topic (with question counts)
 *     description: Path parameter is named `id` in the route but read as `topicId` by the controller.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: List of lessons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/Lesson' }
 *                       - type: object
 *                         properties: { questions_count: { type: integer } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Topic not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/topics/:topicId/lessons', validate({ params: idParam }), ctrl.listLessons);

/**
 * @openapi
 * /api/methodist/lessons/{id}:
 *   get:
 *     tags: [Methodist]
 *     summary: Get a lesson with its full question list
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Lesson with questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/LessonWithQuestions' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Lesson not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   patch:
 *     tags: [Methodist]
 *     summary: Update a lesson (partial)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateLessonRequest' }
 *     responses:
 *       200:
 *         description: Updated lesson
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Lesson' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Lesson not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/lessons/:id', validate({ params: idParam }), ctrl.getLesson);
router.patch('/lessons/:id', validate({ params: idParam, body: updateLessonSchema }), ctrl.updateLesson);

/**
 * @openapi
 * /api/methodist/lessons/{id}/archive:
 *   post:
 *     tags: [Methodist]
 *     summary: Archive a lesson
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Archived (no data payload)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/lessons/:id/archive', validate({ params: idParam }), ctrl.archiveLesson);

/**
 * @openapi
 * /api/methodist/lessons/{id}/copy:
 *   post:
 *     tags: [Methodist]
 *     summary: Copy a lesson (and all its questions) into another topic
 *     description: New lesson's title is suffixed with " (копия)". Target topic must belong to the same organization.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetTopicId]
 *             properties: { targetTopicId: { type: string, format: uuid } }
 *     responses:
 *       201:
 *         description: New lesson with copied questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/LessonWithQuestions' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Lesson or target topic not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/lessons/:id/copy', validate({ params: idParam, body: copyLessonSchema }), ctrl.copyLesson);

/**
 * @openapi
 * /api/methodist/questions:
 *   post:
 *     tags: [Methodist]
 *     summary: Create a single A/B/C/D question for a lesson
 *     description: >
 *       Note: unlike most other content-mutation endpoints in this module, this
 *       one does not verify the lesson belongs to the caller's organization
 *       before inserting (no findLessonInOrg check in the service).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateQuestionRequest' }
 *     responses:
 *       201:
 *         description: Question created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Question' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/questions', validate({ body: createQuestionSchema }), ctrl.createQuestion);

/**
 * @openapi
 * /api/methodist/questions/batch:
 *   post:
 *     tags: [Methodist]
 *     summary: Create multiple A/B/C/D questions for one or more lessons in a single insert
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questions]
 *             properties:
 *               questions:
 *                 type: array
 *                 minItems: 1
 *                 items: { $ref: '#/components/schemas/CreateQuestionRequest' }
 *     responses:
 *       201:
 *         description: Questions created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Question' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/questions/batch', validate({ body: createQuestionsBatchSchema }), ctrl.createQuestionsBatch);

/**
 * @openapi
 * /api/methodist/lessons/{lessonId}/questions:
 *   get:
 *     tags: [Methodist]
 *     summary: List questions of a lesson
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: lessonId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Question' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/lessons/:lessonId/questions', validate({ params: idParam }), ctrl.listQuestions);

/**
 * @openapi
 * /api/methodist/questions/{id}:
 *   patch:
 *     tags: [Methodist]
 *     summary: Update a question (partial)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateQuestionRequest' }
 *     responses:
 *       200:
 *         description: Updated question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Question' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   delete:
 *     tags: [Methodist]
 *     summary: Delete a question (hard delete)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       204: { description: Question deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/questions/:id', validate({ params: idParam, body: updateQuestionSchema }), ctrl.updateQuestion);
router.delete('/questions/:id', validate({ params: idParam }), ctrl.deleteQuestion);

/**
 * @openapi
 * /api/methodist/students:
 *   get:
 *     tags: [Methodist]
 *     summary: List all students in the organization with their groups (no financial data)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Raw row shape from listStudentsWithGroups (organization-wide, all branches)
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/students', ctrl.getStudents);

/**
 * @openapi
 * /api/methodist/groups:
 *   get:
 *     tags: [Methodist]
 *     summary: List all groups in the organization (all branches)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Raw row shape from listGroupsByOrg (organization-wide, all branches)
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/groups', ctrl.getGroups);

/**
 * @openapi
 * /api/methodist/difficulty:
 *   get:
 *     tags: [Methodist]
 *     summary: Difficulty analytics report — test and homework score stats across the organization
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Difficulty report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tests:
 *                       type: array
 *                       items: { type: object, description: 'Row shape from testDifficultyStats' }
 *                     homework:
 *                       type: array
 *                       items: { type: object, description: 'Row shape from homeworkStats' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/difficulty', ctrl.getDifficultyReport);

export default router;
