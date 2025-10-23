import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Mountain className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <div>
              <h1 className="text-xl font-bold text-primary">Hotel del Cerro</h1>
              <p className="text-xs text-muted-foreground">Cerro San Bernardo, Salta</p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link to="/habitaciones" className="text-sm font-medium hover:text-primary transition-colors">
              Habitaciones
            </Link>
            <Link to="/contacto" className="text-sm font-medium hover:text-primary transition-colors">
              Contacto
            </Link>

            {session ? (
              <>
                <Link to="/mis-reservas" className="text-sm font-medium hover:text-primary transition-colors">
                  Mis Reservas
                </Link>
                {userRole === 'operator' && (
                  <Link to="/operador" className="text-sm font-medium hover:text-primary transition-colors">
                    Panel Operador
                  </Link>
                )}
                {userRole === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                    Panel Admin
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Ingresar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
