import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Calendar, Bed } from "lucide-react";

interface Stats {
  totalReservations: number;
  activeReservations: number;
  totalRevenue: number;
  totalRooms: number;
  availableRooms: number;
  pendingReservations: number;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalReservations: 0,
    activeReservations: 0,
    totalRevenue: 0,
    totalRooms: 0,
    availableRooms: 0,
    pendingReservations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total reservas
      const { count: totalReservations } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });

      // Reservas activas (confirmadas o pendientes)
      const { count: activeReservations } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['confirmed', 'pending']);

      // Reservas pendientes
      const { count: pendingReservations } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Ingresos totales (de reservas completadas o confirmadas)
      const { data: revenueData } = await supabase
        .from('reservations')
        .select('total_price')
        .in('status', ['completed', 'confirmed']);

      const totalRevenue = revenueData?.reduce((sum, r) => sum + Number(r.total_price), 0) || 0;

      // Total habitaciones
      const { count: totalRooms } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true });

      // Habitaciones disponibles
      const { count: availableRooms } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      setStats({
        totalReservations: totalReservations || 0,
        activeReservations: activeReservations || 0,
        totalRevenue,
        totalRooms: totalRooms || 0,
        availableRooms: availableRooms || 0,
        pendingReservations: pendingReservations || 0,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center">Cargando estadísticas...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Estadísticas Generales</h3>
        <p className="text-sm text-muted-foreground">
          Resumen del estado actual del hotel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeReservations} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Pendientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReservations}</div>
            <p className="text-xs text-muted-foreground">
              Requieren confirmación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Confirmadas y completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habitaciones Totales</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilidad</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableRooms}</div>
            <p className="text-xs text-muted-foreground">
              Habitaciones disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRooms > 0 
                ? Math.round(((stats.totalRooms - stats.availableRooms) / stats.totalRooms) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRooms - stats.availableRooms} de {stats.totalRooms} ocupadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>Indicadores clave del negocio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm font-medium">Ingreso promedio por reserva</span>
              <span className="text-sm font-semibold">
                ${stats.totalReservations > 0 
                  ? Math.round(stats.totalRevenue / stats.totalReservations).toLocaleString()
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm font-medium">Tasa de conversión</span>
              <span className="text-sm font-semibold">
                {stats.totalReservations > 0
                  ? Math.round((stats.activeReservations / stats.totalReservations) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Reservas por habitación</span>
              <span className="text-sm font-semibold">
                {stats.totalRooms > 0 
                  ? (stats.totalReservations / stats.totalRooms).toFixed(1)
                  : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
