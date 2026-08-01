import { pool } from '../../../config/db.js';

/** training_type_id всех активных групп студента, без дублей/null — так студент
    может проходить программу нескольких курсов сразу, если состоит в нескольких группах. */
export async function getTrainingTypeIdsForStudent(studentId, db = pool) {
  const { rows } = await db.query(
    `SELECT DISTINCT g.training_type_id
       FROM group_students gs
       JOIN groups g ON g.id = gs.group_id AND g.deleted_at IS NULL
      WHERE gs.student_id = $1 AND gs.left_at IS NULL AND g.training_type_id IS NOT NULL`,
    [studentId],
  );
  return rows.map((r) => r.training_type_id);
}

/** Темы + уроки методики для списка training_type_id. Прогресс подмешивается в сервисе. */
export async function listTopicsWithLessons(trainingTypeIds, db = pool) {
  if (trainingTypeIds.length === 0) return [];
  const { rows } = await db.query(
    `SELECT t.id AS topic_id, t.training_type_id, t.name AS topic_name, t.description AS topic_description,
            t.video_url AS topic_video_url, t.sort_order AS topic_sort_order,
            l.id AS lesson_id, l.title, l.lesson_type, l.description, l.instruction,
            l.coin_reward, l.video_url, l.file_key, l.sort_order AS lesson_sort_order
       FROM topics t
       LEFT JOIN methodology_lessons l ON l.topic_id = t.id AND l.deleted_at IS NULL AND l.is_archived = false
      WHERE t.training_type_id = ANY($1) AND t.deleted_at IS NULL AND t.is_archived = false
      ORDER BY t.sort_order, t.created_at, l.sort_order, l.created_at`,
    [trainingTypeIds],
  );
  return rows;
}

/** Урок — только если его тема входит в допустимые training_type_id студента. */
export async function getLessonForStudent(lessonId, trainingTypeIds, db = pool) {
  const { rows: [lesson] } = await db.query(
    `SELECT l.id, l.title, l.lesson_type, l.description, l.instruction, l.coin_reward,
            l.video_url, l.file_key, t.name AS topic_name, t.training_type_id
       FROM methodology_lessons l
       JOIN topics t ON t.id = l.topic_id
      WHERE l.id = $1 AND t.training_type_id = ANY($2)
        AND l.deleted_at IS NULL AND l.is_archived = false AND t.deleted_at IS NULL`,
    [lessonId, trainingTypeIds],
  );
  return lesson ?? null;
}

export async function getQuestionsNoAnswers(lessonId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, question_type, question_text, option_a, option_b, option_c, option_d, sort_order
       FROM methodology_questions
      WHERE lesson_id = $1
      ORDER BY sort_order, created_at`,
    [lessonId],
  );
  return rows;
}

export async function getQuestionsWithAnswers(lessonId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, question_type, correct_answer, correct_text_answer
       FROM methodology_questions WHERE lesson_id = $1 ORDER BY sort_order, created_at`,
    [lessonId],
  );
  return rows;
}

// ---------- попытки теста урока (тот же приём, что test_results) ----------

export async function getAttempt(lessonId, studentId, db = pool) {
  const { rows: [r] } = await db.query(
    `SELECT * FROM methodology_test_attempts WHERE lesson_id = $1 AND student_id = $2`,
    [lessonId, studentId],
  );
  return r ?? null;
}

/** Уникальность lesson_id+student_id → повторный старт словит conflict (null). */
export async function insertAttempt(lessonId, studentId, db = pool) {
  const { rows: [r] } = await db.query(
    `INSERT INTO methodology_test_attempts (lesson_id, student_id, started_at)
     VALUES ($1, $2, now())
     ON CONFLICT (lesson_id, student_id) DO NOTHING
     RETURNING *`,
    [lessonId, studentId],
  );
  return r ?? null;
}

export async function finalizeAttempt(lessonId, studentId, answers, score, db = pool) {
  const { rows: [r] } = await db.query(
    `UPDATE methodology_test_attempts
        SET answers = $3::jsonb, score = $4, finished_at = now()
      WHERE lesson_id = $1 AND student_id = $2 AND finished_at IS NULL
      RETURNING *`,
    [lessonId, studentId, JSON.stringify(answers), score],
  );
  return r ?? null;
}

// ---------- сдача практического урока (тот же приём, что homework_submissions) ----------

export async function getSubmission(lessonId, studentId, db = pool) {
  const { rows: [r] } = await db.query(
    `SELECT * FROM methodology_submissions WHERE lesson_id = $1 AND student_id = $2`,
    [lessonId, studentId],
  );
  return r ?? null;
}

/** WHERE status <> 'graded' — не даём затереть уже оценённую сдачу повторной отправкой. */
export async function upsertSubmission({ lessonId, studentId, fileKey, textAnswer }, db = pool) {
  const { rows: [r] } = await db.query(
    `INSERT INTO methodology_submissions (lesson_id, student_id, file_key, text_answer, status, submitted_at)
     VALUES ($1, $2, $3, $4, 'submitted', now())
     ON CONFLICT (lesson_id, student_id) DO UPDATE
        SET file_key = EXCLUDED.file_key, text_answer = EXCLUDED.text_answer,
            status = 'submitted', submitted_at = now()
      WHERE methodology_submissions.status <> 'graded'
     RETURNING *`,
    [lessonId, studentId, fileKey ?? null, textAnswer ?? null],
  );
  return r ?? null;
}

// ---------- прогресс для списка уроков одним батчем (без N+1) ----------

export async function getAttemptsForLessons(studentId, lessonIds, db = pool) {
  if (lessonIds.length === 0) return [];
  const { rows } = await db.query(
    `SELECT lesson_id, score, finished_at FROM methodology_test_attempts
      WHERE student_id = $1 AND lesson_id = ANY($2)`,
    [studentId, lessonIds],
  );
  return rows;
}

export async function getSubmissionsForLessons(studentId, lessonIds, db = pool) {
  if (lessonIds.length === 0) return [];
  const { rows } = await db.query(
    `SELECT lesson_id, status, score FROM methodology_submissions
      WHERE student_id = $1 AND lesson_id = ANY($2)`,
    [studentId, lessonIds],
  );
  return rows;
}
