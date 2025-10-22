-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a restricted policy that allows:
-- 1. Users to view their own profile
-- 2. Operators and admins to view all profiles
CREATE POLICY "Users can view own profile and operators can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'operator'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);