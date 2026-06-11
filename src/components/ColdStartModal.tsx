import { useSystemStore } from '@/store/systemStore';
import { BedDouble, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ColdStartModal() {
  const { isWakingUp } = useSystemStore();

  if (!isWakingUp) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-lg shadow-2xl border-indigo-500/30 bg-slate-950 text-white overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full" />
        <CardContent className="pt-10 pb-8 px-6 sm:px-10 flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 rounded-full animate-pulse" />
            <BedDouble className="w-20 h-20 text-indigo-400 relative z-10 animate-bounce" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Despertando el Servidor</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Detectamos que el servidor estaba inactivo (Render lo apaga temporalmente tras un tiempo sin uso). 
              <br className="hidden sm:block" />
              Estamos esperando a que encienda de nuevo y reintentando la conexión automáticamente.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-indigo-300 bg-indigo-500/10 py-3 px-6 rounded-full border border-indigo-500/20">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium text-lg">Reintentando conexión...</span>
          </div>

          <div className="pt-6 border-t border-slate-800/80 w-full mt-4">
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text leading-tight pb-1">
              La primera ya duerme Cuautitlán Izcalli
            </h1>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
