import crypto from 'node:crypto';
import { BIND_TOKEN_BYTES, BIND_TOKEN_TTL_SECONDS, bindTokenKey } from './constants.js';

export class TelegramBindTokenService {
  constructor({ redis, botUsername, tokenTtlSeconds = BIND_TOKEN_TTL_SECONDS }) {
    if (!redis) throw new Error('redis is required');
    this.redis = redis;
    this.botUsername = botUsername;
    this.tokenTtlSeconds = tokenTtlSeconds;
  }

  async createForUser(userId) {
    if (!userId) throw new Error('userId is required');
    if (!this.botUsername) throw new Error('TELEGRAM_BOT_USERNAME is required to build a deep link');

    const token = await this.#createUniqueToken(userId);

    return {
      token,
      expiresIn: this.tokenTtlSeconds,
      deepLink: `https://t.me/${this.botUsername}?start=${encodeURIComponent(token)}`,
    };
  }

  async consume(token) {
    if (!token) return null;
    const userId = await this.redis.getdel(bindTokenKey(token));
    return userId || null;
  }

  async #createUniqueToken(userId) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = crypto.randomBytes(BIND_TOKEN_BYTES).toString('base64url');
      const ok = await this.redis.set(bindTokenKey(token), userId, 'EX', this.tokenTtlSeconds, 'NX');
      if (ok === 'OK') return token;
    }
    throw new Error('Failed to allocate a unique Telegram bind token');
  }
}
