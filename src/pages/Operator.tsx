import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, Mail, CreditCard } from "lucide-react";
import { toast } from "sonner";
import ReservationsManager from "@/components/operator/ReservationsManager";
import RoomsStatus from "@/components/operator/RoomsStatus";
import ContactMessagesManager from "@/components/operator/ContactMessagesManager";
import PaymentsManager from "@/components/operator/PaymentsManager";

export default function Operator() {
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

      const isOperator = roles?.some(r => r.role === "operator" || r.role === "admin");
      
      if (!isOperator) {
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
        <h1 className="text-4xl font-bold mb-8 text-primary">Panel de Operador</h1>
        
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rooms">
              <Building2 className="h-4 w-4 mr-2" />
              Habitaciones
            </TabsTrigger>
            <TabsTrigger value="reservations">
              <Calendar className="h-4 w-4 mr-2" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="messages">
              <Mail className="h-4 w-4 mr-2" />
              Mensajes
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Pagos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="mt-6">
            <RoomsStatus />
          </TabsContent>

          <TabsContent value="reservations" className="mt-6">
            <ReservationsManager />
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <ContactMessagesManager />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentsManager />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
