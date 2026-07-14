import { AppError } from '../../../utils/AppError.js';
import { getLeaderboard } from '../../leaderboard/leaderboard.service.js';
import * as repo from './overview.repository.js';

const ATTENDANCE_WINDOW_DAYS = 30;
const RECENT_LIMIT = 5;

/**
 * Guard принадлежности: ребёнок должен быть привязан к этому родителю
 * (student_profiles.parent_id). Возвращает карточку ребёнка или бросает 403 —
 * родитель не должен даже знать, существует ли чужой ребёнок.
 */
async function assertParentOwnsChild(parentId, childId) {
  const child = await repo.getChild(parentId, childId);
  if (!child) throw new AppError(403, 'Child does not belong to this parent');
  return child;
}

/** Список детей родителя (краткие карточки для экрана выбора). */
export async function listChildren(parentId) {
  return repo.getChildrenForParent(parentId);
}

/**
 * Полный обзор одного ребёнка: коины, долг, недельный рейтинг, группы,
 * посещаемость (сводка за 30 дней + последние отметки) и оценки (ДЗ + тесты).
 */
export async function getChildOverview(parentId, childId) {
  const child = await assertParentOwnsChild(parentId, childId);

  const [leaderboard, groups, attendanceSummary, recentAttendance, homeworkGrades, testResults] =
    await Promise.all([
      getLeaderboard(child.branchId, 'week', { limit: 20, studentId: childId }),
      repo.getGroups(childId),
      repo.getAttendanceSummary(childId, ATTENDANCE_WINDOW_DAYS),
      repo.getRecentAttendance(childId, RECENT_LIMIT),
      repo.getRecentHomeworkGrades(childId, RECENT_LIMIT),
      repo.getRecentTestResults(childId, RECENT_LIMIT),
    ]);

  return {
    child: {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      avatarKey: child.avatarKey,
      frozen: child.frozen,
    },
    coins: child.coins,
    totalDebt: child.totalDebt,
    rank: leaderboard.me,
    groups,
    attendance: {
      windowDays: ATTENDANCE_WINDOW_DAYS,
      summary: attendanceSummary,
      recent: recentAttendance,
    },
    grades: {
      homework: homeworkGrades,
      tests: testResults,
    },
  };
}
