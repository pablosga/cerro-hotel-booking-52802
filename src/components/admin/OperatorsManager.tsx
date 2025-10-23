import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export default function OperatorsManager() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"operator" | "admin">("operator");

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .in('role', ['operator', 'admin'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error: any) {
      toast.error("Error al cargar operadores");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Buscar usuario por email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', searchEmail.toLowerCase().trim())
        .single();

      if (profileError || !profile) {
        toast.error("Usuario no encontrado con ese email");
        return;
      }

      // Verificar si ya tiene el rol
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.id)
        .eq('role', selectedRole)
        .single();

      if (existingRole) {
        toast.error("El usuario ya tiene este rol asignado");
        return;
      }

      // Asignar rol
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: profile.id,
          role: selectedRole
        }]);

      if (error) throw error;

      toast.success(`Rol ${selectedRole} asignado correctamente`);
      setIsDialogOpen(false);
      setSearchEmail("");
      fetchOperators();
    } catch (error: any) {
      toast.error("Error al asignar rol");
      console.error(error);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      toast.success("Rol eliminado");
      fetchOperators();
    } catch (error: any) {
      toast.error("Error al eliminar rol");
    }
  };

  if (loading) {
    return <p className="text-center">Cargando operadores...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestión de Operadores y Administradores</CardTitle>
            <CardDescription>Asignar y gestionar roles de usuario</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Asignar Rol
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Rol a Usuario</DialogTitle>
                <DialogDescription>
                  Busca al usuario por su email y asígnale un rol
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRole} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email del Usuario*</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    El usuario debe estar registrado en el sistema
                  </p>
                </div>

                <div>
                  <Label htmlFor="role">Rol*</Label>
                  <Select value={selectedRole} onValueChange={(value: "operator" | "admin") => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Operador: gestiona reservas, mensajes y pagos<br />
                    Administrador: acceso completo al sistema
                  </p>
                </div>

                <DialogFooter>
                  <Button type="submit">
                    Asignar Rol
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userRoles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay operadores o administradores asignados
            </p>
          ) : (
            userRoles.map((userRole) => (
              <Card key={userRole.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {userRole.profiles?.full_name || "Sin nombre"}
                        </h4>
                        <Badge variant={userRole.role === 'admin' ? "default" : "secondary"}>
                          {userRole.role === 'admin' ? 'Administrador' : 'Operador'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {userRole.profiles?.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Asignado el {new Date(userRole.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Rol</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de eliminar el rol {userRole.role} de {userRole.profiles?.email}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveRole(userRole.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
