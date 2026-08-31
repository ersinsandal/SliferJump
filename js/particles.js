/**
 * Particle class represents a single visual particle effect.
 * Optimized for high performance and zero memory allocation during render loops.
 */
class Particle {
    constructor(x, y, vx, vy, life, size, col, gravity = 0, decay = 1, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.gravity = gravity;
        this.decay = decay;
        this.shape = shape;
        this.alpha = 255;

        // Fast color extraction (pre-computed once, never during render!)
        if (typeof col === 'string') {
            if (col.startsWith('#')) {
                let hex = col.slice(1);
                if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                let num = parseInt(hex, 16) || 0;
                this.r = (num >> 16) & 255;
                this.g = (num >> 8) & 255;
                this.b = num & 255;
            } else {
                this.r = 255; this.g = 215; this.b = 0;
            }
        } else if (col && typeof col === 'object') {
            if (typeof red === 'function' && col.levels) {
                this.r = col.levels[0] !== undefined ? col.levels[0] : 255;
                this.g = col.levels[1] !== undefined ? col.levels[1] : 215;
                this.b = col.levels[2] !== undefined ? col.levels[2] : 0;
            } else if (col.r !== undefined) {
                this.r = col.r; this.g = col.g; this.b = col.b;
            } else if (typeof red === 'function') {
                this.r = red(col); this.g = green(col); this.b = blue(col);
            } else {
                this.r = 255; this.g = 215; this.b = 0;
            }
        } else {
            this.r = 255; this.g = 255; this.b = 255;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.alpha = (this.life / this.maxLife) * 255;
    }

    render() {
        if (this.life <= 0 || this.alpha <= 0) return;
        
        fill(this.r, this.g, this.b, this.alpha);
        noStroke();

        if (this.shape === 'circle') {
            ellipse(this.x, this.y, this.size);
        } else if (this.shape === 'square') {
            let half = this.size * 0.5;
            rect(this.x - half, this.y - half, this.size, this.size);
        } else if (this.shape === 'spark') {
            push();
            translate(this.x, this.y);
            rotate(atan2(this.vy, this.vx));
            ellipse(0, 0, this.size * 2, this.size * 0.5);
            pop();
        } else if (this.shape === 'star') {
            push();
            translate(this.x, this.y);
            this.drawStar(0, 0, this.size * 0.5, this.size, 5);
            pop();
        }
    }
    
    drawStar(x, y, radius1, radius2, npoints) {
        let angle = TWO_PI / npoints;
        let halfAngle = angle / 2.0;
        beginShape();
        for (let a = -HALF_PI; a < TWO_PI - HALF_PI; a += angle) {
            let sx = x + cos(a) * radius2;
            let sy = y + sin(a) * radius2;
            vertex(sx, sy);
            sx = x + cos(a + halfAngle) * radius1;
            sy = y + sin(a + halfAngle) * radius1;
            vertex(sx, sy);
        }
        endShape(CLOSE);
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * ParticleSystem manages collections of particles and provides emitters.
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.isMobile = (typeof isMobileDevice !== 'undefined') ? isMobileDevice : false;
        this.maxParticles = (typeof config !== 'undefined' && config.MAX_PARTICLES) ? config.MAX_PARTICLES : (this.isMobile ? 90 : 200);
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.update();
            if (p.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        if (this.particles.length === 0) return;
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].render();
        }
    }
    
    addParticle(p) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(p);
        } else {
            // Replace oldest particle with zero array shifting overhead
            this.particles[0] = p;
            this.particles.push(this.particles.shift());
        }
    }

    emitJumpDust(x, y, c) {
        let count = this.isMobile ? random(4, 7) : random(8, 12);
        for (let i = 0; i < count; i++) {
            let vx = random(-2, 2);
            let vy = random(-0.5, 0.5);
            let size = random(3, 8);
            let life = random(20, 35);
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, -0.05, 1, 'circle'));
        }
    }

    emitFireBreath(x, y, direction) {
        let count = this.isMobile ? random(2, 3) : random(3, 5);
        for (let i = 0; i < count; i++) {
            let vx = direction * random(3, 6);
            let vy = random(-1, 1);
            let size = random(10, 20);
            let life = random(25, 45);
            let col = { r: 255, g: random(100, 200), b: 0 };
            this.addParticle(new Particle(x, y, vx, vy, life, size, col, -0.1, 1, 'circle'));
        }
    }

    emitDragonFlame(x, y, vx = 0, vy = 0) {
        let count = this.isMobile ? random(2, 4) : random(4, 7);
        for (let i = 0; i < count; i++) {
            let pvx = vx + random(-2.5, 2.5);
            let pvy = vy + random(-2.5, 2.5);
            let size = random(12, 26);
            let life = random(20, 40);
            let col = { r: 255, g: random(60, 200), b: random(0, 30) };
            let shape = random() > 0.4 ? 'circle' : 'spark';
            this.addParticle(new Particle(x, y, pvx, pvy, life, size, col, -0.05, 1.2, shape));
        }
    }

    emitCollectBurst(x, y, c) {
        let count = this.isMobile ? random(10, 16) : random(20, 30);
        for (let i = 0; i < count; i++) {
            let angle = random(TWO_PI);
            let speed = random(2, 6);
            let vx = cos(angle) * speed;
            let vy = sin(angle) * speed;
            let size = random(5, 12);
            let life = random(25, 50);
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, 0.1, 1, 'star'));
        }
    }

    emitDeathBurst(x, y) {
        let count = this.isMobile ? 20 : 40;
        for (let i = 0; i < count; i++) {
            let angle = random(TWO_PI);
            let speed = random(1, 8);
            let vx = cos(angle) * speed;
            let vy = sin(angle) * speed;
            let size = random(5, 15);
            let life = random(30, 60);
            let col = { r: random(50, 150), g: 0, b: random(100, 200) };
            this.addParticle(new Particle(x, y, vx, vy, life, size, col, 0.2, 1, 'square'));
        }
    }

    emitMeteorTrail(x, y) {
        let count = this.isMobile ? 1 : random(2, 3);
        for (let i = 0; i < count; i++) {
            let vx = random(-1, 1);
            let vy = random(-1, -3);
            let size = random(8, 15);
            let life = random(15, 30);
            let col = { r: 255, g: random(150, 255), b: 0 };
            this.addParticle(new Particle(x, y, vx, vy, life, size, col, -0.05, 1, 'spark'));
        }
    }

    emitMeteorImpact(x, y) {
        let count = this.isMobile ? 12 : 25;
        for (let i = 0; i < count; i++) {
            let angle = random(TWO_PI);
            let speed = random(3, 10);
            let vx = cos(angle) * speed;
            let vy = sin(angle) * speed;
            let size = random(8, 18);
            let life = random(25, 50);
            let col = { r: 255, g: random(50, 150), b: 0 };
            this.addParticle(new Particle(x, y, vx, vy, life, size, col, 0.2, 1, 'square'));
        }
    }

    emitLavaSpark(x, y) {
        let count = 1;
        for (let i = 0; i < count; i++) {
            let vx = random(-1, 1);
            let vy = random(-2, -5);
            let size = random(4, 9);
            let life = random(20, 45);
            let col = { r: 255, g: random(100, 200), b: 0 };
            this.addParticle(new Particle(x, y, vx, vy, life, size, col, 0.1, 1, 'spark'));
        }
    }

    emitRealmTransition() {
        if (typeof width === 'undefined' || typeof height === 'undefined') return;
        let count = this.isMobile ? 40 : 80;
        for (let i = 0; i < count; i++) {
            let x = random(width);
            let y = random(-200, 0);
            let vx = random(-1, 1);
            let vy = random(2, 8);
            let size = random(5, 14);
            let life = random(50, 90);
            let col = { r: 255, g: 215, b: 0 };
            this.addParticle(new Particle(x, y, vx, vy, life, size, col, 0.05, 1, 'star'));
        }
    }

    emitShieldGlow(x, y, radius) {
        if (random() > 0.3) return;
        let angle = random(TWO_PI);
        let dist = random(radius - 5, radius + 5);
        let px = x + cos(angle) * dist;
        let py = y + sin(angle) * dist;
        let vx = random(-0.5, 0.5);
        let vy = random(-1, 0);
        let size = random(3, 6);
        let life = random(15, 30);
        let col = { r: 255, g: 223, b: 0 };
        this.addParticle(new Particle(px, py, vx, vy, life, size, col, -0.01, 1, 'circle'));
    }

    clear() {
        this.particles = [];
    }
}

