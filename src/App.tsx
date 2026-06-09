import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  ChevronRight, 
  Terminal, 
  Shield, 
  Target, 
  Cpu, 
  Zap, 
  Send, 
  Radio, 
  Compass, 
  AlertTriangle,
  Volume2,
  VolumeX,
  Sparkles,
  Link2
} from 'lucide-react';
import { soundDeck } from './utils/audio';

// Constants
const DNC_LIMIT = 24; // 24 operational drones as in screenshots
const CELL_DIVS = 18;  // Density divisor for coverage calculation

type MissionMode = 'AREA_COVERAGE' | 'TARGET_SEARCH' | 'PERIMETER_DEFENSE' | 'RECONNAISSANCE';

interface Drone {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  type: 'scout' | 'striker' | 'heavy' | 'stealth';
  energy: number; // 0 to 100
  sensorRadius: number;
  trail: { x: number; y: number }[];
  color: string;
}

interface ThreatSector {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
}

interface SearchTarget {
  id: number;
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export default function App() {
  // Simulator state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [missionMode, setMissionMode] = useState<MissionMode>('AREA_COVERAGE');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Live Telemetry states
  const [coverageRate, setCoverageRate] = useState<number>(3.8);
  const [operationalCount, setOperationalCount] = useState<number>(24);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [threatCount, setThreatCount] = useState<number>(3);
  const [tacticalScore, setTacticalScore] = useState<number>(0);

  // Command Uplink States
  const [isUplinkConnected, setIsUplinkConnected] = useState<boolean>(false);
  const [isUplinkConnecting, setIsUplinkConnecting] = useState<boolean>(false);
  const [uplinkStep, setUplinkStep] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'vance' | 'user'; text: string; time: string }>>([
    {
      sender: 'vance',
      text: 'General Arthur Vance on secure network channel. Swarm feedback indicators synchronized. Command terminal preloaded to query theater tactics under stress.',
      time: '08:52'
    }
  ]);
  const [isAIGenerating, setIsAIGenerating] = useState<boolean>(false);

  // Refs for simulation loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dronesRef = useRef<Drone[]>([]);
  const threatsRef = useRef<ThreatSector[]>([]);
  const targetsRef = useRef<SearchTarget[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Spawn explosion helper
  const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1.5,
        life: 0,
        maxLife: Math.random() * 30 + 20
      });
    }
  };

  // Re-initialize Simulation
  const restartSimulation = () => {
    soundDeck.playClick();
    
    // Initialise 24 drones with random vectors
    const size = 24;
    const initialDrones: Drone[] = [];
    const colors = ['#0ef', '#c084fc', '#4ade80', '#fbbf24'];
    
    for (let i = 0; i < size; i++) {
      initialDrones.push({
        id: i + 1,
        x: 100 + Math.random() * 500,
        y: 100 + Math.random() * 300,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        angle: Math.random() * Math.PI * 2,
        type: i % 4 === 0 ? 'stealth' : i % 4 === 1 ? 'scout' : i % 4 === 2 ? 'heavy' : 'striker',
        energy: 100,
        sensorRadius: i % 4 === 1 ? 75 : 55, // scout has greater sensor area
        trail: [],
        color: colors[i % colors.length]
      });
    }
    dronesRef.current = initialDrones;

    // Reset threat sectors (3 drifting hazard zones)
    threatsRef.current = [
      { id: 1, x: 200, y: 150, radius: 90, vx: 0.3, vy: -0.2 },
      { id: 2, x: 550, y: 350, radius: 100, vx: -0.2, vy: 0.3 },
      { id: 3, x: 300, y: 400, radius: 80, vx: 0.1, vy: -0.1 }
    ];

    // Reset targetsfor search mode
    targetsRef.current = [
      { id: 1, x: 150 + Math.random() * 500, y: 100 + Math.random() * 300, radius: 8, pulsePhase: 0 },
      { id: 2, x: 150 + Math.random() * 500, y: 100 + Math.random() * 300, radius: 8, pulsePhase: Math.PI / 3 },
      { id: 3, x: 150 + Math.random() * 500, y: 100 + Math.random() * 300, radius: 8, pulsePhase: Math.PI * (2/3) }
    ];

    particlesRef.current = [];
    setElapsedTime(0);
    setTacticalScore(0);
    setOperationalCount(24);
  };

  // Run on mount
  useEffect(() => {
    restartSimulation();
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Timer loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle Mute
  const toggleMute = () => {
    const nextMuted = soundDeck.toggleMute();
    setIsMuted(nextMuted);
  };

  // Connection Uplink Simulation Sequence
  const handleConnectUplink = () => {
    if (isUplinkConnected || isUplinkConnecting) return;
    
    soundDeck.playClick();
    setIsUplinkConnecting(true);
    
    const steps = [
      'BOOTING QUANTUM COMM ENCRYPTION...',
      'INTERCEPTING PEER FREQ CHANNELS...',
      'SYNCHRONIZING SECURE TACTICAL RELAYS...',
      '⚡ AEGIS UPLINK ONLINE [VANCE.A.TACTICAL]'
    ];
    
    let currentIdx = 0;
    setUplinkStep(steps[0]);
    soundDeck.playWarning();

    const timer = setInterval(() => {
      currentIdx++;
      if (currentIdx < steps.length) {
        setUplinkStep(steps[currentIdx]);
        soundDeck.playClick();
      } else {
        clearInterval(timer);
        setIsUplinkConnected(true);
        setIsUplinkConnecting(false);
        setUplinkStep('');
        soundDeck.playVictory();
      }
    }, 600);
  };

  // Send Prompt to secure backend API proxy
  const handleSendCommand = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const messageToSend = customPrompt || chatInput;
    if (!messageToSend.trim() || isAIGenerating) return;

    soundDeck.playClick();
    
    // Add User bubble
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text: messageToSend, time: timeStr }]);
    if (!customPrompt) setChatInput('');
    setIsAIGenerating(true);

    try {
      // Structure state context for AI reasoning
      const systemInstruction = `You are General Arthur Vance, a legendary Tactical Command Advisor of the command ship Aegis. You are advising the Coordinator on managing a decentralized swarm of 24 software agents in a tactical simulator. General Vance is extremely professional, crisp, utilizes high-tech military and defense-oriented words, lists quick tactical bullet points, and provides clear commands. Ensure response is brief (under 130 words) and directly mentions current telemetry if helpful: Mode is ${missionMode}, Coverage rate is ${coverageRate.toFixed(1)}%, Alive count is ${operationalCount} / 24, and Time deployed is ${elapsedTime}s.`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: messageToSend,
          systemInstruction
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setChatMessages(prev => [...prev, { sender: 'vance', text: data.text, time: timeStr }]);
        soundDeck.playWarning();
      } else {
        setChatMessages(prev => [...prev, { 
          sender: 'vance', 
          text: `[UPLINK EXCEPTION]: ${data.error || 'Server connection timed out. Restart security protocols.'}`, 
          time: timeStr 
        }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { 
        sender: 'vance', 
        text: `[COMMS CORRUPTION]: Failed to handshake server relay. Ensure secrets configured.`, 
        time: timeStr 
      }]);
    } finally {
      setIsAIGenerating(false);
    }
  };

  // Core Simulation Math and Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize dynamically based on container bounding box
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width || 800;
        canvas.height = height || 550;
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const updateAndRender = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Clean Canvas with Deep Slate Cyber tone
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid Overlay
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Outpost Center (For Perimeter Defense mode)
      const centerX = w / 2;
      const centerY = h / 2;
      const defensePerimeterRadius = Math.min(w, h) * 0.23;

      if (missionMode === 'PERIMETER_DEFENSE') {
        const pulseRatio = (Math.sin(Date.now() / 200) + 1) / 2;
        
        // Outpost outer shield range
        ctx.beginPath();
        ctx.arc(centerX, centerY, defensePerimeterRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.08 + pulseRatio * 0.05})`;
        ctx.fillStyle = `rgba(16, 185, 129, ${0.01 + pulseRatio * 0.01})`;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Core Outpost itself
        ctx.beginPath();
        ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#032f20';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // High Intensity Core Node
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      }

      // 1. UPDATE AND DRAW THREATS SATELLITES/SECTORS
      const activeThreatsList = threatsRef.current;
      ctx.shadowBlur = 0;
      
      activeThreatsList.forEach(threat => {
        if (isPlaying) {
          // Drifting motion
          threat.x += threat.vx;
          threat.y += threat.vy;

          // bounce threats on canvas boundaries
          if (threat.x - threat.radius < 0 || threat.x + threat.radius > w) threat.vx *= -1;
          if (threat.y - threat.radius < 0 || threat.y + threat.radius > h) threat.vy *= -1;
        }

        // Pulse effect
        const pulse = Math.sin(Date.now() / 450 + threat.id) * 6;
        const currentRad = threat.radius + pulse;

        // Large Hazard Zone Fill
        const gradient = ctx.createRadialGradient(threat.x, threat.y, 5, threat.x, threat.y, currentRad);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.18)');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.07)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(threat.x, threat.y, currentRad, 0, Math.PI * 2);
        ctx.fill();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(threat.x, threat.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Thin dashed perimeter
        ctx.beginPath();
        ctx.arc(threat.x, threat.y, currentRad, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. UPDATE AND DRAW TARGET SECTOR IN SEARCH MODE
      if (missionMode === 'TARGET_SEARCH') {
        const activeTargets = targetsRef.current;
        activeTargets.forEach((target) => {
          target.pulsePhase += 0.04;
          const pRadius = target.radius + Math.sin(target.pulsePhase) * 3;

          // Glow range
          ctx.beginPath();
          ctx.arc(target.x, target.y, pRadius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
          ctx.fill();

          // Target center crosshair
          ctx.beginPath();
          ctx.arc(target.x, target.y, pRadius, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Reticle lines
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          ctx.moveTo(target.x - 12, target.y);
          ctx.lineTo(target.x + 12, target.y);
          ctx.moveTo(target.x, target.y - 12);
          ctx.lineTo(target.x, target.y + 12);
          ctx.stroke();
        });
      }

      // 3. PHYSICAL AGENT MOVEMENT CALCULATIONS (DECENTRALIZED SWARM SYSTEM)
      const currentDrones = dronesRef.current;
      const aliveDrones = currentDrones.filter(d => d.energy > 0);
      
      // Sync stats count
      if (aliveDrones.length !== operationalCount) {
        setOperationalCount(aliveDrones.length);
      }

      // Coverage rate math: map divided into partitioning grids
      let coveredBoxes = 0;
      const cellW = w / CELL_DIVS;
      const cellH = h / CELL_DIVS;

      // We only compute coverage grid on interval to protect performance
      if (Date.now() % 3 === 0) {
        let activeCovered = 0;
        for (let i = 0; i < CELL_DIVS; i++) {
          for (let j = 0; j < CELL_DIVS; j++) {
            const blockX = i * cellW + cellW/2;
            const blockY = j * cellH + cellH/2;
            
            // Check if any drone sensor overlaps
            const isCovered = aliveDrones.some(drone => {
              const dx = drone.x - blockX;
              const dy = drone.y - blockY;
              return Math.sqrt(dx*dx + dy*dy) < drone.sensorRadius;
            });

            if (isCovered) activeCovered++;
          }
        }
        const calcPercent = (activeCovered / (CELL_DIVS * CELL_DIVS)) * 100;
        setCoverageRate(Math.max(1.2, calcPercent));
      }

      // Apply Local flocking vector calculus on each active drone
      if (isPlaying) {
        aliveDrones.forEach((drone, idx) => {
          // Boids Forces
          let alignX = 0, alignY = 0;
          let cohesionX = 0, cohesionY = 0;
          let separationX = 0, separationY = 0;
          let localCount = 0;

          // Local awareness threshold: only see neighbors within 90 pixels!
          const visionRadius = 90;
          const separationLimit = 28;

          aliveDrones.forEach(other => {
            if (other.id === drone.id) return;
            const dx = other.x - drone.x;
            const dy = other.y - drone.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < visionRadius) {
              // 1. Alignment
              alignX += other.vx;
              alignY += other.vy;
              
              // 2. Cohesion
              cohesionX += other.x;
              cohesionY += other.y;
              
              // 3. Separation
              if (dist < separationLimit) {
                separationX -= (other.x - drone.x);
                separationY -= (other.y - drone.y);
              }
              localCount++;
            }
          });

          // Compute final physical boids thrust vectors
          let boidVx = 0;
          let boidVy = 0;

          if (localCount > 0) {
            alignX /= localCount;
            alignY /= localCount;
            cohesionX = (cohesionX / localCount) - drone.x;
            cohesionY = (cohesionY / localCount) - drone.y;

            // Normalize weights
            boidVx += alignX * 0.15 + cohesionX * 0.005 + separationX * 0.12;
            boidVy += alignY * 0.15 + cohesionY * 0.005 + separationY * 0.12;
          }

          // 4. MISSION MODE SPECIFIC STRUCUTURAL STEERING (EMERGENT PHENOMENA)
          let modeVx = 0;
          let modeVy = 0;

          switch (missionMode) {
            case 'AREA_COVERAGE': {
              // Forces drones to push away from EVERYONE further to spread evenly
              let spreadForceX = 0;
              let spreadForceY = 0;
              
              aliveDrones.forEach(other => {
                if (other.id === drone.id) return;
                const dx = other.x - drone.x;
                const dy = other.y - drone.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Strong longer-range repulsion (local coordination)
                if (dist < 180) {
                  const factor = (180 - dist) / 180;
                  spreadForceX -= dx * factor * 0.08;
                  spreadForceY -= dy * factor * 0.08;
                }
              });

              // Gentle center-seeking to prevent escaping map too much
              const centerPullX = (w / 2) - drone.x;
              const centerPullY = (h / 2) - drone.y;

              modeVx = spreadForceX + centerPullX * 0.0008;
              modeVy = spreadForceY + centerPullY * 0.0008;
              break;
            }

            case 'TARGET_SEARCH': {
              // Steer toward closest target sector if detected in sensor footprint
              let closestTarget: SearchTarget | null = null;
              let minDist = 99999;

              targetsRef.current.forEach(t => {
                const dx = t.x - drone.x;
                const dy = t.y - drone.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < minDist) {
                  minDist = dist;
                  closestTarget = t;
                }
              });

              if (closestTarget && minDist < drone.sensorRadius * 2.2) {
                // Drone detects and steers directly toward coordinates!
                const pullX = (closestTarget as SearchTarget).x - drone.x;
                const pullY = (closestTarget as SearchTarget).y - drone.y;
                const len = Math.sqrt(pullX*pullX + pullY*pullY);
                if (len > 0) {
                  modeVx = (pullX / len) * 1.5;
                  modeVy = (pullY / len) * 1.5;
                }
              } else {
                // Random drift wandering to search quadrants
                modeVx = (Math.sin(Date.now() / 1000 + drone.id) * 0.5);
                modeVy = (Math.cos(Date.now() / 1000 + drone.id) * 0.5);
              }
              break;
            }

            case 'PERIMETER_DEFENSE': {
              // Assemble elliptical defensive perimeter ring
              // Each drone coordinates an angle based on index or current position
              const droneAngle = (idx / DNC_LIMIT) * Math.PI * 2 + (Date.now() / 25000); // Orbit factor
              const targetOrbitX = centerX + Math.cos(droneAngle) * defensePerimeterRadius;
              const targetOrbitY = centerY + Math.sin(droneAngle) * defensePerimeterRadius;

              // Pull toward assigned perimeter locked target
              const orbitPullX = targetOrbitX - drone.x;
              const orbitPullY = targetOrbitY - drone.y;

              modeVx = orbitPullX * 0.055;
              modeVy = orbitPullY * 0.055;
              break;
            }

            case 'RECONNAISSANCE': {
              // Individual figure-8 infinity patrols
              const recIndex = idx % 3;
              const patrolPhase = (Date.now() / 4500) + (idx * (Math.PI / 8));
              
              let pathNodeX = centerX;
              let pathNodeY = centerY;

              if (recIndex === 0) {
                // Large oval path
                pathNodeX = w/2 + Math.cos(patrolPhase) * (w * 0.35);
                pathNodeY = h/2 + Math.sin(patrolPhase) * (h * 0.25);
              } else if (recIndex === 1) {
                // Figure-8 pattern horizontal
                pathNodeX = w/2 + Math.sin(patrolPhase * 2) * (w * 0.28);
                pathNodeY = h/2 + Math.cos(patrolPhase) * (h * 0.2);
              } else {
                // Vertical loop patrol
                pathNodeX = w/2 + Math.cos(patrolPhase) * (w * 0.15);
                pathNodeY = h/2 + Math.sin(patrolPhase * 2) * (h * 0.3);
              }

              const pathPullX = pathNodeX - drone.x;
              const pathPullY = pathNodeY - drone.y;

              // Steer toward moving patrol coordinates
              const len = Math.sqrt(pathPullX*pathPullX + pathPullY*pathPullY);
              if (len > 0) {
                modeVx = (pathPullX / len) * 1.8;
                modeVy = (pathPullY / len) * 1.8;
              }
              break;
            }
          }

          // 5. THREAT/HAZARD STEERING AVOIDANCE (DECENTRALIZED SURVIVAL)
          let avoidThreatVx = 0;
          let avoidThreatVy = 0;

          activeThreatsList.forEach(threat => {
            const tx = threat.x - drone.x;
            const ty = threat.y - drone.y;
            const dist = Math.sqrt(tx*tx + ty*ty);

            // If hazard overlaps drone's custom sensor, adjust heading to bypass
            if (dist < (threat.radius + drone.sensorRadius + 30)) {
              const dangerFactor = (threat.radius + drone.sensorRadius + 30 - dist);
              avoidThreatVx -= (tx / dist) * dangerFactor * 0.085;
              avoidThreatVy -= (ty / dist) * dangerFactor * 0.085;
              
              // Apply real-time energy drainage inside the actual hazard
              if (dist < threat.radius) {
                drone.energy -= 0.18; // Slow attrition decay
                if (drone.energy < 0) drone.energy = 0;
              }
            }
          });

          // Standard Wall Avoidance vector
          let borderForceX = 0, borderForceY = 0;
          const mapMargin = 30;
          if (drone.x < mapMargin) borderForceX = (mapMargin - drone.x) * 0.2;
          if (drone.x > w - mapMargin) borderForceX = (w - mapMargin - drone.x) * 0.2;
          if (drone.y < mapMargin) borderForceY = (mapMargin - drone.y) * 0.2;
          if (drone.y > h - mapMargin) borderForceY = (h - mapMargin - drone.y) * 0.2;

          // Merge all computed operational forces
          drone.vx += boidVx + modeVx * 1.2 + avoidThreatVx + borderForceX;
          drone.vy += boidVy + modeVy * 1.2 + avoidThreatVy + borderForceY;

          // Velocity Limiter (Prevents physics runaways)
          const currSpeed = Math.sqrt(drone.vx*drone.vx + drone.vy*drone.vy);
          const speedCap = drone.type === 'scout' ? 3.4 : drone.type === 'heavy' ? 1.8 : 2.5;
          if (currSpeed > speedCap) {
            drone.vx = (drone.vx / currSpeed) * speedCap;
            drone.vy = (drone.vy / currSpeed) * speedCap;
          }

          // Translate Position
          drone.x += drone.vx;
          drone.y += drone.vy;

          // Set rotation angle
          drone.angle = Math.atan2(drone.vy, drone.vx);

          // Update trail history
          drone.trail.push({ x: drone.x, y: drone.y });
          if (drone.trail.length > 7) drone.trail.shift();

          // 6. TARGET COLLISION LOGIC (TARGET SEARCH MODE)
          if (missionMode === 'TARGET_SEARCH') {
            targetsRef.current.forEach((target, j) => {
              const tx = target.x - drone.x;
              const ty = target.y - drone.y;
              const dist = Math.sqrt(tx*tx + ty*ty);
              if (dist < 16) {
                // Target acquired
                createExplosion(target.x, target.y, '#fbbf24', 20);
                soundDeck.playExplosion('small');
                
                // Re-spawn target somewhere else
                targetsRef.current[j] = {
                  id: target.id,
                  x: 100 + Math.random() * (w - 200),
                  y: 100 + Math.random() * (h - 200),
                  radius: 8,
                  pulsePhase: Math.random() * Math.PI
                };

                // Reward drone energy and add score!
                drone.energy = Math.min(100, drone.energy + 20);
                setTacticalScore(prev => prev + 10);
              }
            });
          }

          // Check if drone died this frame
          if (drone.energy <= 0) {
            createExplosion(drone.x, drone.y, drone.color, 25);
            soundDeck.playExplosion('large');
          }
        });
      }

      // 4. DRAW PEER-TO-PEER P2P COMMUNICATION MESH NETWORK (EMERGENT LINK GRAPH)
      ctx.lineWidth = 0.8;
      for (let i = 0; i < aliveDrones.length; i++) {
        for (let j = i + 1; j < aliveDrones.length; j++) {
          const d1 = aliveDrones[i];
          const d2 = aliveDrones[j];
          const dx = d1.x - d2.x;
          const dy = d1.y - d2.y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          // Connect nodes if within local cross-link range (110 pixels)
          if (dist < 110) {
            const opacity = (110 - dist) / 110 * 0.16;
            ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(d1.x, d1.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.stroke();
          }
        }
      }

      // 5. RENDER ACTIVE AGENTS & SENSORS
      aliveDrones.forEach(drone => {
        // Draw sensor radius pulse
        const pulse = (Math.sin(Date.now() / 250 + drone.id) + 1) / 2;
        const sRad = drone.sensorRadius + pulse * 4;

        ctx.beginPath();
        ctx.arc(drone.x, drone.y, sRad, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.035 + (pulse * 0.015)})`;
        ctx.stroke();

        // Draw Trail (glowing path)
        ctx.beginPath();
        drone.trail.forEach((t, index) => {
          const alpha = index / drone.trail.length * 0.28;
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = 1.5;
        });
        ctx.stroke();

        // Draw drone triangle agent heading
        ctx.save();
        ctx.translate(drone.x, drone.y);
        ctx.rotate(drone.angle);

        // Fill based on drone health
        const energyFract = drone.energy / 100;
        
        ctx.beginPath();
        // Dynamic styling: triangle pointing right (matches vector heading)
        ctx.moveTo(8, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        
        ctx.fillStyle = drone.color;
        ctx.fill();

        // High heat neon core
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(-3, -3);
        ctx.lineTo(-1, 0);
        ctx.lineTo(-3, 3);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.restore();
      });

      // 6. RENDER PARTICLE EFFECTS (EXP_CRASH_ANIMS)
      const particles = particlesRef.current;
      particles.forEach((p, idx) => {
        if (isPlaying) {
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
        }

        const alpha = 1 - (p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
      // Clear dead particles
      particlesRef.current = particles.filter(p => p.life < p.maxLife);

      // 7. CRITICAL ATTRITION WARNING RENDER
      if (aliveDrones.length === 0) {
        // Red distressed text overlay
        ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
        ctx.fillRect(0, 0, w, h);

        const flicker = Date.now() % 500 > 150;
        if (flicker) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.72)';
          ctx.font = 'bold 36px font-mono, Courier, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.letterSpacing = '8px';
          ctx.fillText('CRITICAL ATTRITION', w / 2, h / 2);
          
          ctx.font = '13px font-mono, Courier, monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText('0/24 SWARM UNITS FUNCTIONAL • COLLAPSE DECAY SECURED', w / 2, h / 2 + 50);
        }
      }

      // Next Loop
      animationFrameId.current = requestAnimationFrame(updateAndRender);
    };

    updateAndRender();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      resizeObserver.disconnect();
    };
  }, [isPlaying, missionMode, operationalCount]);

  // Handle Mode Change
  const selectMode = (mode: MissionMode) => {
    soundDeck.playClick();
    setMissionMode(mode);
    // Adjust threat count corresponding to mode difficulty for visuals
    if (mode === 'AREA_COVERAGE') setThreatCount(3);
    else if (mode === 'TARGET_SEARCH') setThreatCount(2);
    else if (mode === 'PERIMETER_DEFENSE') setThreatCount(4);
    else if (mode === 'RECONNAISSANCE') setThreatCount(3);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-[#070b13] text-gray-200 select-none overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR: Width ~320px, highly detailed, high-contrast digital command system */}
      <div className="w-full md:w-[335px] shrink-0 border-r border-[#1e293b] bg-[#0c1220] flex flex-col justify-between overflow-y-auto custom-scrollbar p-5 pb-4 z-15">
        
        {/* Header section with high-tech badge */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded border border-[#06b6d4]/45 bg-[#0e1726] shadow-[0_0_12px_rgba(6,182,212,0.15)] select-none">
              <Shield className="w-6 h-6 text-[#06b6d4] animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase leading-none font-mono">
                AEGIS-SWARM
              </h1>
              <p className="text-[10px] text-[#06b6d4] tracking-widest font-mono uppercase mt-1">
                ADVANCED AI SIMULATOR
              </p>
            </div>
          </div>

          {/* SYSTEM CONTROLS layout in image */}
          <div className="bg-[#0f172a] rounded-lg border border-slate-800/80 p-3.5 mb-5 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                ⚙️ SYSTEM CONTROLS
              </span>
              <div className="flex gap-2">
                {/* Audio Toggle */}
                <button 
                  onClick={toggleMute}
                  className="p-1 px-1.5 rounded border border-[#1e293b] bg-[#0c1220] hover:bg-slate-800/70 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Toggle synthesiser sounds"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#06b6d4]" />}
                </button>
              </div>
            </div>

            {/* Square Buttons array exactly as shown in screenshot */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => {
                  soundDeck.playClick();
                  setIsPlaying(!isPlaying);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border rounded text-xs font-mono font-bold uppercase transition ${
                  isPlaying 
                    ? 'bg-[#06b6d4]/10 border-[#06b6d4]/40 text-[#06b6d4] hover:bg-[#06b6d4]/20' 
                    : 'bg-amber-950/20 border-amber-500/40 text-amber-500 hover:bg-amber-900/30'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-[#06b6d4]/40 text-[#06b6d4]" />
                    PAUS SYSTEM
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-amber-500/40 text-amber-500" />
                    RUN SYSTEM
                  </>
                )}
              </button>

              <button
                onClick={restartSimulation}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded text-xs font-mono font-bold uppercase transition cursor-pointer"
                title="Restart simulation metrics"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                REST
              </button>
            </div>

            {/* Drodown Selector in screenshots */}
            <div>
              <select
                value={missionMode}
                onChange={(e) => selectMode(e.target.value as MissionMode)}
                className="w-full bg-[#080d1a] border border-[#1e293b] text-xs px-2.5 py-2 rounded text-[#06b6d4] font-semibold tracking-wider font-mono outline-none cursor-pointer focus:border-[#06b6d4]"
              >
                <option value="AREA_COVERAGE" className="bg-[#0b0f19]">🛰️ AREA COVERAGE</option>
                <option value="TARGET_SEARCH" className="bg-[#0b0f19]">🎯 TARGET SEARCH</option>
                <option value="PERIMETER_DEFENSE" className="bg-[#0b0f19]">🛡️ PERIMETER DEFENSE</option>
                <option value="RECONNAISSANCE" className="bg-[#0b0f19]">🔍 RECONNAISSANCE</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-400/85 italic leading-relaxed mt-3">
              {missionMode === 'AREA_COVERAGE' && 'Maximize collective sensor footprint across the operational theater.'}
              {missionMode === 'TARGET_SEARCH' && 'Coordinated search for high-value targets in a dynamic field.'}
              {missionMode === 'PERIMETER_DEFENSE' && 'Establish and protect a decentralized defensive boundary around the outpost.'}
              {missionMode === 'RECONNAISSANCE' && 'Continuous patrols monitoring and adjusting to moving hazard threats.'}
            </p>
          </div>

          {/* LIVE TELEMETRY from screenshots - Grid with neon indicators */}
          <div className="bg-[#040810]/40 rounded-lg border border-[#1e293b]/70 p-4 mb-5">
            <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-3">
              ⚡ LIVE TELEMETRY
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Coverage block */}
              <div className="bg-[#0d1628] rounded border border-slate-800/80 p-3 flex flex-col justify-between h-[68px]">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  COVERAGE
                </span>
                <span className="text-lg font-mono font-bold text-[#06b6d4] tracking-wide mt-1 animate-pulse">
                  {coverageRate.toFixed(1)}%
                </span>
              </div>

              {/* Operational block */}
              <div className="bg-[#0d1628] rounded border border-slate-800/80 p-3 flex flex-col justify-between h-[68px]">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  OPERATIONAL
                </span>
                <span className={`text-lg font-mono font-bold mt-1 ${operationalCount > 0 ? 'text-[#4ade80]' : 'text-red-500'}`}>
                  {operationalCount}/24
                </span>
              </div>

              {/* Timer elapsed */}
              <div className="bg-[#0d1628] rounded border border-slate-800/80 p-3 flex flex-col justify-between h-[68px]">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  TIME
                </span>
                <span className="text-lg font-mono font-bold text-[#b45309] tracking-wide mt-1">
                  {elapsedTime}s
                </span>
              </div>

              {/* Threat factors */}
              <div className="bg-[#0d1628] rounded border border-slate-800/80 p-3 flex flex-col justify-between h-[68px]">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  THREATS
                </span>
                <span className="text-lg font-mono font-bold text-red-500/85 tracking-wide mt-1">
                  {threatCount}
                </span>
              </div>
            </div>

            {/* Score tracker block */}
            <div className="mt-3 bg-[#0d1628] rounded border border-slate-800/80 p-2.5 px-3 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                TACTICAL SCORE
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {tacticalScore} PTS
              </span>
            </div>
          </div>

          {/* TACTICAL AI system control from screenshots */}
          <div className="bg-[#040810]/40 rounded-lg border border-[#1e293b]/70 p-4">
            <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-3 flex items-center justify-between">
              <span>☣️ TACTICAL AI</span>
              {isUplinkConnected && (
                <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30 animate-pulse">
                  SECURE COMMS
                </span>
              )}
            </h3>

            {/* TACTICAL AI OFFLINE layout exactly as shown in screenshot */}
            {!isUplinkConnected ? (
              <div className="bg-[#080d17] rounded border border-dashed border-slate-800 p-4 text-center">
                <Radio className="w-7 h-7 mx-auto text-slate-600 mb-2.5 animate-pulse" />
                <h4 className="text-[11px] font-bold font-mono text-slate-350 uppercase">
                  {isUplinkConnecting ? 'ESTABLISHING INTERLUDE...' : 'AI UPLINK OFFLINE'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-sans max-w-[210px] mx-auto">
                  {isUplinkConnecting ? uplinkStep : 'Link a project key to enable real-time tactical analysis.'}
                </p>

                {!isUplinkConnecting && (
                  <button
                    onClick={handleConnectUplink}
                    className="mt-3.5 w-full bg-[#06b6d4]/10 border border-[#06b6d4]/45 text-[#06b6d4] hover:bg-[#06b6d4]/20 transition-all text-xs font-mono font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#06b6d4]/5 active:scale-[0.98]"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    CONNECT COMMAND LINK
                  </button>
                )}
                
                <p className="text-[9px] text-slate-600 font-mono mt-3 text-center">
                  AI Studio Key Management ↗
                </p>
              </div>
            ) : (
              /* Connected Chat Terminal from Vance Advisor */
              <div className="flex flex-col h-[230px] bg-[#0c1220]/75 border border-[#1e293b] rounded p-2.5">
                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-2.5 custom-scrollbar text-[11px] font-mono leading-normal">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[8.5px] font-bold ${msg.sender === 'user' ? 'text-slate-500' : 'text-[#06b6d4]'}`}>
                          {msg.sender === 'user' ? 'COORDINATOR' : 'GEN. VANCE'}
                        </span>
                        <span className="text-[8px] text-slate-600">{msg.time}</span>
                      </div>
                      <div className={`p-2 rounded-lg max-w-[94%] ${
                        msg.sender === 'user' 
                          ? 'bg-[#0f172a] text-slate-300 rounded-tr-none border border-slate-800' 
                          : 'bg-[#06b6d4]/5 text-[#67e8f9] rounded-tl-none border border-[#06b6d4]/15'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isAIGenerating && (
                    <div className="text-[9px] text-[#06b6d4] italic animate-pulse">
                      Analyzing theater encryption waves...
                    </div>
                  )}
                </div>

                {/* Quick actions for AI */}
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <button
                    onClick={() => handleSendCommand(undefined, 'What is our tactical threat summary right now?')}
                    className="text-[9px] bg-slate-900 border border-slate-800 hover:border-[#06b6d4]/40 text-slate-400 hover:text-white px-2 py-1 rounded truncate transition cursor-pointer"
                    disabled={isAIGenerating}
                  >
                    🔬 TELEMETRY AUDIT
                  </button>
                  <button
                    onClick={() => handleSendCommand(undefined, `Give me a secure strategic deployment guide for ${missionMode}.`)}
                    className="text-[9px] bg-slate-900 border border-slate-800 hover:border-[#06b6d4]/40 text-slate-400 hover:text-white px-2 py-1 rounded truncate transition cursor-pointer"
                    disabled={isAIGenerating}
                  >
                    🛡️ STRATEGY BRIEF
                  </button>
                </div>

                {/* Sender form */}
                <form onSubmit={handleSendCommand} className="flex gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Inquire Vance..."
                    className="flex-1 bg-[#05080e] border border-slate-800 hover:border-slate-700 focus:border-[#06b6d4] text-[10.5px] rounded px-2 py-1.5 outline-none font-mono text-gray-300 focus:ring-1 focus:ring-[#06b6d4]/30"
                    disabled={isAIGenerating}
                  />
                  <button
                    type="submit"
                    className="bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20 border border-[#06b6d4]/45 text-[#06b6d4] hover:text-cyan-300 rounded p-1.5 flex items-center justify-center transition cursor-pointer"
                    disabled={isAIGenerating}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer Area with static info */}
        <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-650">
          <span className="flex items-center gap-1">
            <Sparkles className={`w-3 h-3 ${isUplinkConnected ? 'text-[#06b6d4]' : 'text-slate-500'}`} />
            UPLINK {isUplinkConnected ? 'SECURE' : 'OFFLINE'}
          </span>
          <span>V 1.42.0</span>
        </div>
      </div>

      {/* RIGHT MAIN PANEL: Canvas Radar Grid and Interactive overlay */}
      <div className="flex-1 h-full relative" ref={containerRef}>
        
        {/* HTML Canvas */}
        <canvas
          ref={canvasRef}
          onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              setHoverCoords({
                x: Number((e.clientX - rect.left).toFixed(1)),
                y: Number((e.clientY - rect.top).toFixed(1))
              });
            }
          }}
          onClick={(e) => {
            // Click adds manual temporary displacement particles / pulses
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              const pulseX = e.clientX - rect.left;
              const pulseY = e.clientY - rect.top;
              createExplosion(pulseX, pulseY, '#06b6d4', 8);
              soundDeck.playClick();
              
              // Apply push on drones
              dronesRef.current.forEach(drone => {
                const dx = drone.x - pulseX;
                const dy = drone.y - pulseY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 100) {
                  const force = (100 - dist) / 100 * 2.5;
                  drone.vx += (dx / dist) * force;
                  drone.vy += (dy / dist) * force;
                }
              });

              // Add a search target dynamically on double click or simple click in target searches
              if (missionMode === 'TARGET_SEARCH' && targetsRef.current.length < 5) {
                targetsRef.current.push({
                  id: Date.now(),
                  x: pulseX,
                  y: pulseY,
                  radius: 8,
                  pulsePhase: 0
                });
              }
            }
          }}
          className="block w-full h-full cursor-crosshair"
        />

        {/* Floating Top Center Mode Badge */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-[#09101d]/85 backdrop-blur-md rounded border border-slate-800/80 px-4 py-2 flex items-center gap-2 select-none shadow-lg shadow-black/40">
          <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-ping" />
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">
            MISSION: {missionMode.replace('_', ' ')}
          </span>
        </div>

        {/* Encryption protocol tag on the far top-right */}
        <div className="absolute top-5 right-5 text-right font-mono text-[9px] text-slate-500/80 leading-relaxed select-none hidden sm:block">
          <div>PROTOCOL: AES_SWARM_VGC</div>
          <div>ENCRYPT: AES_256_GCM</div>
        </div>

        {/* Real-Time Location Coordinate Tracking Overlay bottom left */}
        <div className="absolute bottom-5 left-5 font-mono text-[10px] text-slate-500/85 bg-[#09101d]/60 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-800/50 select-none">
          LOC_DATA: {hoverCoords.x}, {hoverCoords.y}
        </div>
      </div>
    </div>
  );
}
