# Aegis Swarm: AI-Based Cooperative Swarm Coordination Simulator for Defence Missions

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-6.2.3-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Aegis Swarm** is an interactive, decentralized tactical simulation designed to study the resilience, operational degradation, and emergent behavior of autonomous aerial swarm agents under restrictive environments. 

Rather than relying on a vulnerable central command node, each simulated drone acts as a self-contained intelligence agent. It steers, coordinates, and adapts solely based on its local sensor bubble and peer-to-peer relative positioning—producing structured collective formations capable of sustaining active attrition, threat zones, and energy constraints in real-time.

---

## 📸 System Showcase

| ![Area Coverage](https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=600) | ![Target Search](https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=600) |
| :---: | :---: |
| **🛰️ Decentralized Flight Formations** | **🚨 Attrition & Threat Avoidance** |

---

## 🎯 Engineering & Operational Research Focus

The primary objective of **Aegis Swarm** is to model and study **operational reliability** and state stability rather than simple path-finding automation. The core simulator evaluates:

*   **Emergent Coordinated Steering:** Combining localized Reynolds flocking mechanics (separation, alignment, cohesion) to execute collective missions without a centralized control coordinator.
*   **Decoupled Intelligence:** Simulating physical constraints where loss of communication or GPS jamming requires individual agents to transition to localized decision matrices.
*   **Survival under Stress (Attrition Analysis):** Visualizing how swarm effectiveness, sensor footprint, and perimeter control degrade as units are progressively lost (*Critical Attrition* thresholds).
*   **Sensor & Battery Restraints:** Units consume power dynamically. Low-energy reserves force agents to seek automatic docking or adjust coverage orbits.
*   **Human-in-the-Loop Integration:** Facilitating tactical AI feedback loops where humans deploy active countermeasures (e.g. CIWS laser sweeps, localized EMP blasts, tactical shielding) to defend the core reactor from threat incursions.

---

## 🛰️ Mission-Specific Operational Modes

The simulation supports four discrete mission environments, each modeling a distinct control challenge:

### 1. 🛰️ Area Coverage
Agents distribute their nodes evenly across the coordinate plane, aiming to maximize their overlapping radial sensor zones. This mode evaluates how well the swarm maintains environmental visibility of threat groups as peer elements are actively deactivated.

### 2. 🎯 Target Search
Drones enter a highly dynamic, noisy region to discover localized high-value targets. Because agents possess zero central reference frames, discovery of a target triggers a localized alert chain, pulling neighboring units to swarm the target dynamically under partial information.

### 3. 🛡️ Perimeter Defense
A flock coordinates boundaries around a central vital interest (the Core Reactor). Drones adapt their flight vectors to maintain a defensive screen, dynamically filling caps left by downed escorts to shield critical modules from incoming kinetic kamikaze threats.

### 4. 🔍 Reconnaissance
Agents traverse unstructured flight coordinates to scan, log, and classify threat densities. Paths are generated dynamically on the fly based on threat exposure maps, shifting flight groups away from high-hazard zones while prioritizing unscanned regions.

---

## 🧠 Emergent Rules & Agent Decision Loop

Each agent inside the simulation resolves its flight characteristics through high-speed vector summation updated per frame:

$$\vec{F}_{\text{total}} = w_1\vec{F}_{\text{separation}} + w_2\vec{F}_{\text{alignment}} + w_3\vec{F}_{\text{cohesion}} + w_4\vec{F}_{\text{mission}} + w_5\vec{F}_{\text{avoidance}}$$

1.  **Separation:** Steer to avoid crowding or colliding with close local neighbors.
2.  **Alignment:** Steer towards the average heading of nearby flock elements.
3.  **Cohesion:** Steer toward the center of mass of local flock neighbors to maintain structure.
4.  **Mission Target Focus:** Steer toward active task targets assigned relative to local space.
5.  **Threat Avoidance:** Steer violently away from active threat boundaries (high-energy red zones).

---

## 🕹️ Interactive Tactical Dashboard & Controls

The dashboard is built to mimic state-of-the-art military command interfaces, utilizing high-contrast, dark-slate visual motifs paired with responsive micro-animations:

*   **Live Telemetry Panel:** Monitoring real-time Metrics including **Coverage Efficiency (%)**, **Operational Swarm Count (N/24)**, and active **Threat Intensity indicators**.
*   **Tactical AI Overlay Hook:** Built-in hooks for integrating real-time intelligence feeds (AI Uplink) to evaluate live vector groups and suggest defense adaptations.
*   **Command Suite (Interactive Canvas):**
    *   *Click-and-Drag:* Deliver manual CIWS high-energy laser sweeps to neutralize hostile swarm waves.
    *   *EMP Deployment:* Trigger localized electromagnetic discharges to neutralize dense hostile incursions when cooling limits have reset.
    *   *Interceptor Escorts:* Call forward active chasing interceptors to track, lock, and eliminate high-priority structures.

---

## 🛠️ Stack & Architecture

*   **Runtime Framework:** React 19 + TypeScript (strict types, vector modules).
*   **Bundler & Hot-Reload:** Vite + ESBuild for extreme frame execution speeds on HTML5 canvas.
*   **Physics Engine:** Custom 2D kinematic canvas renderer utilizing double buffering for seamless, low-overhead swarm movement rendering (60+ FPS).
*   **Styling:** Tailwinds Utility framework + glassmorphism cards and display-focused typography.
*   **Audio Synthesizer:** Built-in procedurally generated audio synth using Web Audio API nodes to produce immersive retro-tactical alarms, laser tones, incursion alerts, and deep EMP responses without external assets.

---

## 🚀 Getting Started & Installation

To run the Aegis Swarm simulator on your local machine:

### Prerequisites
Make sure you have Node.js (version 18 or above) and npm installed.

### 1. Clone the repository
```bash
git clone https://github.com/sharma01riddhi/Aegis-Swarm-AI-Based-Cooperative-Swarm-Coordination-Simulator-for-Defence-Missions.git
cd Aegis-Swarm-AI-Based-Cooperative-Swarm-Coordination-Simulator-for-Defence-Missions
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the command module.

### 4. Build production distribution
```bash
npm run build
```
Static files will be bundled into the `/dist` directory, ready to deploy.

---

## 🔬 Contributing & Defense Modeling

This simulator is open for academic and scientific collaboration on decentralized intelligence models.
If you'd like to integrate advanced agent algorithms or custom AI vector steering models, feel free to submit a pull request!
