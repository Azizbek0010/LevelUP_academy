import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/** Централизованный обработчик — монтируется в app.js ПОСЛЕДНИМ. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode ?? err.status ?? 500;
  // Клиентская ошибка = наш AppError ИЛИ безопасно-раскрываемая 4xx
  // (body-parser при кривом/пустом JSON бросает 400 с expose:true).
  const isClientError = Boolean(err.isOperational) || (status < 500 && err.expose === true);

  // логируем как unhandled только реальные серверные (5xx)
  if (status >= 500) logger.error({ err }, 'Unhandled error');

  res.status(status).json({
    success: false,
    message: isClientError ? err.message : 'Internal server error',
    ...(err.details && { details: err.details }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
