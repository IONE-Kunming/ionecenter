-- Reload PostgREST schema cache so the show_category_numbers column is visible
NOTIFY pgrst, 'reload schema';
