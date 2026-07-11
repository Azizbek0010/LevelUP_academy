import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  idParam,
  groupStudentParams,
  createExpenseSchema,
  listExpensesQuery,
  createStudentSchema,
  updateStudentSchema,
  freezeStudentSchema,
  listStudentsQuery,
  createMentorSchema,
  freezeMentorSchema,
  updateMentorSchema,
  createGroupSchema,
  updateGroupSchema,
  addGroupStudentSchema,
  listGroupsQuery,
  createAnnouncementSchema,
} from './admin.schemas.js';
import * as ctrl from './admin.controller.js';
import paymentsRoutes from './payments/payments.routes.js';
import reportsRoutes from './reports/reports.routes.js';

/**
 * K-ADMIN — панель филиала. Только Admin; scope жёстко = свой branch_id.
 * Управление: дашборд, расходы, студенты (add-student с генерацией логин-кода),
 * группы, платежи (/payments), отчёты (/reports).
 */
const router = Router();

router.use(authenticate, authorize('admin'));

router.use('/payments', paymentsRoutes);
router.use('/reports', reportsRoutes);

// дашборд филиала: доход − расход = прибыль, студенты, группы, долги
router.get('/dashboard', ctrl.dashboard);

// расходы
router.post('/expenses', validate({ body: createExpenseSchema }), ctrl.createExpense);
router.get('/expenses', validate({ query: listExpensesQuery }), ctrl.listExpenses);
router.delete('/expenses/:id', validate({ params: idParam }), ctrl.deleteExpense);

// студенты
router.post('/students', validate({ body: createStudentSchema }), ctrl.createStudent);
router.get('/students', validate({ query: listStudentsQuery }), ctrl.listStudents);
router.get('/students/:id', validate({ params: idParam }), ctrl.studentDetail);
router.patch('/students/:id', validate({ params: idParam, body: updateStudentSchema }), ctrl.updateStudent);
router.post('/students/:id/freeze', validate({ params: idParam, body: freezeStudentSchema }), ctrl.freezeStudent);
router.post('/students/:id/regenerate-password', validate({ params: idParam }), ctrl.regenerateStudentPassword);
router.delete('/students/:id', validate({ params: idParam }), ctrl.deleteStudent);

// менторы (Admin заводит в своём филиале; вход у ментора по email)
router.post('/mentors', validate({ body: createMentorSchema }), ctrl.createMentor);
router.get('/mentors', ctrl.listMentors);
router.patch('/mentors/:id', validate({ params: idParam, body: updateMentorSchema }), ctrl.updateMentor);
router.post('/mentors/:id/freeze', validate({ params: idParam, body: freezeMentorSchema }), ctrl.freezeMentor);
router.delete('/mentors/:id', validate({ params: idParam }), ctrl.deleteMentor);

// группы
router.post('/groups', validate({ body: createGroupSchema }), ctrl.createGroup);
router.get('/groups', validate({ query: listGroupsQuery }), ctrl.listGroups);
router.get('/groups/:id', validate({ params: idParam }), ctrl.groupDetail);
router.patch('/groups/:id', validate({ params: idParam, body: updateGroupSchema }), ctrl.updateGroup);
router.post('/groups/:id/archive', validate({ params: idParam }), ctrl.archiveGroup);
router.post('/groups/:id/unarchive', validate({ params: idParam }), ctrl.unarchiveGroup);
router.post('/groups/:id/students', validate({ params: idParam, body: addGroupStudentSchema }), ctrl.addGroupStudent);
router.delete('/groups/:id/students/:studentId', validate({ params: groupStudentParams }), ctrl.removeGroupStudent);

// объявления (для Telegram-бота — рассылка родителям/студентам филиала или группы)
router.post('/announcements', validate({ body: createAnnouncementSchema }), ctrl.createAnnouncement);

export default router;
