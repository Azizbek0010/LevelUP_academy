import { z } from 'zod';

// ---------- Типы обучения ----------
export const createTrainingTypeSchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(160),
  description: z.string().trim().max(1000).optional(),
  icon: z.string().trim().max(60).optional(),
});

export const updateTrainingTypeSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  icon: z.string().trim().max(60).optional(),
});

// ---------- Темы ----------
export const createTopicSchema = z.object({
  trainingTypeId: z.string().uuid(),
  name: z.string().trim().min(1, 'Название обязательно').max(200),
  description: z.string().trim().max(2000).optional(),
  videoUrl: z.string().trim().max(500).optional(),
});

export const updateTopicSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  videoUrl: z.string().trim().max(500).optional(),
});

// ---------- Уроки (тест / практика) ----------
export const createLessonSchema = z.object({
  topicId: z.string().uuid(),
  title: z.string().trim().min(1, 'Название обязательно').max(200),
  lessonType: z.enum(['test', 'practical']),
  description: z.string().trim().max(4000).optional(),
  instruction: z.string().trim().max(2000).optional(),
  coinReward: z.coerce.number().int().min(0).default(0),
});

export const updateLessonSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  instruction: z.string().trim().max(2000).optional(),
  coinReward: z.coerce.number().int().min(0).optional(),
});

// ---------- Вопросы (A/B/C/D) ----------
export const createQuestionSchema = z.object({
  lessonId: z.string().uuid(),
  questionText: z.string().trim().min(1, 'Текст вопроса обязателен').max(1000),
  optionA: z.string().trim().min(1).max(300),
  optionB: z.string().trim().min(1).max(300),
  optionC: z.string().trim().min(1).max(300),
  optionD: z.string().trim().min(1).max(300),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
});

export const updateQuestionSchema = z.object({
  questionText: z.string().trim().min(1).max(1000).optional(),
  optionA: z.string().trim().min(1).max(300).optional(),
  optionB: z.string().trim().min(1).max(300).optional(),
  optionC: z.string().trim().min(1).max(300).optional(),
  optionD: z.string().trim().min(1).max(300).optional(),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
});

// Пакетное создание вопросов
export const createQuestionsBatchSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, 'Хотя бы один вопрос'),
});

// Копировать урок (тест/практику) в тему
export const copyLessonSchema = z.object({
  targetTopicId: z.string().uuid(),
});

export const idParam = z.object({ id: z.string().uuid('Invalid id') });
