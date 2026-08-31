class DynamicBackground {
    constructor() {
        this.currentRealm = null;
        this.transitionProgress = 0;
        this.scrollOffset = 0;
        this.isMobile = (typeof isMobileDevice !== 'undefined') ? isMobileDevice : false;
        
        // Element arrays (optimized counts for desktop/mobile)
        let starCount = this.isMobile ? 30 : 60;
        this.stars = [];
        for (let i = 0; i < starCount; i++) {
            this.stars.push({ x: random(windowWidth || 500), y: random(windowHeight || 800), alphaPhase: random(TWO_PI), size: random(1, 2.5) });
        }
        
        let cloudCount = this.isMobile ? 5 : 8;
        this.clouds = [];
        for (let i = 0; i < cloudCount; i++) {
            this.clouds.push({ x: random(windowWidth || 500), y: random(windowHeight || 800), speed: random(0.5, 1.2), size: random(50, 120) });
        }
        
        this.buildings = [];
        for (let i = 0; i < 15; i++) {
            this.buildings.push({ x: i * 35, w: random(20, 45), h: random(100, 250) });
        }
        
        let particleCount = this.isMobile ? 15 : 35;
        this.particles = [];
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({ x: random(windowWidth || 500), y: random(windowHeight || 800), speedY: random(0.5, 1.8), phase: random(TWO_PI) });
        }
    }

    setRealm(realm) {
        if (this.currentRealm !== realm) {
            this.fromRealm = this.currentRealm;
            this.currentRealm = realm;
            this.transitionProgress = 0;
        }
    }

    update(scrollAmount) {
        this.scrollOffset += scrollAmount * 0.2; // Parallax effect
        
        if (this.transitionProgress < 1 && this.fromRealm) {
            this.transitionProgress += 0.02; // 50 frames transition
        }

        // Update elements
        for (let i = 0; i < this.stars.length; i++) {
            this.stars[i].alphaPhase += 0.05;
        }
        
        for (let i = 0; i < this.clouds.length; i++) {
            let cloud = this.clouds[i];
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size < 0) {
                cloud.x = width + cloud.size;
                cloud.y = random(height);
            }
        }
        
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            p.y -= p.speedY;
            p.x += sin(p.phase) * 0.5;
            p.phase += 0.02;
            if (p.y < -10) {
                p.y = height + 10;
                p.x = random(width);
            }
        }
    }

    render(realm, bgImage) {
        if (!this.currentRealm) this.currentRealm = realm;
        
        if (this.transitionProgress < 1 && this.fromRealm) {
            this.renderTransition(this.fromRealm, this.currentRealm, this.transitionProgress, bgImage);
        } else {
            this.renderRealm(this.currentRealm, bgImage, 255);
        }
    }

    renderRealm(realm, bgImage, alphaValue) {
        push();
        rectMode(CORNER);
        imageMode(CORNER);
        let w = width;
        let h = height;
        let rId = realm.id || realm;
        
        // --- 1. ALWAYS DRAW BG IMAGE IF AVAILABLE (STATIC) ---
        if (bgImage && bgImage.width > 0) {
            let imgW = w;
            let imgH = w * (bgImage.height / bgImage.width);
            if (imgH < h) {
                imgH = h;
                imgW = h * (bgImage.width / bgImage.height);
            }
            
            tint(255, alphaValue);
            image(bgImage, -(imgW - w) / 2, 0, imgW, imgH); // Center it horizontally if wider
            noTint();
            
            // Semi-transparent black curtain to make platforms pop across entire screen
            noStroke();
            fill(0, 0, 0, (170 * alphaValue) / 255);
            rect(0, 0, w, h);
        } else {
            // Fallback colors if absolutely no image
            if (rId % 5 === 1) background(135, 206, 235, alphaValue);
            else if (rId % 5 === 2) background(10, 10, 40, alphaValue);
            else if (rId % 5 === 3) background(30, 0, 40, alphaValue);
            else if (rId % 5 === 4) background(5, 20, 5, alphaValue);
            else background(200, 200, 200, alphaValue);
        }

        // --- 2. DRAW OVERLAY EFFECTS BASED ON WORLD THEME ---
        let theme = rId % 5;
        if (theme === 2) {
            // Stars
            noStroke();
            for (let i = 0; i < this.stars.length; i++) {
                let s = this.stars[i];
                let a = map(sin(s.alphaPhase), -1, 1, 50, 255);
                fill(255, (a * alphaValue) / 255);
                ellipse(s.x, s.y, s.size);
            }
            // Mist/Fog
            fill(10, 10, 20, (50 * alphaValue) / 255);
            rect(0, 0, w, h);
        } else if (theme === 3) {
            // Shadow Realm Vortex & Mist
            noStroke();
            push();
            translate(w/2, h/2);
            rotate(frameCount * 0.01);
            for(let i=0; i<4; i++){
                fill(128, 0, 128, (28 * alphaValue) / 255);
                ellipse(0, 0, 280 - i*60);
            }
            pop();
            fill(138, 43, 226, (140 * alphaValue) / 255);
            for (let i = 0; i < this.particles.length; i++) {
                ellipse(this.particles[i].x, this.particles[i].y, 7, 7);
            }
        } else if (theme === 4) {
            // Orichalcos Energy lines
            stroke(0, 200, 50, (90 * alphaValue) / 255);
            strokeWeight(1);
            let numLines = this.isMobile ? 5 : 8;
            for(let i=0; i<numLines; i++){
                let y = (frameCount * 2 + i * 65) % h;
                line(0, y, w, y);
            }
            noStroke();
            fill(50, 255, 100, (140 * alphaValue) / 255);
            for (let i = 0; i < this.particles.length; i++) {
                rect(this.particles[i].x, this.particles[i].y, 4, 4);
            }
        } else if (theme === 0) {
            // Divine / Boss Theme - Light beams & Golden Sparkles
            noStroke();
            fill(255, 215, 0, (35 * alphaValue) / 255);
            triangle(w*0.3, 0, w*0.7, 0, w*0.5, h);
            triangle(w*0.1, 0, w*0.4, 0, w*0.2, h);
            triangle(w*0.6, 0, w*0.9, 0, w*0.8, h);
            fill(255, 215, 0, (180 * alphaValue) / 255);
            for (let i = 0; i < this.particles.length; i++) {
                ellipse(this.particles[i].x, this.particles[i].y, 5);
            }
        }
        pop();
    }

    renderTransition(fromR, toR, progress, bgImage) {
        if (progress < 0.5) {
            // Fade out old
            let alpha = map(progress, 0, 0.5, 255, 0);
            this.renderRealm(fromR, bgImage, alpha);
        } else {
            // Fade in new
            let alpha = map(progress, 0.5, 1, 0, 255);
            this.renderRealm(toR, bgImage, alpha);
        }

        // White flash peak at 0.5
        let flashAlpha = 0;
        if (progress < 0.5) {
            flashAlpha = map(progress, 0, 0.5, 0, 255);
        } else {
            flashAlpha = map(progress, 0.5, 1, 255, 0);
        }
        push();
        noStroke();
        fill(255, flashAlpha);
        rectMode(CORNER);
        rect(0, 0, width, height);
        pop();
    }
}
