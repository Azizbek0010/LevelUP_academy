import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './admin.service.js';

// authorize('admin') жёстко проставляет req.scope = { organizationId, branchId } из токена
const branchId = (req) => req.scope.branchId;

// ---------- дашборд ----------
export const dashboard = asyncHandler(async (req, res) => {
  res.json(await service.dashboard(branchId(req)));
});

// ---------- настройки (длительность урока из организации, для формы группы) ----------
export const settings = asyncHandler(async (req, res) => {
  res.json(await service.getSettings(branchId(req)));
});

// ---------- расходы ----------
export const createExpense = asyncHandler(async (req, res) => {
  res.status(201).json({ expense: await service.createExpense(req.scope, req.user.id, req.body) });
});

export const listExpenses = asyncHandler(async (req, res) => {
  res.json(await service.listExpenses(branchId(req), req.query));
});

export const deleteExpense = asyncHandler(async (req, res) => {
  await service.deleteExpense(branchId(req), req.params.id);
  res.status(204).end();
});

// ---------- студенты ----------
export const createStudent = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createStudent(req.scope, req.body));
});

export const listStudents = asyncHandler(async (req, res) => {
  res.json(await service.listStudents(branchId(req), req.query));
});

export const studentDetail = asyncHandler(async (req, res) => {
  res.json({ student: await service.studentDetail(branchId(req), req.params.id) });
});

export const updateStudent = asyncHandler(async (req, res) => {
  res.json({ student: await service.updateStudent(branchId(req), req.params.id, req.body) });
});

export const freezeStudent = asyncHandler(async (req, res) => {
  res.json({
    student: await service.setStudentFrozen(
      branchId(req),
      req.params.id,
      req.body.frozen,
      req.body.reason,
    ),
  });
});

export const regenerateStudentPassword = asyncHandler(async (req, res) => {
  res.json(await service.regenerateStudentPassword(branchId(req), req.params.id));
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await service.deleteStudent(branchId(req), req.params.id);
  res.status(204).end();
});

// ---------- менторы ----------
export const createMentor = asyncHandler(async (req, res) => {
  res.status(201).json({ mentor: await service.createMentor(req.scope, req.body) });
});

export const listMentors = asyncHandler(async (req, res) => {
  res.json(await service.listMentors(branchId(req)));
});

export const freezeMentor = asyncHandler(async (req, res) => {
  res.json({ mentor: await service.setMentorFrozen(branchId(req), req.params.id, req.body.frozen) });
});

export const updateMentor = asyncHandler(async (req, res) => {
  // req.user.id — кто присвоил грейд, пишется в mentor_profiles.grade_set_by
  res.json({
    mentor: await service.updateMentor(branchId(req), req.params.id, req.body, req.user.id),
  });
});

export const deleteMentor = asyncHandler(async (req, res) => {
  await service.deleteMentor(branchId(req), req.params.id);
  res.status(204).end();
});

// ---------- группы ----------
export const createGroup = asyncHandler(async (req, res) => {
  res.status(201).json({ group: await service.createGroup(branchId(req), req.body) });
});

export const listGroups = asyncHandler(async (req, res) => {
  res.json(await service.listGroups(branchId(req), req.query));
});

export const groupDetail = asyncHandler(async (req, res) => {
  res.json({ group: await service.groupDetail(branchId(req), req.params.id) });
});

export const updateGroup = asyncHandler(async (req, res) => {
  res.json({ group: await service.updateGroup(branchId(req), req.params.id, req.body) });
});

export const archiveGroup = asyncHandler(async (req, res) => {
  res.json({ group: await service.setGroupArchived(branchId(req), req.params.id, true) });
});

export const unarchiveGroup = asyncHandler(async (req, res) => {
  res.json({ group: await service.setGroupArchived(branchId(req), req.params.id, false) });
});

export const addGroupStudent = asyncHandler(async (req, res) => {
  res.status(201).json(
    await service.addGroupStudent(branchId(req), req.params.id, req.body.studentId),
  );
});

export const removeGroupStudent = asyncHandler(async (req, res) => {
  await service.removeGroupStudent(branchId(req), req.params.id, req.params.studentId);
  res.status(204).end();
});

// ---------- объявления ----------
export const createAnnouncement = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createAnnouncement(branchId(req), req.body));
});
