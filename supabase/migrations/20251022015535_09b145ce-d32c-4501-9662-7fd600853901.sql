-- Assign operator role to operador@hoteldelcerro.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'operator'::app_role
FROM public.profiles
WHERE email = 'operador@hoteldelcerro.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign admin role to admin@hoteldelcerro.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE email = 'admin@hoteldelcerro.com'
ON CONFLICT (user_id, role) DO NOTHING;