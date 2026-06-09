import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Shield, RefreshCw, Send, Target, ChevronRight, AlertOctagon } from 'lucide-react';
import { CombatLog } from '../types';
import { soundDeck } from '../utils/audio';

interface MissionIntelligenceProps {
  logs: CombatLog[];
  coreHp: number;
  maxCoreHp: number;
  shieldEnergy: number;
  maxShieldEnergy: number;
  score: number;
  activeDronesCount: number;
  interceptedCount: number;
  gameTimeSecs: number;
  scenarioDifficulty: string;
}

export const MissionIntelligence: React.FC<MissionIntelligenceProps> = ({
  logs,
  coreHp,
  maxCoreHp,
  shieldEnergy,
  maxShieldEnergy,
  score,
  activeDronesCount,
  interceptedCount,
  gameTimeSecs,
  scenarioDifficulty,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'advisor' | 'you'; text: string; time: string }>>([
    {
      sender: 'advisor',
      text: "Core defense systems initialized. Lead coordinates, deploy countermeasures, and tap of the sector canvas to direct high-energy CIWS laser sweeps on swarm vector groups.",
      time: "08:52",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle custom mock command responses from General Arthur Vance based on keywords
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    soundDeck.playClick();
    const userMsg = inputText;
    setInputText('');

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { sender: 'you', text: userMsg, time: timestamp }]);
    setIsTyping(true);

    setTimeout(() => {
      let responseText = "Understood, Command. Adjusting tactical filters on standard frequencies. Keep shields sustained and CIWS laser sweeps focused.";

      const lower = userMsg.toLowerCase();
      if (lower.includes('shield') || lower.includes('protect')) {
        responseText = "Shield integrity is indeed critical. Shields automatically absorb damage when active around the Core. Upgrade 'Reactive Shields' to amplify health absorption!";
      } else if (lower.includes('stealth') || lower.includes('invisible') || lower.includes('ghost')) {
        responseText = "Stealth drones are protected from baseline targeting. Maintain core sensor sweep radius to reveal their visual trails, then fire localized CIWS beams immediately.";
      } else if (lower.includes('heavy') || lower.includes('kamikaze') || lower.includes('boss')) {
        responseText = "Heavy Kamikazes carry high explosive heads targeting our primary Reactor Core. Upgrade 'CIWS Laser Focal Watts' and dispatch Interceptor Escorts to intercept them beforehand.";
      } else if (lower.includes('emp') || lower.includes('blast') || lower.includes('zap')) {
        responseText = "EMP systems create standard electrostatic rings. Trigger them when swarm density spikes to disable or incinerate light recon drones in a single sweep!";
      } else if (lower.includes('strategy') || lower.includes('help') || lower.includes('how')) {
        responseText = "Strategy checklist: 1. Hold-to-drag on the radar grid to fire CIWS. 2. Keep 150 Cores available for Interceptor fleet deployment. 3. Upgrade Reactor Shields early to sustain direct kamikaze impacts.";
      }

      setMessages((prev) => [
        ...prev,
        { sender: 'advisor', text: responseText, time: timestamp },
      ]);
      setIsTyping(false);
      soundDeck.playWarning(); // Trigger soft alarm for incoming msg
    }, 1200);
  };

  const getLogColorClass = (type: string) => {
    switch (type) {
      case 'danger': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'success': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 bg-slate-950/40 p-4 rounded-xl border border-slate-900 shadow-xl">
      {/* 1. Tactical Telemetry & Core Status */}
      <div className="flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-lg p-4">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3.5 font-mono flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-cyan-400 animate-pulse" /> Telemetry Stream
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
          <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded">
            <span className="text-[10px] text-slate-500 font-mono block">ACTIVE SWARM</span>
            <span className="text-lg font-bold font-mono text-red-400">{activeDronesCount} units</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded">
            <span className="text-[10px] text-slate-500 font-mono block">INTERCEPTED</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{interceptedCount} units</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded">
            <span className="text-[10px] text-slate-500 font-mono block">TACTICAL SCORE</span>
            <span className="text-lg font-bold font-mono text-cyan-450">{score} pts</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded">
            <span className="text-[10px] text-slate-500 font-mono block">RUN TIME</span>
            <span className="text-lg font-bold font-mono text-slate-300">
              {Math.floor(gameTimeSecs / 60)}:{(gameTimeSecs % 60).toString().padStart(2, '0')}s
            </span>
          </div>
        </div>

        {/* Hull & Shield Bars */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-rose-450 mb-1">
              <span>REACTOR HULL INTEGRITY</span>
              <span>{Math.round((coreHp / maxCoreHp) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded bg-slate-950 overflow-hidden border border-rose-950/60">
              <div
                className="h-full bg-gradient-to-r from-red-650 to-red-500 transition-all duration-300"
                style={{ width: `${(coreHp / maxCoreHp) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-cyan-400 mb-1">
              <span>AEGIS SHIELD DEPLETED</span>
              <span>{Math.round((shieldEnergy / maxShieldEnergy) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded bg-slate-950 overflow-hidden border border-cyan-950/60">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                style={{ width: `${(shieldEnergy / maxShieldEnergy) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. System Combat Logger */}
      <div className="flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-lg p-4 min-h-[180px]">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2.5 font-mono flex items-center gap-1.5 justify-between">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-400" /> Operational Feed
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-850 font-sans text-slate-500">
            SECURE LINK ACTIVE
          </span>
        </h3>

        <div className="flex-1 overflow-y-auto bg-slate-950/65 rounded border border-slate-850 p-2.5 font-mono text-[11px] leading-relaxed space-y-1.5 h-36 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No operational records logged yet. Stand by.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2 items-start break-all">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={getLogColorClass(log.type)}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. AI Commander Tactical Consultant */}
      <div className="flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-lg p-4">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2 font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-cyan-400" /> CMD Advisor
          </span>
          <span className="text-[9px] text-cyan-400 animate-pulse font-mono">
            VANCE.A [TACTICAL]
          </span>
        </h3>

        {/* Message Loop bubble */}
        <div className="flex-1 overflow-y-auto bg-slate-950/65 rounded border border-slate-850 p-2.5 space-y-3 h-28 custom-scrollbar mb-2" ref={scrollRef}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'you' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="text-[9px] font-mono font-bold text-slate-500">
                  {m.sender === 'you' ? 'COORDINATOR' : 'GEN. VANCE'}
                </span>
                <span className="text-[8px] font-mono text-slate-600">{m.time}</span>
              </div>
              <div className={`p-2 rounded max-w-[90%] text-xs font-sans ring-1 ${
                m.sender === 'you'
                  ? 'bg-slate-900 ring-slate-800 text-slate-300 rounded-tr-none'
                  : 'bg-cyan-950/15 ring-cyan-500/20 text-cyan-300 rounded-tl-none leading-relaxed'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="text-[10px] text-cyan-500 font-mono animate-pulse italic">
              Vance is calculating trajectories...
            </div>
          )}
        </div>

        {/* Submittor */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            id="chat_input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type query... (e.g. 'shields', 'stealth', 'strategy')"
            className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700/80 focus:border-cyan-500/80 outline-none text-xs rounded px-2.5 py-1.5 font-mono text-slate-300 focus:ring-1 focus:ring-cyan-500/40"
          />
          <button
            id="btn_send_chat"
            type="submit"
            className="p-1 px-3 bg-cyan-950/40 border border-cyan-500/40 hover:bg-cyan-900/50 hover:border-cyan-400 rounded text-cyan-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
