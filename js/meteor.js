class Meteor {
    constructor(x, targetY, sizeStr) {
        this.x = x;
        this.y = -100;
        this.targetY = targetY;
        this.sizeStr = sizeStr; // 'SMALL', 'MEDIUM', 'LARGE'
        
        let sizeMap = { 'SMALL': 15, 'MEDIUM': 25, 'LARGE': 40 };
        let speedMap = { 'SMALL': 8, 'MEDIUM': 6, 'LARGE': 4 };
        
        this.radius = sizeMap[sizeStr] || 25;
        this.speed = speedMap[sizeStr] || 6;
        
        this.angle = random(TWO_PI);
        this.warning = true;
        this.warningTimer = 60;
        this.active = false;
        this.exploded = false;
        this.explosionTimer = 30;
        this.trail = [];
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
            this.trail.push({x: this.x, y: this.y, life: 255});
            
            if (this.trail.length > 20) this.trail.shift();
            for (let t of this.trail) t.life -= 15;
            
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
            
            // Trail
            noStroke();
            for (let i = 0; i < this.trail.length; i++) {
                let t = this.trail[i];
                let size = map(i, 0, this.trail.length, 5, this.radius * 2);
                fill(255, map(i, 0, this.trail.length, 0, 150), 0, max(0, t.life));
                ellipse(t.x, t.y, size);
            }
            
            translate(this.x, this.y);
            rotate(this.angle);
            
            // Rock
            fill(100, 50, 50);
            stroke(50, 20, 20);
            strokeWeight(2);
            beginShape();
            for (let i = 0; i < TWO_PI; i += PI / 4) {
                let r = this.radius + random(-5, 5);
                vertex(cos(i) * r, sin(i) * r);
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
        for (let m of this.meteors) m.renderWarning();
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
