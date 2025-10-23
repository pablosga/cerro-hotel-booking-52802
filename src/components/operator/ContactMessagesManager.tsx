import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MessageSquare, Send } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
}

const statusLabels: { [key: string]: string } = {
  pending: "Pendiente",
  responded: "Respondido",
};

const statusColors: { [key: string]: "default" | "secondary" | "destructive" } = {
  pending: "secondary",
  responded: "default",
};

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [response, setResponse] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Error al cargar mensajes");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedMessage || !response.trim()) {
      toast.error("Por favor escribe una respuesta");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('contact_messages')
        .update({
          status: 'responded',
          response: response.trim(),
          responded_by: user?.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      toast.success("Respuesta guardada");
      setSelectedMessage(null);
      setResponse("");
      fetchMessages();
    } catch (error: any) {
      toast.error("Error al guardar respuesta");
    }
  };

  const filteredMessages = filterStatus === "all"
    ? messages
    : messages.filter(m => m.status === filterStatus);

  if (loading) {
    return <p className="text-center">Cargando mensajes...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Mensajes de Contacto</h3>
          <p className="text-sm text-muted-foreground">
            Total: {filteredMessages.length} mensaje(s)
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="responded">Respondidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredMessages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay mensajes para mostrar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <Card key={message.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{message.name}</h4>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{message.email}</span>
                        </div>
                        {message.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{message.phone}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(message.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Badge variant={statusColors[message.status]}>
                      {statusLabels[message.status]}
                    </Badge>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>

                  {message.response && (
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-sm font-semibold mb-1">Respuesta:</p>
                      <p className="text-sm">{message.response}</p>
                      {message.responded_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Respondido el {format(new Date(message.responded_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  )}

                  {message.status === 'pending' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedMessage(message)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Responder
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Responder a {message.name}</DialogTitle>
                          <DialogDescription>
                            Escribe tu respuesta al mensaje de contacto
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-semibold mb-1">Mensaje original:</p>
                            <p className="text-sm">{message.message}</p>
                          </div>
                          <Textarea
                            placeholder="Escribe tu respuesta aquí..."
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            rows={5}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={handleRespond}>
                            Enviar Respuesta
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
