import React from 'react';
import { Shield, Zap, Flame, Cpu, Wrench, RefreshCw, Crosshair, HelpCircle } from 'lucide-react';
import { WeaponUpgrade } from '../types';
import { soundDeck } from '../utils/audio';

interface UpgradePanelProps {
  currency: number;
  upgrades: WeaponUpgrade[];
  onUpgrade: (id: string) => void;
  onDeployEMP: () => void;
  empCooldown: number;
  onRepairCore: () => void;
  coreHp: number;
  maxCoreHp: number;
  onDeployInterceptors: () => void;
  interceptorCooldown: number;
}

export const UpgradePanel: React.FC<UpgradePanelProps> = ({
  currency,
  upgrades,
  onUpgrade,
  onDeployEMP,
  empCooldown,
  onRepairCore,
  coreHp,
  maxCoreHp,
  onDeployInterceptors,
  interceptorCooldown,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield': return <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />;
      case 'zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'laser': return <Crosshair className="w-5 h-5 text-emerald-400" />;
      case 'interceptor': return <Cpu className="w-5 h-5 text-pink-400 animate-pulse" />;
      default: return <Wrench className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleActionClick = (action: () => void) => {
    soundDeck.playClick();
    action();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl">
      {/* Title & Credits */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Aegis Armory Panel</h2>
          <p className="text-xs text-slate-500 font-mono">Unlock and scale active weapon arrays</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 font-mono">AVAILABLE CORES</div>
          <div className="text-xl font-bold font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
            ⚡ {currency}
          </div>
        </div>
      </div>

      {/* Emergency Active Counter-Measures */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-3 font-mono">TACTICAL COMMANDS</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Repair Core Hull */}
          <button
            id="btn_repair_core"
            onClick={() => handleActionClick(onRepairCore)}
            disabled={coreHp >= maxCoreHp || currency < 250}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all duration-200 ${
              coreHp >= maxCoreHp
                ? 'bg-slate-950/20 border-slate-800 text-slate-600 cursor-not-allowed'
                : currency < 250
                ? 'bg-slate-900/30 border-slate-800 text-slate-500 hover:border-red-500/20'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40 hover:border-emerald-500/60 active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-xs font-medium uppercase font-mono">
              <Wrench className="w-4 h-4" /> REPAIR HULL
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Est: 250 Cores (+25% integrity)</span>
          </button>

          {/* Trigger High EMP */}
          <button
            id="btn_emp_trigger"
            onClick={() => handleActionClick(onDeployEMP)}
            disabled={empCooldown > 0}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all duration-200 ${
              empCooldown > 0
                ? 'bg-slate-950/30 border-slate-900 text-cyan-700 font-mono'
                : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/40 hover:border-cyan-400 active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-xs font-medium uppercase font-mono">
              <Zap className="w-4 h-4 animate-bounce" /> TRIGGER EMP
            </div>
            {empCooldown > 0 ? (
              <span className="text-[10px] text-slate-500 font-mono">COOLING: {(empCooldown / 60).toFixed(1)}s</span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Release electrostatic wave</span>
            )}
          </button>
        </div>

        {/* Tactical Fleet Deployment */}
        <div className="mt-3">
          <button
            id="btn_interceptor_fleet"
            onClick={() => handleActionClick(onDeployInterceptors)}
            disabled={interceptorCooldown > 0 || currency < 150}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              interceptorCooldown > 0
                ? 'bg-slate-950/30 border-slate-900 text-pink-700 cursor-not-allowed font-mono'
                : currency < 150
                ? 'bg-slate-900/30 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-pink-950/20 border-pink-500/30 text-pink-400 hover:bg-pink-900/40 hover:border-pink-500/60 active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Cpu className={`w-4 h-4 ${interceptorCooldown === 0 && currency >= 150 ? 'animate-spin' : ''}`} />
              <div className="text-left">
                <div className="text-xs font-medium uppercase font-mono">Deploy Interceptor Escorts</div>
                <div className="text-[10px] text-slate-400 font-mono">Scaffold 6 tracker anti-drones</div>
              </div>
            </div>
            {interceptorCooldown > 0 ? (
              <span className="text-xs text-slate-500 font-mono">REARMING: {(interceptorCooldown / 60).toFixed(0)}s</span>
            ) : (
              <span className="text-xs font-bold font-mono text-pink-400">⚡ 150</span>
            )}
          </button>
        </div>
      </div>

      {/* Armory Upgrades Scroll list */}
      <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-3 font-mono">SYSTEM AUGMENTATIONS</h3>
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {upgrades.map((upgrade) => {
          const isMaxed = upgrade.level >= upgrade.maxLevel;
          const canAfford = currency >= upgrade.cost;

          return (
            <div
              key={upgrade.id}
              className={`p-3.5 rounded-lg border transition-all duration-200 ${
                isMaxed
                  ? 'bg-slate-950/10 border-slate-900'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  {getIcon(upgrade.icon)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 font-mono">{upgrade.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      LVL {upgrade.level}/{upgrade.maxLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{upgrade.description}</p>

                  {/* Level Bars */}
                  <div className="flex gap-1 mt-2 mb-2.5">
                    {Array.from({ length: upgrade.maxLevel }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded-sm transition-all duration-150 ${
                          idx < upgrade.level ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Purchase Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400/80 font-mono">
                      Current: <span className="font-bold text-slate-200">{upgrade.value}</span>
                    </span>
                    {!isMaxed ? (
                      <button
                        id={`btn_upgrade_${upgrade.id}`}
                        onClick={() => handleActionClick(() => onUpgrade(upgrade.id))}
                        disabled={!canAfford}
                        className={`px-3 py-1 text-[10px] font-bold font-mono rounded border uppercase transition-all duration-150 ${
                          canAfford
                            ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-400 hover:bg-cyan-900/60 hover:scale-[1.03] active:scale-[0.97]'
                            : 'bg-slate-950 border-slate-900 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        ⚡ {upgrade.cost}
                      </button>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[9px] font-bold font-mono rounded bg-slate-900 border border-slate-800 text-slate-500 uppercase">
                        FULLY MAXED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
