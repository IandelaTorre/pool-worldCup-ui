import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Share2, Users, ArrowLeft, Check, Clock, Loader2, AlertTriangle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Match {
  id: string;
  teamHome: string;
  teamAway: string;
  teamHomeFlagUrl: string;
  teamAwayFlagUrl: string;
  matchDate: string;
  venue: string;
  city: string;
  countryHost: string;
  scoreHome: number | null;
  scoreAway: number | null;
  status: 'pending' | 'in_progress' | 'finished';
  groupName: string;
}

interface Prediction {
  id: string;
  matchId: string;
  predictionHome: number;
  predictionAway: number;
  pointsEarned?: number;
}

interface LeaderboardEntry {
  userId: string;
  fullName: string;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
}

function MatchCard({ 
  match, 
  initialPrediction, 
  groupId, 
  onError,
  onPredictionSaved
}: { 
  match: Match, 
  initialPrediction: { predictionId?: string, home: string, away: string, points?: number },
  groupId: string,
  onError: (msg: string) => void,
  onPredictionSaved: (matchId: string, predictionId: string, home: string, away: string) => void
}) {
  const [home, setHome] = useState(initialPrediction.home);
  const [away, setAway] = useState(initialPrediction.away);
  const [saving, setSaving] = useState(false);
  
  const isFinished = match.status === 'finished';
  const isPending = match.status === 'pending';
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const currentPredId = useRef<string | undefined>(initialPrediction.predictionId);
  const isFirstRender = useRef(true);
  // Track if the home/away were set from props or from user input
  const userEdited = useRef(false);

  const hasPrediction = !!currentPredId.current && home !== '' && away !== '';

  useEffect(() => {
    // Skip on the very first mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Only auto-save if the user actually changed the value
    if (!userEdited.current) return;
    if (home === '' || away === '' || isFinished) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const payloadHome = parseInt(home);
        const payloadAway = parseInt(away);

        if (currentPredId.current) {
          await api.put(`/predictions/${currentPredId.current}`, {
            predictionHome: payloadHome,
            predictionAway: payloadAway
          });
          onPredictionSaved(match.id, currentPredId.current, home, away);
        } else {
          const res = await api.post('/predictions', {
            matchId: match.id,
            groupId,
            predictionHome: payloadHome,
            predictionAway: payloadAway
          });
          currentPredId.current = res.data.data.id;
          onPredictionSaved(match.id, currentPredId.current!, home, away);
        }
      } catch (err: any) {
        // No mostrar error si no hay conexión a internet
        if (!navigator.onLine) {
          console.warn('Sin conexión, no se pudo guardar predicción.');
        } else {
          console.error('Error saving', err);
          onError(`No se pudo guardar la predicción para ${match.teamHome} vs ${match.teamAway}. ${err.response?.data?.detail || ''}`);
        }
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [home, away, match.id, groupId, isFinished, onError]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 5);
    return date.toLocaleDateString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const location = `${match.city}, ${match.countryHost}`;

  let statusBadge;
  if (isFinished) {
    statusBadge = <span className="text-emerald-400 font-medium">Finalizado</span>;
  } else if (match.status === 'in_progress') {
    statusBadge = <span className="text-yellow-400 font-medium animate-pulse">En Juego</span>;
  } else if (hasPrediction && !saving) {
    statusBadge = <span className="text-emerald-400 font-medium flex items-center gap-1"><Check className="h-3 w-3"/> Completado</span>;
  } else {
    statusBadge = <span className="text-muted-foreground font-medium">Pendiente</span>;
  }

  return (
    <Card className={`glass-panel overflow-hidden border-white/5 ${isFinished ? 'opacity-80' : ''}`}>
      <div className={`h-1 w-full ${isFinished ? 'bg-muted' : isPending ? (hasPrediction ? 'bg-emerald-500' : 'bg-primary') : 'bg-yellow-500'}`} />
      <CardContent className="p-6 relative">
        <div className="flex justify-between items-start mb-4 text-sm text-muted-foreground">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 font-bold text-foreground">
              <Clock className="h-4 w-4 text-primary" /> {formatDate(match.matchDate)} hrs
            </span>
            <span className="flex items-center gap-1 text-xs opacity-70">
              <MapPin className="h-3 w-3" /> {match.venue} ({location})
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {saving && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            {statusBadge}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex-1 flex items-center justify-end gap-3 text-right">
            <span className="font-bold text-lg md:text-xl leading-tight">{match.teamHome}</span>
            {match.teamHomeFlagUrl ? <img src={match.teamHomeFlagUrl} alt={match.teamHome} className="w-8 h-6 rounded-sm object-cover shadow-sm" /> : <div className="w-8 h-6 bg-white/10 rounded-sm" />}
          </div>
          
          <div className="flex gap-2 items-center shrink-0">
            <Input 
              type="text" inputMode="numeric" value={home} 
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) {
                  userEdited.current = true;
                  setHome(e.target.value);
                }
              }}
              className="w-12 h-12 text-center text-xl font-bold bg-black/40 border-white/10 focus-visible:ring-primary"
              disabled={isFinished} placeholder="-"
            />
            <span className="text-muted-foreground font-bold">-</span>
            <Input 
              type="text" inputMode="numeric" value={away} 
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) {
                  userEdited.current = true;
                  setAway(e.target.value);
                }
              }}
              className="w-12 h-12 text-center text-xl font-bold bg-black/40 border-white/10 focus-visible:ring-primary"
              disabled={isFinished} placeholder="-"
            />
          </div>

          <div className="flex-1 flex items-center justify-start gap-3 text-left">
            {match.teamAwayFlagUrl ? <img src={match.teamAwayFlagUrl} alt={match.teamAway} className="w-8 h-6 rounded-sm object-cover shadow-sm" /> : <div className="w-8 h-6 bg-white/10 rounded-sm" />}
            <span className="font-bold text-lg md:text-xl leading-tight">{match.teamAway}</span>
          </div>
        </div>

        {isFinished && (
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
            <div className="text-muted-foreground">
              Resultado real: <span className="font-bold text-foreground">{match.scoreHome} - {match.scoreAway}</span>
            </div>
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              +{initialPrediction.points || 0} Puntos
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GroupView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard'>('matches');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [group, setGroup] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [predictionsMap, setPredictionsMap] = useState<Record<string, any>>({});
  
  const [errorMsg, setErrorMsg] = useState('');

  // Agrupación en lugar de filtros simples
  const [groupBy, setGroupBy] = useState<'group' | 'date' | 'status'>('group');

  const inviteLink = `${window.location.origin}/join/${group?.inviteCode || ''}`;

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const resGroup = await api.get(`/groups/${id}`);
        setGroup(resGroup.data.data);

        const resMatches = await api.get('/matches');
        setMatches(resMatches.data.data);

        const resPred = await api.get(`/predictions/user/${user.id}/group/${id}`);
        const userPreds: Prediction[] = resPred.data.data;

        const predState: Record<string, any> = {};
        userPreds.forEach(p => {
          predState[p.matchId] = {
            predictionId: p.id,
            home: p.predictionHome.toString(),
            away: p.predictionAway.toString(),
            points: p.pointsEarned
          };
        });
        setPredictionsMap(predState);

        const resLeaderboard = await api.get(`/groups/${id}/leaderboard`);
        setLeaderboard(resLeaderboard.data.data);
      } catch (error) {
        console.error('Error fetching group data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const groupedMatches = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    
    // Ordenamos cronológicamente para que dentro de cada grupo los partidos salgan en orden
    const sortedMatches = [...matches].sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    
    sortedMatches.forEach(m => {
      let key = '';
      if (groupBy === 'group') {
        key = `Grupo ${m.groupName}`;
      } else if (groupBy === 'date') {
        const d = new Date(m.matchDate);
        d.setHours(d.getHours() + 5);
        key = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        key = key.charAt(0).toUpperCase() + key.slice(1);
      } else if (groupBy === 'status') {
        const p = predictionsMap[m.id];
        const hasPrediction = p && p.predictionId && p.home !== '' && p.away !== '';
        
        if (m.status === 'finished') {
          key = 'Finalizados';
        } else if (m.status === 'in_progress') {
          key = 'En Juego';
        } else if (hasPrediction) {
          key = 'Completados';
        } else {
          key = 'Pendientes';
        }
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    
    return groups;
  }, [matches, groupBy, predictionsMap]);

  const orderedKeys = useMemo(() => {
    if (groupBy === 'group') return Object.keys(groupedMatches).sort();
    if (groupBy === 'status') return ['En Juego', 'Pendientes', 'Completados', 'Finalizados'].filter(k => groupedMatches[k]);
    if (groupBy === 'date') {
      return Object.keys(groupedMatches).sort((a, b) => {
        const timeA = new Date(groupedMatches[a][0].matchDate).getTime();
        const timeB = new Date(groupedMatches[b][0].matchDate).getTime();
        return timeA - timeB;
      });
    }
    return Object.keys(groupedMatches);
  }, [groupedMatches, groupBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative pb-20">
      <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="glass-panel max-w-sm w-full border-destructive/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-destructive/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Error al Guardar</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <p className="text-muted-foreground mb-6">{errorMsg}</p>
              <Button onClick={() => setErrorMsg('')} className="w-full">Entendido</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="container mx-auto py-6 px-4 flex items-center gap-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/my-groups')} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {group?.name || 'Grupo'}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> {group?.maxMembers} Miembros Max.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 relative z-10 mt-4 space-y-6">
        <Card className="glass-panel border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-lg">Invita a tus amigos</h3>
              <p className="text-sm text-muted-foreground">Comparte este enlace para que se unan a tu grupo.</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <Input value={inviteLink} readOnly className="bg-black/40 border-white/10 text-center sm:text-left font-mono" />
              <Button onClick={copyToClipboard} variant={copied ? "default" : "secondary"} className={copied ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex bg-black/40 p-1 rounded-xl w-full max-w-sm mx-auto">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'matches' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('matches')}
          >
            Partidos
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'leaderboard' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Posiciones
          </button>
        </div>

        {activeTab === 'matches' && (
          <div className="max-w-2xl mx-auto mt-8">
            
            <div className="flex flex-col items-center mb-8">
              <span className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-bold">Agrupar partidos por</span>
              <div className="flex gap-2">
                <Button 
                  variant={groupBy === 'group' ? 'default' : 'outline'}
                  onClick={() => setGroupBy('group')}
                  className={`rounded-full px-6 transition-all ${groupBy === 'group' ? 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-black/40 hover:bg-white/10'}`}
                >
                  Grupos
                </Button>
                <Button 
                  variant={groupBy === 'date' ? 'default' : 'outline'}
                  onClick={() => setGroupBy('date')}
                  className={`rounded-full px-6 transition-all ${groupBy === 'date' ? 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-black/40 hover:bg-white/10'}`}
                >
                  Fecha
                </Button>
                <Button 
                  variant={groupBy === 'status' ? 'default' : 'outline'}
                  onClick={() => setGroupBy('status')}
                  className={`rounded-full px-6 transition-all ${groupBy === 'status' ? 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-black/40 hover:bg-white/10'}`}
                >
                  Estado
                </Button>
              </div>
            </div>

            <div className="space-y-10">
              {orderedKeys.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-black/20 rounded-xl border border-white/5">
                  No hay partidos disponibles.
                </div>
              ) : (
                orderedKeys.map(sectionTitle => (
                  <div key={sectionTitle} className="animate-fade-in">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-px bg-white/10 flex-1" />
                      <h2 className="text-primary font-bold uppercase tracking-widest text-sm bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
                        {sectionTitle}
                      </h2>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>
                    
                    <div className="space-y-4">
                      {groupedMatches[sectionTitle].map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          initialPrediction={predictionsMap[match.id] || { home: '', away: '' }} 
                          groupId={id as string}
                          onError={(msg) => setErrorMsg(msg)}
                          onPredictionSaved={(matchId, predictionId, home, away) => {
                            setPredictionsMap(prev => ({
                              ...prev,
                              [matchId]: { predictionId, home, away, points: prev[matchId]?.points }
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="max-w-3xl mx-auto">
            <Card className="glass-panel border-white/5">
              <CardHeader>
                <CardTitle>Tabla de Posiciones</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aún no hay puntos en este grupo.</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-white/10">
                      <div className="w-8">#</div>
                      <div className="flex-1">Jugador</div>
                      <div className="w-20 text-center hidden sm:block">Exactos</div>
                      <div className="w-20 text-center hidden sm:block">Ganador</div>
                      <div className="w-20 text-right">Pts</div>
                    </div>
                    
                    {leaderboard.map((entry, index) => (
                      <div key={entry.userId} className="flex items-center px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">
                        <div className={`w-8 font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                            {entry.fullName.charAt(0)}
                          </div>
                          <span className="font-medium">{entry.fullName}</span>
                        </div>
                        <div className="w-20 text-center text-sm text-muted-foreground hidden sm:block">
                          {entry.exactScores}
                        </div>
                        <div className="w-20 text-center text-sm text-muted-foreground hidden sm:block">
                          {entry.correctWinners}
                        </div>
                        <div className="w-20 text-right font-bold text-lg text-primary">
                          {entry.totalPoints}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
