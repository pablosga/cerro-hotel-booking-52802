import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Users, DollarSign, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Reservation {
  id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_price: number;
  status: string;
  payment_status: string;
  special_requests: string | null;
  created_at: string;
  room_id: string;
  rooms: {
    room_number: string;
    room_type: string;
  };
}

const statusColors: { [key: string]: "default" | "secondary" | "destructive" } = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "default",
};

const statusLabels: { [key: string]: string } = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

const paymentStatusLabels: { [key: string]: string } = {
  pending: "Pendiente",
  paid: "Pagado",
  refunded: "Reembolsado",
};

const MyReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Debes iniciar sesión");
      navigate("/auth");
      return;
    }
    setSession(session);
    fetchReservations(session.user.id);
  };

  const fetchReservations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms (
            room_number,
            room_type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      toast.error("Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;

      toast.success("Reserva cancelada");
      if (session) {
        fetchReservations(session.user.id);
      }
    } catch (error: any) {
      toast.error("Error al cancelar reserva");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <p className="text-center">Cargando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-primary">Mis Reservas</h1>

          {reservations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No tienes reservas aún</p>
                <Button onClick={() => navigate("/habitaciones")}>
                  Ver Habitaciones Disponibles
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          Habitación {reservation.rooms.room_number}
                        </CardTitle>
                        <CardDescription>{reservation.rooms.room_type}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={statusColors[reservation.status]}>
                          {statusLabels[reservation.status]}
                        </Badge>
                        <Badge variant="outline">
                          {paymentStatusLabels[reservation.payment_status]}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <span className="font-semibold">Entrada: </span>
                          {format(new Date(reservation.check_in_date), "PPP", { locale: es })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <span className="font-semibold">Salida: </span>
                          {format(new Date(reservation.check_out_date), "PPP", { locale: es })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{reservation.guests_count} huésped(es)</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-semibold">${reservation.total_price.toLocaleString()}</span>
                      </div>
                    </div>

                    {reservation.special_requests && (
                      <div className="flex items-start gap-2 text-sm bg-muted p-3 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <span className="font-semibold">Solicitudes especiales: </span>
                          <p className="text-muted-foreground">{reservation.special_requests}</p>
                        </div>
                      </div>
                    )}

                    {reservation.status === 'pending' && (
                      <div className="flex justify-end pt-4 border-t">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancelar Reserva
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La reserva será cancelada.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, mantener</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelReservation(reservation.id)}>
                                Sí, cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyReservations;
