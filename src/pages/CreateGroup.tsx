import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Settings2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/AuthModal';

export default function CreateGroup() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const [name, setName] = useState('');
  
  // Rules State
  const [rules, setRules] = useState({
    exactScore: { points: 3, enabled: true },
    winner: { points: 1, enabled: true },
    goalDifference: { points: 1, enabled: true },
    teamGoals: { points: 1, enabled: true }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateRule = (key: keyof typeof rules, field: 'points' | 'enabled', value: any) => {
    setRules(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Create the group
      const resGroup = await api.post('/groups', { name, maxMembers: 20 });
      const groupId = resGroup.data.data.id;

      // 2. Fetch the generated default scoring config to get ruleTypeIds
      const resConfig = await api.get(`/groups/${groupId}/scoring-config`);
      const defaultConfigs = resConfig.data.data;

      // 3. Map our UI state to the correct ruleTypeIds based on rule code
      const configsToUpdate = defaultConfigs.map((config: any) => {
        const code = config.ruleType.code;
        let uiRule = null;
        
        if (code === 'exact_score') uiRule = rules.exactScore;
        else if (code === 'winner') uiRule = rules.winner;
        else if (code === 'goal_difference') uiRule = rules.goalDifference;
        else if (code === 'team_goals') uiRule = rules.teamGoals;

        return {
          ruleTypeId: config.ruleTypeId,
          points: uiRule ? uiRule.points : config.points,
          enabled: uiRule ? uiRule.enabled : config.enabled
        };
      });

      // 4. Update the scoring configuration
      await api.put(`/groups/${groupId}/scoring-config`, { configs: configsToUpdate });

      // Navigate to the newly created group dashboard
      navigate(`/group/${groupId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al crear el grupo. Revisa tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden p-4 md:p-8">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      
      <header className="max-w-3xl mx-auto mb-8 flex items-center gap-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/my-groups')} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Crear Nuevo Grupo</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto relative z-10">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-8">
          <Card className="glass-panel border-white/5">
            <CardHeader>
              <CardTitle>Información del Grupo</CardTitle>
              <CardDescription>Dale un nombre épico a tu grupo para invitar a tus amigos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Nombre del Grupo</Label>
                  <Input 
                    id="groupName" 
                    placeholder="Ej. Los Reyes del Fútbol" 
                    className="bg-black/20 border-white/10 h-12 text-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-emerald-400" />
                <CardTitle>Reglas de Puntuación</CardTitle>
              </div>
              <CardDescription>Activa o desactiva las reglas y personaliza los puntos por cada acierto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Regla: Marcador Exacto */}
              <div className={`p-4 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${rules.exactScore.enabled ? 'bg-black/20 border-primary/30' : 'bg-black/10 border-white/5 opacity-60 grayscale'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Switch 
                      checked={rules.exactScore.enabled} 
                      onCheckedChange={(val) => updateRule('exactScore', 'enabled', val)}
                    />
                    <Label className="text-base font-bold text-primary cursor-pointer" onClick={() => updateRule('exactScore', 'enabled', !rules.exactScore.enabled)}>
                      Marcador Exacto
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-14">Acertar la cantidad de goles de ambos equipos.</p>
                </div>
                <div className="flex items-center gap-4 ml-14 md:ml-0">
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    disabled={!rules.exactScore.enabled}
                    value={rules.exactScore.points} 
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) updateRule('exactScore', 'points', e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-24 bg-black/40 border-primary/30 text-center font-bold text-xl"
                  />
                  <span className="font-medium text-sm">Puntos</span>
                </div>
              </div>

              {/* Regla: Ganador o Empate */}
              <div className={`p-4 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${rules.winner.enabled ? 'bg-black/20 border-emerald-500/30' : 'bg-black/10 border-white/5 opacity-60 grayscale'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Switch 
                      checked={rules.winner.enabled} 
                      onCheckedChange={(val) => updateRule('winner', 'enabled', val)}
                    />
                    <Label className="text-base font-bold text-emerald-400 cursor-pointer" onClick={() => updateRule('winner', 'enabled', !rules.winner.enabled)}>
                      Ganador o Empate
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-14">Acertar qué equipo gana o si quedan empatados.</p>
                </div>
                <div className="flex items-center gap-4 ml-14 md:ml-0">
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    disabled={!rules.winner.enabled}
                    value={rules.winner.points} 
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) updateRule('winner', 'points', e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-24 bg-black/40 border-emerald-500/30 text-center font-bold text-xl"
                  />
                  <span className="font-medium text-sm">Puntos</span>
                </div>
              </div>

              {/* Regla: Diferencia de Goles */}
              <div className={`p-4 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${rules.goalDifference.enabled ? 'bg-black/20 border-yellow-500/30' : 'bg-black/10 border-white/5 opacity-60 grayscale'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Switch 
                      checked={rules.goalDifference.enabled} 
                      onCheckedChange={(val) => updateRule('goalDifference', 'enabled', val)}
                    />
                    <Label className="text-base font-bold text-yellow-400 cursor-pointer" onClick={() => updateRule('goalDifference', 'enabled', !rules.goalDifference.enabled)}>
                      Diferencia de Goles
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-14">Acertar la diferencia de goles entre ambos.</p>
                </div>
                <div className="flex items-center gap-4 ml-14 md:ml-0">
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    disabled={!rules.goalDifference.enabled}
                    value={rules.goalDifference.points} 
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) updateRule('goalDifference', 'points', e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-24 bg-black/40 border-yellow-500/30 text-center font-bold text-xl"
                  />
                  <span className="font-medium text-sm">Puntos</span>
                </div>
              </div>

              {/* Regla: Goles del Equipo */}
              <div className={`p-4 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${rules.teamGoals.enabled ? 'bg-black/20 border-purple-500/30' : 'bg-black/10 border-white/5 opacity-60 grayscale'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Switch 
                      checked={rules.teamGoals.enabled} 
                      onCheckedChange={(val) => updateRule('teamGoals', 'enabled', val)}
                    />
                    <Label className="text-base font-bold text-purple-400 cursor-pointer" onClick={() => updateRule('teamGoals', 'enabled', !rules.teamGoals.enabled)}>
                      Goles del Equipo
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-14">Acertar los goles exactos que anota uno de los equipos.</p>
                </div>
                <div className="flex items-center gap-4 ml-14 md:ml-0">
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    disabled={!rules.teamGoals.enabled}
                    value={rules.teamGoals.points} 
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) updateRule('teamGoals', 'points', e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    className="w-24 bg-black/40 border-purple-500/30 text-center font-bold text-xl"
                  />
                  <span className="font-medium text-sm">Puntos</span>
                </div>
              </div>

            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => navigate('/my-groups')}>Cancelar</Button>
            <Button disabled={loading} type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8">
              {loading ? 'Guardando...' : 'Crear Grupo'}
            </Button>
          </div>
        </form>
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab="login" />
    </div>
  );
}
