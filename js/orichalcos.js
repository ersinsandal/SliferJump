class Orichalcos {
    static sealImage = null;
    static w = 50;
    static h = 50;
    static ROCHE_LIMIT = 37;

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.pulsePhase = 0;
        this.glowIntensity = 0;
    }

    update() {
        this.angle += 0.02;
        this.pulsePhase += 0.05;
        this.glowIntensity = (sin(this.pulsePhase) + 1) / 2; // 0 to 1
    }

    render() {
        push();
        translate(this.x, this.y);
        
        // Green glow
        noStroke();
        for (let i = 3; i > 0; i--) {
            fill(0, 255, 0, 20 + this.glowIntensity * 30 - i * 10);
            ellipse(0, 0, Orichalcos.w + i * 20, Orichalcos.h + i * 20);
        }

        // Light rays
        stroke(0, 255, 0, 50 + this.glowIntensity * 50);
        strokeWeight(2);
        push();
        rotate(-this.angle * 2);
        for (let i = 0; i < 6; i++) {
            line(0, 0, 0, Orichalcos.w + 10);
            rotate(TWO_PI / 6);
        }
        pop();

        // Image
        rotate(this.angle);
        imageMode(CENTER);
        if (Orichalcos.sealImage) {
            image(Orichalcos.sealImage, 0, 0, Orichalcos.w, Orichalcos.h);
        } else {
            // Fallback
            fill(0, 100, 0);
            ellipse(0, 0, Orichalcos.w, Orichalcos.h);
        }
        pop();
    }
}
