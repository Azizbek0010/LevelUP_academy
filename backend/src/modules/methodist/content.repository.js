import { pool } from '../../config/db.js';

// ==================== ТИПЫ ОБУЧЕНИЯ ====================
export function insertTrainingType({ orgId, createdBy, name, description, icon }, db = pool) {
  return db
    .query(
      `INSERT INTO training_types (organization_id, created_by, name, description, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, icon, sort_order, created_at`,
      [orgId, createdBy, name, description ?? null, icon ?? null],
    )
    .then((r) => r.rows[0]);
}

export function listTrainingTypes(orgId, db = pool) {
  return db
    .query(
      `SELECT tt.id, tt.name, tt.description, tt.icon, tt.sort_order, tt.created_at,
              (SELECT count(*)::int FROM topics t WHERE t.training_type_id = tt.id AND t.deleted_at IS NULL) AS topics_count
         FROM training_types tt
        WHERE tt.organization_id = $1 AND tt.deleted_at IS NULL
        ORDER BY tt.sort_order ASC, tt.created_at DESC`,
      [orgId],
    )
    .then((r) => r.rows);
}

export function findTrainingType(id, orgId, db = pool) {
  return db
    .query(
      `SELECT id FROM training_types
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function updateTrainingType(id, orgId, fields, db = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['name', 'name'],
    ['description', 'description'],
    ['icon', 'icon'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return null;
  vals.push(id, orgId);
  return db
    .query(
      `UPDATE training_types SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND organization_id = $${i} AND deleted_at IS NULL
        RETURNING id, name, description, icon, sort_order`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function archiveTrainingType(id, orgId, db = pool) {
  return db.query(
    `UPDATE training_types SET is_archived = true, updated_at = now()
      WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
    [id, orgId],
  );
}

// ==================== ТЕМЫ ====================
export function insertTopic({ trainingTypeId, createdBy, name, description, videoUrl }, db = pool) {
  return db
    .query(
      `INSERT INTO topics (training_type_id, created_by, name, description, video_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, video_url, sort_order, created_at`,
      [trainingTypeId, createdBy, name, description ?? null, videoUrl ?? null],
    )
    .then((r) => r.rows[0]);
}

export function listTopics(trainingTypeId, db = pool) {
  return db
    .query(
      `SELECT t.id, t.name, t.description, t.video_url, t.sort_order, t.created_at,
              (SELECT count(*)::int FROM methodology_lessons l WHERE l.topic_id = t.id AND l.deleted_at IS NULL) AS lessons_count
         FROM topics t
        WHERE t.training_type_id = $1 AND t.deleted_at IS NULL
        ORDER BY t.sort_order ASC, t.created_at DESC`,
      [trainingTypeId],
    )
    .then((r) => r.rows);
}

export function findTopicInOrg(topicId, orgId, db = pool) {
  return db
    .query(
      `SELECT t.id, t.training_type_id
         FROM topics t
         JOIN training_types tt ON tt.id = t.training_type_id
        WHERE t.id = $1 AND tt.organization_id = $2
          AND t.deleted_at IS NULL AND tt.deleted_at IS NULL`,
      [topicId, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function updateTopic(id, orgId, fields, db = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['name', 'name'],
    ['description', 'description'],
    ['videoUrl', 'video_url'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return null;
  vals.push(id, orgId);
  return db
    .query(
      `UPDATE topics SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND training_type_id IN (
          SELECT id FROM training_types WHERE organization_id = $${i}
        ) AND deleted_at IS NULL
        RETURNING id, name, description, video_url, sort_order`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function archiveTopic(id, orgId, db = pool) {
  return db.query(
    `UPDATE topics SET is_archived = true, updated_at = now()
      WHERE id = $1 AND training_type_id IN (
        SELECT id FROM training_types WHERE organization_id = $2
      ) AND deleted_at IS NULL`,
    [id, orgId],
  );
}

// ==================== УРОКИ ====================
export function insertLesson({ topicId, createdBy, title, lessonType, description, instruction, coinReward }, db = pool) {
  return db
    .query(
      `INSERT INTO methodology_lessons (topic_id, created_by, title, lesson_type, description, instruction, coin_reward)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, lesson_type, description, instruction, coin_reward, sort_order, created_at`,
      [topicId, createdBy, title, lessonType, description ?? null, instruction ?? null, coinReward ?? 0],
    )
    .then((r) => r.rows[0]);
}

export function listLessons(topicId, db = pool) {
  return db
    .query(
      `SELECT l.id, l.title, l.lesson_type, l.description, l.instruction, l.coin_reward, l.sort_order, l.created_at,
              (SELECT count(*)::int FROM methodology_questions q WHERE q.lesson_id = l.id) AS questions_count
         FROM methodology_lessons l
        WHERE l.topic_id = $1 AND l.deleted_at IS NULL
        ORDER BY l.sort_order ASC, l.created_at DESC`,
      [topicId],
    )
    .then((r) => r.rows);
}

export function findLessonInOrg(lessonId, orgId, db = pool) {
  return db
    .query(
      `SELECT l.*
         FROM methodology_lessons l
         JOIN topics t ON t.id = l.topic_id
         JOIN training_types tt ON tt.id = t.training_type_id
        WHERE l.id = $1 AND tt.organization_id = $2
          AND l.deleted_at IS NULL AND t.deleted_at IS NULL AND tt.deleted_at IS NULL`,
      [lessonId, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function findLessonWithQuestions(lessonId, orgId, db = pool) {
  return db
    .query(
      `SELECT l.id, l.title, l.lesson_type, l.description, l.instruction, l.coin_reward, l.sort_order, l.created_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', q.id,
                    'questionText', q.question_text,
                    'optionA', q.option_a,
                    'optionB', q.option_b,
                    'optionC', q.option_c,
                    'optionD', q.option_d,
                    'correctAnswer', q.correct_answer,
                    'sortOrder', q.sort_order
                  )
                  ORDER BY q.sort_order, q.created_at
                ) FILTER (WHERE q.id IS NOT NULL),
                '[]'
              ) AS questions
         FROM methodology_lessons l
         JOIN topics t ON t.id = l.topic_id
         JOIN training_types tt ON tt.id = t.training_type_id
         LEFT JOIN methodology_questions q ON q.lesson_id = l.id
        WHERE l.id = $1 AND tt.organization_id = $2
          AND l.deleted_at IS NULL AND t.deleted_at IS NULL AND tt.deleted_at IS NULL
        GROUP BY l.id`,
      [lessonId, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function updateLesson(id, orgId, fields, db = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['title', 'title'],
    ['description', 'description'],
    ['instruction', 'instruction'],
    ['coinReward', 'coin_reward'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return null;
  vals.push(id, orgId);
  return db
    .query(
      `UPDATE methodology_lessons SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND topic_id IN (
          SELECT t.id FROM topics t
          JOIN training_types tt ON tt.id = t.training_type_id
          WHERE tt.organization_id = $${i}
        ) AND deleted_at IS NULL
        RETURNING id, title, lesson_type, description, instruction, coin_reward, sort_order`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function archiveLesson(id, orgId, db = pool) {
  return db.query(
    `UPDATE methodology_lessons SET is_archived = true, updated_at = now()
      WHERE id = $1 AND topic_id IN (
        SELECT t.id FROM topics t
        JOIN training_types tt ON tt.id = t.training_type_id
        WHERE tt.organization_id = $2
      ) AND deleted_at IS NULL`,
    [id, orgId],
  );
}

// ==================== ВОПРОСЫ ====================
export function insertQuestion({ lessonId, questionText, optionA, optionB, optionC, optionD, correctAnswer }, db = pool) {
  return db
    .query(
      `INSERT INTO methodology_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [lessonId, questionText, optionA, optionB, optionC, optionD, correctAnswer],
    )
    .then((r) => r.rows[0]);
}

export function insertQuestionsBatch(questions, db = pool) {
  if (questions.length === 0) return Promise.resolve([]);
  const values = [];
  const params = [];
  let i = 1;
  for (const q of questions) {
    values.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6})`);
    params.push(q.lessonId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer);
    i += 7;
  }
  return db
    .query(
      `INSERT INTO methodology_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
       VALUES ${values.join(', ')}
       RETURNING *`,
      params,
    )
    .then((r) => r.rows);
}

export function listQuestions(lessonId, db = pool) {
  return db
    .query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer, sort_order
         FROM methodology_questions
        WHERE lesson_id = $1
        ORDER BY sort_order, created_at`,
      [lessonId],
    )
    .then((r) => r.rows);
}

export function updateQuestion(id, fields, db = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['questionText', 'question_text'],
    ['optionA', 'option_a'],
    ['optionB', 'option_b'],
    ['optionC', 'option_c'],
    ['optionD', 'option_d'],
    ['correctAnswer', 'correct_answer'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return null;
  vals.push(id);
  return db
    .query(
      `UPDATE methodology_questions SET ${cols.join(', ')}
        WHERE id = $${i}
        RETURNING *`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function deleteQuestion(id, db = pool) {
  return db.query(`DELETE FROM methodology_questions WHERE id = $1`, [id]);
}
