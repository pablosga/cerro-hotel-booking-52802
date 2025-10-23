import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Wifi, Tv, Wind, Coffee } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  description: string;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  is_available: boolean;
  image_url: string | null;
}

const amenityIcons: { [key: string]: any } = {
  WiFi: Wifi,
  TV: Tv,
  "Aire acondicionado": Wind,
  Coffee: Coffee,
};

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
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

  const handleReserve = (roomId: string) => {
    if (!session) {
      toast.error("Debes iniciar sesión para hacer una reserva");
      navigate("/auth");
      return;
    }
    navigate(`/reservar/${roomId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <p className="text-center">Cargando habitaciones...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Nuestras Habitaciones</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige la habitación perfecta para tu estadía. Todas con vista al valle y las montañas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-muted flex items-center justify-center">
                <p className="text-6xl font-bold text-muted-foreground/20">{room.room_number}</p>
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Habitación {room.room_number}</CardTitle>
                    <CardDescription className="mt-1">{room.room_type}</CardDescription>
                  </div>
                  {room.is_available ? (
                    <Badge variant="default" className="bg-accent">Disponible</Badge>
                  ) : (
                    <Badge variant="secondary">Ocupada</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{room.description}</p>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Capacidad: {room.capacity} personas</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {room.amenities?.slice(0, 4).map((amenity, index) => {
                    const Icon = amenityIcons[amenity] || Coffee;
                    return (
                      <div key={index} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                        <Icon className="h-3 w-3" />
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <p className="text-2xl font-bold text-primary">
                    ${room.price_per_night.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground"> / noche</span>
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={!room.is_available}
                  onClick={() => handleReserve(room.id)}
                >
                  {room.is_available ? "Reservar Ahora" : "No Disponible"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Rooms;
