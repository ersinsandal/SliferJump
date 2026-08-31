/**
 * SliferJump 2.0: Rise of Slifer
 * Main Game Engine — State Machine & Game Loop
 * Replaces the old index.js
 */

// ─── Global Game State ───
let gameState = GAME_STATE.MENU;
let platforms = [];
let slifer;
let orichalcos = null;
let score = 0;
let displayScore = 0;
let isBlackholed = false;
let stepSize;
let isMobile;

// ─── Systems ───
let particleSystem;
let meteorSystem;
let lavaSystem;
let monsterSystem;
let collectibleSystem;
let questSystem;
let achievementSystem;
let dynamicBackground;

// ─── Screen Shake ───
let shakeTimer = 0;
let shakeIntensity = 0;

// ─── Realm Tracking ───
let currentLevel = null;
let currentLevelId = 1;

// ─── Game Stats (per-session) ───
let gameStats = {};

// ─── Sound Assets ───
const sound = {
    blackhole: null,
    jump: null,
    spring: null,
    fragile: null,
    falling: null,
    roar: null,
    lava: null,
    background: null,
    break: null,
    explosion: null,
};

// ─── Background Images Cache ───
const loadedBgImages = {};

// ─── Death Animation ───
let died = false;
let deathAnimTimer = 0;
const DEATH_ANIM_DURATION = 90;
let winStatus = false;
let deathType = "";
let gameStartTime = 0;

// ═══════════════════════════════════════════
//  P5 LIFECYCLE
// ═══════════════════════════════════════════

/**
 * Preload — load static resources
 */
function preload() {
    const basePath = ".";
    
    // Load backgrounds
    for (let i = 1; i <= 25; i++) {
        loadedBgImages[i] = loadImage(`assets/img/bg_level_${i}.png`, 
            () => {}, 
            () => {
                // Fallback if not found
                loadedBgImages[i] = loadImage(`assets/img/bg_realm_${Math.ceil(i/5)}.jpg`);
            }
        );
    }

    Slifer.leftImage = loadImage(basePath + "/assets/img/slifer_left.png");
    Slifer.rightImage = loadImage(basePath + "/assets/img/slifer_right.png");
    Platform.springImage = loadImage(basePath + "/assets/img/spring.png");
    Orichalcos.sealImage = loadImage(basePath + "/assets/img/hole.png");

    soundFormats("mp3", "wav", "ogg");
    sound.explosion = loadSound(basePath + "/assets/sound/explosion.mp3");
    sound.break = loadSound(basePath + "/assets/sound/break.mp3");
    sound.roar = loadSound(basePath + "/assets/sound/roar.mp3");
    sound.lava = loadSound(basePath + "/assets/sound/lava.mp3");
    sound.background = loadSound(basePath + "/assets/sound/background.mp3");
    
    sound.blackhole = loadSound(basePath + "/assets/sound/blackhole.mp3");
    sound.jump = loadSound(basePath + "/assets/sound/jump.wav");
    sound.spring = loadSound(basePath + "/assets/sound/spring.mp3");
    sound.fragile = loadSound(basePath + "/assets/sound/fragile.mp3");
    sound.falling = loadSound(basePath + "/assets/sound/falling.mp3");
}

/**
 * Setup — initialization
 */
function setup() {
    frameRate(config.FPS);
    
    // Create canvas
    let container = document.getElementById('game-container');
    let cWidth = container ? container.clientWidth : 400;
    let cHeight = container ? container.clientHeight : 700;
    let cnv = createCanvas(cWidth, cHeight);
    if (container) cnv.parent('game-container');

    applyScaling();

    // Initialize systems
    particleSystem = new ParticleSystem();
    meteorSystem = new MeteorSystem();
    lavaSystem = new LavaSystem();
    monsterSystem = new MonsterSystem();
    collectibleSystem = new CollectibleSystem();
    questSystem = new QuestSystem();
    achievementSystem = new AchievementSystem();
    dynamicBackground = new DynamicBackground();

    // Assign sounds to SoundManager
    SoundManager.sounds = sound;

    // Initialize achievement system
    achievementSystem.init();

    // Initialize UI
    UI.init();

    // Start in menu state
    gameState = GAME_STATE.MENU;
    if (sound.background) sound.background.setLoop(true);
    setTimeout(() => { if (gameState === GAME_STATE.MENU) SoundManager.playMenuMusic(); }, 1000);
}

/**
 * Main draw loop
 */
let physicsAccumulator = 0;
const PHYSICS_STEP = 1000 / 60;

function executeGameState() {
    switch (gameState) {
        case GAME_STATE.MENU:
            drawMenuBackground();
            break;
        case GAME_STATE.PLAYING:
            updateAndDrawGame();
            break;
        case GAME_STATE.PAUSED:
            drawPausedScreen();
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOverAnimation();
            break;
    }
    // Render toasts only outside active playing
    if (gameState !== GAME_STATE.PLAYING) {
        UI.renderToasts();
    }
}

function draw() {
    let dt = deltaTime;
    if (dt > 100) dt = 100; // Cap to prevent death spiral
    
    physicsAccumulator += dt;
    let steps = Math.floor(physicsAccumulator / PHYSICS_STEP);
    
    if (steps > 0) {
        physicsAccumulator -= steps * PHYSICS_STEP;
        for (let i = 0; i < steps; i++) {
            executeGameState();
        }
    }
}

// ═══════════════════════════════════════════
//  GAME START / RESET
// ═══════════════════════════════════════════

/**
 * Start a new game
 * @param {number} levelId
 */
function startGame(levelId = 1) {
    currentLevelId = levelId;
    currentLevel = getCurrentLevel(levelId);

    // Reset state
    platforms = [];
    orichalcos = null;
    score = 0;
    displayScore = 0;
    isBlackholed = false;
    died = false;
    deathAnimTimer = 0;
    gameStartTime = millis();

    // Reset stats
    gameStats = {
        score: 0,
        totalScroll: 0,
        maxClimb: 0,
        meteorsDodged: 0,
        monstersEvaded: 0,
        eyesCollected: 0,
        totalCollected: 0,
        movingPlatJumps: 0,
        scoreWithoutFragile: 0,
        energy: 0,
        thunderForceCount: 0,
        thunderForceCooldown: 0,
        fragileUsed: false,
        lavaSurvivalFrames: 0,
        lavaScore: 0,
        collectedTypes: new Set(),
        timeSeconds: 0,
    };

    // Reset systems
    particleSystem.clear();
    meteorSystem.clear();
    lavaSystem.reset();
    if (currentLevel.hasLava) {
        lavaSystem.activate(currentLevel.lavaSpeed);
    }
    monsterSystem.clear();
    collectibleSystem.clear();
    dynamicBackground.setRealm(currentLevel);

    // Generate initial platforms
    generatePlatforms();

    // Create slifer directly on top of guaranteed starting platform
    const startPlat = platforms[0];
    slifer = new Slifer(
        startPlat.x,
        startPlat.y - Slifer.h / 2 - Platform.h / 2
    );
    slifer.vy = -Slifer.jumpForce;
    SoundManager.playJump();

    // Init quests
    questSystem.initNewGame();
    questSystem.loadPersistentQuests();

    // Update game count
    const profile = GameStorage.getProfile();
    profile.totalGames = (profile.totalGames || 0) + 1;
    GameStorage.saveProfile(profile);

    // Hide overlays
    UI.hideMenu();
    UI.hideGameOver();

    // Stop menu music firmly before gameplay
    SoundManager.stopMenuMusic();
    if (SoundManager.sounds && SoundManager.sounds.background) {
        try {
            SoundManager.sounds.background.setLoop(false);
            SoundManager.sounds.background.stop();
        } catch(e) {}
    }
    gameState = GAME_STATE.PLAYING;
}

// ═══════════════════════════════════════════
//  MAIN GAME LOOP
// ═══════════════════════════════════════════

function updateAndDrawGame() {
    // Check if background music is illegally playing
    if (SoundManager.sounds && SoundManager.sounds.background && SoundManager.sounds.background.isPlaying()) {
        SoundManager.stopMenuMusic();
    }
    // ── Apply screen shake ──
    push();
    if (shakeTimer > 0) {
        shakeTimer--;
        const sx = random(-shakeIntensity, shakeIntensity);
        const sy = random(-shakeIntensity, shakeIntensity);
        translate(sx, sy);
    }

    // ── Check Level Win Condition ──
    if (score >= currentLevel.scoreGoal) {
        GameStorage.unlockLevel(currentLevel.id + 1);
        gameState = GAME_STATE.GAME_OVER;
        handleGameOver("win");
        return;
    }

    // ── Draw background ──
    dynamicBackground.update(slifer.vy < 0 ? -slifer.vy : 0);
    dynamicBackground.render(currentLevel, loadedBgImages[currentLevel.id]);

    // ── Update & render lava (behind everything) ──
    let limitY = -999999;
    if (gameStats.samePlatJumps > 3) {
        limitY = -999999;
    } else {
        let sy = slifer.y + Slifer.h/2;
        let belowPlats = platforms.filter(p => p.isStandable() && p.y >= sy - 10).sort((a,b) => a.y - b.y);
        if (belowPlats.length > 0) {
            limitY = belowPlats[0].y + 25;
        } else {
            limitY = height;
        }
    }

    if (lavaSystem.isActive()) {
        lavaSystem.update(limitY);
        gameStats.lavaSurvivalFrames++;
    }

    // ── Render orichalcos ──
    if (orichalcos) {
        orichalcos.update();
        orichalcos.render();
    }

    // ── Render & update monsters ──
    monsterSystem.update(slifer.x, slifer.y);
    monsterSystem.render();

    // ── Render & update meteors ──
    if (currentLevel.hasMeteors) {
        meteorSystem.update(currentLevel, score);
        meteorSystem.render();
    }

    // ── Render & update collectibles ──
    collectibleSystem.update();
    collectibleSystem.render();

    // ── Draw all platforms ──
    platforms.forEach((plat) => {
        plat.render(currentLevel);

        // Spring collision
        if (
            plat.springed &&
            slifer.vy > 0 &&
            checkCollision(slifer, {
                x: plat.x + (plat.springX || 0),
                y: plat.y - Platform.h / 2 - Platform.springH / 2,
                w: Platform.springW,
                h: Platform.springH,
            })
        ) {
            SoundManager.playSpring();
            slifer.vy = -Slifer.superJumpForce;
            particleSystem.emitCollectBurst(plat.x + plat.springX, plat.y + plat.springY, "#FFD700");

            if (gameStats.lastPlat === plat) {
                gameStats.samePlatJumps = (gameStats.samePlatJumps || 0) + 1;
            } else {
                gameStats.lastPlat = plat;
                gameStats.samePlatJumps = 0;
            }
        }

        // Platform collision
        if (
            plat.isStandable() &&
            slifer.vy > 0 &&
            checkCollision(slifer, plat)
        ) {
            slifer.vy = -Slifer.jumpForce;
            particleSystem.emitJumpDust(slifer.x, slifer.y + Slifer.h / 2, currentLevel.particleColor);

            if (gameStats.lastPlat === plat) {
                gameStats.samePlatJumps = (gameStats.samePlatJumps || 0) + 1;
            } else {
                gameStats.lastPlat = plat;
                gameStats.samePlatJumps = 0;
            }

            if (plat.type === Platform.platformTypes.FRAGILE) {
                plat.type = Platform.platformTypes.INVISIBLE;
                plat.springed = false;
                SoundManager.playFragile();
                gameStats.fragileUsed = true;
            } else if (plat.type === Platform.platformTypes.TRAP) {
                plat.triggerTrap();
                SoundManager.playFragile();
            } else {
                SoundManager.playJump();
            }

            if (plat.type === Platform.platformTypes.MOVING) {
                gameStats.movingPlatJumps++;
                questSystem.updateStat("movingPlatJumps", gameStats.movingPlatJumps);
            }
        }

        // Update moving/trap/vanishing platforms
        if (!UI.isTransitioning()) {
            plat.update();
        }
    });

    // ── Render and update slifer ──
    slifer.render(particleSystem);
    slifer.update();

    // ── Render lava in front of Slifer so Slifer naturally submerges into it ──
    if (lavaSystem.isActive()) {
        lavaSystem.render();
    }
    
    // ── Update score based on absolute max height (instant from 1st jump) ──
    let currentClimb = Math.max(0, (gameStats.totalScroll || 0) + (slifer.startY - slifer.y));
    if (currentClimb > (gameStats.maxClimb || 0)) {
        let diff = currentClimb - (gameStats.maxClimb || 0);
        gameStats.maxClimb = currentClimb;
        let scoreMulti = collectibleSystem ? collectibleSystem.getScoreMultiplier() : 1;
        score += Math.ceil(diff * scoreMulti);
    }

    // ── Check collectible collection ──
    const collected = collectibleSystem.checkCollection(slifer.x, slifer.y, Slifer.w, Slifer.h);
    if (collected) {
        if (collected.id === 'eye') slifer.vy = -Slifer.superJumpForce;
        particleSystem.emitCollectBurst(slifer.x, slifer.y, collected.glowColor);
        SoundManager.synthCollect(collected.id);
        gameStats.totalCollected++;
        gameStats.collectedTypes.add(collected.id);

        if (collected.id === "eye") {
            slifer.vy = -Slifer.superJumpForce;
            gameStats.eyesCollected++;
            questSystem.updateStat("eyesCollected", gameStats.eyesCollected);
        } else if (collected.id === "reborn") {
            gameStats.rebornCount = Math.min(3, (gameStats.rebornCount || 0) + 1);
        } else {
            if (collected.id === "swords") slifer.isShielded = true;
        }

        questSystem.updateStat("totalCollected", gameStats.totalCollected);
    }

    // ── Update particles ──
    particleSystem.update();
    particleSystem.render();

    // ── Update Thunder Force Cooldown (10s = 600 frames at 60 FPS) ──
    if (gameStats.thunderForceCooldown > 0) {
        gameStats.thunderForceCooldown--;
    }

    // ── Auto-Trigger Thunder Force when energy full and not in cooldown ──
    if (gameStats.energy >= 100 && (!gameStats.thunderForceCooldown || gameStats.thunderForceCooldown <= 0) && (typeof thunderForceTimer === 'undefined' || thunderForceTimer <= 0)) {
        activateThunderForce();
    }

    // ── Check Hazards & Deaths ──
    if (slifer.y >= height) {
        if (gameStats.rebornCount > 0) {
            gameStats.rebornCount--;
            slifer.y = height - 100;
            slifer.vy = -Slifer.superJumpForce * 1.3;
            particleSystem.emitDeathBurst(slifer.x, slifer.y);
            SoundManager.synthDragonRoar();
            triggerShake(12, 20);
        } else {
            died = true;
            deathType = "falling";
            SoundManager.playFalling();
        }
    }

    let isInvincible = (typeof thunderForceTimer !== 'undefined' && thunderForceTimer > 0);

    if (!died && !isInvincible) {
        // Death from orichalcos (Millennium Eye protects player and is consumed)
        if (!died && orichalcos && dist(slifer.x, slifer.y, orichalcos.x, orichalcos.y) < Orichalcos.ROCHE_LIMIT) {
            if (gameStats.eyesCollected > 0) {
                // Collectible Millennium Eye saves you from the black hole!
                gameStats.eyesCollected--;
                questSystem.updateStat("eyesCollected", gameStats.eyesCollected);
                orichalcos = null;
                slifer.vy = -Slifer.superJumpForce;
                particleSystem.emitDeathBurst(slifer.x, slifer.y);
                particleSystem.emitCollectBurst(slifer.x, slifer.y, "#FFD700");
                SoundManager.playShieldBreak();
                SoundManager.synthDragonRoar();
                triggerShake(10, 20);
            } else {
                died = true;
                deathType = "orichalcos";
                isBlackholed = true;
                SoundManager.playBlackhole();
            }
        }

        // Death from meteor
        let collidingMeteor = meteorSystem.checkCollision(slifer.x, slifer.y, Slifer.w, Slifer.h);
        if (!died && collidingMeteor) {
            if (collectibleSystem.hasShield()) {
                collectibleSystem.breakShield();
                slifer.isShielded = false;
                meteorSystem.removeMeteor(collidingMeteor);
                particleSystem.emitDeathBurst(slifer.x, slifer.y);
                particleSystem.emitCollectBurst(slifer.x, slifer.y, "#FFD700");
                SoundManager.playShieldBreak();
                triggerShake(10, 20);
            } else {
                died = true;
                deathType = "meteor";
                particleSystem.emitDeathBurst(slifer.x, slifer.y);
                SoundManager.playExplosion();
                triggerShake(15, 30);
            }
        }

        // Death from monster
        let collidingMonster = monsterSystem.checkCollision(slifer.x, slifer.y, Slifer.w, Slifer.h);
        if (!died && collidingMonster) {
            if (collectibleSystem.hasShield()) {
                collectibleSystem.breakShield();
                slifer.isShielded = false;
                monsterSystem.removeMonster(collidingMonster);
                particleSystem.emitDeathBurst(slifer.x, slifer.y);
                particleSystem.emitCollectBurst(slifer.x, slifer.y, "#FFD700");
                SoundManager.playShieldBreak();
                triggerShake(10, 20);
            } else {
                died = true;
                deathType = "monster";
                particleSystem.emitDeathBurst(slifer.x, slifer.y);
                SoundManager.playBreak();
                triggerShake(12, 20);
            }
        }

        // Death from monster laser
        if (!died && monsterSystem.checkLaserCollision(slifer.x, slifer.y, Slifer.w, Slifer.h)) {
            if (collectibleSystem.hasShield()) {
                collectibleSystem.breakShield();
                slifer.isShielded = false;
                particleSystem.emitDeathBurst(slifer.x, slifer.y);
                particleSystem.emitCollectBurst(slifer.x, slifer.y, "#FFD700");
                SoundManager.playShieldBreak();
                triggerShake(10, 20);
            } else {
                died = true;
                deathType = "laser";
                particleSystem.emitDeathBurst(slifer.x, slifer.y);
                SoundManager.playExplosion();
                triggerShake(15, 30);
            }
        }

        // Death from lava (Monster Reborn saves player if available)
        if (!died && lavaSystem.isActive() && lavaSystem.checkCollision(slifer.y, Slifer.h)) {
            if (gameStats.rebornCount > 0) {
                gameStats.rebornCount--;
                slifer.y = lavaSystem.y - Slifer.h - 30;
                slifer.vy = -Slifer.superJumpForce * 1.5;
                particleSystem.emitDeathBurst(slifer.x, slifer.y);
                particleSystem.emitCollectBurst(slifer.x, slifer.y, "#00BFFF");
                SoundManager.playRoar();
                triggerShake(12, 20);
                lavaSystem.y += 40;
            } else {
                died = true;
                deathType = "lava";
                SoundManager.playLava();
                triggerShake(10, 20);
            }
        }
    }

    if (died) {
        deathAnimTimer = DEATH_ANIM_DURATION;
        slifer.alive = false;
        slifer.vx = 0;
        slifer.vy = 0;
        particleSystem.emitDeathBurst(slifer.x, slifer.y);
        SoundManager.stopAmbient();
        gameState = GAME_STATE.GAME_OVER;
        handleGameOver(deathType);
    }

    // ── Scroll world when slifer goes above threshold ──
    let scoreMulti = collectibleSystem ? collectibleSystem.getScoreMultiplier() : 1;
    if (slifer.y <= config.THRESHOLD && slifer.vy < 0) {
        const scrollAmount = -slifer.vy;

        // Move orichalcos
        if (orichalcos) orichalcos.y += scrollAmount;

        // Move & recycle platforms
        updatePlatforms(scrollAmount, scoreMulti);

        // Move meteors, monsters, collectibles
        if (meteorSystem.scrollDown) meteorSystem.scrollDown(scrollAmount);
        monsterSystem.scrollDown(scrollAmount);
        collectibleSystem.scrollDown(scrollAmount);
        if (lavaSystem.isActive()) lavaSystem.scrollDown(scrollAmount);

        // Track meteor dodges
        gameStats.meteorsDodged = meteorSystem.dodgedCount || 0;
    }

    // ── Remove offscreen entities ──
    if (orichalcos && orichalcos.y > height) orichalcos = null;
    monsterSystem.removeOffscreen();
    collectibleSystem.removeOffscreen();

    // ── Update score tracking ──
    if (!gameStats.fragileUsed) {
        gameStats.scoreWithoutFragile = score;
        questSystem.updateStat("scoreWithoutFragile", gameStats.scoreWithoutFragile);
    }
    gameStats.score = score;
    gameStats.timeSeconds = (millis() - gameStartTime) / 1000;

    // ── Thunder Force Dragon Breath (Giant Fiery Orange Inferno Directly to Scoreboard) ──
    if (typeof thunderForceTimer !== 'undefined' && thunderForceTimer > 0) {
        thunderForceTimer--;

        // Screen Shake during breath
        let shake = map(thunderForceTimer, 90, 0, 20, 0);
        translate(random(-shake, shake), random(-shake, shake));

        // Scoreboard target at top-left panel center (rect is 10, 10, 220, 65)
        let targetX = 120;
        let targetY = 42;

        // Exact dragon mouth coordinates
        let mouthOffsetX = (slifer.direction === Slifer.RIGHT ? Slifer.w * 0.45 : -Slifer.w * 0.45);
        let mouthOffsetY = -Slifer.h * 0.22;
        let mouthX = slifer.x + mouthOffsetX;
        let mouthY = slifer.y + mouthOffsetY;

        let intensity = map(thunderForceTimer, 90, 0, 1, 0);

        // Vector from mouth to scoreboard target
        let dx = targetX - mouthX;
        let dy = targetY - mouthY;
        let distTarget = Math.hypot(dx, dy);
        let nx = -dy / (distTarget || 1);
        let ny = dx / (distTarget || 1);

        push();
        // ── Helper to draw a glowing fiery triangle cone from mouth to target ──
        const drawFlameCone = (wStart, wEnd, fillColor, strokeColor, strkWeight) => {
            if (fillColor) fill(fillColor); else noFill();
            if (strokeColor) { stroke(strokeColor); strokeWeight(strkWeight || 1); } else noStroke();
            
            beginShape();
            vertex(mouthX - nx * wStart, mouthY - ny * wStart);
            vertex(mouthX + nx * wStart, mouthY + ny * wStart);
            vertex(targetX + nx * wEnd, targetY + ny * wEnd);
            vertex(targetX - nx * wEnd, targetY - ny * wEnd);
            endShape(CLOSE);
        };

        // 1. Giant Outer Crimson-Red Flame Aura (Completely covers scoreboard width)
        drawFlameCone(25 * intensity, 230 * intensity, color(255, 30, 0, 75 * intensity), color(255, 60, 0, 120 * intensity), 3);

        // 2. Main Blazing Fiery Orange Torrent
        drawFlameCone(16 * intensity, 160 * intensity, color(255, 110, 0, 160 * intensity), color(255, 150, 0, 220 * intensity), 3);

        // 3. Bright Golden-Amber Flame Body
        drawFlameCone(10 * intensity, 100 * intensity, color(255, 190, 20, 210 * intensity), color(255, 220, 70, 245 * intensity), 2.5);

        // 4. White-Hot Intense Yellow Flame Core
        drawFlameCone(4 * intensity, 45 * intensity, color(255, 255, 220, 250 * intensity), color(255, 255, 255, 255 * intensity), 2);

        // 5. Six Turbulent Wavy Flame Ribbons rushing into the scoreboard
        stroke(255, 225, 110, 230 * intensity);
        strokeWeight(4 * intensity);
        noFill();
        for (let rib = 0; rib < 6; rib++) {
            beginShape();
            vertex(mouthX, mouthY);
            let segments = 8;
            for (let s = 1; s < segments; s++) {
                let t = s / segments;
                let lx = lerp(mouthX, targetX, t);
                let ly = lerp(mouthY, targetY, t);
                let spread = lerp(8, 70, t) * intensity;
                let offset = (Math.sin(frameCount * 0.35 + rib * 1.5 + s) * spread) + random(-7, 7);
                vertex(lx + nx * offset, ly + ny * offset);
            }
            vertex(targetX + random(-40, 40), targetY + random(-15, 15));
            endShape();
        }

        // 6. Erupting Fireball at Slifer's Mouth
        noStroke();
        fill(255, 255, 240, 255 * intensity);
        ellipse(mouthX, mouthY, 32 * intensity, 32 * intensity);
        fill(255, 140, 0, 230 * intensity);
        ellipse(mouthX, mouthY, 65 * intensity, 65 * intensity);
        fill(255, 50, 0, 150 * intensity);
        ellipse(mouthX, mouthY, 95 * intensity, 95 * intensity);

        // 7. Giant Fiery Explosion Engulfing the Scoreboard
        fill(255, 255, 230, 240 * intensity);
        ellipse(targetX, targetY, 120 * intensity, 70 * intensity);
        fill(255, 140, 0, 190 * intensity);
        ellipse(targetX, targetY, 200 * intensity, 110 * intensity);
        fill(255, 50, 0, 130 * intensity);
        ellipse(targetX, targetY, 270 * intensity, 150 * intensity);

        // Expanding fiery blast wave rings around scoreboard
        if (thunderForceTimer > 60) {
            let expSize = map(thunderForceTimer, 90, 60, 0, 240);
            noFill();
            stroke(255, 140, 0, 230 * intensity);
            strokeWeight(5);
            ellipse(targetX, targetY, expSize, expSize * 0.6);
            stroke(255, 230, 50, 250 * intensity);
            strokeWeight(3);
            ellipse(targetX, targetY, expSize * 0.7, expSize * 0.4);
        }

        // Score popup floating up from scoreboard in burning gold
        textSize(28 * intensity);
        textStyle(BOLD);
        fill(255, 220, 0, 255 * intensity);
        stroke(180, 40, 0, 230 * intensity);
        strokeWeight(2.5);
        textAlign(CENTER, CENTER);
        let rise = map(thunderForceTimer, 90, 0, 0, 50);
        text("+2000", targetX, targetY - rise);

        pop();

        // Realistic dragon flame particles (fire puffs & sparks, ZERO stars!)
        if (particleSystem && frameCount % 2 === 0) {
            for (let i = 0; i < 4; i++) {
                let t = random();
                let px = lerp(mouthX, targetX, t);
                let py = lerp(mouthY, targetY, t);
                let spread = lerp(10, 80, t) * intensity;
                let sparkX = px + nx * random(-spread, spread);
                let sparkY = py + ny * random(-spread, spread);
                let dirX = (targetX - mouthX) * 0.015;
                let dirY = (targetY - mouthY) * 0.015;
                particleSystem.emitDragonFlame(sparkX, sparkY, dirX, dirY);
            }
        }
    }

    // ── Draw HUD ──
    UI.drawHUD(score, currentLevel, Math.floor(frameRate()), gameStats.energy);

    // ── Draw compact power-up HUD ──
    collectibleSystem.renderHUD(width - 10, 100);

    // ── Render realm transition overlay ──
    UI.renderRealmTransition();

    // ── Process quest/achievement notifications ──
    processNotifications();

    pop();

    // Animate display score
    if (displayScore < score) {
        displayScore = Math.min(displayScore + Math.ceil((score - displayScore) * 0.1), score);
    }
}

// ═══════════════════════════════════════════
//  PLATFORM MANAGEMENT
// ═══════════════════════════════════════════

function generatePlatforms() {
    platforms = [];
    config.STEPS = 9;
    stepSize = Math.floor(height / config.STEPS);
    
    // Bottom platform (guaranteed stable starting platform at center)
    const startY = height - 120;
    const startX = width / 2;
    platforms.push(new Platform(startX, startY, Platform.platformTypes.STABLE, false));

    // Ascending platforms
    for (let y = startY - stepSize; y > -50; y -= stepSize) {
        const x = Platform.w / 2 + (width - Platform.w) * Math.random();
        let type = Platform.platformTypes.getRandomType(currentLevel);
        while (type === Platform.platformTypes.FRAGILE || type === Platform.platformTypes.TRAP) {
            type = Platform.platformTypes.getRandomType(currentLevel);
        }
        const springed = Math.random() < config.SPRINGED_CHANCE;
        platforms.push(new Platform(x, y, type, springed));
    }
}

function updatePlatforms(scrollAmount, scoreMulti) {
    gameStats.totalScroll = (gameStats.totalScroll || 0) + scrollAmount;
    
    if ((!gameStats.thunderForceCooldown || gameStats.thunderForceCooldown <= 0) && (typeof thunderForceTimer === 'undefined' || thunderForceTimer <= 0)) {
        let multi = 1.0 / (1 + (gameStats.thunderForceCount || 0));
        gameStats.energy = Math.min(100, (gameStats.energy || 0) + scrollAmount * 0.05 * multi);
    }

    for (let i = platforms.length - 1; i >= 0; i--) {
        platforms[i].y += scrollAmount;

        // Recycle platform that fell below screen
        if (platforms[i].y > height) {
            const highestY = Math.min(...platforms.map((p) => p.y));
            const newY = highestY - stepSize;
            const newX = Platform.w / 2 + (width - Platform.w) * Math.random();
            let newType = Platform.platformTypes.getRandomType(currentLevel);
            const springed = Math.random() < config.SPRINGED_CHANCE;

            // Spawn orichalcos hole occasionally
            if (
                !orichalcos &&
                Math.random() < (currentLevel.orichalcosChance || config.ORICHALCOS_CHANCE)
            ) {
                orichalcos = new Orichalcos(
                    width * 0.15 + width * 0.7 * Math.random(),
                    newY - 40
                );
            }

            // Spawn monster
            if (
                currentLevel.hasMonsters &&
                Math.random() < (currentLevel.monsterChance || config.MONSTER_CHANCE)
            ) {
                monsterSystem.spawnMonster(newX, newY, currentLevel);
            }

            // Spawn collectible
            if (Math.random() < config.COLLECTIBLE_CHANCE) {
                collectibleSystem.spawnCollectible(newX, newY - 30);
            }

            platforms[i] = new Platform(newX, newY, newType, springed);
        }
    }
}

/**
 * Check AABB collision between two objects with hitboxes
 */
function checkCollision(a, b) {
    const aBox = {
        x: a.x - (Slifer.w * 0.4),
        y: a.y - (Slifer.h * 0.3),
        w: Slifer.w * 0.8,
        h: Slifer.h * 0.6,
    };
    const bBox = {
        x: b.x - (b.width || b.w) / 2,
        y: b.y - (b.height || b.h) / 2,
        w: b.width || b.w,
        h: b.height || b.h,
    };

    return (
        aBox.x < bBox.x + bBox.w &&
        aBox.x + aBox.w > bBox.x &&
        aBox.y < bBox.y + bBox.h &&
        aBox.y + aBox.h > bBox.y
    );
}

// ═══════════════════════════════════════════
//  GAME OVER & WIN HANDLING
// ═══════════════════════════════════════════

let isHandlingGameOver = false;

function handleGameOver(type) {
    if (isHandlingGameOver) return;
    isHandlingGameOver = true;
    
    winStatus = (type === "win");
    deathType = type;
    
    // Save stats
    GameStorage.updateStats({
        score: Math.floor(score),
        eyes: gameStats.eyesCollected || 0,
        meteors: gameStats.meteorsDodged || 0,
        monsters: gameStats.monstersEvaded || 0,
    });

    if (score > GameStorage.getHighScore()) {
        GameStorage.saveHighScore(Math.floor(score));
    }

    questSystem.evaluateGameEnd(gameStats, winStatus);
    achievementSystem.checkAll(gameStats, currentLevel, winStatus);

    setTimeout(() => {
        isHandlingGameOver = false;
    }, 1000);
}

let thunderForceTimer = 0;

function drawGameOverAnimation() {
    dynamicBackground.render(currentLevel, loadedBgImages[currentLevel.id]);

    if (deathAnimTimer > 0) {
        deathAnimTimer--;

        if (winStatus) {
            slifer.vy = -10;
            slifer.y += slifer.vy;
            slifer.render(particleSystem);
            particleSystem.emitCollectBurst(slifer.x, slifer.y, "#FFD700");
        } else if (deathType === "lava") {
            // Lava death: Slifer slowly sinks submerged under the lava layer!
            slifer.y += 2.0;
            slifer.render(particleSystem);

            if (lavaSystem.isActive()) {
                lavaSystem.update();
                lavaSystem.render();
            }

            if (frameCount % 3 === 0) {
                particleSystem.emitLavaSpark(slifer.x + random(-25, 25), (lavaSystem ? lavaSystem.y : height - 50) + random(-5, 10));
            }
        } else if (!isBlackholed) {
            slifer.render(particleSystem);
            for (let i = platforms.length - 1; i >= 0; i--) {
                platforms[i].y -= Slifer.jumpForce;
                platforms[i].render(currentLevel);
                if (platforms[i].y < 0) platforms.splice(i, 1);
            }
            if (orichalcos) {
                orichalcos.y -= Slifer.jumpForce;
                orichalcos.render();
                if (orichalcos.y < 0) orichalcos = null;
            }
            if (lavaSystem.isActive()) {
                lavaSystem.render();
            }
        } else {
            // Spiral absorption into the Orichalcos Black Hole
            let progress = 1 - (deathAnimTimer / DEATH_ANIM_DURATION);
            if (orichalcos) {
                orichalcos.update();
                orichalcos.render();
                let pullX = lerp(slifer.x, orichalcos.x, 0.16);
                let pullY = lerp(slifer.y, orichalcos.y, 0.16);
                slifer.x = pullX;
                slifer.y = pullY;
            }
            let sizeScale = Math.max(0.01, 1 - progress * 0.98);
            push();
            translate(slifer.x, slifer.y);
            let spinSpeed = 0.2 + progress * 0.5;
            slifer.deathSpin = (slifer.deathSpin || 0) + spinSpeed;
            rotate(slifer.deathSpin);
            scale(sizeScale);
            translate(-slifer.x, -slifer.y);
            slifer.render(particleSystem);
            pop();
        }

        particleSystem.update();
        particleSystem.render();

        const alpha = map(deathAnimTimer, DEATH_ANIM_DURATION, 0, 0, winStatus ? 50 : 150);
        fill(winStatus ? 255 : 0, winStatus ? 255 : 0, winStatus ? 255 : 0, alpha);
        noStroke();
        rect(0, 0, width, height);
    }

    if (deathAnimTimer <= 0 && !UI.gameOverVisible) {
        const newAch = achievementSystem.getJustUnlocked();

        UI.showGameOver(
            score,
            currentLevel.name,
            GameStorage.getHighScore(),
            newAch.map(a => a),
            winStatus
        );

        resetSliferDimensions();
    }
}

function resetSliferDimensions() {
    Slifer.w = 80;
    Slifer.h = 80;
    Slifer.jumpForce = 10.5;
    Slifer.superJumpForce = 18;
    Slifer.speed = 7.2;
    config.GRAVITY = 0.25;
    config.MAX_FALLING_SPEED = 12;
    Platform.w = 110;
    Platform.h = 28;
    Platform.springW = 81;
    Platform.springH = 33;
    Platform.speed = 2;

    applyScaling();
}

// ═══════════════════════════════════════════
//  BACKGROUND & PAUSED
// ═══════════════════════════════════════════

function drawMenuBackground() {
    dynamicBackground.update(1);
    dynamicBackground.render(LEVELS[0], loadedBgImages[1]);

    if (sound.background && !sound.background.isPlaying() && !SoundManager.muted) {
        const profile = GameStorage.getProfile();
        const settings = profile.settings || { altMusic: false };
        if (!settings.altMusic && getAudioContext().state === 'running') {
            SoundManager.playMenuMusic();
        }
    }
}

function drawPausedScreen() {
    dynamicBackground.render(currentLevel, loadedBgImages[currentLevel.id]);

    platforms.forEach((p) => p.render(currentLevel));
    slifer.render(particleSystem);

    fill(0, 0, 0, 150);
    noStroke();
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255, 215, 0);
    textStyle(BOLD);
    text("⏸ DURAKLADI", width / 2, height / 2 - 20);

    textSize(14);
    fill(200);
    text("Devam etmek için herhangi bir tuşa bas", width / 2, height / 2 + 20);
}

// ═══════════════════════════════════════════
//  NOTIFICATION PROCESSING
// ═══════════════════════════════════════════

function processNotifications() {
    const justCompleted = questSystem.getJustCompleted();
    justCompleted.forEach((q) => {
        SoundManager.synthCollect("pot");
    });

    const justUnlocked = achievementSystem.getJustUnlocked();
    justUnlocked.forEach((id) => {
        const def = ACHIEVEMENT_DEFS.find((a) => a.id === id);
        if (def) {
            SoundManager.synthCollect("eye");
        }
    });
}

function triggerShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTimer = duration;
}

// ═══════════════════════════════════════════
//  INPUT HANDLING
// ═══════════════════════════════════════════

function keyPressed() {
    if (gameState === GAME_STATE.PAUSED) {
        gameState = GAME_STATE.PLAYING;
        SoundManager.stopMenuMusic();
        return;
    }
    if (gameState !== GAME_STATE.PLAYING) return;

    if (keyCode === ESCAPE) {
        gameState = GAME_STATE.PAUSED;
        SoundManager.playMenuMusic();
        return;
    }

    if ((keyCode === 70 || key === 'f' || key === 'F') && gameStats.energy >= 100 && (!gameStats.thunderForceCooldown || gameStats.thunderForceCooldown <= 0)) {
        activateThunderForce();
    }

    if (
        (keyCode === LEFT_ARROW || keyCode === 65) &&
        slifer.vx !== -Slifer.speed
    ) {
        slifer.vx = -Slifer.speed;
        slifer.direction = Slifer.Direction.LEFT;
    } else if (
        (keyCode === RIGHT_ARROW || keyCode === 68) &&
        slifer.vx !== Slifer.speed
    ) {
        slifer.vx = Slifer.speed;
        slifer.direction = Slifer.Direction.RIGHT;
    }
}

function keyReleased() {
    if (gameState !== GAME_STATE.PLAYING) return;
    if (
        !keyIsDown(LEFT_ARROW) &&
        !keyIsDown(RIGHT_ARROW) &&
        !keyIsDown(65) &&
        !keyIsDown(68) &&
        slifer.vx !== 0
    ) {
        slifer.vx = 0;
    }
}

function touchStarted() {
    if (gameState === GAME_STATE.MENU || gameState === GAME_STATE.GAME_OVER) {
        SoundManager.init();
        return;
    }
    if (gameState === GAME_STATE.PAUSED) {
        gameState = GAME_STATE.PLAYING;
        SoundManager.stopMenuMusic();
        return;
    }
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // Check if tapped on energy bar
    if (gameStats.energy >= 100 && (!gameStats.thunderForceCooldown || gameStats.thunderForceCooldown <= 0) && touches.length > 0) {
        let tx = touches[0].x;
        let ty = touches[0].y;
        if (tx > width - 50 && ty > height / 2 - 100 && ty < height / 2 + 100) {
            activateThunderForce();
            return false;
        }
    }

    if (mouseX < width / 2 && slifer.vx !== -Slifer.speed) {
        slifer.vx = -Slifer.speed;
        slifer.direction = Slifer.Direction.LEFT;
    } else if (mouseX >= width / 2 && slifer.vx !== -Slifer.speed) {
        slifer.vx = Slifer.speed;
        slifer.direction = Slifer.Direction.RIGHT;
    }
    return false;
}

function activateThunderForce() {
    if (gameStats.thunderForceCooldown > 0) return;
    gameStats.energy = 0;
    gameStats.thunderForceCooldown = 600; // 10 seconds cooldown at 60 FPS
    gameStats.thunderForceCount = (gameStats.thunderForceCount || 0) + 1;
    thunderForceTimer = 90;
    
    SoundManager.playRoar();
    
    slifer.x = width / 2;
    let targetY = height - 50;
    if (typeof lavaSystem !== 'undefined' && lavaSystem.isActive()) {
        targetY = Math.min(targetY, lavaSystem.y - 40);
    }
    slifer.y = targetY;
    slifer.vy = -Slifer.superJumpForce * 2.5;
    
    score += 2000;
    
    for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].y > height / 2) {
            particleSystem.emitDeathBurst(platforms[i].x, platforms[i].y);
            platforms.splice(i, 1);
        }
    }
    
    config.STEPS = 9;
    stepSize = Math.floor(height / config.STEPS);
    for (let y = 0; y > -height * 2; y -= stepSize) {
        const x = Platform.w / 2 + (width - Platform.w) * Math.random();
        platforms.push(new Platform(x, y, Platform.platformTypes.STABLE, false));
    }
    
    monsterSystem.clear();
    meteorSystem.clear();
}

function touchMoved() {
    if (gameState !== GAME_STATE.PLAYING) return;
    touchStarted();
}

function touchEnded() {
    if (gameState !== GAME_STATE.PLAYING) return;
    if (slifer.vx !== 0) slifer.vx = 0;
}

// ═══════════════════════════════════════════
//  WINDOW RESIZE & SCALING
// ═══════════════════════════════════════════

function windowResized() {
    let container = document.getElementById('game-container');
    if (container) {
        resizeCanvas(container.clientWidth, container.clientHeight);
    }
    config.STEPS = 9;
    stepSize = Math.floor(height / config.STEPS);

    resetSliferDimensions();
}

function applyScaling() {
    config.STEPS = 9;
    stepSize = Math.floor(height / config.STEPS);
    isMobile = window.matchMedia("only screen and (max-width: 768px)").matches;

    if (height > 0) {
        const REF_HEIGHT = 1289;
        const heightRatio = height / REF_HEIGHT;
        Slifer.jumpForce *= heightRatio;
        Slifer.superJumpForce *= heightRatio;
        config.GRAVITY *= heightRatio;
        config.MAX_FALLING_SPEED *= heightRatio;
        Slifer.h *= heightRatio;
        Platform.h *= heightRatio;
        Platform.springH *= heightRatio;
    }
    if (width > 0) {
        const REF_WIDTH = 725;
        const widthRatio = width / REF_WIDTH;
        Slifer.speed *= widthRatio;
        Slifer.w *= widthRatio;
        Platform.w *= widthRatio;
        Platform.springW *= widthRatio;
    }
}

function returnToMenu() {
    gameState = GAME_STATE.MENU;
    UI.showMenu();
    SoundManager.playMenuMusic();
}

function mousePressed() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
        if (gameState === GAME_STATE.MENU) SoundManager.playMenuMusic();
    }
}
