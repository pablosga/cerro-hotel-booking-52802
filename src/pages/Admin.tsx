import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [hasRole, setHasRole] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = roles?.some(r => r.role === "admin");
      
      if (!isAdmin) {
        toast.error("No tienes permisos para acceder a esta página");
        navigate("/");
        return;
      }

      setHasRole(true);
    } catch (error) {
      console.error("Error checking role:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!hasRole) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-primary">Panel de Administrador</h1>
        
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rooms">
              <Building2 className="h-4 w-4 mr-2" />
              Habitaciones
            </TabsTrigger>
            <TabsTrigger value="operators">
              <Users className="h-4 w-4 mr-2" />
              Operadores
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>CRUD de Habitaciones</CardTitle>
                <CardDescription>Crear, leer, actualizar y eliminar habitaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenido en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operators" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>CRUD de Operadores</CardTitle>
                <CardDescription>Gestiona los operadores del hotel</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenido en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Consultas y Estadísticas</CardTitle>
                <CardDescription>Visualiza gráficos y métricas del hotel</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contenido en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
