import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, LogIn, Loader2, AlertTriangle, CheckCircle2, ArrowLeft, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/AuthModal';

export default function JoinGroup() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [joinedGroup, setJoinedGroup] = useState<{ id: string; name: string } | null>(null);

  // Track if a join was attempted before authentication
  const pendingJoin = useRef(false);

  // When the user logs in from this page, automatically trigger the join
  useEffect(() => {
    if (isAuthenticated && pendingJoin.current) {
      pendingJoin.current = false;
      handleJoin();
    }
  }, [isAuthenticated]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      pendingJoin.current = true;
      setAuthModalOpen(true);
      return;
    }
    if (!inviteCode) return;

    setJoining(true);
    setError('');

    try {
      const res = await api.post('/groups/join', { inviteCode });
      const groupId = res.data.data.groupId;

      const resGroup = await api.get(`/groups/${groupId}`);
      setJoinedGroup({ id: groupId, name: resGroup.data.data.name });

      setTimeout(() => navigate(`/group/${groupId}`), 2000);

    } catch (err: any) {
      const status = err.response?.status;

      if (status === 409) {
        // Already a member — find the group in /groups/me and redirect
        try {
          const resMyGroups = await api.get('/groups/me');
          const myGroups = resMyGroups.data.data;
          const matched = myGroups.find((g: any) =>
            g.inviteCode?.toUpperCase() === inviteCode?.toUpperCase()
          );
          navigate(matched ? `/group/${matched.id}` : '/my-groups');
        } catch {
          navigate('/my-groups');
        }
      } else if (status === 404) {
        setError('El código de invitación no existe o ha expirado.');
      } else if (status === 400) {
        setError(err.response?.data?.detail || 'El grupo ya está lleno o el código no es válido.');
      } else {
        setError(err.response?.data?.detail || 'No se pudo unir al grupo. Intenta de nuevo.');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Trophy className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-white">
            Quiniela Mundial
          </span>
        </div>

        {joinedGroup ? (
          <Card className="glass-panel border-emerald-500/30 text-center">
            <CardContent className="py-12 px-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold">¡Bienvenido!</h2>
              <p className="text-muted-foreground">
                Te has unido a <span className="font-bold text-foreground">{joinedGroup.name}</span> correctamente.
              </p>
              <p className="text-sm text-muted-foreground">Redirigiendo al grupo...</p>
              <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
            </CardContent>
          </Card>

        ) : (
          <Card className="glass-panel border-white/10 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-emerald-500" />
            <CardContent className="py-10 px-8">
              <div className="text-center mb-8">
                <p className="text-sm uppercase tracking-widest text-muted-foreground font-bold mb-3">
                  Invitación al grupo
                </p>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-6 py-3 rounded-2xl mb-6">
                  <Hash className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-black font-mono tracking-widest text-primary">
                    {inviteCode?.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground">¿Listo para competir?</h2>
                <p className="text-muted-foreground text-sm mt-1">Únete y predice los resultados del Mundial</p>
              </div>

              <div className="bg-black/30 rounded-xl p-5 mb-8 border border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span>Predice el marcador de cada partido</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>Acumula puntos con cada acierto</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                  <span>Compite por el primer lugar del grupo</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive/40 text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {isAuthenticated ? (
                <Button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90"
                >
                  {joining
                    ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uniéndose...</>
                    : <><LogIn className="mr-2 h-5 w-5" /> ¡Unirme al Grupo!</>
                  }
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handleJoin}
                    className="w-full h-12 text-base font-bold"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Entrar o Registrarse para Unirme
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Necesitas una cuenta gratuita para participar.
                  </p>
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full mt-3 text-muted-foreground"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab="login"
      />
    </div>
  );
}
