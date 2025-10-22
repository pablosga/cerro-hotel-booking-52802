-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'operator', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  room_type TEXT NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10,2) NOT NULL,
  capacity INTEGER NOT NULL,
  image_url TEXT,
  amenities TEXT[],
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contact messages table
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response TEXT,
  responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Rooms policies
CREATE POLICY "Anyone can view available rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Operators can update rooms" ON public.rooms FOR UPDATE USING (public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage rooms" ON public.rooms FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Reservations policies
CREATE POLICY "Users can view own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reservations" ON public.reservations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Operators can manage reservations" ON public.reservations FOR ALL USING (public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'admin'));

-- Contact messages policies
CREATE POLICY "Anyone can create contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own messages" ON public.contact_messages FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operators can manage messages" ON public.contact_messages FOR UPDATE USING (public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'admin'));

-- Services policies
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for rooms
INSERT INTO public.rooms (room_number, room_type, description, price_per_night, capacity, amenities, is_available) VALUES
('101', 'Standard', 'Habitación confortable con vista al valle', 8500.00, 2, ARRAY['WiFi', 'TV', 'Aire acondicionado', 'Baño privado'], true),
('102', 'Standard', 'Habitación acogedora con todas las comodidades', 8500.00, 2, ARRAY['WiFi', 'TV', 'Aire acondicionado', 'Baño privado'], true),
('201', 'Deluxe', 'Habitación superior con balcón y vista panorámica', 12000.00, 2, ARRAY['WiFi', 'TV', 'Aire acondicionado', 'Minibar', 'Balcón', 'Baño privado'], true),
('202', 'Deluxe', 'Suite con vista al Cerro San Bernardo', 12000.00, 2, ARRAY['WiFi', 'TV', 'Aire acondicionado', 'Minibar', 'Balcón', 'Baño privado'], true),
('301', 'Suite', 'Suite Premium con jacuzzi y vista espectacular', 18000.00, 4, ARRAY['WiFi', 'TV', 'Aire acondicionado', 'Minibar', 'Jacuzzi', 'Balcón amplio', 'Sala de estar', 'Baño privado'], true),
('302', 'Suite', 'Suite de lujo con todas las comodidades', 18000.00, 4, ARRAY['WiFi', 'TV', 'Aire acondicionado', 'Minibar', 'Jacuzzi', 'Balcón amplio', 'Sala de estar', 'Baño privado'], true);

-- Insert sample services
INSERT INTO public.services (name, description, price, icon, is_active) VALUES
('Desayuno buffet', 'Desayuno completo con productos regionales', 2500.00, 'utensils', true),
('Spa y masajes', 'Servicio de spa con masajes relajantes', 5000.00, 'spa', true),
('Excursiones guiadas', 'Tours por el Cerro San Bernardo y alrededores', 3500.00, 'mountain', true),
('Traslado aeropuerto', 'Servicio de traslado desde/hacia el aeropuerto', 4000.00, 'plane', true),
('Cena gourmet', 'Cena especial con cocina regional', 6000.00, 'chef', true),
('WiFi Premium', 'Internet de alta velocidad', 0.00, 'wifi', true);