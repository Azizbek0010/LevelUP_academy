import { AppError } from '../../utils/AppError.js';
import { buildObjectKey, getUploadUrl as getS3UploadUrl } from '../../config/s3.js';
import * as repo from './content.repository.js';

// ==================== ТИПЫ ОБУЧЕНИЯ ====================
export async function createTrainingType(orgId, userId, payload) {
  return repo.insertTrainingType({ orgId, createdBy: userId, ...payload });
}

export async function listTrainingTypes(orgId) {
  return repo.listTrainingTypes(orgId);
}

export async function updateTrainingType(id, orgId, payload) {
  const item = await repo.updateTrainingType(id, orgId, payload);
  if (!item) throw new AppError(404, 'Training type not found');
  return item;
}

export async function archiveTrainingType(id, orgId) {
  await repo.archiveTrainingType(id, orgId);
}

// ==================== ТЕМЫ ====================
export async function createTopic(orgId, userId, payload) {
  const tt = await repo.findTrainingType(payload.trainingTypeId, orgId);
  if (!tt) throw new AppError(404, 'Training type not found');
  return repo.insertTopic({ createdBy: userId, ...payload });
}

export async function listTopics(trainingTypeId, orgId) {
  const tt = await repo.findTrainingType(trainingTypeId, orgId);
  if (!tt) throw new AppError(404, 'Training type not found');
  return repo.listTopics(trainingTypeId);
}

export async function updateTopic(id, orgId, payload) {
  const item = await repo.updateTopic(id, orgId, payload);
  if (!item) throw new AppError(404, 'Topic not found');
  return item;
}

export async function archiveTopic(id, orgId) {
  await repo.archiveTopic(id, orgId);
}

// ==================== УРОКИ ====================
export async function createLesson(orgId, userId, payload) {
  const topic = await repo.findTopicInOrg(payload.topicId, orgId);
  if (!topic) throw new AppError(404, 'Topic not found in your organization');
  return repo.insertLesson({ createdBy: userId, ...payload });
}

export async function listLessons(topicId, orgId) {
  const topic = await repo.findTopicInOrg(topicId, orgId);
  if (!topic) throw new AppError(404, 'Topic not found');
  return repo.listLessons(topicId);
}

export async function getLesson(lessonId, orgId) {
  const lesson = await repo.findLessonWithQuestions(lessonId, orgId);
  if (!lesson) throw new AppError(404, 'Lesson not found');
  return lesson;
}

export async function updateLesson(id, orgId, payload) {
  const item = await repo.updateLesson(id, orgId, payload);
  if (!item) throw new AppError(404, 'Lesson not found');
  return item;
}

export async function archiveLesson(id, orgId) {
  await repo.archiveLesson(id, orgId);
}

/**
 * Presigned S3 PUT url for a lesson's practical-task attachment.
 * Verifies the lesson belongs to the caller's organization first, then
 * returns { uploadUrl, fileKey } — the client PUTs the file to uploadUrl
 * and saves the key via updateLesson({ fileKey }).
 */
export async function getLessonUploadUrl(lessonId, orgId, { filename, contentType }) {
  const lesson = await repo.findLessonInOrg(lessonId, orgId);
  if (!lesson) throw new AppError(404, 'Lesson not found');
  const fileKey = buildObjectKey(`lessons/${lessonId}`, filename);
  const uploadUrl = await getS3UploadUrl(fileKey, contentType);
  return { uploadUrl, fileKey };
}

/** Копировать урок (тест/практику) в другую тему со всеми вопросами. */
export async function copyLesson(lessonId, orgId, userId, targetTopicId) {
  const lesson = await repo.findLessonInOrg(lessonId, orgId);
  if (!lesson) throw new AppError(404, 'Lesson not found');

  const topic = await repo.findTopicInOrg(targetTopicId, orgId);
  if (!topic) throw new AppError(404, 'Target topic not found');

  const questions = await repo.listQuestions(lessonId);

  const newLesson = await repo.insertLesson({
    topicId: targetTopicId,
    createdBy: userId,
    title: `${lesson.title} (копия)`,
    lessonType: lesson.lesson_type,
    description: lesson.description,
    instruction: lesson.instruction,
    coinReward: lesson.coin_reward,
  });

  if (questions.length > 0) {
    await repo.insertQuestionsBatch(
      questions.map((q) => ({
        lessonId: newLesson.id,
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        correctAnswer: q.correct_answer,
      })),
    );
  }

  return repo.findLessonWithQuestions(newLesson.id, orgId);
}

// ==================== ВОПРОСЫ ====================
export async function createQuestion(payload) {
  return repo.insertQuestion(payload);
}

export async function createQuestionsBatch(questions) {
  return repo.insertQuestionsBatch(questions);
}

export async function listQuestions(lessonId) {
  return repo.listQuestions(lessonId);
}

export async function updateQuestion(id, payload) {
  const item = await repo.updateQuestion(id, payload);
  if (!item) throw new AppError(404, 'Question not found');
  return item;
}

export async function deleteQuestion(id) {
  await repo.deleteQuestion(id);
}
