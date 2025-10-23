import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInDays, addDays, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CalendarIcon, Users, Wifi, Tv, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  description: string;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  image_url: string | null;
}

const bookingSchema = z.object({
  check_in_date: z.date(),
  check_out_date: z.date(),
  guests_count: z.number().min(1, "Mínimo 1 huésped").max(10, "Máximo 10 huéspedes"),
  special_requests: z.string().max(500, "Máximo 500 caracteres").optional(),
}).refine(
  (data) => data.check_out_date > data.check_in_date,
  {
    message: "La fecha de salida debe ser posterior a la fecha de entrada",
    path: ["check_out_date"],
  }
);

type BookingFormValues = z.infer<typeof bookingSchema>;

const amenityIcons: { [key: string]: any } = {
  WiFi: Wifi,
  TV: Tv,
  "Aire acondicionado": Wind,
};

const BookRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(0);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guests_count: 1,
      special_requests: "",
    },
  });

  useEffect(() => {
    checkAuth();
    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Debes iniciar sesión para hacer una reserva");
      navigate("/auth");
      return;
    }
    setSession(session);
  };

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      
      if (!data.is_available) {
        toast.error("Esta habitación no está disponible");
        navigate("/habitaciones");
        return;
      }

      setRoom(data);
    } catch (error: any) {
      toast.error("Error al cargar la habitación");
      navigate("/habitaciones");
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    const checkIn = form.watch("check_in_date");
    const checkOut = form.watch("check_out_date");

    if (checkIn && checkOut && room) {
      const nightsCount = differenceInDays(checkOut, checkIn);
      if (nightsCount > 0) {
        setNights(nightsCount);
        setTotalPrice(nightsCount * room.price_per_night);
      }
    }
  };

  useEffect(() => {
    const subscription = form.watch(() => calculatePrice());
    return () => subscription.unsubscribe();
  }, [form.watch, room]);

  const onSubmit = async (values: BookingFormValues) => {
    if (!session || !room) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .insert({
          user_id: session.user.id,
          room_id: room.id,
          check_in_date: format(values.check_in_date, 'yyyy-MM-dd'),
          check_out_date: format(values.check_out_date, 'yyyy-MM-dd'),
          guests_count: values.guests_count,
          total_price: totalPrice,
          special_requests: values.special_requests || null,
          status: 'pending',
          payment_status: 'pending',
        });

      if (error) throw error;

      toast.success("¡Reserva creada exitosamente!");
      navigate("/mis-reservas");
    } catch (error: any) {
      toast.error("Error al crear la reserva: " + error.message);
    } finally {
      setSubmitting(false);
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

  if (!room) return null;

  const today = startOfDay(new Date());

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-primary">Reservar Habitación</h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Room Info */}
            <Card>
              <CardHeader>
                <CardTitle>Habitación {room.room_number}</CardTitle>
                <CardDescription>{room.room_type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-48 bg-muted flex items-center justify-center rounded-lg">
                  <p className="text-6xl font-bold text-muted-foreground/20">{room.room_number}</p>
                </div>
                
                <p className="text-sm text-muted-foreground">{room.description}</p>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Capacidad: {room.capacity} personas</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {room.amenities?.map((amenity, index) => {
                    const Icon = amenityIcons[amenity] || Wifi;
                    return (
                      <div key={index} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                        <Icon className="h-3 w-3" />
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-2xl font-bold text-primary">
                    ${room.price_per_night.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground"> / noche</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Reserva</CardTitle>
                <CardDescription>Completa el formulario para confirmar tu estadía</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="check_in_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Entrada</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Selecciona una fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => isBefore(date, today)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="check_out_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Salida</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Selecciona una fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => 
                                  isBefore(date, form.watch("check_in_date") ? addDays(form.watch("check_in_date"), 1) : today)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guests_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Huéspedes</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={room.capacity}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Máximo {room.capacity} personas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="special_requests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Solicitudes Especiales (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ej: Cama extra, hora de llegada tardía, etc."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {totalPrice > 0 && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">Noches:</span>
                          <span className="font-semibold">{nights}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">Precio por noche:</span>
                          <span className="font-semibold">${room.price_per_night.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="text-lg font-bold">Total:</span>
                          <span className="text-lg font-bold text-primary">${totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting || totalPrice === 0}>
                      {submitting ? "Procesando..." : "Confirmar Reserva"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookRoom;
