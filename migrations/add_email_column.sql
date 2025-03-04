-- Add email column to public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email text;

-- Copy email data from existing users if available
UPDATE public.users
SET email = auth.users.email
FROM auth.users
WHERE public.users.id = auth.users.id
AND public.users.email IS NULL;