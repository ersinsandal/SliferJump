class Collectible {
    static w = 44;
    static h = 64;

    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.collected = false;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.glowPhase = Math.random() * Math.PI * 2;
    }

    update() {
        this.bobPhase += 0.04;
        this.glowPhase += 0.03;
    }

    render() {
        if (this.collected) return;
        push();
        translate(this.x, this.y);
        let bobY = Math.sin(this.bobPhase) * 4;
        translate(0, bobY);
        
        if (this.type.id === 'eye') {
            this._drawEye();
        } else {
            this._drawCard();
        }
        pop();
    }
    
    _drawEye() {
        const size = Collectible.w;
        const ctx = drawingContext;
        const isMob = (typeof isMobileDevice !== 'undefined' && isMobileDevice);

        push();
        imageMode(CENTER);

        // Golden yellow glow on desktop
        if (!isMob) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        }

        // Solid golden yellow circle background
        fill(255, 215, 0); // Bright golden yellow
        stroke(218, 165, 32); // Darker gold border
        strokeWeight(2.5);
        ellipse(0, 0, size, size);

        // Inner subtle golden ring
        noFill();
        stroke(255, 245, 120, 200);
        strokeWeight(1.2);
        ellipse(0, 0, size * 0.82, size * 0.82);

        if (!isMob) ctx.shadowBlur = 0;

        // Millennium Eye image/symbol inside the golden circle
        if (typeof Platform !== 'undefined' && Platform.springImage && Platform.springImage.width > 0) {
            let imgW = size * 0.65;
            let imgH = imgW * (Platform.springImage.height / Platform.springImage.width);
            image(Platform.springImage, 0, 0, imgW, imgH);
        } else {
            textSize(22);
            textAlign(CENTER, CENTER);
            fill(0);
            noStroke();
            text('👁', 0, 0);
        }
        pop();
    }

    _drawCard() {
        const cw = Collectible.w;
        const ch = Collectible.h;
        const r = 3;
        const ctx = drawingContext;
        const isMob = (typeof isMobileDevice !== 'undefined' && isMobileDevice);

        rectMode(CENTER);
        imageMode(CENTER);

        // Card Glow on desktop
        if (!isMob) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(218, 165, 32, 0.6)';
        }

        // YGO Spell/Normal Card Background (Goldenrod / Yellow)
        fill(218, 165, 32);
        stroke(92, 64, 51); // Dark brown border
        strokeWeight(2);
        rect(0, 0, cw, ch, r);

        // Inner thin brown border
        strokeWeight(1);
        rect(0, 0, cw - 4, ch - 4, r - 1);

        if (!isMob) ctx.shadowBlur = 0;

        // Art Frame (Light brown/yellowish square, upper-middle aligned)
        let artY = -ch * 0.15;
        let artW = cw * 0.76;
        let artH = ch * 0.52;
        fill(235, 212, 148);
        stroke(92, 64, 51);
        strokeWeight(1.5);
        rect(0, artY, artW, artH);

        // Bottom text/flavor box area (clean brown frame, no text)
        let descY = ch * 0.28;
        let descH = ch * 0.26;
        fill(225, 198, 130);
        stroke(92, 64, 51);
        strokeWeight(1);
        rect(0, descY, artW, descH);

        // Icon inside art frame
        textAlign(CENTER, CENTER);
        noStroke();
        if (this.type.id === 'swords') {
            textSize(18); fill(0); text('⚔️', 0, artY);
        } else if (this.type.id === 'reborn') {
            textSize(18); fill(0); text('☥', 0, artY);
        } else if (this.type.id === 'pot') {
            textSize(18); fill(0); text('🏺', 0, artY);
        }
    }

    getHitbox() {
        return {
            x: this.x - Collectible.w / 2,
            y: this.y - Collectible.h / 2,
            w: Collectible.w,
            h: Collectible.h
        };
    }
}

class ActivePowerUp {
    constructor(type) {
        this.type = type;
        this.maxFrames = type.duration || 600; // 10 seconds (600 frames)
        this.remainingFrames = this.maxFrames;
    }

    update() {
        this.remainingFrames--;
    }

    isActive() {
        return this.remainingFrames > 0;
    }

    getProgress() {
        return Math.max(0, this.remainingFrames / this.maxFrames);
    }
}

class CollectibleSystem {
    constructor() {
        this.collectibles = [];
        this.activePowerUps = [];
    }

    getScoreMultiplier() {
        let multi = 1;
        for (let p of this.activePowerUps) {
            if (p.type.id === 'pot') multi *= (p.type.multi || 2);
        }
        return multi;
    }

    scrollDown(amount) {
        for (let c of this.collectibles) c.y += amount;
    }

    removeOffscreen() {
        this.collectibles = this.collectibles.filter(c => c.y < height + 100);
    }

    clear() {
        this.collectibles = [];
        this.activePowerUps = [];
    }

    spawnCollectible(x, y) {
        const types = Object.values(COLLECTIBLE_TYPES);
        // Weights: eye=4 (frequent for Orichalcos protection), swords=2, reborn=2, pot=2
        const weights = [4, 2, 2, 2];
        let total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let cumulative = 0;
        let chosenType = types[0];
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (r <= cumulative) { chosenType = types[i]; break; }
        }
        this.collectibles.push(new Collectible(x, y, chosenType));
    }

    update() {
        for (let c of this.collectibles) c.update();
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            this.activePowerUps[i].update();
            if (!this.activePowerUps[i].isActive()) {
                if (this.activePowerUps[i].type.id === 'swords' && typeof slifer !== 'undefined') {
                    slifer.isShielded = false;
                }
                this.activePowerUps.splice(i, 1);
            }
        }
    }

    render() {
        for (let c of this.collectibles) c.render();
    }

    checkCollection(playerX, playerY, playerW, playerH) {
        let pLeft = playerX - playerW / 2;
        let pRight = playerX + playerW / 2;
        let pTop = playerY - playerH / 2;
        let pBottom = playerY + playerH / 2;

        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            let c = this.collectibles[i];
            if (!c.collected) {
                let box = c.getHitbox();
                if (
                    pLeft < box.x + box.w &&
                    pRight > box.x &&
                    pTop < box.y + box.h &&
                    pBottom > box.y
                ) {
                    c.collected = true;
                    this.activatePowerUp(c.type);
                    this.collectibles.splice(i, 1);
                    return c.type;
                }
            }
        }
        return null;
    }

    activatePowerUp(type) {
        if (type.id === 'swords') {
            if (typeof slifer !== 'undefined') slifer.isShielded = true;
        }
        if (type.duration > 0) {
            // Remove existing same type first (reset timer to 10s)
            this.activePowerUps = this.activePowerUps.filter(p => p.type.id !== type.id);
            this.activePowerUps.push(new ActivePowerUp(type));
        }
    }

    hasShield() {
        return typeof slifer !== 'undefined' && slifer.isShielded;
    }

    breakShield() {
        if (typeof slifer !== 'undefined') slifer.isShielded = false;
        this.activePowerUps = this.activePowerUps.filter(p => p.type.id !== 'swords');
        if (typeof particleSystem !== 'undefined' && typeof slifer !== 'undefined') {
            particleSystem.emitDeathBurst(slifer.x, slifer.y);
        }
    }

    // ── Compact Top-Right HUD Bar (English names, duration bars) ──
    renderHUD(rightEdgeX, startY) {
        let timedPowerUps = this.activePowerUps.filter(p => p.type.duration > 0);
        if (timedPowerUps.length === 0) return;

        push();
        const panelW = 162;
        const panelPad = 6;
        const barW = panelW - panelPad * 2 - 20; // 130px bar
        const barH = 5;
        const rowH = 26;
        const panelH = timedPowerUps.length * rowH + panelPad * 2;
        const panelX = width - panelW - 10;
        const panelY = startY;

        // Panel background
        fill(10, 15, 30, 210);
        stroke(255, 215, 0, 90);
        strokeWeight(1);
        rectMode(CORNER);
        rect(panelX, panelY, panelW, panelH, 6);

        timedPowerUps.forEach((p, i) => {
            let prog = p.getProgress();
            let y = panelY + panelPad + i * rowH;
            let x = panelX + panelPad;

            // Icon
            noStroke();
            textAlign(LEFT, CENTER);
            textSize(11);
            fill(255);
            text(p.type.hudIcon || '★', x + 1, y + rowH * 0.28);

            // Label (English Name)
            textSize(7.2);
            textStyle(BOLD);
            fill(...(p.type.hudColor || [200, 200, 200]));
            text(p.type.hudLabel || p.type.name || p.type.id, x + 16, y + rowH * 0.28);
            textStyle(NORMAL);

            // Seconds Remaining
            let secsLeft = Math.ceil(p.remainingFrames / 60);
            textAlign(RIGHT, CENTER);
            textSize(7.5);
            fill(240, 240, 240, 230);
            text(secsLeft + 's', panelX + panelW - panelPad - 2, y + rowH * 0.28);

            // Bar background
            fill(0, 0, 0, 180);
            rect(x + 16, y + rowH * 0.60, barW, barH, 2.5);

            // Bar fill
            let bc = p.type.barColor || [255, 255, 0];
            fill(...bc, 230);
            if (prog > 0) {
                rect(x + 16, y + rowH * 0.60, barW * prog, barH, 2.5);
            }
        });

        pop();
    }
}
