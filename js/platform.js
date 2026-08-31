class Platform {
    static w = 110;
    static h = 28;
    static speed = 2;
    static springW = 81;
    static springH = 33;
    static springImage = null;

    static platformTypes = {
        INVISIBLE: 0,
        MOVING: 2,
        FRAGILE: 3,
        STABLE: 5,
        TRAP: 6,
        VANISHING: 7,

        /**
         * Get a random platform type based on realm config
         * @param {Object} realm
         * @returns {number} platformType
         */
        getRandomType(realm) {
            const r = Math.random();
            const stableChance = realm.platformStableChance || 0.6;
            const movingChance = realm.platformMovingChance || 0.2;
            const fragileChance = realm.platformFragileChance || 0.2;
            
            if (r < stableChance) {
                return Platform.platformTypes.STABLE;
            }
            if (r < stableChance + movingChance) {
                return Platform.platformTypes.MOVING;
            }
            if (r < stableChance + movingChance + fragileChance) {
                return Platform.platformTypes.FRAGILE;
            }

            const realmId = realm.id || 1;
            
            if (realmId >= 3 && Math.random() < 0.12) {
                return Platform.platformTypes.VANISHING;
            }
            if (realmId >= 4 && Math.random() < 0.1) {
                return Platform.platformTypes.TRAP;
            }

            return Platform.platformTypes.STABLE;
        },

        /**
         * Get platform color for type and realm
         * @param {number} type
         * @param {Object} realm
         * @returns {string} color
         */
        getColor(type, realm) {
            return realm.platformColor1 || '#ffffff';
        }
    };

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} type 
     * @param {boolean} springed 
     */
    constructor(x, y, type, springed) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.springed = springed;
        this.width = Platform.w;
        this.height = Platform.h;
        this.dir = Math.random() > 0.5 ? 1 : -1;

        this.trapTimer = 30;
        this.vanishPhase = Math.floor(Math.random() * 90);
        this.vanishVisible = true;
        this.fallSpeed = 0;
        this.isFalling = false;
        this.trapTriggered = false;
    }

    render(realm) {
        if (this.type === Platform.platformTypes.INVISIBLE) return;
        
        if (this.type === Platform.platformTypes.VANISHING && !this.vanishVisible) {
            push();
            rectMode(CENTER);
            stroke(255, 100);
            strokeWeight(1);
            noFill();
            rect(this.x, this.y, Platform.w, Platform.h, 5);
            pop();
            return;
        }

        push();
        rectMode(CENTER);
        noStroke();
        
        let c1 = color(realm.platformColor1 || '#aaa');
        let c2 = color(realm.platformColor2 || '#555');

        if (this.type === Platform.platformTypes.TRAP) {
            c1 = lerpColor(c1, color(255, 50, 50), 0.3);
            c2 = lerpColor(c2, color(200, 0, 0), 0.3);
        }

        // Draw body (shadow layer)
        fill(c2);
        rect(this.x, this.y + 3, Platform.w, Platform.h - 4, 8);
        // Draw body (main layer)
        fill(c1);
        rect(this.x, this.y, Platform.w, Platform.h - 4, 8);

        // Realm specific decorations
        const realmId = realm.id || 1;
        if (realmId === 1) {
            fill(34, 139, 34);
            noStroke();
            // (Removed green arcs that looked like tiny eyes)
            rect(this.x - 25, this.y - Platform.h / 2, 20, 4, 2);
            rect(this.x + 20, this.y - Platform.h / 2, 15, 4, 2);
        } else if (realmId === 2) {
            stroke(255, 200);
            strokeWeight(2);
            line(this.x - Platform.w / 2 + 5, this.y - Platform.h / 2 + 3, this.x + Platform.w / 2 - 5, this.y - Platform.h / 2 + 3);
            noStroke();
        } else if (realmId === 3) {
            fill(200, 200, 180);
            noStroke();
            ellipse(this.x - 25, this.y, 8, 8);
            ellipse(this.x + 5, this.y + 2, 6, 6);
            ellipse(this.x + 30, this.y - 2, 10, 10);
        } else if (realmId === 4) {
            fill(255, 150);
            noStroke();
            triangle(this.x - 35, this.y - 4, this.x - 25, this.y - 4, this.x - 30, this.y + 6);
            triangle(this.x + 25, this.y - 4, this.x + 35, this.y - 4, this.x + 30, this.y + 6);
        } else if (realmId === 5) {
            fill(255, 215, 0, 80);
            noStroke();
            rect(this.x, this.y, Platform.w + 8, Platform.h + 8, 12);
        }

        // Type specific decorations
        if (this.type === Platform.platformTypes.MOVING) {
            fill(255, 255, 255, 150);
            noStroke();
            triangle(this.x - Platform.w / 2 + 5, this.y, this.x - Platform.w / 2 + 15, this.y - 5, this.x - Platform.w / 2 + 15, this.y + 5);
            triangle(this.x + Platform.w / 2 - 5, this.y, this.x + Platform.w / 2 - 15, this.y - 5, this.x + Platform.w / 2 - 15, this.y + 5);
        } else if (this.type === Platform.platformTypes.FRAGILE) {
            stroke(50, 50, 50, 150);
            strokeWeight(2);
            line(this.x - 20, this.y - 5, this.x - 10, this.y + 5);
            line(this.x + 10, this.y - 3, this.x + 20, this.y + 4);
            noStroke();
        } else if (this.type === Platform.platformTypes.TRAP) {
            stroke(100, 0, 0, 150);
            strokeWeight(1);
            line(this.x - 30, this.y - 3, this.x, this.y + 5);
            line(this.x + 5, this.y + 3, this.x + 30, this.y - 4);
            noStroke();
        }

        // Draw spring (Millennium Eye on bouncy platform)
        if (this.springed) {
            const springX = this.x + (this.springX || 0);
            const springY = this.y - Platform.h / 2 - Platform.springH / 2 + 3;
            
            push();
            translate(springX, springY);
            imageMode(CENTER);

            let pulse = Math.sin(frameCount * 0.1) * 1.5;
            let sw = Platform.springW + pulse;
            let sh = Platform.springH + pulse * (Platform.springH / Platform.springW);
            
            if (Platform.springImage && Platform.springImage.width > 0) {
                const isMob = (typeof isMobileDevice !== 'undefined' && isMobileDevice);
                if (isMob) {
                    // Fast mobile golden aura ring behind sprite
                    noStroke();
                    fill(255, 215, 0, 180);
                    ellipse(0, 0, sw + 5, sh + 5);
                    fill(255, 250, 150, 220);
                    ellipse(0, 0, sw + 2, sh + 2);
                    image(Platform.springImage, 0, 0, sw, sh);
                } else {
                    const ctx = drawingContext;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 12;
                    image(Platform.springImage, 0, 0, sw, sh);
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                    image(Platform.springImage, 0, 0, sw, sh);
                }
            }
            pop();
        }
        
        pop();
    }

    update() {
        if (this.type === Platform.platformTypes.MOVING) {
            this.x += Platform.speed * this.dir;
            if (this.x < Platform.w / 2) {
                this.x = Platform.w / 2;
                this.dir = 1;
            } else if (this.x > width - Platform.w / 2) {
                this.x = width - Platform.w / 2;
                this.dir = -1;
            }
        }

        if (this.type === Platform.platformTypes.TRAP && this.trapTriggered) {
            this.trapTimer--;
            if (this.trapTimer <= 0) {
                this.isFalling = true;
            }
        }

        if (this.isFalling) {
            this.y += this.fallSpeed;
            this.fallSpeed += 0.3;
        }

        if (this.type === Platform.platformTypes.VANISHING) {
            this.vanishPhase++;
            if (this.vanishPhase >= 90) {
                this.vanishPhase = 0;
                this.vanishVisible = !this.vanishVisible;
            }
        }
    }

    triggerTrap() {
        if (this.type === Platform.platformTypes.TRAP && !this.trapTriggered) {
            this.trapTriggered = true;
        }
    }

    /**
     * @returns {boolean}
     */
    isStandable() {
        if (this.type === Platform.platformTypes.INVISIBLE) return false;
        if (this.isFalling) return false;
        if (this.type === Platform.platformTypes.VANISHING && !this.vanishVisible) return false;
        return true;
    }
}
