import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bed } from "lucide-react";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  is_available: boolean;
  amenities: string[] | null;
}

export default function RoomsStatus() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast.error("Error al cargar habitaciones");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (roomId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_available: !currentStatus })
        .eq('id', roomId);

      if (error) throw error;

      toast.success(`Habitación ${!currentStatus ? 'habilitada' : 'deshabilitada'}`);
      fetchRooms();
    } catch (error: any) {
      toast.error("Error al actualizar disponibilidad");
    }
  };

  if (loading) {
    return <p className="text-center">Cargando habitaciones...</p>;
  }

  const availableCount = rooms.filter(r => r.is_available).length;
  const occupiedCount = rooms.length - availableCount;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Estado de Habitaciones</CardTitle>
            <CardDescription>Consulta y actualiza la disponibilidad de las habitaciones</CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Disponibles: {availableCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span>No disponibles: {occupiedCount}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className={room.is_available ? "border-primary" : "border-secondary"}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-lg">Hab. {room.room_number}</h4>
                  </div>
                  <Badge variant={room.is_available ? "default" : "secondary"}>
                    {room.is_available ? "Disponible" : "No disponible"}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <strong>Tipo:</strong> {room.room_type}
                  </p>
                  <p className="text-sm">
                    <strong>Capacidad:</strong> {room.capacity} persona(s)
                  </p>
                  <p className="text-sm">
                    <strong>Precio:</strong> ${room.price_per_night.toLocaleString()}/noche
                  </p>
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.amenities.map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <Label htmlFor={`room-${room.id}`} className="text-sm">
                    Habilitar para reservas
                  </Label>
                  <Switch
                    id={`room-${room.id}`}
                    checked={room.is_available}
                    onCheckedChange={() => toggleAvailability(room.id, room.is_available)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No hay habitaciones registradas en el sistema
          </p>
        )}
      </CardContent>
    </Card>
  );
}
