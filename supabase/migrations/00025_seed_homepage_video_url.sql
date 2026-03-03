-- Set the homepage video URL to the existing Supabase storage video
INSERT INTO site_settings (key, value, updated_at)
VALUES (
  'homepage_video_url',
  'https://npmuxzpzyhftinsfught.supabase.co/storage/v1/object/public/site-assets/videos/homepage-video.mp4',
  now()
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at;
