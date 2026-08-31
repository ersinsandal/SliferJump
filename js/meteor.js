class Meteor {
    constructor(x, targetY, sizeStr) {
        this.x = x;
        this.y = -100;
        this.targetY = targetY;
        this.sizeStr = sizeStr; // 'SMALL', 'MEDIUM', 'LARGE'
        
        let sizeMap = { 'SMALL': 15, 'MEDIUM': 25, 'LARGE': 40 };
        let speedMap = { 'SMALL': 8, 'MEDIUM': 6.5, 'LARGE': 5.5 };
        
        this.radius = sizeMap[sizeStr] || 25;
        this.speed = speedMap[sizeStr] || 6;
        
        this.angle = random(TWO_PI);
        this.warning = true;
        this.warningTimer = 60;
        this.active = false;
        this.exploded = false;
        this.explosionTimer = 30;
        this.trail = [];

        // Precompute jagged rock points for zero per-frame allocation
        this.rockPoints = [];
        for (let i = 0; i < TWO_PI; i += PI / 4) {
            let r = this.radius + random(-3, 3);
            this.rockPoints.push({ x: cos(i) * r, y: sin(i) * r });
        }
    }

    update() {
        if (this.warning) {
            this.warningTimer--;
            if (this.warningTimer <= 0) {
                this.warning = false;
                this.active = true;
            }
        } else if (this.active && !this.exploded) {
            this.y += this.speed;
            this.angle += 0.05;
            
            // Spawn trail sleekly from behind the falling meteor
            let trailY = this.y - this.radius * 0.25;
            this.trail.push({ x: this.x, y: trailY, life: 255 });
            
            // Proportional trail length: Large meteor gets 26-point majestic fiery tail
            let maxTrail = this.sizeStr === 'LARGE' ? 26 : (this.sizeStr === 'MEDIUM' ? 18 : 14);
            if (this.trail.length > maxTrail) this.trail.shift();
            
            let decay = this.sizeStr === 'LARGE' ? 8 : (this.sizeStr === 'MEDIUM' ? 12 : 16);
            for (let i = 0; i < this.trail.length; i++) this.trail[i].life -= decay;
            
            if (this.y >= this.targetY) {
                this.exploded = true;
                this.active = false;
            }
        } else if (this.exploded) {
            this.explosionTimer--;
        }
    }

    renderWarning() {
        if (!this.warning) return;
        push();
        let alpha = map(sin(frameCount * 0.2), -1, 1, 50, 200);
        stroke(255, 0, 0, alpha);
        strokeWeight(2);
        drawingContext.setLineDash([10, 10]);
        line(this.x, 0, this.x, this.targetY);
        drawingContext.setLineDash([]);
        
        fill(255, 0, 0, alpha);
        noStroke();
        ellipse(this.x, this.targetY, this.radius * 2, 10);
        pop();
    }

    render() {
        if (this.warning) {
            this.renderWarning();
        } else if (this.active && !this.exploded) {
            push();
            
            // Sleek, vibrant glowing meteor flame tail
            noStroke();
            let tLen = this.trail.length;
            for (let i = 0; i < tLen; i++) {
                let t = this.trail[i];
                let progress = (i + 1) / (tLen || 1);
                let size = 4 + progress * (this.radius * 1.1);
                let alpha = Math.min(255, Math.max(0, t.life));
                
                // Outer vibrant blazing flame
                fill(255, progress * 130 + 15, 0, alpha * 0.85);
                ellipse(t.x, t.y, size);
                // Glowing golden core
                fill(255, 235, 60, alpha * 0.95);
                ellipse(t.x, t.y, size * 0.5);
            }
            
            translate(this.x, this.y);
            rotate(this.angle);
            
            // Rock body
            fill(100, 50, 50);
            stroke(50, 20, 20);
            strokeWeight(2);
            beginShape();
            for (let i = 0; i < this.rockPoints.length; i++) {
                vertex(this.rockPoints[i].x, this.rockPoints[i].y);
            }
            endShape(CLOSE);
            
            pop();
        } else if (this.exploded && this.explosionTimer > 0) {
            push();
            translate(this.x, this.targetY);
            noStroke();
            let r = map(this.explosionTimer, 30, 0, this.radius, this.radius * 4);
            let alpha = map(this.explosionTimer, 30, 0, 255, 0);
            fill(255, 100, 0, alpha);
            ellipse(0, 0, r);
            fill(255, 200, 0, alpha);
            ellipse(0, 0, r * 0.6);
            pop();
        }
    }

    getHitbox() {
        return { x: this.x, y: this.y, radius: this.radius };
    }

    isDone() {
        return this.exploded && this.explosionTimer <= 0;
    }
}

class MeteorSystem {
    constructor() {
        this.meteors = [];
        this.spawnTimer = 100;
        this.dodgedCount = 0;
    }

    update(realm, score) {
        if (!realm || !realm.meteorInterval) return;
        
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            let sizes = ['SMALL', 'MEDIUM', 'LARGE'];
            let size = random(sizes);
            let x = random(50, width - 50);
            let targetY = random(height / 2, height - 50);
            this.meteors.push(new Meteor(x, targetY, size));
            this.spawnTimer = realm.meteorInterval;
        }

        for (let i = this.meteors.length - 1; i >= 0; i--) {
            this.meteors[i].update();
            if (this.meteors[i].isDone()) {
                this.dodgedCount++;
                this.meteors.splice(i, 1);
            }
        }
    }

    render() {
        for (let m of this.meteors) m.render();
    }

    checkCollision(sliferX, sliferY, sliferW, sliferH) {
        for (let m of this.meteors) {
            if (m.active && !m.exploded && !m.warning) {
                let hb = m.getHitbox();
                let closestX = constrain(hb.x, sliferX - sliferW / 2, sliferX + sliferW / 2);
                let closestY = constrain(hb.y, sliferY - sliferH / 2, sliferY + sliferH / 2);
                let distance = dist(hb.x, hb.y, closestX, closestY);
                if (distance < hb.radius) return m; // Return the specific meteor!
            }
        }
        return null;
    }

    scrollDown(amount) {
        for (let m of this.meteors) {
            m.y += amount;
            m.targetY += amount;
            for (let t of m.trail) {
                t.y += amount;
            }
        }
    }

    removeMeteor(m) {
        let idx = this.meteors.indexOf(m);
        if (idx !== -1) {
            this.meteors.splice(idx, 1);
        }
    }

    clear() {
        this.meteors = [];
        this.dodgedCount = 0;
        this.spawnTimer = 180;
    }
}
