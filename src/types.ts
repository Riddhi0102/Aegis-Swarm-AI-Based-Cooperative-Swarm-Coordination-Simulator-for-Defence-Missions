export type DroneType = 'scout' | 'striker' | 'heavy' | 'stealth';

export interface Position {
  x: number;
  y: number;
}

export interface Drone {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  hp: number;
  maxHp: number;
  type: DroneType;
  width: number;
  height: number;
  trail: Position[];
  targetTowerId: string | 'core';
  shootCooldown: number;
  points: number;
  shield?: number;
}

export interface Satellite {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number; // For rotation/animation
  range: number;
  hp: number;
  maxHp: number;
  active: boolean;
  empCooldown: number; // in game ticks or ms
  color: string;
  level: number;
  status: 'nominal' | 'damaged' | 'rebuilding';
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  originTowerId: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Interceptor {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetDroneId: string | null;
  speed: number;
  life: number; // ticks left
}

export interface CombatLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export interface WeaponUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  value: number;
  icon: string;
}

export interface Scenario {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  difficulty: 'Low' | 'Medium' | 'High' | 'EXTREME';
  threatLevel: number;
  droneTypes: DroneType[];
  spawnInterval: number;
  maxDones: number;
  instructions: string;
  icon: string;
}
