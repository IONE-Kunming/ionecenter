import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Required storage buckets for the application.
 * Each bucket is created as public so files can be accessed via CDN URLs.
 * fileSizeLimit is set high (50 MB) to avoid restrictive upload limits.
 */
const REQUIRED_BUCKETS = [
  { id: "product-images", public: true, fileSizeLimit: 52428800 },
  { id: "site-assets", public: true, fileSizeLimit: 52428800 },
] as const

/**
 * Ensures all required Supabase storage buckets exist with correct settings.
 * Safe to call multiple times — creates missing buckets and updates existing ones.
 * Should be called during app bootstrap or from admin setup.
 */
export async function ensureStorageBuckets(): Promise<{
  created: string[]
  existing: string[]
  errors: string[]
}> {
  const supabase = createAdminClient()
  const created: string[] = []
  const existing: string[] = []
  const errors: string[] = []

  const { data: buckets } = await supabase.storage.listBuckets()
  const existingIds = new Set((buckets ?? []).map((b) => b.id))

  for (const bucket of REQUIRED_BUCKETS) {
    if (existingIds.has(bucket.id)) {
      existing.push(bucket.id)
      // Update existing bucket to ensure settings are current
      const { error: updateError } = await supabase.storage.updateBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
      })
      if (updateError) {
        errors.push(`${bucket.id} (update): ${updateError.message}`)
      }
      continue
    }
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
    })
    if (error) {
      errors.push(`${bucket.id}: ${error.message}`)
    } else {
      created.push(bucket.id)
    }
  }

  return { created, existing, errors }
}
