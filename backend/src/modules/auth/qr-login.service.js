import crypto from 'node:crypto';

/**
 * Вход студента по QR-коду: admin/branch_manager показывает QR на экране,
 * студент сканирует камерой телефона (открывается ссылка на member-app),
 * ссылка сама логинит его — без набора логин-кода и пароля.
 *
 * Тот же принцип, что и у Telegram bind-token (telegram/bind-token.service.js):
 * Redis-ключ с TTL, одноразовый через getdel. Отдельный класс, а не reuse
 * telegram-сервиса — концептуально это не Telegram, у QR своя область
 * действия (admin выдаёт студенту, а не студент себе).
 */
const QR_LOGIN_TTL_SECONDS = 300; // 5 минут — на экране висит недолго, сканируют сразу
const QR_LOGIN_BYTES = 16;
const QR_LOGIN_PREFIX = 'qr-login:';

const qrLoginKey = (token) => `${QR_LOGIN_PREFIX}${token}`;

export class QrLoginService {
  constructor({ redis, tokenTtlSeconds = QR_LOGIN_TTL_SECONDS }) {
    if (!redis) throw new Error('redis is required');
    this.redis = redis;
    this.tokenTtlSeconds = tokenTtlSeconds;
  }

  /** Токен для конкретного userId (студент, за которого admin открыл QR). */
  async createForUser(userId) {
    if (!userId) throw new Error('userId is required');
    const token = await this.#createUniqueToken(userId);
    return { token, expiresIn: this.tokenTtlSeconds };
  }

  /** Одноразовое погашение — getdel атомарен, повторный вызов с тем же токеном вернёт null. */
  async consume(token) {
    if (!token) return null;
    const userId = await this.redis.getdel(qrLoginKey(token));
    return userId || null;
  }

  async #createUniqueToken(userId) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = crypto.randomBytes(QR_LOGIN_BYTES).toString('base64url');
      const ok = await this.redis.set(qrLoginKey(token), userId, 'EX', this.tokenTtlSeconds, 'NX');
      if (ok === 'OK') return token;
    }
    throw new Error('Failed to allocate a unique QR login token');
  }
}
