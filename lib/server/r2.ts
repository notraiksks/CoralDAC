import { DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/** Cloudflare R2 (S3 API). Server only. Buckets: originals (private uploads), public (display copies; served by signed links). */
export const BUCKET_ORIGINALS = "coraldac-originals"
export const BUCKET_PUBLIC = "coraldac-public"

let client: S3Client | null = null

function r2(): S3Client {
  if (client) return client
  const account = process.env.R2_ACCOUNT_ID
  const id = process.env.R2_ACCESS_KEY_ID
  const secret = process.env.R2_SECRET_ACCESS_KEY
  if (!account || !id || !secret) throw new Error("R2 keys are not set")
  client = new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: id, secretAccessKey: secret },
  })
  return client
}

/** Presigned PUT for one upload; the browser must send exactly this Content-Type. */
export function presignUpload(key: string, contentType: string, seconds = 600) {
  return getSignedUrl(r2(), new PutObjectCommand({ Bucket: BUCKET_ORIGINALS, Key: key, ContentType: contentType }), {
    expiresIn: seconds,
  })
}

/** Presigned GET (display copies, thumbnails). */
export function presignGet(bucket: string, key: string, seconds = 3600) {
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: seconds })
}

/** Size and type of an uploaded object, or null when it is missing. */
export async function headObject(bucket: string, key: string): Promise<{ size: number; type?: string } | null> {
  try {
    const h = await r2().send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return { size: Number(h.ContentLength ?? 0), type: h.ContentType }
  } catch {
    return null
  }
}

export async function deleteKeys(bucket: string, keys: (string | null | undefined)[]) {
  const objs = keys.filter((k): k is string => Boolean(k)).map((Key) => ({ Key }))
  if (objs.length) await r2().send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objs, Quiet: true } }))
}
