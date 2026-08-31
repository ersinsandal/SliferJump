/**
 * Particle class represents a single visual particle effect.
 */
class Particle {
    constructor(x, y, vx, vy, life, size, color, gravity = 0, decay = 1, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color; // p5 color object
        this.alpha = 255;
        this.gravity = gravity;
        this.decay = decay;
        this.shape = shape;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.alpha = map(this.life, 0, this.maxLife, 0, 255);
    }

    render() {
        if (this.isDead()) return;
        
        push();
        noStroke();
        
        // Clone color and set alpha
        let c = color(red(this.color), green(this.color), blue(this.color), this.alpha);
        fill(c);
        
        translate(this.x, this.y);
        
        if (this.shape === 'circle') {
            ellipse(0, 0, this.size);
        } else if (this.shape === 'square') {
            rectMode(CENTER);
            rect(0, 0, this.size, this.size);
        } else if (this.shape === 'star') {
            this.drawStar(0, 0, this.size / 2, this.size, 5);
        } else if (this.shape === 'spark') {
            rotate(atan2(this.vy, this.vx));
            ellipse(0, 0, this.size * 2, this.size * 0.5);
        }
        
        pop();
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
        this.maxParticles = (typeof config !== 'undefined' && config.MAX_PARTICLES) ? config.MAX_PARTICLES : 200;
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
        for (let p of this.particles) {
            p.render();
        }
    }
    
    addParticle(p) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(p);
        } else {
            // Replace oldest particle
            this.particles[0] = p;
            // Shift array to keep order (optional, but good for rendering)
            this.particles.push(this.particles.shift());
        }
    }

    emitJumpDust(x, y, c) {
        let count = random(8, 12);
        for (let i = 0; i < count; i++) {
            let vx = random(-2, 2);
            let vy = random(-0.5, 0.5);
            let size = random(3, 8);
            let life = random(20, 40);
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, -0.05, 1, 'circle'));
        }
    }

    emitFireBreath(x, y, direction) {
        let count = random(3, 5);
        for (let i = 0; i < count; i++) {
            let vx = direction * random(3, 6);
            let vy = random(-1, 1);
            let size = random(10, 20);
            let life = random(30, 50);
            let c = color(255, random(100, 200), 0); // Orange-red
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, -0.1, 1, 'circle'));
        }
    }

    emitDragonFlame(x, y, vx = 0, vy = 0) {
        let count = random(4, 7);
        for (let i = 0; i < count; i++) {
            let pvx = vx + random(-2.5, 2.5);
            let pvy = vy + random(-2.5, 2.5);
            let size = random(12, 28);
            let life = random(25, 45);
            let r = 255;
            let g = random(60, 200);
            let b = random(0, 30);
            let shape = random() > 0.4 ? 'circle' : 'spark';
            this.addParticle(new Particle(x, y, pvx, pvy, life, size, color(r, g, b), -0.05, 1.2, shape));
        }
    }

    emitCollectBurst(x, y, c) {
        let count = random(20, 30);
        for (let i = 0; i < count; i++) {
            let angle = random(TWO_PI);
            let speed = random(2, 6);
            let vx = cos(angle) * speed;
            let vy = sin(angle) * speed;
            let size = random(5, 12);
            let life = random(30, 60);
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, 0.1, 1, 'star'));
        }
    }

    emitDeathBurst(x, y) {
        let count = 40;
        for (let i = 0; i < count; i++) {
            let angle = random(TWO_PI);
            let speed = random(1, 8);
            let vx = cos(angle) * speed;
            let vy = sin(angle) * speed;
            let size = random(5, 15);
            let life = random(40, 80);
            let c = color(random(50, 150), 0, random(100, 200)); // Dark purple
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, 0.2, 1, 'square'));
        }
    }

    emitMeteorTrail(x, y) {
        let count = random(2, 3);
        for (let i = 0; i < count; i++) {
            let vx = random(-1, 1);
            let vy = random(-1, -3); // Going up mostly, relative to falling meteor
            let size = random(8, 15);
            let life = random(20, 40);
            let c = color(255, random(150, 255), 0); // Yellow-orange
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, -0.05, 1, 'spark'));
        }
    }

    emitMeteorImpact(x, y) {
        let count = 25;
        for (let i = 0; i < count; i++) {
            let angle = random(TWO_PI);
            let speed = random(3, 10);
            let vx = cos(angle) * speed;
            let vy = sin(angle) * speed;
            let size = random(8, 20);
            let life = random(30, 60);
            let c = color(255, random(50, 150), 0); // Red-orange
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, 0.2, 1, 'square'));
        }
    }

    emitLavaSpark(x, y) {
        let count = random(1, 2);
        for (let i = 0; i < count; i++) {
            let vx = random(-1, 1);
            let vy = random(-2, -5);
            let size = random(4, 10);
            let life = random(30, 60);
            let c = color(255, random(100, 200), 0);
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, 0.1, 1, 'spark'));
        }
    }

    emitRealmTransition() {
        if (typeof width === 'undefined' || typeof height === 'undefined') return;
        let count = 100;
        for (let i = 0; i < count; i++) {
            let x = random(width);
            let y = random(-200, 0);
            let vx = random(-1, 1);
            let vy = random(2, 8);
            let size = random(5, 15);
            let life = random(60, 120);
            let c = color(255, 215, 0); // Gold
            this.addParticle(new Particle(x, y, vx, vy, life, size, c, 0.05, 1, 'star'));
        }
    }

    emitShieldGlow(x, y, radius) {
        // Subtle emission, meant to be called continuously
        if (random() > 0.3) return; // 70% chance to emit nothing this frame
        let angle = random(TWO_PI);
        let dist = random(radius - 5, radius + 5);
        let px = x + cos(angle) * dist;
        let py = y + sin(angle) * dist;
        
        let vx = random(-0.5, 0.5);
        let vy = random(-1, 0);
        let size = random(3, 6);
        let life = random(20, 40);
        let c = color(255, 223, 0); // Gold glow
        this.addParticle(new Particle(px, py, vx, vy, life, size, c, -0.01, 1, 'circle'));
    }

    clear() {
        this.particles = [];
    }
}
