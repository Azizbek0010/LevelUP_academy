import { AppError } from '../../../utils/AppError.js';
import { buildObjectKey, getUploadUrl as getS3UploadUrl } from '../../../config/s3.js';
import { changeCoins } from '../../coins/coins.service.js';
import { aiReviewQueue } from '../../../queues/aiReview.queue.js';
import { sendToBranchGroup } from '../../telegram/branchNotify.js';
import { logger } from '../../../config/logger.js';
import * as repo from './lessons.repository.js';

// Тот же порог, что у group-тестов (student/tests/tests.service.js) — для единообразия.
const PASS_SCORE_THRESHOLD = 50;

async function allowedTrainingTypeIds(studentId) {
  return repo.getTrainingTypeIdsForStudent(studentId);
}

/** choice — точное совпадение буквы; riddle/open — текст без учёта регистра
 * и лишних пробелов (тот же формат ответа, что и у choice — answers[q.id]
 * всегда строка, разница только в том, с чем её сравнивать). */
function isAnswerCorrect(question, given) {
  if (given == null) return false;
  if (question.question_type === 'choice') return given === question.correct_answer;
  return String(given).trim().toLowerCase() === String(question.correct_text_answer ?? '').trim().toLowerCase();
}

function shapeLesson(l) {
  return {
    id: l.id,
    title: l.title,
    type: l.lesson_type,
    description: l.description,
    instruction: l.instruction,
    coinReward: l.coin_reward,
    videoUrl: l.video_url,
    topicName: l.topic_name,
  };
}

/** Темы + уроки методики курсов студента, с честным прогрессом (только то, что есть в базе). */
export async function listForStudent(studentId) {
  const trainingTypeIds = await allowedTrainingTypeIds(studentId);
  if (trainingTypeIds.length === 0) return [];

  const rows = await repo.listTopicsWithLessons(trainingTypeIds);
  const lessonIds = [...new Set(rows.filter((r) => r.lesson_id).map((r) => r.lesson_id))];
  const [attempts, submissions] = await Promise.all([
    repo.getAttemptsForLessons(studentId, lessonIds),
    repo.getSubmissionsForLessons(studentId, lessonIds),
  ]);
  const attemptByLesson = new Map(attempts.map((a) => [a.lesson_id, a]));
  const submissionByLesson = new Map(submissions.map((s) => [s.lesson_id, s]));

  const topics = new Map();
  for (const r of rows) {
    if (!topics.has(r.topic_id)) {
      topics.set(r.topic_id, {
        id: r.topic_id,
        name: r.topic_name,
        description: r.topic_description,
        videoUrl: r.topic_video_url,
        lessons: [],
      });
    }
    if (!r.lesson_id) continue; // тема без уроков — просто пустая группа в списке

    const attempt = attemptByLesson.get(r.lesson_id);
    const submission = submissionByLesson.get(r.lesson_id);
    topics.get(r.topic_id).lessons.push({
      id: r.lesson_id,
      title: r.title,
      type: r.lesson_type,
      description: r.description,
      coinReward: r.coin_reward,
      videoUrl: r.video_url,
      hasAttachment: !!r.file_key,
      score: r.lesson_type === 'test' && attempt?.finished_at ? attempt.score : null,
      submissionStatus: r.lesson_type === 'practical' ? (submission?.status ?? null) : null,
      submissionScore: r.lesson_type === 'practical' ? (submission?.score ?? null) : null,
    });
  }
  return [...topics.values()];
}

async function assertAccess(studentId, lessonId) {
  const trainingTypeIds = await allowedTrainingTypeIds(studentId);
  const lesson = await repo.getLessonForStudent(lessonId, trainingTypeIds);
  if (!lesson) throw new AppError(404, 'Lesson not found');
  return lesson;
}

export async function getLessonDetail(studentId, lessonId) {
  const lesson = await assertAccess(studentId, lessonId);
  if (lesson.lesson_type === 'test') {
    const attempt = await repo.getAttempt(lessonId, studentId);
    return {
      ...shapeLesson(lesson),
      attempt: attempt
        ? { startedAt: attempt.started_at, finished: !!attempt.finished_at, score: attempt.finished_at ? attempt.score : null }
        : null,
    };
  }
  const submission = await repo.getSubmission(lessonId, studentId);
  return {
    ...shapeLesson(lesson),
    submission: submission
      ? { status: submission.status, score: submission.score, submittedAt: submission.submitted_at }
      : null,
  };
}

/** Старт попытки. Идемпотентно для незавершённой попытки — без времени на тест
 * страница может быть перезагружена ребёнком в любой момент, и вопросы должны
 * восстановиться, а не потеряться (только 409, если уже сдан). */
export async function startTest(studentId, lessonId) {
  const lesson = await assertAccess(studentId, lessonId);
  if (lesson.lesson_type !== 'test') throw new AppError(409, 'This lesson is not a test');

  let attempt = await repo.insertAttempt(lessonId, studentId);
  if (!attempt) {
    attempt = await repo.getAttempt(lessonId, studentId);
    if (attempt.finished_at) throw new AppError(409, 'Already submitted');
  }

  const questions = await repo.getQuestionsNoAnswers(lessonId);
  return {
    startedAt: attempt.started_at,
    questions: questions.map((q) => ({
      id: q.id,
      type: q.question_type,
      question: q.question_text,
      // choice — 4 варианта; riddle/open — свободный текстовый ответ, options не нужны
      options: q.question_type === 'choice' ? [q.option_a, q.option_b, q.option_c, q.option_d] : null,
    })),
  };
}

/** answers — { [questionId]: 'A'|'B'|'C'|'D' }. branchId — из JWT (req.user.branchId),
 * не запрашивается заново: нужен только для уведомления родителям. */
export async function submitTest(studentId, lessonId, answers, branchId) {
  const lesson = await assertAccess(studentId, lessonId);
  if (lesson.lesson_type !== 'test') throw new AppError(409, 'This lesson is not a test');

  const attempt = await repo.getAttempt(lessonId, studentId);
  if (!attempt) throw new AppError(409, 'Attempt not started');
  if (attempt.finished_at) throw new AppError(409, 'Already submitted');

  const questions = await repo.getQuestionsWithAnswers(lessonId);
  const correctCount = questions.reduce((acc, q) => acc + (isAnswerCorrect(q, answers[q.id]) ? 1 : 0), 0);
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const finalized = await repo.finalizeAttempt(lessonId, studentId, answers, score);
  if (!finalized) throw new AppError(409, 'Already submitted');

  if (score >= PASS_SCORE_THRESHOLD && lesson.coin_reward > 0) {
    await changeCoins({
      studentId,
      actorId: studentId,
      amount: lesson.coin_reward,
      operation: 'reward',
      reason: 'Methodology lesson test passed',
      refType: 'methodology_lesson',
      refId: lessonId,
    });
  }

  // Родителям — конкретный результат по теме (не общая топ-статистика, та
  // считается на лету в student/home и никуда не пушится сама). Один тест —
  // одно сообщение, без дебаунса: в отличие от davomat здесь нет автосейва
  // по клику, submit — уже финальное разовое действие.
  notifyTestResult({ branchId, studentId, topicName: lesson.topic_name, lessonTitle: lesson.title, score }).catch(
    (err) => logger.error({ err, lessonId, studentId }, 'submitTest: parent group notify failed'),
  );

  return { score };
}

async function notifyTestResult({ branchId, studentId, topicName, lessonTitle, score }) {
  if (!branchId) return;
  const name = await repo.getStudentName(studentId);
  if (!name) return;

  const mark = score >= PASS_SCORE_THRESHOLD ? '✅' : '⚠️';
  const text = `<b>📝 Test natijasi</b>\n${name} — «${topicName}» (${lessonTitle})\n${mark} ${score}%`;
  await sendToBranchGroup(branchId, text);
}

/** Presigned PUT для сдачи практического урока — тот же приём, что у ДЗ/видео. */
export async function getHomeworkUploadUrl(studentId, lessonId, { filename, contentType }) {
  const lesson = await assertAccess(studentId, lessonId);
  if (lesson.lesson_type !== 'practical') throw new AppError(409, 'This lesson has no homework');

  const fileKey = buildObjectKey(`methodology-submissions/${lessonId}`, filename);
  const uploadUrl = await getS3UploadUrl(fileKey, contentType);
  return { uploadUrl, fileKey };
}

/** Приём сдачи + (если у training_type включена Aqlli tahlil) постановка
 * AI-review в очередь. Сам ручной grading ментора — отдельная, не связанная
 * с этим история (см. чат с Karis) — review здесь не заменяет его, а
 * дополняет: "что показал код", а не финальная оценка ментора. */
export async function submitHomework(studentId, lessonId, { fileKey, textAnswer }) {
  const lesson = await assertAccess(studentId, lessonId);
  if (lesson.lesson_type !== 'practical') throw new AppError(409, 'This lesson has no homework');

  const submission = await repo.upsertSubmission({ lessonId, studentId, fileKey, textAnswer });
  if (!submission) throw new AppError(409, 'Already graded, cannot resubmit');

  if (lesson.ai_review_enabled) {
    // Сбой постановки в очередь не должен ронять сдачу ДЗ — ученик своё дело
    // сделал, review просто останется 'pending' и подхватится веб-панелью
    // как "ещё считается" (или потребует ручной разбор, если Redis правда лёг).
    aiReviewQueue.add('review', { submissionId: submission.id }).catch((err) => {
      logger.error({ err, submissionId: submission.id }, 'ai-review: failed to enqueue');
    });
  }

  return { status: submission.status, submittedAt: submission.submitted_at };
}
