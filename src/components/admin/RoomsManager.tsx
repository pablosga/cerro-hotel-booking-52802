import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  is_available: boolean;
  image_url: string | null;
  amenities: string[] | null;
}

export default function RoomsManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "",
    description: "",
    price_per_night: "",
    capacity: "",
    is_available: true,
    image_url: "",
    amenities: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const roomData = {
        room_number: formData.room_number,
        room_type: formData.room_type,
        description: formData.description || null,
        price_per_night: parseFloat(formData.price_per_night),
        capacity: parseInt(formData.capacity),
        is_available: formData.is_available,
        image_url: formData.image_url || null,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : null,
      };

      if (editingRoom) {
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', editingRoom.id);

        if (error) throw error;
        toast.success("Habitación actualizada");
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert([roomData]);

        if (error) throw error;
        toast.success("Habitación creada");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchRooms();
    } catch (error: any) {
      toast.error("Error al guardar habitación");
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      description: room.description || "",
      price_per_night: room.price_per_night.toString(),
      capacity: room.capacity.toString(),
      is_available: room.is_available,
      image_url: room.image_url || "",
      amenities: room.amenities?.join(', ') || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      toast.success("Habitación eliminada");
      fetchRooms();
    } catch (error: any) {
      toast.error("Error al eliminar habitación");
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: "",
      room_type: "",
      description: "",
      price_per_night: "",
      capacity: "",
      is_available: true,
      image_url: "",
      amenities: "",
    });
    setEditingRoom(null);
  };

  if (loading) {
    return <p className="text-center">Cargando habitaciones...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestión de Habitaciones</CardTitle>
            <CardDescription>Crear, editar y eliminar habitaciones del hotel</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Habitación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRoom ? "Editar" : "Nueva"} Habitación</DialogTitle>
                <DialogDescription>
                  Complete los datos de la habitación
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room_number">Número de Habitación*</Label>
                    <Input
                      id="room_number"
                      value={formData.room_number}
                      onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="room_type">Tipo de Habitación*</Label>
                    <Input
                      id="room_type"
                      value={formData.room_type}
                      onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                      placeholder="Ej: Suite, Doble, Simple"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_per_night">Precio por Noche*</Label>
                    <Input
                      id="price_per_night"
                      type="number"
                      step="0.01"
                      value={formData.price_per_night}
                      onChange={(e) => setFormData({...formData, price_per_night: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacidad*</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="image_url">URL de Imagen</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="amenities">Amenidades (separadas por comas)</Label>
                  <Input
                    id="amenities"
                    value={formData.amenities}
                    onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                    placeholder="WiFi, TV, Aire Acondicionado"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                  />
                  <Label htmlFor="is_available">Disponible para reservas</Label>
                </div>

                <DialogFooter>
                  <Button type="submit">
                    {editingRoom ? "Actualizar" : "Crear"} Habitación
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">Habitación {room.room_number}</h4>
                      <Badge variant={room.is_available ? "default" : "secondary"}>
                        {room.is_available ? "Disponible" : "No disponible"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Tipo:</strong> {room.room_type}
                    </p>
                    {room.description && (
                      <p className="text-sm text-muted-foreground mb-1">{room.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Capacidad:</strong> {room.capacity} persona(s)
                    </p>
                    <p className="text-sm font-semibold text-primary mb-2">
                      ${room.price_per_night.toLocaleString()} por noche
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
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Habitación</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de eliminar la habitación {room.room_number}? Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(room.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
