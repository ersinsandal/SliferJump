class LavaSystem {
    constructor() {
        this.active = false;
        this.y = 0; // Will be set on activate
        this.speed = 0;
        this.bubbles = [];
        this.waveOffset = 0;
    }

    activate(speed) {
        this.active = true;
        this.y = height + 100;
        this.speed = speed;
    }

    deactivate() {
        this.active = false;
        this.y = height + 100;
        this.bubbles = [];
    }

    update(limitY = -999999) {
        if (!this.active) return;
        
        if (this.y > height + 50) {
            this.y = height + 50; // Keep it just off-screen so it doesn't take 10 seconds to catch up
        }

        if (this.y - this.speed > limitY) {
            let dist = this.y - limitY;
            let currentSpeed = this.speed;
            if (dist > 200) {
                currentSpeed = this.speed * 8; // Catch up fast when far below
            } else if (dist > 100) {
                currentSpeed = this.speed * 4;
            }
            this.y -= currentSpeed;
        } else if (this.y < limitY - 10) {
            // If lava is somehow above the limit (e.g. limit dropped because platform broke)
            // make it recede smoothly instead of teleporting
            this.y += this.speed * 5; 
        } else {
            this.y = limitY;
        }
        this.waveOffset += 0.05;

        if (random() < 0.1) {
            this.bubbles.push({
                x: random(width),
                y: this.y + random(10, 50),
                radius: random(2, 8),
                speed: random(1, 3),
                alpha: 255
            });
        }

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            let b = this.bubbles[i];
            b.y -= b.speed;
            b.alpha -= 5;
            if (b.y < this.y - 20 || b.alpha <= 0) {
                this.bubbles.splice(i, 1);
            }
        }
    }

    render() {
        if (!this.active) return;

        push();
        // Lava glow (optimized 2-tier ambient aura)
        noStroke();
        fill(255, 80, 0, 35);
        rect(0, this.y - 40, width, 40);
        fill(255, 120, 0, 70);
        rect(0, this.y - 18, width, 18);

        // Lava body
        let gradY = this.y;
        if (Math.abs(gradY - height) < 0.1) gradY = height - 0.1;
        let gradient = drawingContext.createLinearGradient(0, gradY, 0, height);
        gradient.addColorStop(0, 'rgba(255, 69, 0, 1)'); // OrangeRed
        gradient.addColorStop(1, 'rgba(139, 0, 0, 1)');  // DarkRed
        drawingContext.fillStyle = gradient;
        
        let step = (typeof isMobileDevice !== 'undefined' && isMobileDevice) ? 16 : 10;
        beginShape();
        vertex(0, height);
        for (let x = 0; x <= width; x += step) {
            let wave = sin(x * 0.02 + this.waveOffset) * 10;
            vertex(x, this.y + wave);
        }
        vertex(width, height);
        endShape(CLOSE);

        // Bright highlights
        noFill();
        stroke(255, 150, 0, 200);
        strokeWeight(2);
        beginShape();
        for (let x = 0; x <= width; x += step * 1.5) {
            let wave = sin(x * 0.02 + this.waveOffset) * 10;
            vertex(x, this.y + wave + 2);
        }
        endShape();

        // Bubbles
        noStroke();
        for (let i = 0; i < this.bubbles.length; i++) {
            let b = this.bubbles[i];
            fill(255, 150, 0, b.alpha);
            ellipse(b.x, b.y, b.radius * 2);
            fill(255, 255, 200, b.alpha);
            ellipse(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.5);
        }
        pop();
    }

    scrollDown(amount) {
        if (this.active) {
            this.y += amount;
            for (let b of this.bubbles) {
                b.y += amount;
            }
        }
    }

    getLevel() {
        return this.y;
    }

    isActive() {
        return this.active;
    }

    checkCollision(sliferY, sliferH) {
        if (!this.active) return false;
        return (sliferY + sliferH > this.y - 10);
    }

    reset() {
        this.deactivate();
    }
}
