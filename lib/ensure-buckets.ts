"use server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Required storage buckets for the application.
 * Each bucket is created as public so files can be accessed via CDN URLs.
 */
const REQUIRED_BUCKETS = [
  { id: "product-images", public: true },
  { id: "site-assets", public: true },
] as const

/**
 * Ensures all required Supabase storage buckets exist.
 * Safe to call multiple times — skips already-existing buckets.
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
      continue
    }
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
    })
    if (error) {
      errors.push(`${bucket.id}: ${error.message}`)
    } else {
      created.push(bucket.id)
    }
  }

  return { created, existing, errors }
}
