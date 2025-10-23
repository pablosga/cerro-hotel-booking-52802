import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, MessageSquare, Check, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  rooms: {
    room_number: string;
    room_type: string;
  };
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
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

export default function ReservationsManager() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms (
            room_number,
            room_type
          ),
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      toast.error("Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (reservationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', reservationId);

      if (error) throw error;

      toast.success(`Reserva ${statusLabels[status].toLowerCase()}`);
      fetchReservations();
    } catch (error: any) {
      toast.error("Error al actualizar reserva");
    }
  };

  const updatePaymentStatus = async (reservationId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ payment_status: paymentStatus })
        .eq('id', reservationId);

      if (error) throw error;

      toast.success("Estado de pago actualizado");
      fetchReservations();
    } catch (error: any) {
      toast.error("Error al actualizar pago");
    }
  };

  const filteredReservations = filterStatus === "all" 
    ? reservations 
    : reservations.filter(r => r.status === filterStatus);

  if (loading) {
    return <p className="text-center">Cargando reservas...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Reservas</h3>
          <p className="text-sm text-muted-foreground">
            Total: {filteredReservations.length} reserva(s)
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay reservas para mostrar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        {reservation.profiles?.full_name || "Sin nombre"}
                      </h4>
                      <p className="text-sm text-muted-foreground">{reservation.profiles?.email}</p>
                      {reservation.profiles?.phone && (
                        <p className="text-sm text-muted-foreground">{reservation.profiles.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={statusColors[reservation.status]}>
                        {statusLabels[reservation.status]}
                      </Badge>
                      <Badge variant="outline">
                        {reservation.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Habitación</span>
                        <span className="font-semibold">{reservation.rooms.room_number}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Check-in</span>
                        <span className="font-semibold">
                          {format(new Date(reservation.check_in_date), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Huéspedes</span>
                        <span className="font-semibold">{reservation.guests_count}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold">${reservation.total_price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {reservation.special_requests && (
                    <div className="flex items-start gap-2 text-sm bg-muted p-3 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <span className="font-semibold">Solicitudes: </span>
                        <span className="text-muted-foreground">{reservation.special_requests}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    {reservation.status === 'pending' && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="default">
                              <Check className="h-4 w-4 mr-2" />
                              Confirmar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Reserva</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Deseas confirmar esta reserva?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => updateReservationStatus(reservation.id, 'confirmed')}>
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <X className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Rechazar Reserva</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas cancelar esta reserva?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No</AlertDialogCancel>
                              <AlertDialogAction onClick={() => updateReservationStatus(reservation.id, 'cancelled')}>
                                Sí, cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}

                    {reservation.status === 'confirmed' && (
                      <Button size="sm" onClick={() => updateReservationStatus(reservation.id, 'completed')}>
                        Marcar como Completada
                      </Button>
                    )}

                    {reservation.payment_status === 'pending' && reservation.status !== 'cancelled' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updatePaymentStatus(reservation.id, 'paid')}
                      >
                        Marcar como Pagado
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
