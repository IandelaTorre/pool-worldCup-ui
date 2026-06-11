import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
import { Trophy, Users, TrendingUp, ChevronRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <header className="container mx-auto py-6 px-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Trophy className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-white">
            Quiniela Mundial
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline text-muted-foreground mr-2 font-medium">Hola, {user?.fullName}</span>
              <Button variant="ghost" onClick={() => navigate('/my-groups')} className="font-bold">
                Mis Grupos
              </Button>
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/20" onClick={handleLogout}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Salir</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => openAuth('login')}>Entrar</Button>
              <Button onClick={() => openAuth('signup')} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50">
                Registrarse
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center text-center relative z-10 mt-10 md:mt-20">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Vive el Mundial <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-emerald-400">
            con tus amigos
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10">
          Crea tu grupo, predice los resultados de los partidos, suma puntos y demuestra quién sabe más de fútbol.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Button size="lg" className="h-14 px-8 text-lg font-bold" onClick={() => isAuthenticated ? navigate('/create-group') : openAuth('login')}>
            Crear Grupo Nuevo
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-lg glass-panel hover:bg-white/5" onClick={() => isAuthenticated ? navigate('/my-groups') : openAuth('login')}>
            Unirse con un Código
          </Button>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Grupos Privados</h3>
            <p className="text-muted-foreground">Invita a tus amigos con un enlace único o código secreto.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="h-24 w-24" />
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 text-yellow-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Reglas Personalizadas</h3>
            <p className="text-muted-foreground">Decide cuántos puntos vale atinar al ganador o al marcador exacto.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tabla de Posiciones</h3>
            <p className="text-muted-foreground">Actualización en tiempo real después de cada partido.</p>
          </div>
        </div>
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={authTab} />
    </div>
  );
}
