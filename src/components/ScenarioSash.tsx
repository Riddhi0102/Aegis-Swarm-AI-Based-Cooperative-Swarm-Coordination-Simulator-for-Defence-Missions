import React from 'react';
import { ShieldCheck, Crosshair, HelpCircle, EyeOff, Radio, Play, Pause } from 'lucide-react';
import { Scenario } from '../types';
import { soundDeck } from '../utils/audio';

interface ScenarioSashProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  score: number;
}

export const ScenarioSash: React.FC<ScenarioSashProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  onRestart,
  score,
}) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Low': return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20';
      case 'Medium': return 'text-amber-400 bg-amber-950/40 border-amber-500/20';
      case 'High': return 'text-orange-400 bg-orange-950/40 border-orange-500/20';
      case 'EXTREME': return 'text-red-400 bg-red-950/40 border-red-500/30 animate-pulse';
      default: return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield-check': return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'crosshair': return <Crosshair className="w-5 h-5 text-amber-400 animate-spin-reverse" />;
      case 'eye-off': return <EyeOff className="w-5 h-5 text-orange-400" />;
      case 'radio': return <Radio className="w-5 h-5 text-red-400 animate-pulse" />;
      default: return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl">
      {/* Simulation Command Center */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Defense Exercises</h2>
          <p className="text-xs text-slate-500 font-mono">Simulate active incursions</p>
        </div>
        <button
          id="btn_restart_sim"
          onClick={() => {
            soundDeck.playClick();
            onRestart();
          }}
          className="px-2 py-1 text-[10px] font-bold font-mono border border-slate-700/65 text-slate-300 hover:text-white rounded hover:bg-slate-800 uppercase transition-all duration-150"
        >
          Reset Sim
        </button>
      </div>

      {/* Main Core Commands */}
      <div className="flex gap-3 mb-6">
        <button
          id="btn_play_pause"
          onClick={() => {
            soundDeck.playClick();
            onTogglePlay();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg font-bold font-mono text-sm uppercase transition-all border shadow ${
            isPlaying
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-400 hover:bg-amber-900/30'
              : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-amber-400/20" /> PAUSE SWARM
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-emerald-400/20" /> DEPLOY SYSTEM
            </>
          )}
        </button>
      </div>

      {/* Scenario List */}
      <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-3 font-mono">MISSIONS DATABASE</h3>
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;
          return (
            <div
              key={scenario.id}
              onClick={() => {
                if (!isSelected) {
                  soundDeck.playClick();
                  onSelectScenario(scenario.id);
                }
              }}
              className={`p-3.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded border ${isSelected ? 'bg-cyan-950/60 border-cyan-500/30' : 'bg-slate-900 border-slate-850'}`}>
                  {getIcon(scenario.icon)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold font-mono ${isSelected ? 'text-cyan-400' : 'text-slate-350'}`}>
                      {scenario.name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${getDifficultyColor(scenario.difficulty)}`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{scenario.subtitle}</div>
                  <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 md:line-clamp-none leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Briefing Deck */}
      <div className="mt-5 p-3.5 rounded-lg bg-teal-950/15 border border-teal-500/20">
        <h4 className="text-[10px] font-semibold text-teal-400 tracking-wider uppercase font-mono mb-1">
          TACTICAL THREAT REPORT
        </h4>
        <p className="text-[11px] text-teal-350 italic font-sans leading-relaxed">
         🛡️ {currentScenario.instructions}
        </p>
      </div>
    </div>
  );
};
