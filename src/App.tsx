import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Users, 
  Activity, 
  Shield, 
  Zap, 
  Target, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Info,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  History,
  Trophy,
  Clock,
  BarChart3,
  X
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from './lib/utils';
import { INITIAL_PLAYERS, SUBSTITUTES, Player, Formation, Mentality, FORMATION_POSITIONS, FORMATION_DETAILS, TACTICAL_SCENARIOS, TacticalScenario } from './types';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).players;
      } catch (e) {
        return INITIAL_PLAYERS;
      }
    }
    return INITIAL_PLAYERS;
  });
  const [substitutes, setSubstitutes] = useState<Player[]>(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).substitutes;
      } catch (e) {
        return SUBSTITUTES;
      }
    }
    return SUBSTITUTES;
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [formation, setFormation] = useState<Formation>(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).formation;
      } catch (e) {
        return '2-3-1';
      }
    }
    return '2-3-1';
  });
  const [mentality, setMentality] = useState<Mentality>(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).mentality;
      } catch (e) {
        return 'Balanced';
      }
    }
    return 'Balanced';
  });
  const [isPitchExpanded, setIsPitchExpanded] = useState(false);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Match Timer and Score State
  const [matchTime, setMatchTime] = useState(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).matchTime;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Always start paused on refresh
  const [scoreHome, setScoreHome] = useState(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).scoreHome;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  });
  const [scoreAway, setScoreAway] = useState(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).scoreAway;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  });
  const [teamHomeName, setTeamHomeName] = useState(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).teamHomeName;
      } catch (e) {
        return 'Home';
      }
    }
    return 'Home';
  });
  const [teamAwayName, setTeamAwayName] = useState(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).teamAwayName;
      } catch (e) {
        return 'Away';
      }
    }
    return 'Away';
  });
  const [pitchColor, setPitchColor] = useState(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).pitchColor;
      } catch (e) {
        return '#1E3A1E';
      }
    }
    return '#1E3A1E';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [matchDuration, setMatchDuration] = useState(() => {
    const saved = localStorage.getItem('current_match_state');
    if (saved) {
      try {
        return JSON.parse(saved).matchDuration;
      } catch (e) {
        return 40;
      }
    }
    return 40;
  });
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPostMatchOpen, setIsPostMatchOpen] = useState(false);

  // Supabase Auth Listener
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Match History from Supabase
  React.useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        // If not logged in, maybe load from localStorage or just keep empty
        const local = localStorage.getItem('match_history');
        if (local) setMatchHistory(JSON.parse(local));
        return;
      }

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
      } else if (data) {
        setMatchHistory(data.map(m => ({
          id: m.id,
          date: new Date(m.created_at).toLocaleString(),
          home: m.home_team,
          away: m.away_team,
          score: `${m.score_home} - ${m.score_away}`,
          duration: m.duration,
          stats: {
            totalErrors: m.total_errors,
            avgRating: m.avg_rating,
            topPlayer: m.top_player
          }
        })));
      }
    };

    fetchHistory();
  }, [user]);

  // Timer Logic
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMatchTime(prev => {
          const next = prev + 1;
          // Auto-stop if duration reached (optional, but good for UX)
          if (next >= matchDuration * 60) {
            setIsTimerRunning(false);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, matchDuration]);

  // Auto-save current match state to localStorage
  React.useEffect(() => {
    const matchState = {
      players,
      substitutes,
      formation,
      mentality,
      matchTime,
      isTimerRunning,
      scoreHome,
      scoreAway,
      teamHomeName,
      teamAwayName,
      matchDuration,
      pitchColor
    };
    localStorage.setItem('current_match_state', JSON.stringify(matchState));
  }, [players, substitutes, formation, mentality, matchTime, isTimerRunning, scoreHome, scoreAway, teamHomeName, teamAwayName, matchDuration, pitchColor]);

  const handleResetMatch = () => {
    if (window.confirm('Reset all match data? This will clear all current progress.')) {
      setPlayers(INITIAL_PLAYERS);
      setSubstitutes(SUBSTITUTES);
      setMatchTime(0);
      setIsTimerRunning(false);
      setScoreHome(0);
      setScoreAway(0);
      setFormation('2-3-1');
      setMentality('Balanced');
      localStorage.removeItem('current_match_state');
      setIsSettingsOpen(false);
      
      setToastMessage('Match reset to initial state');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const applyTacticalScenario = (scenario: TacticalScenario) => {
    setFormation(scenario.recommendedFormation);
    setMentality(scenario.recommendedMentality);
    
    setToastMessage(`Đã áp dụng: ${scenario.label} (${scenario.recommendedFormation})`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEndMatch = async () => {
    const totalErrors = players.reduce((sum, p) => sum + (p.errors || 0), 0);
    const avgRating = players.reduce((sum, p) => sum + (p.rating || 0), 0) / players.length;
    const topPlayer = [...players].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    const matchRecord = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      home: teamHomeName,
      away: teamAwayName,
      score: `${scoreHome} - ${scoreAway}`,
      duration: formatTime(matchTime),
      stats: {
        totalErrors,
        avgRating: avgRating.toFixed(1),
        topPlayer: topPlayer.name
      }
    };

    // Save to Supabase if logged in
    if (user) {
      const { error } = await supabase.from('matches').insert({
        user_id: user.id,
        home_team: teamHomeName,
        away_team: teamAwayName,
        score_home: scoreHome,
        score_away: scoreAway,
        duration: formatTime(matchTime),
        total_errors: totalErrors,
        avg_rating: parseFloat(avgRating.toFixed(1)),
        top_player: topPlayer.name
      });

      if (error) {
        console.error('Error saving match:', error);
        alert('Failed to save match to cloud. Saving locally instead.');
      }
    } else {
      // Save to local storage if not logged in
      const newHistory = [matchRecord, ...matchHistory];
      localStorage.setItem('match_history', JSON.stringify(newHistory));
    }

    setMatchHistory(prev => [matchRecord, ...prev]);
    setIsTimerRunning(false);
    setIsPostMatchOpen(true);
    localStorage.removeItem('current_match_state');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        alert('Check your email for confirmation!');
      }
      setIsAuthModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update player positions and stats when formation or mentality changes
  React.useEffect(() => {
    const positions = FORMATION_POSITIONS[formation];
    const details = FORMATION_DETAILS[formation];
    
    // Mentality offsets (x-axis)
    const getMentalityOffset = (m: Mentality, index: number) => {
      if (index === 0) return 0; // GK doesn't move much
      if (m === 'Attacking') return 10;
      if (m === 'Defensive') return -10;
      return 0;
    };

    setPlayers(prev => prev.map((player, index) => {
      const basePos = positions[index] || { x: player.x, y: player.y };
      const detail = details[index] || { title: player.positionTitle, role: player.role, movement: player.movement, position: player.position };
      const offset = getMentalityOffset(mentality, index);
      
      // Adjust stats based on mentality
      const newStats = { ...player.stats };
      if (mentality === 'Attacking') {
        newStats.attack = Math.min(100, INITIAL_PLAYERS[index].stats.attack + 10);
        newStats.defense = Math.max(0, INITIAL_PLAYERS[index].stats.defense - 5);
      } else if (mentality === 'Defensive') {
        newStats.attack = Math.max(0, INITIAL_PLAYERS[index].stats.attack - 5);
        newStats.defense = Math.min(100, INITIAL_PLAYERS[index].stats.defense + 10);
      } else {
        newStats.attack = INITIAL_PLAYERS[index].stats.attack;
        newStats.defense = INITIAL_PLAYERS[index].stats.defense;
      }

      return {
        ...player,
        x: Math.max(5, Math.min(95, basePos.x + offset)),
        y: basePos.y,
        position: detail.position,
        positionTitle: detail.title,
        role: detail.role,
        movement: detail.movement,
        stats: newStats
      };
    }));
  }, [formation, mentality]);

  const selectedPlayer = useMemo(() => 
    players.find(p => p.id === selectedPlayerId), 
    [players, selectedPlayerId]
  );

  const radarData = useMemo(() => {
    if (!selectedPlayer) return [];
    const s = selectedPlayer.stats;
    return [
      { subject: 'Stamina', A: s.stamina, fullMark: 100 },
      { subject: 'Speed', A: s.speed, fullMark: 100 },
      { subject: 'Passing', A: s.passing, fullMark: 100 },
      { subject: 'Attack', A: s.attack, fullMark: 100 },
      { subject: 'Defense', A: s.defense, fullMark: 100 },
      { subject: 'Morale', A: s.morale, fullMark: 100 },
    ];
  }, [selectedPlayer]);

  const handleStatChange = (stat: keyof Player['stats'], value: number) => {
    if (!selectedPlayerId) return;
    setPlayers(prev => prev.map(p => 
      p.id === selectedPlayerId 
        ? { ...p, stats: { ...p.stats, [stat]: value } }
        : p
    ));
  };

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Tactical Instruction Transmitted');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  const handleApply = () => {
    setToastMessage('Tactical Instruction Transmitted');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubstitution = (subId: string) => {
    if (!selectedPlayerId) return;
    
    const activePlayerIndex = players.findIndex(p => p.id === selectedPlayerId);
    const subPlayerIndex = substitutes.findIndex(p => p.id === subId);
    
    if (activePlayerIndex === -1 || subPlayerIndex === -1) return;
    
    const activePlayer = players[activePlayerIndex];
    const subPlayer = substitutes[subPlayerIndex];
    
    const newPlayers = [...players];
    const newSubstitutes = [...substitutes];
    
    const updatedSubPlayer: Player = {
      ...subPlayer,
      x: activePlayer.x,
      y: activePlayer.y,
      position: activePlayer.position,
      positionTitle: activePlayer.positionTitle,
      status: 'active',
      errors: 0,
      rating: 6.0
    };
    
    const updatedActivePlayer: Player = {
      ...activePlayer,
      status: 'sub',
      x: 0,
      y: 0
    };
    
    newPlayers[activePlayerIndex] = updatedSubPlayer;
    newSubstitutes[subPlayerIndex] = updatedActivePlayer;
    
    setPlayers(newPlayers);
    setSubstitutes(newSubstitutes);
    setSelectedPlayerId(updatedSubPlayer.id);
    setIsSubModalOpen(false);
    
    setToastMessage(`Substitution: ${activePlayer.name} ↔ ${subPlayer.name}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-[#E4E3E0] font-sans selection:bg-[#E4E3E0] selection:text-[#141414]">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[100] bg-[#E4E3E0] text-[#141414] px-6 py-3 rounded-sm shadow-2xl flex items-center gap-3"
          >
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-[#E4E3E0]/20 p-4 flex justify-between items-center bg-[#141414]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E4E3E0] text-[#141414] flex items-center justify-center font-bold text-xl rounded-sm">T</div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest">Tactix Pro (Sân 7)</h1>
            <p className="text-[10px] opacity-50 italic font-serif">7-a-side Tactical Engine v2.4</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-tighter opacity-50">Match Time</span>
              <span className="font-mono text-lg leading-none">{formatTime(matchTime)}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-sm border border-[#E4E3E0]/10">
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={cn(
                  "p-1 rounded transition-colors",
                  isTimerRunning ? "text-yellow-500 hover:bg-yellow-500/10" : "text-green-500 hover:bg-green-500/10"
                )}
                title={isTimerRunning ? "Stop Time" : "Start Time"}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button 
                onClick={() => {
                  setIsTimerRunning(false);
                  setMatchTime(0);
                }}
                className="p-1 text-[#E4E3E0]/50 hover:text-[#E4E3E0] hover:bg-[#E4E3E0]/10 rounded transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-[#E4E3E0]/20" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-tighter opacity-50">Score</span>
              <div className="flex items-center gap-2 font-mono text-lg leading-none">
                <span className="w-4 text-center">{scoreHome}</span>
                <span className="opacity-30">-</span>
                <span className="w-4 text-center">{scoreAway}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 bg-[#1A1A1A] p-0.5 rounded-sm border border-[#E4E3E0]/10">
                <button 
                  onClick={() => setScoreHome(prev => Math.max(0, prev - 1))}
                  className="p-0.5 text-[#E4E3E0]/30 hover:text-[#E4E3E0] hover:bg-[#E4E3E0]/10 rounded"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[8px] opacity-30 uppercase font-bold px-1 truncate max-w-[40px]">{teamHomeName}</span>
                <button 
                  onClick={() => setScoreHome(prev => prev + 1)}
                  className="p-0.5 text-[#E4E3E0]/30 hover:text-[#E4E3E0] hover:bg-[#E4E3E0]/10 rounded"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="flex items-center gap-1 bg-[#1A1A1A] p-0.5 rounded-sm border border-[#E4E3E0]/10">
                <button 
                  onClick={() => setScoreAway(prev => Math.max(0, prev - 1))}
                  className="p-0.5 text-[#E4E3E0]/30 hover:text-[#E4E3E0] hover:bg-[#E4E3E0]/10 rounded"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[8px] opacity-30 uppercase font-bold px-1 truncate max-w-[40px]">{teamAwayName}</span>
                <button 
                  onClick={() => setScoreAway(prev => prev + 1)}
                  className="p-0.5 text-[#E4E3E0]/30 hover:text-[#E4E3E0] hover:bg-[#E4E3E0]/10 rounded"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="p-2 hover:bg-[#E4E3E0]/10 transition-colors rounded-full"
            title="Sync Cloud"
          >
            <Zap className={cn("w-5 h-5", user ? "text-green-500" : "text-[#E4E3E0]")} />
          </button>
          
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 hover:bg-[#E4E3E0]/10 transition-colors rounded-full"
            title="Match History"
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-[#E4E3E0]/10 transition-colors rounded-full"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
        
        {/* Left Sidebar: Tactics & Team */}
        <AnimatePresence mode="wait">
          {!isPitchExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:col-span-3 space-y-4"
            >
              <section className="bg-[#1A1A1A] border border-[#E4E3E0]/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 opacity-50" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">Global Tactics</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase opacity-50 block mb-2">Formation (Sân 7)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['2-3-1', '3-2-1', '2-1-2-1', '3-1-2'] as Formation[]).map(f => (
                        <button 
                          key={f}
                          onClick={() => setFormation(f)}
                          className={cn(
                            "py-2 text-xs border transition-all",
                            formation === f 
                              ? "bg-[#E4E3E0] text-[#141414] border-[#E4E3E0]" 
                              : "border-[#E4E3E0]/20 hover:border-[#E4E3E0]/50"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase opacity-50 block mb-2">Mentality</label>
                    <div className="flex border border-[#E4E3E0]/20 rounded-sm overflow-hidden">
                      {(['Defensive', 'Balanced', 'Attacking'] as Mentality[]).map(m => (
                        <button 
                          key={m}
                          onClick={() => setMentality(m)}
                          className={cn(
                            "flex-1 py-2 text-[10px] uppercase tracking-tighter transition-all",
                            mentality === m 
                              ? "bg-[#E4E3E0] text-[#141414]" 
                              : "hover:bg-[#E4E3E0]/5"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-[#1A1A1A] border border-[#E4E3E0]/10 p-4 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 opacity-50" />
                    <h2 className="text-xs font-bold uppercase tracking-widest">Active Squad</h2>
                  </div>
                  <span className="text-[10px] opacity-50">{players.length}/7 Active</span>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {players.map(player => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 text-left transition-all group border-l-2",
                        selectedPlayerId === player.id 
                          ? "bg-[#E4E3E0]/10 border-[#E4E3E0]" 
                          : "border-transparent hover:bg-[#E4E3E0]/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] opacity-40 w-4">{player.number}</span>
                        <div>
                          <p className="text-xs font-medium">{player.name}</p>
                          <p className="text-[9px] opacity-50 uppercase tracking-tighter">{player.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            {player.errors && player.errors > 0 && (
                              <span className="text-[7px] bg-red-500/20 text-red-500 px-1 rounded font-bold">
                                {player.errors}E
                            </span>
                            )}
                            <span className={cn(
                              "text-[9px] font-mono font-bold",
                              (player.rating || 0) >= 8 ? "text-green-500" :
                              (player.rating || 0) >= 6 ? "text-yellow-500" :
                              "text-red-500"
                            )}>
                              {player.rating?.toFixed(1)}
                            </span>
                          </div>
                          <div className="w-12 h-1 bg-[#222] rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-green-500 transition-all" 
                              style={{ width: `${player.stats.stamina}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-3 h-3 transition-transform",
                          selectedPlayerId === player.id ? "rotate-90" : "opacity-0 group-hover:opacity-100"
                        )} />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E4E3E0]/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 opacity-50" />
                    <h2 className="text-xs font-bold uppercase tracking-widest">Substitutes</h2>
                  </div>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {substitutes.map(player => (
                      <div
                        key={player.id}
                        className="w-full flex items-center justify-between p-2 text-left transition-all border-l-2 border-transparent bg-[#141414]/50 rounded-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] opacity-20 w-4">{player.number}</span>
                          <div>
                            <p className="text-xs font-medium opacity-60">{player.name}</p>
                            <p className="text-[9px] opacity-30 uppercase tracking-tighter">{player.position}</p>
                          </div>
                        </div>
                        <span className="text-[8px] uppercase font-bold opacity-20 tracking-widest">SUB</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Pitch Visualization */}
        <div className={cn(
          "transition-all duration-500 ease-in-out",
          isPitchExpanded ? "lg:col-span-12 fixed inset-0 z-50 p-4 bg-[#141414] lg:relative lg:inset-auto lg:z-0 lg:p-0" : "lg:col-span-6"
        )}>
          <div id="pitch-container" 
            className={cn(
              "relative rounded-xl border-4 border-[#E4E3E0]/10 overflow-hidden shadow-2xl transition-all duration-500",
              isPitchExpanded ? "w-full h-full" : "aspect-[4/3]"
            )}
            style={{ backgroundColor: pitchColor }}
          >
            {/* Pitch Markings */}
            <div className="absolute inset-4 border-2 border-[#E4E3E0]/20 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#E4E3E0]/20 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-[#E4E3E0]/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-24 h-48 border-2 border-[#E4E3E0]/20 -translate-y-1/2" />
              <div className="absolute top-1/2 right-0 w-24 h-48 border-2 border-[#E4E3E0]/20 -translate-y-1/2" />
            </div>

            {/* Players on Pitch */}
            {players.map(player => (
              <motion.div
                key={player.id}
                layoutId={`player-${player.id}`}
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  const pitchElement = document.getElementById('pitch-container');
                  if (!pitchElement) return;
                  const rect = pitchElement.getBoundingClientRect();
                  const newX = ((info.point.x - rect.left) / rect.width) * 100;
                  const newY = ((info.point.y - rect.top) / rect.height) * 100;
                  
                  // Clamp values between 0 and 100
                  const clampedX = Math.max(0, Math.min(100, newX));
                  const clampedY = Math.max(0, Math.min(100, newY));
                  
                  setPlayers(prev => prev.map(p => 
                    p.id === player.id ? { ...p, x: clampedX, y: clampedY } : p
                  ));
                }}
                onClick={() => setSelectedPlayerId(player.id)}
                className={cn(
                  "absolute cursor-grab active:cursor-grabbing z-10",
                  selectedPlayerId === player.id ? "z-20" : "z-10"
                )}
                style={{ 
                  left: `${player.x}%`, 
                  top: `${player.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all shadow-lg",
                    selectedPlayerId === player.id 
                      ? "bg-[#E4E3E0] text-[#141414] border-[#E4E3E0] scale-125" 
                      : "bg-[#141414] text-[#E4E3E0] border-[#E4E3E0]/40 hover:border-[#E4E3E0]"
                  )}>
                    {player.number}
                  </div>
                  <span className={cn(
                    "mt-1 px-1.5 py-0.5 text-[8px] uppercase font-bold tracking-tighter rounded-sm whitespace-nowrap",
                    selectedPlayerId === player.id ? "bg-[#E4E3E0] text-[#141414]" : "bg-[#141414]/80 text-[#E4E3E0]"
                  )}>
                    {player.name}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Pitch Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button 
                onClick={() => setIsPitchExpanded(!isPitchExpanded)}
                className="p-2 bg-[#141414]/80 backdrop-blur-sm border border-[#E4E3E0]/20 rounded-lg hover:bg-[#E4E3E0]/10 transition-colors"
              >
                {isPitchExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button className="p-2 bg-[#141414]/80 backdrop-blur-sm border border-[#E4E3E0]/20 rounded-lg hover:bg-[#E4E3E0]/10 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="p-2 bg-[#141414]/80 backdrop-blur-sm border border-[#E4E3E0]/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Live Tracking Active</span>
                </div>
              </div>
              <div className={cn(
                "p-2 backdrop-blur-sm border rounded-lg transition-colors",
                mentality === 'Attacking' ? "bg-red-500/20 border-red-500/40" :
                mentality === 'Defensive' ? "bg-blue-500/20 border-blue-500/40" :
                "bg-[#141414]/80 border-[#E4E3E0]/20"
              )}>
                <div className="flex items-center gap-2">
                  <Zap className={cn(
                    "w-3 h-3",
                    mentality === 'Attacking' ? "text-red-500" :
                    mentality === 'Defensive' ? "text-blue-500" :
                    "text-[#E4E3E0]"
                  )} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    {mentality} Mode
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Player Details */}
        <AnimatePresence mode="wait">
          {!isPitchExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-3 space-y-4"
            >
              {selectedPlayer ? (
                <div className="space-y-4">
                  <section className="bg-[#1A1A1A] border border-[#E4E3E0]/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 opacity-50" />
                        <h2 className="text-xs font-bold uppercase tracking-widest">Performance</h2>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#E4E3E0]/10 rounded">#{selectedPlayer.number}</span>
                    </div>
                    
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#E4E3E0" strokeOpacity={0.1} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#E4E3E0', fontSize: 8, opacity: 0.5 }} />
                          <Radar
                            name={selectedPlayer.name}
                            dataKey="A"
                            stroke="#E4E3E0"
                            fill="#E4E3E0"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <input 
                            type="text" 
                            value={selectedPlayer.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setPlayers(prev => prev.map(p => 
                                p.id === selectedPlayerId ? { ...p, name: newName } : p
                              ));
                            }}
                            className="bg-transparent text-lg font-bold w-full border-b border-transparent hover:border-[#E4E3E0]/20 focus:border-[#E4E3E0]/50 outline-none transition-colors"
                          />
                          <p className="text-[10px] text-[#E4E3E0]/60 font-medium uppercase tracking-wider">{selectedPlayer.positionTitle}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <input 
                            type="number" 
                            value={selectedPlayer.number}
                            onChange={(e) => {
                              const newNumber = parseInt(e.target.value) || 0;
                              setPlayers(prev => prev.map(p => 
                                p.id === selectedPlayerId ? { ...p, number: newNumber } : p
                              ));
                            }}
                            className="bg-[#141414] text-[10px] w-8 text-center border border-[#E4E3E0]/10 rounded outline-none"
                          />
                          <input 
                            type="text" 
                            value={selectedPlayer.position}
                            onChange={(e) => {
                              const newPos = e.target.value.toUpperCase();
                              setPlayers(prev => prev.map(p => 
                                p.id === selectedPlayerId ? { ...p, position: newPos } : p
                              ));
                            }}
                            className="bg-transparent text-[10px] uppercase opacity-50 mt-1 w-12 text-right border-b border-transparent hover:border-[#E4E3E0]/20 focus:border-[#E4E3E0]/50 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E4E3E0]/10">
                        <div className="p-2 bg-[#141414] rounded border border-[#E4E3E0]/5">
                          <p className="text-[8px] uppercase font-bold tracking-widest opacity-40 mb-1">Số lỗi (Errors)</p>
                          <input 
                            type="number" 
                            value={selectedPlayer.errors || 0}
                            onChange={(e) => {
                              const newErrors = parseInt(e.target.value) || 0;
                              setPlayers(prev => prev.map(p => 
                                p.id === selectedPlayerId ? { ...p, errors: newErrors } : p
                              ));
                            }}
                            className="bg-transparent font-mono text-sm w-full outline-none"
                          />
                        </div>
                        <div className="p-2 bg-[#141414] rounded border border-[#E4E3E0]/5">
                          <p className="text-[8px] uppercase font-bold tracking-widest opacity-40 mb-1">Điểm (Rating)</p>
                          <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="10"
                            value={selectedPlayer.rating || 0}
                            onChange={(e) => {
                              const newRating = parseFloat(e.target.value) || 0;
                              setPlayers(prev => prev.map(p => 
                                p.id === selectedPlayerId ? { ...p, rating: newRating } : p
                              ));
                            }}
                            className="bg-transparent font-mono text-sm w-full outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-2 bg-[#141414] rounded border border-[#E4E3E0]/5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[8px] uppercase font-bold tracking-widest opacity-40">Sẵn sàng thay thế (Replacement Readiness)</p>
                          <span className={cn(
                            "text-[8px] font-bold px-1 rounded",
                            (selectedPlayer.rating || 0) < 6 || (selectedPlayer.errors || 0) > 2 
                              ? "bg-red-500/20 text-red-500" 
                              : "bg-green-500/20 text-green-500"
                          )}>
                            {(selectedPlayer.rating || 0) < 6 || (selectedPlayer.errors || 0) > 2 ? "CẦN THAY" : "ỔN ĐỊNH"}
                          </span>
                        </div>
                        <div className="h-1 bg-[#E4E3E0]/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, (10 - (selectedPlayer.errors || 0) * 2 + (selectedPlayer.rating || 0)) / 20 * 100))}%` }}
                            className={cn(
                              "h-full transition-colors",
                              (selectedPlayer.rating || 0) < 6 || (selectedPlayer.errors || 0) > 2 ? "bg-red-500" : "bg-green-500"
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-[#E4E3E0]/10">
                        <div>
                          <p className="text-[8px] uppercase font-bold tracking-widest opacity-40 mb-1">Nhiệm vụ chính</p>
                          <p className="text-[11px] leading-relaxed opacity-80">{selectedPlayer.role}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase font-bold tracking-widest opacity-40 mb-1">Phạm vi di chuyển</p>
                          <p className="text-[11px] leading-relaxed opacity-80 italic">{selectedPlayer.movement}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-2 bg-[#141414] rounded border border-[#E4E3E0]/5">
                          <p className="text-[8px] uppercase opacity-50 mb-1">Distance</p>
                          <p className="font-mono text-sm">9.4 km</p>
                        </div>
                        <div className="p-2 bg-[#141414] rounded border border-[#E4E3E0]/5">
                          <p className="text-[8px] uppercase opacity-50 mb-1">Top Speed</p>
                          <p className="font-mono text-sm">34.2 km/h</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-[#1A1A1A] border border-[#E4E3E0]/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 opacity-50" />
                      <h2 className="text-xs font-bold uppercase tracking-widest">Live Adjustments</h2>
                    </div>
                    <div className="space-y-4">
                      {(['stamina', 'morale', 'passing', 'attack'] as const).map(stat => (
                        <div key={stat}>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[10px] uppercase opacity-50">{stat}</label>
                            <span className="font-mono text-[10px]">{selectedPlayer.stats[stat]}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={selectedPlayer.stats[stat]}
                            onChange={(e) => handleStatChange(stat, parseInt(e.target.value))}
                            className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#E4E3E0]"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <button 
                        onClick={() => setIsSubModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-3 bg-yellow-500 text-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all rounded-sm"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Substitute
                      </button>
                      <button 
                        onClick={handleApply}
                        className="flex items-center justify-center gap-2 py-3 bg-[#E4E3E0] text-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all rounded-sm"
                      >
                        <Zap className="w-3 h-3" />
                        Apply
                      </button>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#E4E3E0]/20 rounded-lg opacity-40">
                  <Target className="w-12 h-12 mb-4" />
                  <p className="text-xs uppercase tracking-widest">Select a player to view live metrics</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-[#141414]/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1A1A1A] border border-[#E4E3E0]/20 p-6 rounded-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Match Settings</h2>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 hover:bg-[#E4E3E0]/10 rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Team Names</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] uppercase opacity-50">Home Team</p>
                      <input 
                        type="text" 
                        value={teamHomeName}
                        onChange={(e) => setTeamHomeName(e.target.value)}
                        className="w-full bg-[#141414] border border-[#E4E3E0]/10 p-2 text-xs rounded outline-none focus:border-[#E4E3E0]/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] uppercase opacity-50">Away Team</p>
                      <input 
                        type="text" 
                        value={teamAwayName}
                        onChange={(e) => setTeamAwayName(e.target.value)}
                        className="w-full bg-[#141414] border border-[#E4E3E0]/10 p-2 text-xs rounded outline-none focus:border-[#E4E3E0]/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Match Duration (Minutes)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="90" 
                      value={matchDuration}
                      onChange={(e) => setMatchDuration(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#E4E3E0]"
                    />
                    <span className="font-mono text-xs w-8">{matchDuration}m</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Pitch Theme</label>
                  <div className="flex gap-3">
                    {[
                      { name: 'Classic', color: '#1E3A1E' },
                      { name: 'Dark', color: '#0F1A0F' },
                      { name: 'Blue', color: '#1A263A' },
                      { name: 'Clay', color: '#3A261A' }
                    ].map(theme => (
                      <button 
                        key={theme.name}
                        onClick={() => setPitchColor(theme.color)}
                        className={cn(
                          "flex-1 p-2 border rounded transition-all text-center",
                          pitchColor === theme.color 
                            ? "border-[#E4E3E0] bg-[#E4E3E0] text-[#141414]" 
                            : "border-[#E4E3E0]/10 hover:border-[#E4E3E0]/30"
                        )}
                      >
                        <div 
                          className="w-full h-4 rounded-sm mb-1" 
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className="text-[8px] uppercase font-bold">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Cố vấn chiến thuật (Tactical Advisor)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {TACTICAL_SCENARIOS.map(scenario => {
                      const IconComponent = {
                        Shield: Shield,
                        Target: Target,
                        Zap: Zap,
                        Activity: Activity,
                        Trophy: Trophy,
                        Users: Users
                      }[scenario.icon] || Info;

                      return (
                        <button 
                          key={scenario.id}
                          onClick={() => applyTacticalScenario(scenario)}
                          className="flex items-center gap-3 p-3 bg-[#141414] border border-[#E4E3E0]/10 rounded hover:border-[#E4E3E0]/30 transition-all text-left group"
                        >
                          <div className="p-2 bg-[#E4E3E0]/5 rounded group-hover:bg-[#E4E3E0]/10 transition-colors">
                            <IconComponent className="w-4 h-4 opacity-70" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wide">{scenario.label}</p>
                            <p className="text-[8px] opacity-40 uppercase tracking-tighter mt-0.5">{scenario.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-mono opacity-50">{scenario.recommendedFormation}</p>
                            <p className="text-[8px] font-mono opacity-50">{scenario.recommendedMentality}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E4E3E0]/10 space-y-3">
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false);
                      handleEndMatch();
                    }}
                    className="w-full py-3 bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] uppercase font-bold tracking-widest hover:bg-green-500 hover:text-white transition-all rounded"
                  >
                    End Match & Save Stats
                  </button>
                  <button 
                    onClick={handleResetMatch}
                    className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] uppercase font-bold tracking-widest hover:bg-red-500 hover:text-white transition-all rounded"
                  >
                    Reset Match Data
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Substitution Modal */}
      <AnimatePresence>
        {isSubModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubModalOpen(false)}
              className="absolute inset-0 bg-[#141414]/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1A1A1A] border border-[#E4E3E0]/20 p-8 rounded-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-widest">Select Substitute</h2>
                  <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">Replacing {selectedPlayer?.name}</p>
                </div>
                <button onClick={() => setIsSubModalOpen(false)} className="p-2 hover:bg-[#E4E3E0]/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {substitutes.length > 0 ? substitutes.map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => handleSubstitution(sub.id)}
                    className="w-full flex items-center justify-between p-4 bg-[#141414] border border-[#E4E3E0]/10 rounded hover:border-[#E4E3E0]/40 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#E4E3E0]/5 flex items-center justify-center font-bold text-sm border border-[#E4E3E0]/10">
                        {sub.number}
                      </div>
                      <div className="text-left">
                        <p className="font-bold uppercase tracking-wide">{sub.name}</p>
                        <p className="text-[10px] opacity-50 uppercase">{sub.positionTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] opacity-50 uppercase">Rating</p>
                        <p className="font-mono font-bold text-green-500">{(sub.rating || 6.0).toFixed(1)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </button>
                )) : (
                  <div className="text-center py-12 opacity-30">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-xs uppercase tracking-widest">No substitutes available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-[#141414]/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#1A1A1A] border border-[#E4E3E0]/20 p-8 rounded-lg shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-[#E4E3E0] text-[#141414] flex items-center justify-center font-bold text-2xl rounded-sm mx-auto mb-4">T</div>
                <h2 className="text-lg font-bold uppercase tracking-widest">Cloud Sync</h2>
                <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">Access your tactics anywhere</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold opacity-40">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#141414] border border-[#E4E3E0]/10 p-3 text-sm rounded outline-none focus:border-[#E4E3E0]/30"
                    placeholder="coach@tactix.pro"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold opacity-40">Password</label>
                  <input 
                    type="password" 
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#141414] border border-[#E4E3E0]/10 p-3 text-sm rounded outline-none focus:border-[#E4E3E0]/30"
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-[#E4E3E0] text-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-white transition-all rounded-sm disabled:opacity-50"
                >
                  {authLoading ? 'Processing...' : authMode === 'login' ? 'Login' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-[10px] uppercase font-bold tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Match History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-[#141414]/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1A1A1A] border border-[#E4E3E0]/20 p-6 rounded-lg shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Match History</h2>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1 hover:bg-[#E4E3E0]/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {matchHistory.length === 0 ? (
                  <div className="py-20 text-center opacity-30">
                    <History className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-xs uppercase tracking-widest">No matches recorded yet</p>
                  </div>
                ) : (
                  matchHistory.map(match => (
                    <div key={match.id} className="bg-[#141414] border border-[#E4E3E0]/10 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[8px] uppercase font-bold opacity-40 mb-1">{match.date}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold">{match.home}</span>
                            <span className="text-lg font-mono bg-[#E4E3E0] text-[#141414] px-2 rounded-sm">{match.score}</span>
                            <span className="text-sm font-bold">{match.away}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase font-bold opacity-40 mb-1">Duration</p>
                          <p className="text-xs font-mono">{match.duration}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E4E3E0]/5">
                        <div>
                          <p className="text-[7px] uppercase opacity-40">Avg Rating</p>
                          <p className="text-[10px] font-bold text-green-500">{match.stats.avgRating}</p>
                        </div>
                        <div>
                          <p className="text-[7px] uppercase opacity-40">Total Errors</p>
                          <p className="text-[10px] font-bold text-red-500">{match.stats.totalErrors}</p>
                        </div>
                        <div>
                          <p className="text-[7px] uppercase opacity-40">Top Player</p>
                          <p className="text-[10px] font-bold truncate">{match.stats.topPlayer}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post-Match Stats Modal */}
      <AnimatePresence>
        {isPostMatchOpen && matchHistory[0] && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#141414]/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-lg bg-[#1A1A1A] border-2 border-[#E4E3E0]/20 p-8 rounded-xl shadow-2xl text-center"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#E4E3E0] rounded-full flex items-center justify-center shadow-2xl">
                <Trophy className="w-12 h-12 text-[#141414]" />
              </div>

              <div className="mt-8 space-y-8">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] opacity-50 mb-4">Final Result</h2>
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex-1 text-right">
                      <p className="text-xl font-bold uppercase tracking-tighter">{matchHistory[0].home}</p>
                    </div>
                    <div className="text-5xl font-mono font-black tracking-tighter bg-[#E4E3E0] text-[#141414] px-6 py-2 rounded-lg">
                      {matchHistory[0].score}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xl font-bold uppercase tracking-tighter">{matchHistory[0].away}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#141414] p-4 rounded-lg border border-[#E4E3E0]/5">
                    <Clock className="w-4 h-4 mx-auto mb-2 opacity-30" />
                    <p className="text-[8px] uppercase font-bold opacity-40 mb-1">Duration</p>
                    <p className="text-lg font-mono">{matchHistory[0].duration}</p>
                  </div>
                  <div className="bg-[#141414] p-4 rounded-lg border border-[#E4E3E0]/5">
                    <BarChart3 className="w-4 h-4 mx-auto mb-2 opacity-30" />
                    <p className="text-[8px] uppercase font-bold opacity-40 mb-1">Avg Rating</p>
                    <p className="text-lg font-mono text-green-500">{matchHistory[0].stats.avgRating}</p>
                  </div>
                  <div className="bg-[#141414] p-4 rounded-lg border border-[#E4E3E0]/5">
                    <Shield className="w-4 h-4 mx-auto mb-2 opacity-30" />
                    <p className="text-[8px] uppercase font-bold opacity-40 mb-1">Errors</p>
                    <p className="text-lg font-mono text-red-500">{matchHistory[0].stats.totalErrors}</p>
                  </div>
                </div>

                <div className="bg-[#E4E3E0]/5 p-6 rounded-lg border border-[#E4E3E0]/10">
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 mb-3">Man of the Match</p>
                  <p className="text-2xl font-serif italic text-[#E4E3E0]">{matchHistory[0].stats.topPlayer}</p>
                </div>

                <button 
                  onClick={() => setIsPostMatchOpen(false)}
                  className="w-full py-4 bg-[#E4E3E0] text-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-white transition-all rounded-lg shadow-xl"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Ticker */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#E4E3E0]/20 p-2 z-50 overflow-hidden">
        <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Info className="w-3 h-3 text-yellow-500" />
            <span className="text-[9px] uppercase font-bold tracking-tighter">Match Alert:</span>
            <span className="text-[9px] opacity-70 italic">Quang Hai is showing signs of fatigue. Consider substitution.</span>
          </div>
          <div className="w-[1px] h-3 bg-[#E4E3E0]/20" />
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-bold tracking-tighter">Possession:</span>
            <span className="text-[9px] opacity-70">LIV 58% - 42% MCI</span>
          </div>
          <div className="w-[1px] h-3 bg-[#E4E3E0]/20" />
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-bold tracking-tighter">Expected Goals (xG):</span>
            <span className="text-[9px] opacity-70">LIV 1.84 - 0.92 MCI</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(228, 227, 224, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(228, 227, 224, 0.2);
        }
      `}</style>
    </div>
  );
}
