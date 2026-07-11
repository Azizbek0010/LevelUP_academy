export const BIND_TOKEN_TTL_SECONDS = 600;
export const BIND_TOKEN_REDIS_PREFIX = 'telegram:bind:';
export const BIND_TOKEN_BYTES = 9;

export function bindTokenKey(token) {
  return `${BIND_TOKEN_REDIS_PREFIX}${token}`;
}

