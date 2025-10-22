-- Assign operator role to operator@hoteldelcerro.com
-- This will work after the user registers with this email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'operator'::app_role
FROM public.profiles
WHERE email = 'operador@hoteldelcerro.com'
ON CONFLICT DO NOTHING;

-- Assign admin role to admin@hoteldelcerro.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE email = 'admin@hoteldelcerro.com'
ON CONFLICT DO NOTHING;