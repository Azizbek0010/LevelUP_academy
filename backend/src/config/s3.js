import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { env } from './env.js';

export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // required for MinIO
});

const DEFAULT_EXPIRES_SEC = 900; // 15 min

/** Non-guessable object key: <prefix>/<uuid>/<originalName>. */
export function buildObjectKey(prefix, originalName) {
  return `${prefix}/${randomUUID()}/${originalName}`;
}

/** Presigned PUT — клиент грузит файл напрямую в S3, минуя API. */
export async function getUploadUrl(key, contentType, expiresIn = DEFAULT_EXPIRES_SEC) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/** Presigned GET — временная ссылка на скачивание/стриминг. */
export async function getDownloadUrl(key, expiresIn = DEFAULT_EXPIRES_SEC) {
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteObject(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}
