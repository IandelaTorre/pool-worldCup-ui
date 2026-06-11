import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Users, Plus, Key, Calendar, Loader2, AlertTriangle, CheckCircle2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGroupStore } from '@/store/groupStore';
import { api } from '@/lib/api';

export default function MyGroups() {
  const navigate = useNavigate();
  const { myGroups, fetchMyGroups } = useGroupStore();
  const [loading, setLoading] = useState(true);

  // Join modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      await fetchMyGroups();
      setLoading(false);
    };
    loadGroups();
  }, [fetchMyGroups]);

  const openJoinModal = () => {
    setJoinCode('');
    setJoinError('');
    setJoinSuccess('');
    setJoinModalOpen(true);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setJoinError('');
    setJoinSuccess('');

    try {
      const res = await api.post('/groups/join', { inviteCode: joinCode.trim().toUpperCase() });
      const groupId = res.data.data.groupId;

      // Refresh groups list
      await fetchMyGroups();
      setJoinSuccess('¡Te uniste al grupo! Redirigiendo...');
      setTimeout(() => navigate(`/group/${groupId}`), 1500);

    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        // Already a member — find group and redirect
        const matched = myGroups.find(g => g.inviteCode?.toUpperCase() === joinCode.trim().toUpperCase());
        if (matched) {
          navigate(`/group/${matched.id}`);
        } else {
          setJoinError('Ya eres miembro de este grupo.');
        }
      } else if (status === 404) {
        setJoinError('El código no existe. Verifica que esté bien escrito.');
      } else if (status === 400) {
        setJoinError(err.response?.data?.detail || 'El grupo ya está lleno.');
      } else {
        setJoinError(err.response?.data?.detail || 'No se pudo unir al grupo. Intenta de nuevo.');
      }
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden p-4 md:p-8">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Join Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="glass-panel w-full max-w-sm border-white/10 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary to-emerald-500" />
            <CardContent className="pt-8 pb-6 px-6">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Unirme con Código</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Pide el código de invitación al administrador del grupo e ingrésalo aquí.
              </p>

              {joinSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <p className="font-medium text-emerald-400">{joinSuccess}</p>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Código de Invitación</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="joinCode"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ABC12345"
                        className="pl-9 bg-black/40 border-white/10 font-mono tracking-widest text-center uppercase h-12 text-lg font-bold"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  {joinError && (
                    <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/40 text-sm text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {joinError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setJoinModalOpen(false)}
                      disabled={joining}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 font-bold"
                      disabled={joining || !joinCode.trim()}
                    >
                      {joining
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uniéndome...</>
                        : 'Unirme'
                      }
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mis Grupos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button className="flex-1 h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={() => navigate('/create-group')}>
            <Plus className="mr-2 h-5 w-5" /> Crear Nuevo Grupo
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-14 text-lg glass-panel hover:bg-white/5"
            onClick={openJoinModal}
          >
            <Key className="mr-2 h-5 w-5" /> Unirme a un Grupo
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Grupos Activos</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : myGroups.length === 0 ? (
          <Card className="glass-panel border-white/5 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">Aún no estás en ningún grupo</h3>
              <p className="text-muted-foreground">Crea uno nuevo o únete con un código de invitación.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myGroups.map((group) => (
              <Card
                key={group.id}
                className="glass-panel border-white/10 hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => navigate(`/group/${group.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{group.name}</h3>
                    <div className="bg-black/30 px-2 py-1 rounded text-xs font-mono text-muted-foreground border border-white/5">
                      {group.inviteCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> Max {group.maxMembers}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> {formatDate(group.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
