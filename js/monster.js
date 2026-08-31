class Monster {
    constructor(x, y, typeConfig) {
        this.x = x;
        this.y = y;
        this.typeConfig = typeConfig || {};
        this.vx = this.typeConfig.speed || 1;
        this.alive = true;
        this.visible = true;
        this.stateTimer = 0;
        this.platformRef = null;
        this.w = 40;
        this.h = 40;
    }

    update(sliferX, sliferY) {}
    render() {}
    getHitbox() { return { x: this.x - this.w/2, y: this.y - this.h, w: this.w, h: this.h }; }
    isDead() { return !this.alive; }
}

class Kuriboh extends Monster {
    constructor(x, y, typeConfig) {
        super(x, y, typeConfig);
        this.w = 30;
        this.h = 30;
        this.vx = 2;
    }
    
    update(sliferX, sliferY) {
        this.x += this.vx;
        // Assume patrol bounds ~50px left/right
        if (this.platformRef) {
            if (this.x > this.platformRef.x + this.platformRef.w - 15) this.vx = -abs(this.vx);
            if (this.x < this.platformRef.x + 15) this.vx = abs(this.vx);
        } else {
            if (this.x > width - 15) this.vx = -abs(this.vx);
            if (this.x < 15) this.vx = abs(this.vx);
        }
    }

    render() {
        push();
        translate(this.x, this.y - this.h/2);
        
        // Feet
        fill(255, 200, 0);
        noStroke();
        ellipse(-8, 12, 10, 8);
        ellipse(8, 12, 10, 8);
        
        // Body (fur)
        fill(101, 67, 33);
        ellipse(0, 0, this.w, this.h);
        stroke(80, 50, 20);
        strokeWeight(2);
        for(let i=0; i<TWO_PI; i+=PI/8) {
            line(cos(i)*10, sin(i)*10, cos(i)*18, sin(i)*18);
        }
        
        // Eyes
        noStroke();
        fill(0, 255, 0);
        ellipse(-6, -2, 8, 10);
        ellipse(6, -2, 8, 10);
        fill(0);
        ellipse(-6, -2, 2, 6);
        ellipse(6, -2, 2, 6);
        
        pop();
    }
}

class ManEaterBug extends Monster {
    constructor(x, y, typeConfig) {
        super(x, y, typeConfig);
        this.w = 35;
        this.h = 25;
        this.lungeSpeed = 6;
        this.lungeRange = 150;
        this.lunging = false;
        this.startX = x;
    }

    update(sliferX, sliferY) {
        if (!this.lunging) {
            if (abs(sliferX - this.x) < this.lungeRange && sliferY < this.y && sliferY > this.y - 150) {
                this.lunging = true;
                this.vx = (sliferX > this.x) ? this.lungeSpeed : -this.lungeSpeed;
            }
        } else {
            this.x += this.vx;
            if (abs(this.x - this.startX) > this.lungeRange + 50) {
                this.lunging = false;
                this.startX = this.x;
            }
        }
    }

    render() {
        push();
        translate(this.x, this.y - this.h/2);
        
        // Legs
        stroke(128, 0, 128);
        strokeWeight(3);
        line(-10, 5, -20, 15);
        line(0, 5, 0, 15);
        line(10, 5, 20, 15);

        // Body
        noStroke();
        fill(128, 0, 128); // Purple
        arc(0, 5, this.w, this.h * 1.5, PI, TWO_PI);
        
        // Eyes
        fill(255, 0, 0);
        ellipse((this.vx>0?1:-1)*10, -5, 6, 6);
        
        // Pincers
        fill(200);
        if (this.vx > 0) {
            triangle(15, -5, 25, -10, 20, 0);
            triangle(15, 0, 25, 10, 20, -5);
        } else {
            triangle(-15, -5, -25, -10, -20, 0);
            triangle(-15, 0, -25, 10, -20, -5);
        }
        pop();
    }
}

class DarkMagicianPhantom extends Monster {
    constructor(x, y, typeConfig) {
        super(x, y, typeConfig);
        this.w = 30;
        this.h = 60;
        this.phaseTimer = 0;
        this.phaseInterval = 120;
        this.isPhased = false;
        this.baseY = y;
    }

    update(sliferX, sliferY) {
        this.x += sin(frameCount * 0.02) * 1.5;
        this.y = this.baseY + sin(frameCount * 0.05) * 10;
        
        this.phaseTimer++;
        if (this.phaseTimer > this.phaseInterval) {
            this.phaseTimer = 0;
            this.isPhased = !this.isPhased;
            this.visible = !this.isPhased;
        }
    }

    render() {
        push();
        translate(this.x, this.y - this.h/2);
        
        let alpha = this.isPhased ? 50 : 255;
        
        // Robe
        fill(100, 0, 150, alpha);
        noStroke();
        quad(-10, -10, 10, -10, 15, 30, -15, 30);
        
        // Hat
        fill(80, 0, 120, alpha);
        triangle(-15, -10, 15, -10, 0, -35);
        
        // Face/Eyes
        if (!this.isPhased) {
            fill(0, 255, 255);
            ellipse(-5, -5, 4, 4);
            ellipse(5, -5, 4, 4);
        }
        
        // Staff
        stroke(200, 150, 0, alpha);
        strokeWeight(3);
        line(12, -20, 25, 25);
        noStroke();
        fill(0, 255, 255, alpha);
        ellipse(12, -20, 10, 10);
        
        pop();
    }
}

class BlueEyesSpirit extends Monster {
    constructor(x, y, typeConfig) {
        super(x, y, typeConfig);
        this.w = 50;
        this.h = 50;
        this.laserTimer = 180;
        this.isCharging = false;
        this.laserActive = false;
        this.laserDirection = (x < width/2) ? 1 : -1;
    }

    update(sliferX, sliferY) {
        this.laserTimer--;
        
        if (this.laserTimer > 60) {
            this.isCharging = false;
            this.laserActive = false;
        } else if (this.laserTimer > 30) {
            this.isCharging = true;
            this.laserActive = false;
        } else if (this.laserTimer > 0) {
            this.isCharging = false;
            this.laserActive = true;
        } else {
            this.laserTimer = 180 + random(60);
            this.laserActive = false;
        }
    }

    render() {
        push();
        translate(this.x, this.y - this.h/2);
        
        // Head
        fill(200, 220, 255);
        stroke(100, 150, 255);
        strokeWeight(2);
        
        let d = this.laserDirection;
        // Snout
        triangle(d*10, 5, d*30, 5, d*15, -5);
        // Main head
        ellipse(0, 0, 30, 25);
        // Horns
        triangle(-10, -10, -5, -5, -20, -25);
        triangle(10, -10, 5, -5, 20, -25);
        
        // Eyes
        noStroke();
        if (this.isCharging) {
            fill(0, 255, 255, map(sin(frameCount * 0.5), -1, 1, 100, 255));
            ellipse(d*5, -3, 8, 8);
        } else {
            fill(0, 200, 255);
            ellipse(d*5, -3, 5, 5);
        }
        
        pop();

        if (this.laserActive) {
            push();
            let startX = this.x + (this.laserDirection * 20);
            let w = (this.laserDirection === 1) ? (width - startX) : startX;
            let drawX = (this.laserDirection === 1) ? startX : 0;
            
            fill(150, 200, 255, 200);
            noStroke();
            rect(drawX, this.y - this.h/2 - 10, w, 20);
            fill(255);
            rect(drawX, this.y - this.h/2 - 4, w, 8);
            pop();
        }
    }

    checkLaserCollision(sliferX, sliferY, sliferW, sliferH) {
        if (!this.laserActive) return false;
        let ly = this.y - this.h/2;
        return (sliferY < ly + 10 && sliferY + sliferH > ly - 10);
    }
}

class MonsterSystem {
    constructor() {
        this.monsters = [];
    }

    spawnMonster(x, y, realmConfig) {
        if (!realmConfig || !realmConfig.monsterTypes || realmConfig.monsterTypes.length === 0) return;
        const typeKey = realmConfig.monsterTypes[Math.floor(Math.random() * realmConfig.monsterTypes.length)];
        const typeConfig = MONSTER_TYPES[typeKey];
        if (!typeConfig) return;

        let m = null;
        switch (typeKey) {
            case "KURIBOH": m = new Kuriboh(x, y, typeConfig); break;
            case "MAN_EATER_BUG": m = new ManEaterBug(x, y, typeConfig); break;
            case "DARK_MAGICIAN_PHANTOM": m = new DarkMagicianPhantom(x, y, typeConfig); break;
            case "BLUE_EYES_SPIRIT": m = new BlueEyesSpirit(x, y, typeConfig); break;
        }
        
        if (m) this.monsters.push(m);
        return m;
    }

    update(sliferX, sliferY) {
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            let m = this.monsters[i];
            m.update(sliferX, sliferY);
            if (m.isDead()) {
                this.monsters.splice(i, 1);
            }
        }
    }

    render() {
        for (let m of this.monsters) m.render();
    }

    checkCollision(sliferX, sliferY, sliferW, sliferH) {
        for (let m of this.monsters) {
            if (m instanceof DarkMagicianPhantom && m.isPhased) continue;
            
            let hb = m.getHitbox();
            let sLeft = sliferX - sliferW / 2;
            let sRight = sliferX + sliferW / 2;
            let sTop = sliferY - sliferH / 2;
            let sBottom = sliferY + sliferH / 2;

            let overlap = (sLeft < hb.x + hb.w && sRight > hb.x &&
                           sTop < hb.y + hb.h && sBottom > hb.y);
            
            if (overlap) {
                return m;
            }
        }
        return null;
    }

    checkLaserCollision(sliferX, sliferY, sliferW, sliferH) {
        for (let m of this.monsters) {
            if (m instanceof BlueEyesSpirit && m.checkLaserCollision(sliferX, sliferY, sliferW, sliferH)) {
                return true;
            }
        }
        return false;
    }

    removeMonster(m) {
        let idx = this.monsters.indexOf(m);
        if (idx !== -1) {
            this.monsters.splice(idx, 1);
        }
    }

    scrollDown(amount) {
        for (let m of this.monsters) {
            m.y += amount;
            if (m.baseY !== undefined) m.baseY += amount;
        }
    }

    removeOffscreen() {
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            if (this.monsters[i].y > height + 100) {
                this.monsters.splice(i, 1);
            }
        }
    }

    clear() {
        this.monsters = [];
    }
}
