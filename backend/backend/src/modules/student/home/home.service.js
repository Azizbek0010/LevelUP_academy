import { getBalance } from '../../coins/coins.service.js';
import { getLeaderboard } from '../../leaderboard/leaderboard.service.js';
import { listHomeworkForStudent } from '../../homework/homework.repository.js';
import { getStudentGroupIds } from '../../../shared/membership.js';
import * as homeRepo from './home.repository.js';

const UPCOMING_HOMEWORK_LIMIT = 5;

/**
 * Дашборд студента: баланс коинов, долг, недельный рейтинг, группы и
 * ближайшие невыполненные ДЗ (топ-5 по дедлайну).
 */
export async function getDashboard(user) {
  const studentId = user.id;
  const groupIds = await getStudentGroupIds(studentId);

  const [coins, totalDebt, leaderboard, groups, homeworkList] = await Promise.all([
    getBalance(studentId),
    homeRepo.getTotalDebt(studentId),
    getLeaderboard(user.branchId, 'week', { limit: 20, studentId }),
    homeRepo.getGroupsForStudent(studentId),
    listHomeworkForStudent(studentId, groupIds),
  ]);

  const now = Date.now();
  const upcomingHomework = homeworkList
    .filter((h) => h.deadline && new Date(h.deadline).getTime() > now && h.submission_status !== 'graded')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, UPCOMING_HOMEWORK_LIMIT);

  return {
    coins,
    totalDebt,
    rank: leaderboard.me,
    groups,
    upcomingHomework,
  };
}
