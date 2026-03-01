-- Force PostgREST to reload its schema cache.
-- This ensures the image_url column on site_categories is visible to the API
-- after it was added in migration 00009.
NOTIFY pgrst, 'reload schema';
