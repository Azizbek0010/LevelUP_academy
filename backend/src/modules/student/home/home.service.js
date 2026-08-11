import { getBalance } from '../../coins/coins.service.js';
import { getLeaderboard } from '../../leaderboard/leaderboard.service.js';
import { listHomeworkForStudent } from '../../homework/homework.repository.js';
import { getStudentGroupIds } from '../../../shared/membership.js';
import { getTopicStats, getLatestReview } from '../lessons/lessons.repository.js';
import * as homeRepo from './home.repository.js';

const UPCOMING_HOMEWORK_LIMIT = 5;

/** methodology_submissions.review (Groq responseSchema) -> контракт
 * FeedbackDemo.jsx у XOB: score/praise/growth_area/tips/summary как есть,
 * + source/status/lessonTitle сверху для UI (badge "макет"/дата и т.п.). */
function shapeReview(row) {
  if (!row) return null;
  return {
    ...row.review,
    source: row.review_source,
    status: row.review_status,
    lessonTitle: row.lesson_title,
    reviewedAt: row.reviewed_at,
  };
}

/**
 * Дашборд студента: баланс коинов, долг, недельный рейтинг, группы,
 * ближайшие невыполненные ДЗ (топ-5 по дедлайну), статистика по темам методики
 * (topicStats — где ученик системно слабее/сильнее) и последний AI-разбор
 * практической сдачи (review, Aqlli tahlil).
 */
export async function getDashboard(user) {
  const studentId = user.id;
  const groupIds = await getStudentGroupIds(studentId);

  const [coins, totalDebt, leaderboard, groups, homeworkList, topicStats, latestReview] = await Promise.all([
    getBalance(studentId),
    homeRepo.getTotalDebt(studentId),
    getLeaderboard(user.branchId, 'week', { limit: 20, studentId }),
    homeRepo.getGroupsForStudent(studentId),
    listHomeworkForStudent(studentId, groupIds),
    getTopicStats(studentId),
    getLatestReview(studentId),
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
    topicStats: topicStats.map((t) => ({ topicId: t.topic_id, name: t.topic_name, pct: t.pct })),
    review: shapeReview(latestReview),
  };
}
