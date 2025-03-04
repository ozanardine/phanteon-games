-- Add name column to public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name text;

-- Copy name data from existing users if available
UPDATE public.users
SET name = auth.users.raw_user_meta_data->>'full_name'
FROM auth.users
WHERE public.users.id = auth.users.id
AND public.users.name IS NULL;