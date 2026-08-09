import { logger } from '../../../../config/logger.js';
import { extractSubmission } from './extractor.js';
import { reviewCode } from './groq.client.js';
import * as repo from '../lessons.repository.js';

// В БД нет поля с языком студента (i18n кабинета — только localStorage на
// фронте, см. member/src/i18n/index.jsx). RU — дефолт того же модуля.
const DEFAULT_LANG = 'ru';

function deterministicTestsReview(lang) {
  const uz = lang === 'uz';
  return {
    score: null,
    praise: null,
    growth_area: null,
    tips: [],
    summary: uz
      ? "Kod topilmadi — mentoring tekshiradi."
      : 'Код не найден — работу проверит ментор.',
  };
}

/**
 * submissionId — methodology_submissions.id. Чистая функция побочного
 * эффекта: читает сдачу, извлекает код (extractor), опционально зовёт Groq,
 * пишет review обратно. Ничего не возвращает — воркер (aiReview.worker.js)
 * просто await'ит и ловит исключение сам (BullMQ retry).
 */
export async function processSubmission(submissionId) {
  const submission = await repo.getSubmissionById(submissionId);
  if (!submission) {
    logger.warn({ submissionId }, 'ai-review: submission not found, skipping');
    return;
  }

  const attempts = (submission.review_attempts ?? 0) + 1;
  await repo.saveReview(submissionId, { review: null, reviewSource: null, reviewStatus: 'processing', reviewAttempts: attempts });

  const { bundle, reviewSource } = await extractSubmission({
    fileKey: submission.file_key,
    textAnswer: submission.text_answer,
  });

  // 'tests'/'unreadable' — Groq НЕ вызывается (спека: не читал код — не
  // выдумывай оценку). Единственная разница между ними: 'unreadable' значит
  // "что-то было, но не прочиталось" (файл/ссылка), 'tests' — "нечего читать".
  if (!bundle) {
    const review = reviewSource === 'unreadable'
      ? { score: null, praise: null, growth_area: null, tips: [], summary: DEFAULT_LANG === 'uz'
        ? "Kodni o'qib bo'lmadi. Matn yuboring yoki GitHub'ni public qiling — mentoring ham tekshiradi."
        : 'Не удалось прочитать код. Пришлите текстом или откройте GitHub-репозиторий — работу также проверит ментор.' }
      : deterministicTestsReview(DEFAULT_LANG);
    await repo.saveReview(submissionId, { review, reviewSource, reviewStatus: 'done', reviewAttempts: attempts });
    return;
  }

  try {
    const review = await reviewCode(bundle, DEFAULT_LANG);
    await repo.saveReview(submissionId, { review, reviewSource, reviewStatus: 'done', reviewAttempts: attempts });
  } catch (err) {
    logger.error({ err, submissionId, attempts }, 'ai-review: Groq call failed');
    // GROQ_API_KEY отсутствует/невалидный JSON/сетевая ошибка — половинчатый
    // результат НЕ сохраняется (спека, п.10.3): либо полный review, либо failed.
    await repo.saveReview(submissionId, { review: null, reviewSource, reviewStatus: 'failed', reviewAttempts: attempts });
    throw err; // BullMQ увидит fail → свой retry (см. aiReview.worker.js)
  }
}
