import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function SetupUsers() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ email: string; success: boolean; message: string }[]>([]);

  const createUsers = async () => {
    setLoading(true);
    setResults([]);
    const newResults: { email: string; success: boolean; message: string }[] = [];

    // Create admin user
    try {
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: 'admin@hoteldelcerro.com',
        password: '123456',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: 'Administrador',
          },
        },
      });

      if (adminError) {
        newResults.push({
          email: 'admin@hoteldelcerro.com',
          success: false,
          message: adminError.message.includes('already registered') 
            ? 'Usuario ya existe' 
            : adminError.message
        });
      } else {
        newResults.push({
          email: 'admin@hoteldelcerro.com',
          success: true,
          message: 'Usuario creado exitosamente'
        });
      }
    } catch (error) {
      newResults.push({
        email: 'admin@hoteldelcerro.com',
        success: false,
        message: 'Error al crear usuario'
      });
    }

    // Create operator user
    try {
      const { data: operatorData, error: operatorError } = await supabase.auth.signUp({
        email: 'operador@hoteldelcerro.com',
        password: '123456',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: 'Operador',
          },
        },
      });

      if (operatorError) {
        newResults.push({
          email: 'operador@hoteldelcerro.com',
          success: false,
          message: operatorError.message.includes('already registered')
            ? 'Usuario ya existe'
            : operatorError.message
        });
      } else {
        newResults.push({
          email: 'operador@hoteldelcerro.com',
          success: true,
          message: 'Usuario creado exitosamente'
        });
      }
    } catch (error) {
      newResults.push({
        email: 'operador@hoteldelcerro.com',
        success: false,
        message: 'Error al crear usuario'
      });
    }

    setResults(newResults);
    setLoading(false);

    const allSuccess = newResults.every(r => r.success);
    if (allSuccess) {
      toast.success("Usuarios creados exitosamente! Ahora puedes iniciar sesión con ellos.");
    } else {
      toast.warning("Algunos usuarios no pudieron ser creados. Revisa los detalles.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuración Inicial de Usuarios</CardTitle>
          <CardDescription>
            Crea los usuarios administrador y operador con contraseña "123456"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={createUsers} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Creando usuarios..." : "Crear Usuarios"}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Resultados:</h3>
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{result.email}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Credenciales:</strong><br />
              • admin@hoteldelcerro.com / 123456<br />
              • operador@hoteldelcerro.com / 123456
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
