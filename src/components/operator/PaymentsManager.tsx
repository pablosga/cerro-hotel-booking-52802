import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, Users, Check } from "lucide-react";
import { format } from "date-fns";
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

const paymentStatusLabels: { [key: string]: string } = {
  pending: "Pendiente",
  paid: "Pagado",
  refunded: "Reembolsado",
};

const paymentStatusColors: { [key: string]: "default" | "secondary" | "destructive" } = {
  pending: "secondary",
  paid: "default",
  refunded: "destructive",
};

export default function PaymentsManager() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPayment, setFilterPayment] = useState<string>("all");

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
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      toast.error("Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (reservationId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ payment_status: paymentStatus })
        .eq('id', reservationId);

      if (error) throw error;

      toast.success(`Pago marcado como ${paymentStatusLabels[paymentStatus].toLowerCase()}`);
      fetchReservations();
    } catch (error: any) {
      toast.error("Error al actualizar pago");
    }
  };

  const filteredReservations = filterPayment === "all"
    ? reservations
    : reservations.filter(r => r.payment_status === filterPayment);

  const totalPending = reservations.filter(r => r.payment_status === 'pending').reduce((sum, r) => sum + Number(r.total_price), 0);
  const totalPaid = reservations.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + Number(r.total_price), 0);

  if (loading) {
    return <p className="text-center">Cargando pagos...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Procesamiento de Pagos</h3>
          <p className="text-sm text-muted-foreground">
            Total: {filteredReservations.length} pago(s)
          </p>
        </div>
        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
            <SelectItem value="refunded">Reembolsados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-secondary">${totalPending.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos Recibidos</p>
                <p className="text-2xl font-bold text-primary">${totalPaid.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay pagos para mostrar</p>
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
                    </div>
                    <Badge variant={paymentStatusColors[reservation.payment_status]}>
                      {paymentStatusLabels[reservation.payment_status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-sm">Habitación</span>
                      <span className="font-semibold">{reservation.rooms.room_number}</span>
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
                        <span className="font-semibold text-lg">
                          ${reservation.total_price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    {reservation.payment_status === 'pending' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm">
                            <Check className="h-4 w-4 mr-2" />
                            Marcar como Pagado
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Pago</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Confirmas que se ha recibido el pago de ${reservation.total_price.toLocaleString()} 
                              de {reservation.profiles?.full_name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => updatePaymentStatus(reservation.id, 'paid')}>
                              Confirmar Pago
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {reservation.payment_status === 'paid' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Procesar Reembolso
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Reembolso</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Deseas procesar un reembolso de ${reservation.total_price.toLocaleString()} 
                              para {reservation.profiles?.full_name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => updatePaymentStatus(reservation.id, 'refunded')}>
                              Procesar Reembolso
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
