class Slifer {
    static leftImage = null;
    static rightImage = null;
    static w = 80;
    static h = 80;
    static jumpForce = 11.0;
    static superJumpForce = 15.0;
    static speed = 9.0;

    static LEFT = 0;
    static RIGHT = 1;

    // Alias for backward compatibility
    static Direction = {
        LEFT: 0,
        RIGHT: 1,
    };

    constructor(x, y) {
        this.x = x;
        this.y = y; this.startY = y;
        this.vx = 0;
        this.vy = 0;
        this.direction = Slifer.RIGHT;
        
        this.wingAngle = 0;
        this.wingSpeed = 0.08;
        this.breathTimer = 0;
        this.isShielded = false;
        this.tilt = 0;
        this.deathSpin = 0;
        this.alive = true;
        this.eyeGlow = 0;
        this.invincibleTimer = 0;
    }

    update() {
        if (!this.alive) {
            this.deathSpin += 0.2;
            this.vy += config.GRAVITY;
            this.y += this.vy;
            return;
        }

        // Horizontal movement and wrap
        this.x += this.vx;
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;

        // Gravity
        let grav = this.vy < 0 ? config.GRAVITY : config.GRAVITY * 1.33;
        this.vy += grav;
        if (this.vy > config.MAX_FALLING_SPEED) this.vy = config.MAX_FALLING_SPEED;

        // Apply vertical movement
        this.y += this.vy;

        // Camera threshold limit
        if (this.y <= config.THRESHOLD) {
            this.y = config.THRESHOLD;
        }

        // Wing animation logic
        if (this.vy < 0) {
            this.wingSpeed = 0.15; // Flapping fast when going up
        } else {
            this.wingSpeed = 0.04; // Gliding when falling
        }
        this.wingAngle += this.wingSpeed;

        // Tilt based on horizontal velocity
        let targetTilt = map(this.vx, -Slifer.speed, Slifer.speed, -0.2, 0.2);
        this.tilt = lerp(this.tilt, targetTilt, 0.1);

        // Eye glow
        this.eyeGlow += 0.1;

        // Breath timer
        this.breathTimer++;

        // Grace period invincibility timer
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
        }
    }

    render(particleSystem) {
        push();
        translate(this.x, this.y);
        
        if (!this.alive) {
            rotate(this.deathSpin);
            scale(max(0, 1 - this.deathSpin * 0.05));
        } else {
            rotate(this.tilt);
        }

        let isFlapping = sin(this.wingAngle);
        // Adjust wing angle spread based on flapping/gliding
        let flapOffset = this.vy < 0 ? map(isFlapping, -1, 1, -0.5, 0.5) : map(isFlapping, -1, 1, -0.2, 0.2) + 0.3;

        // Draw BOTH Wings FIRST (Behind the body)
        this.drawWing(-1, flapOffset, true);
        this.drawWing(1, flapOffset, true);

        // Draw Slifer Body Sprite (In front of wings)
        imageMode(CENTER);
        let currentImg = this.direction === Slifer.LEFT ? Slifer.leftImage : Slifer.rightImage;
        if (currentImg) {
            image(currentImg, 0, 0, Slifer.w * 1.5, Slifer.h * 1.5);
        } else {
            // Fallback body
            fill(200, 0, 0);
            ellipse(0, 0, Slifer.w, Slifer.h);
        }

        // Draw Glowing Eyes
        this.drawEyes();

        // Fire Breath Emission
        if (this.alive && this.breathTimer > 40 && particleSystem) {
            if (random() > 0.5) {
                let mouthX = this.direction === Slifer.RIGHT ? Slifer.w * 0.4 : -Slifer.w * 0.4;
                let mouthY = -Slifer.h * 0.2;
                if (particleSystem.emitFireBreath) {
                    particleSystem.emitFireBreath(this.x + mouthX, this.y + mouthY, this.direction);
                }
            }
            if (this.breathTimer > 50) this.breathTimer = 0;
        }

        // ── Active PowerUp Visuals ──
        if (this.alive && typeof collectibleSystem !== 'undefined') {
            for (let p of collectibleSystem.activePowerUps) {
                if (p.type.id === 'swords') {
                    // 3 sharp, pointed golden swords 120° apart (Mercedes logo style)
                    push();
                    let orbit = Slifer.w * 1.0;
                    rotate(frameCount * 0.04);
                    let useBlur = (typeof isMobileDevice === 'undefined' || !isMobileDevice);
                    if (useBlur) {
                        drawingContext.shadowBlur = 10;
                        drawingContext.shadowColor = 'rgba(255,255,0,0.75)';
                    }
                    for (let si = 0; si < 3; si++) {
                        push();
                        rotate((TWO_PI / 3) * si);
                        translate(0, -orbit);

                        // Long, sharp golden blade pointing straight out
                        fill(250, 245, 210, 240);
                        stroke(255, 215, 0, 220);
                        strokeWeight(1.5);
                        rectMode(CENTER);
                        rect(0, -6, 5, 36, 1);

                        // Sharp needle point
                        noStroke();
                        fill(255, 255, 220, 250);
                        triangle(-2.5, -24, 2.5, -24, 0, -42);

                        // Golden Cross guard
                        stroke(218, 165, 32, 220);
                        strokeWeight(1.5);
                        fill(255, 215, 0, 230);
                        rect(0, 12, 20, 4, 1);

                        // Handle
                        stroke(100, 65, 10, 200);
                        strokeWeight(1);
                        fill(120, 80, 20, 230);
                        rect(0, 19, 4, 10);

                        // Pommel
                        noStroke();
                        fill(255, 215, 0, 230);
                        ellipse(0, 25, 6, 6);
                        pop();
                    }
                    if (useBlur) drawingContext.shadowBlur = 0;
                    pop();
                } else if (p.type.id === 'reborn') {
                    // Draw a pulsating green ring
                    push();
                    noFill();
                    stroke(50, 205, 50, 150 + sin(frameCount * 0.1) * 50);
                    strokeWeight(4);
                    ellipse(0, 0, Slifer.w * 1.6 + sin(frameCount*0.05)*10);
                    pop();
                } else if (p.type.id === 'pot') {
                    // Draw golden score aura
                    push();
                    rotate(-frameCount * 0.03);
                    stroke(255, 215, 0, 100);
                    strokeWeight(2);
                    noFill();
                    rectMode(CENTER);
                    rect(0, 0, Slifer.w * 1.4, Slifer.h * 1.4);
                    rotate(PI / 4);
                    rect(0, 0, Slifer.w * 1.4, Slifer.h * 1.4);
                    pop();
                }
            }
        }

        

        pop();
    }

    drawWing(side, flapOffset, isBack) {
        push();
        // side: -1 for left, 1 for right
        scale(side, 1);
        
        let wingColor = color(204, 0, 0, 180); // #CC0000 with alpha
        if (isBack) {
            wingColor = color(150, 0, 0, 180); // Darker for back wing
        }
        
        fill(wingColor);
        stroke(100, 0, 0, 200);
        strokeWeight(2);

        // Wing attachment point
        let attachX = 10;
        let attachY = -10;
        
        translate(attachX, attachY);
        rotate(flapOffset);

        beginShape();
        vertex(0, 0);
        // Top edge
        bezierVertex(20, -30, 40, -40, 60, -20);
        // Outer curved edge
        bezierVertex(50, 0, 70, 20, 30, 40);
        // Bottom scalloped edge
        bezierVertex(25, 20, 15, 25, 0, 15);
        endShape(CLOSE);
        
        // Wing bones (lines)
        noFill();
        stroke(130, 0, 0, 150);
        strokeWeight(1.5);
        bezier(0, 0, 15, -10, 30, -5, 60, -20);
        bezier(0, 0, 10, 5, 20, 15, 30, 40);
        
        pop();
    }

    drawEyes() {
        let eyeX = this.direction === Slifer.RIGHT ? Slifer.w * 0.2 : -Slifer.w * 0.2;
        let eyeY = -Slifer.h * 0.3;
        
        let glowSize = 8 + sin(this.eyeGlow) * 4;
        
        noStroke();
        // Outer glow
        fill(255, 215, 0, 100);
        ellipse(eyeX, eyeY, glowSize);
        
        // Inner bright
        fill(255, 255, 0);
        ellipse(eyeX, eyeY, 4);
    }
}
