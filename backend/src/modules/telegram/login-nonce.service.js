import crypto from 'node:crypto';
import {
  LOGIN_NONCE_BYTES,
  LOGIN_NONCE_TTL_SECONDS,
  LOGIN_PENDING,
  loginNonceKey,
} from './constants.js';

/**
 * Вход через Telegram: браузер и бот встречаются на одном одноразовом nonce.
 *
 *   create()   — фронт получает nonce и deep-link, в Redis кладётся `pending`
 *   approve()  — бот нашёл чат в telegram_accounts и подставляет userId
 *   claim()    — фронт забирает userId и СРАЗУ удаляет ключ
 *
 * Почему nonce, а не сразу токены в боте: access-token нельзя отдавать в чат —
 * он останется в истории переписки и в бэкапах Telegram навсегда. Через nonce в
 * чат уходит только «да, это он», а сами токены выдаются браузеру по HTTPS.
 */
export class TelegramLoginNonceService {
  constructor({ redis, botUsername, ttlSeconds = LOGIN_NONCE_TTL_SECONDS }) {
    if (!redis) throw new Error('redis is required');
    this.redis = redis;
    this.botUsername = botUsername;
    this.ttlSeconds = ttlSeconds;
  }

  async create() {
    if (!this.botUsername) {
      throw new Error('TELEGRAM_BOT_USERNAME is required to build a deep link');
    }

    const nonce = await this.#createUniqueNonce();

    return {
      nonce,
      expiresIn: this.ttlSeconds,
      deepLink: `https://t.me/${this.botUsername}?start=login_${encodeURIComponent(nonce)}`,
    };
  }

  /**
   * Проставить userId существующему nonce.
   *
   * `XX` — только если ключ уже есть: иначе бот с выдуманным или уже протухшим
   * nonce создавал бы новую запись, и «вход» появлялся бы там, где его никто не
   * начинал. Обновление не продлевает TTL — окно остаётся тем, что задал фронт.
   */
  async approve(nonce, userId) {
    if (!nonce || !userId) return false;
    const res = await this.redis.set(loginNonceKey(nonce), userId, 'KEEPTTL', 'XX');
    return res === 'OK';
  }

  /**
   * Забрать результат. `getdel` — атомарно: даже если фронт опрашивает из двух
   * вкладок, токены выпишутся ровно один раз.
   */
  async claim(nonce) {
    if (!nonce) return { status: 'unknown' };
    const value = await this.redis.get(loginNonceKey(nonce));
    if (value === null) return { status: 'unknown' }; // не выдавали или уже истёк
    if (value === LOGIN_PENDING) return { status: 'pending' };

    await this.redis.del(loginNonceKey(nonce));
    return { status: 'approved', userId: value };
  }

  async #createUniqueNonce() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const nonce = crypto.randomBytes(LOGIN_NONCE_BYTES).toString('base64url');
      const ok = await this.redis.set(
        loginNonceKey(nonce),
        LOGIN_PENDING,
        'EX',
        this.ttlSeconds,
        'NX',
      );
      if (ok === 'OK') return nonce;
    }
    throw new Error('Failed to allocate a unique Telegram login nonce');
  }
}
