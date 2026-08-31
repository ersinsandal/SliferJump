# SliferJump 2.0: Rise of Slifer

A modern, high-performance 2D vertical platformer engine engineered in Vanilla JavaScript and HTML5 Canvas (leveraging p5.js and Web Audio API). The project implements deterministic physics, dynamic viewport scrolling, intelligent procedural generation, multi-tier hazard simulation, and real-time audio synthesis without reliance on heavyweight game frameworks.

---

## Architecture Overview

I architected SliferJump 2.0 with a modular, component-driven design. The codebase enforces a clean separation of concerns across input handling, physics calculation, entity updates, canvas rendering, state orchestration, and audio synthesis.

```
SliferJump/
├── index.html                  # Main DOM shell, asset declarations, responsive container
├── manifest.json               # Progressive Web App (PWA) manifest
├── capacitor.config.json       # Native build configuration (Android / iOS)
├── service-worker.js           # Offline caching and asset persistence
├── package.json                # Project metadata and local runtime scripts
│
├── css/
│   └── style.css               # Glassmorphism UI styling, responsive viewports, transitions
│
├── js/
│   ├── config.js               # Global configuration constants, level data, balance curves
│   ├── game.js                 # Core game loop, state machine, lifecycle orchestrator
│   ├── slifer.js               # Player entity, movement kinematics, jump state machine
│   ├── platform.js             # Procedural platform entities (Stable, Moving, Fragile, Trap)
│   ├── lava.js                 # Intelligent dynamic lava subsystem with anti-camping logic
│   ├── orichalcos.js           # Black hole hazard entity with gravitational vortex pull
│   ├── meteor.js               # Ballistic falling projectiles with trajectory warnings
│   ├── monster.js              # Patrol enemies and laser projectile systems
│   ├── collectible.js          # Card items, power-up timers, inventory state management
│   ├── particles.js            # High-throughput particle engine (dust, sparks, flames)
│   ├── sound-manager.js        # Hybrid Web Audio API synthesizer and p5.sound asset player
│   ├── background.js           # Parallax background rendering and level transitions
│   ├── quest.js                # Quest progression and dynamic mission tracking
│   ├── achievement.js          # Persistent achievement unlock pipeline
│   ├── challenge.js            # URL-encoded seed and challenge matchmaker
│   ├── storage.js              # LocalStorage wrapper for high scores and profile data
│   └── ui.js                   # HUD canvas rendering, modal management, responsive overlays
│
├── lib/
│   ├── p5.min.js               # Canvas graphics rendering library
│   └── p5.sound.min.js         # Sound asset loading integration
│
└── assets/
    ├── img/                    # Level backgrounds, character sprites, and HUD icons
    └── sound/                  # Audio samples (music, jumps, impacts, dragon roar)
```

---

## Core Engine Mechanics & Mathematical Model

### 1. Kinematics & Jump Physics
The player character (`Slifer`) moves along the horizontal axis with constant velocity and smooth edge wrapping, while the vertical axis follows Newtonian gravitational integration:

$$\Delta v_y = g \cdot \Delta t$$
$$y_{t+1} = y_t + v_y \cdot \Delta t$$

- **Standard Jump Velocity:** $v_{\text{jump}} = \sqrt{2 \cdot g \cdot h_{\text{jump}}} \approx -5.70\text{ px/frame}$
- **Super Spring Velocity:** $v_{\text{super}} = -1.65 \cdot v_{\text{jump}} \approx -9.40\text{ px/frame}$
- **Screen Wrapping:** When $x < 0$, $x \leftarrow \text{width}$; when $x > \text{width}$, $x \leftarrow 0$.

### 2. Viewport Scrolling & Relative Altitude Tracking
To maintain continuous upward momentum without floating-point precision loss, the viewport scrolls when the player exceeds the vertical threshold ($y \le \text{height} \cdot 0.35$):

$$\text{scrollAmount} = -v_y$$

Every entity in the active scene (platforms, hazards, projectiles, particles) is shifted downwards by $\text{scrollAmount}$. Absolute score is calculated directly from the cumulative vertical climb:

$$\text{Score} = \max(0, \text{totalScroll} + (y_{\text{start}} - y)) \cdot \text{Multiplier}$$

### 3. Procedural Platform Generation
Platforms are generated dynamically ahead of the camera in a staggered vertical pipeline. Each platform is assigned a type based on level-specific probability distributions:
- **Stable Platforms:** Standard stepping stones with consistent friction.
- **Moving Platforms:** Execute harmonic horizontal oscillation ($x(t) = x_0 + A \sin(\omega t)$).
- **Fragile Platforms:** Trigger a break timer upon collision and dissolve immediately.
- **Trap Platforms:** Induce sudden downward displacement or trigger deceptive collapsing states.
- **Spring Modules (Millennium Eye):** Rendered with golden neon bloom; applying a 1.65x upward velocity impulse upon contact.

---

## Subsystems & Game Dynamics

### Intelligent Dynamic Lava Engine
The lava subsystem (`js/lava.js`) features an adaptive pacing algorithm:
- **Floor Clamping:** The lava rises continuously but dynamically clamps its ceiling to exactly one platform below the player's current vertical position. This allows deliberate planning while penalizing missed jumps.
- **Anti-Camping Heuristic:** If a player jumps on the same platform more than 3 consecutive times, the floor clamp is released, causing the lava to accelerate rapidly and consume the camping platform.
- **Occlusion Layering:** Lava is rendered in front of the player. When falling into lava, the player naturally sinks downward into the liquid layer with sizzling particle dissipation.

### Hazard Simulation
1. **The Seal of Orichalcos:** A rotating gravitational singularity. If entered without a collectible Millennium Eye, it captures the player in an exponential spiral vortex ($r(t) = r_0 \cdot e^{-kt}$) leading to instant defeat.
2. **Ballistic Meteors:** Meteors spawn above the camera with projected landing markers before accelerating downwards with trailing fire particles.
3. **Patrol Monsters & Laser Beams:** Enemies patrol horizontal trajectories on platforms and periodically discharge focused energy beams.

### Inventory & Power-Up System
- **Millennium Eye (Collectible):** Stored in the player inventory. When entering an Orichalcos black hole, 1 eye is automatically consumed to shatter the singularity, saving the player and granting a super jump.
- **Swords of Revealing Light:** Generates a radiant 10-second barrier. It absorbs one lethal impact (meteor, monster, or laser beam) and shatters with an acoustic crystal break sound.
- **Monster Reborn:** Rare ankh relic (maximum inventory capacity of 3). If the player falls into the bottom void or touches lava, it activates to launch Slifer safely upward. *(Ineffective only against the Orichalcos singularity).*
- **Pot of Greed:** Applies a temporary $2\times$ multiplier to all vertical score accumulation for 10 seconds.
- **Thunder Force (Ultimate Ignition):** Automatically activates upon reaching 100% climb energy. Slifer unleashes a massive, multi-layered fiery dragon breath targeting the scoreboard (**+2000 points**), obliterating active hazards and ascending at supersonic speed with complete invulnerability. Following activation, the energy bar enters a strict **10-second cooldown state** with a visible countdown indicator.

### Hybrid Audio Architecture
Audio in SliferJump 2.0 is managed by `SoundManager` (`js/sound-manager.js`), combining:
1. **Asset Playback:** Preloaded audio samples (`assets/sound/`) with native p5.sound and HTML5 `Audio` fallbacks.
2. **Real-Time Web Audio API Synthesis:** Zero-latency procedural sound generation using custom oscillators, gain envelopes, and noise nodes (e.g., crystal shield shatter, meteor rumbles, lava bubbles, and black hole gravitational sweeps).

---

## Installation & Local Execution

Because modern browsers enforce strict **CORS (Cross-Origin Resource Sharing)** policies when loading assets (`fetch`, `Image`, `Audio`) over the `file://` protocol, the project must be served through a local HTTP server.

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16.0 or higher recommended) **OR** [Python](https://www.python.org/) (version 3.x)

---

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/SliferJump.git
cd SliferJump
```

#### 2. Launch Local Server

**Option A: Using Node.js (Recommended)**
```bash
# Run directly with npx (no global install required)
npx serve -p 5000 .

# Or using the npm script
npm start
```

**Option B: Using Python 3**
```bash
python -m http.server 5000
```

**Option C: Using Visual Studio Code**
1. Install the **Live Server** extension (`ritwickdey.LiveServer`).
2. Right-click `index.html` in the Explorer pane.
3. Select **Open with Live Server**.

#### 3. Access the Game
Open your web browser and navigate to:
```
http://localhost:5000
```

---

## Controls

| Action | Desktop (Keyboard) | Mobile (Touch) |
| :--- | :--- | :--- |
| **Move Left** | `Left Arrow` / `A` | Tap & hold left half of screen |
| **Move Right** | `Right Arrow` / `D` | Tap & hold right half of screen |
| **Thunder Force** | Auto at 100% / `F` | Auto at 100% / Tap Energy Bar |
| **Pause Game** | `Escape` | Pause UI button |

---

## Mobile Build (Capacitor / Android & iOS)

The repository includes a ready-to-build Capacitor configuration (`capacitor.config.json`) for native mobile packaging:

```bash
# Install Capacitor CLI
npm install @capacitor/core @capacitor/cli

# Initialize and sync web assets
npx cap init SliferJump com.slifersoft.sliferjump
npx cap add android
npx cap copy
npx cap open android
```

---

## License & Attribution

- **Engine Code & Architecture:** Developed by **SliferSoft** under the [MIT License](LICENSE).
- **Artistic Attribution:** Concept, thematic names, and visual inspirations are based on Duel Monsters lore and remain the intellectual property of their respective copyright holders. Developed strictly for educational and portfolio demonstration.
