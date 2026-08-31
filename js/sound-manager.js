/**
 * SoundManager handles playing p5.sound objects and synthesizing new sounds
 * using the Web Audio API.
 */
class SoundManager {
    static audioCtx = null;
    static masterVolume = 0.5;
    static muted = false;
    static sounds = {};
    static ambientOscillator = null;
    static ambientGain = null;

    /**
     * Initializes the AudioContext. Should be called on user interaction.
     */
    static init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    /**
     * Sets the master volume.
     * @param {number} v Volume 0.0 to 1.0
     */
    static setVolume(v) {
        this.masterVolume = Math.max(0, Math.min(1, v));
        if (window.outputVolume) { // p5.sound master volume if available
            window.outputVolume(this.muted ? 0 : this.masterVolume);
        }
        if (this.ambientGain) {
            this.ambientGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume * 0.1, this.audioCtx.currentTime);
        }
    }

    /**
     * Toggles mute state.
     * @returns {boolean} Current mute state
     */
    static toggleMute() {
        this.muted = !this.muted;
        this.setVolume(this.masterVolume);
        return this.muted;
    }

    /**
     * Checks if sounds are muted.
     * @returns {boolean}
     */
    static isMuted() {
        return this.muted;
    }

    // --- p5.sound Wrappers ---
    
    static playJump() { if (!this.muted && this.sounds && this.sounds.jump) try { this.sounds.jump.play(); } catch(e) {} }
    static playSpring() { if (!this.muted && this.sounds && this.sounds.spring) try { this.sounds.spring.play(); } catch(e) {} }
    static playFragile() { if (!this.muted && this.sounds && this.sounds.fragile) try { this.sounds.fragile.play(); } catch(e) {} }
    static playFalling() { if (!this.muted && this.sounds && this.sounds.falling) try { this.sounds.falling.play(); } catch(e) {} }
    static playBlackhole() {
        if (this.muted) return;
        let played = false;
        if (this.sounds && this.sounds.blackhole) {
            try { this.sounds.blackhole.play(); played = true; } catch(e) {}
        }
        if (!played) {
            this.synthBlackhole();
        }
    }
    static playExplosion() { if (!this.muted && this.sounds && this.sounds.explosion) try { this.sounds.explosion.play(); } catch(e) {} }
    static playBreak() { if (!this.muted && this.sounds && this.sounds.break) try { this.sounds.break.play(); } catch(e) {} }
    static playLava() { if (!this.muted && this.sounds && this.sounds.lava) try { this.sounds.lava.play(); } catch(e) {} }

    static playTone(freq, type, duration, vol, envelope = {}) {
        if (this.muted || !this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            const now = this.audioCtx.currentTime;
            const attack = envelope.attack || 0.01;
            const decay = envelope.decay || duration;
            const peakVol = vol * this.masterVolume;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(peakVol, now + attack);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + attack + decay);
            setTimeout(() => { gainNode.disconnect(); }, (attack + decay) * 1000 + 100);
        } catch(e) {}
    }

    static playRoar() {
        if (this.muted) return;
        let played = false;
        if (this.sounds && this.sounds.roar) {
            try {
                if (typeof this.sounds.roar.isLoaded === 'function') {
                    if (this.sounds.roar.isLoaded()) {
                        this.sounds.roar.setVolume(this.masterVolume);
                        this.sounds.roar.play();
                        played = true;
                    }
                } else if (typeof this.sounds.roar.play === 'function') {
                    this.sounds.roar.play();
                    played = true;
                }
            } catch(e) {}
        }
        if (!played) {
            try {
                const audio = new Audio('assets/sound/roar.mp3');
                audio.volume = this.masterVolume;
                audio.play().catch(e => {});
                played = true;
            } catch(e) {}
        }
        if (!played) {
            this.synthDragonRoarFallback();
        }
    }

    static synthDragonRoar() {
        this.playRoar();
    }

    static synthDragonRoarFallback() {
        if (SoundManager.muted) return;
        try {
            const osc = new p5.Oscillator('sawtooth');
            osc.freq(150);
            osc.freq(40, 1.5);
            osc.amp(0, 0);
            osc.amp(0.8, 0.1);
            osc.amp(0, 1.5);
            osc.start();
            osc.stop(1.6);

            const noise = new p5.Noise('brown');
            noise.amp(0, 0);
            noise.amp(1, 0.1);
            noise.amp(0, 1.5);
            noise.start();
            noise.stop(1.6);
        } catch(e) {}
    }

    static playShieldBreak() {
        if (this.muted) return;
        let played = false;
        if (this.sounds && this.sounds.break && this.sounds.break.isLoaded && this.sounds.break.isLoaded()) {
            try {
                this.sounds.break.setVolume(this.masterVolume);
                this.sounds.break.play();
                played = true;
            } catch(e) {}
        }
        if (!played) {
            this.synthShieldBreak();
        }
    }

    static synthShieldBreak() {
        if (this.muted || !this.audioCtx) return;
        try {
            const now = this.audioCtx.currentTime;
            const osc1 = this.audioCtx.createOscillator();
            const osc2 = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(1200, now);
            osc1.frequency.exponentialRampToValueAtTime(150, now + 0.35);

            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(800, now);
            osc2.frequency.exponentialRampToValueAtTime(80, now + 0.35);

            gain.gain.setValueAtTime(0.7 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.35);
            osc2.stop(now + 0.35);
            setTimeout(() => { gain.disconnect(); }, 400);
        } catch(e) {}
    }

    static synthMeteorImpact() {
        if (this.muted) return;
        if (this.sounds && this.sounds.explosion && this.sounds.explosion.isLoaded && this.sounds.explosion.isLoaded()) {
            try {
                this.sounds.explosion.setVolume(this.masterVolume);
                this.sounds.explosion.play();
                return;
            } catch(e) {}
        }
        if (!this.audioCtx) return;
        try {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            if (osc.frequency.exponentialRampToValueAtTime) {
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
            }
            
            gainNode.gain.setValueAtTime(this.masterVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            osc.start(now);
            osc.stop(now + 0.5);
            setTimeout(() => { gainNode.disconnect(); }, 600);
        } catch(e) {}
    }

    static synthLavaBubble() {
        if (this.muted || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.1);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.5, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }

    static synthCollect(type) {
        if (type === 'eye' && SoundManager.sounds.spring && SoundManager.sounds.spring.isLoaded()) {
            SoundManager.sounds.spring.play();
            return;
        }
        this.playTone(880, 'sine', 0.3, 0.4, {attack: 0.05, decay: 0.25});
        setTimeout(() => this.playTone(1320, 'sine', 0.4, 0.3, {attack: 0.05, decay: 0.35}), 100);
    }

    static synthMonsterHit() {
        this.playTone(300, 'sawtooth', 0.2, 0.6, {attack: 0.01, decay: 0.19});
        setTimeout(() => this.playTone(150, 'square', 0.3, 0.6, {attack: 0.01, decay: 0.29}), 50);
    }

    static synthBlackhole() {
        if (this.muted || !this.audioCtx) return;
        try {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(26, now + 1.2);

            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.75 * this.masterVolume, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 1.2);
            setTimeout(() => { gain.disconnect(); }, 1300);
        } catch(e) {}
    }

    static synthRealmTransition() {
        if (this.muted || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const duration = 2.0;
        
        const baseFreq = 440; // A4
        const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // Major chord
        
        freqs.forEach(freq => {
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + duration * 0.5);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            osc.start(now);
            osc.stop(now + duration);
        });
    }

    static synthButtonClick() {
        this.playTone(1000, 'sine', 0.05, 0.3, {attack: 0.01, decay: 0.04});
    }

    static synthAmbientDrone(realmId) {
        if (this.muted || !this.audioCtx) return;
        this.stopAmbient();
        
        const now = this.audioCtx.currentTime;
        this.ambientOscillator = this.audioCtx.createOscillator();
        this.ambientGain = this.audioCtx.createGain();
        
        // Adjust tone based on realm
        let freq = 100;
        let type = 'sine';
        switch (realmId) {
            case 1: freq = 120; type = 'sine'; break;
            case 2: freq = 80; type = 'triangle'; break;
            case 3: freq = 60; type = 'sine'; break; // Soft low hum for shadow realm
            default: freq = 100; type = 'sine'; break;
        }
        
        this.ambientOscillator.type = type;
        this.ambientOscillator.frequency.setValueAtTime(freq, now);
        
        this.ambientGain.gain.setValueAtTime(0, now);
        this.ambientGain.gain.linearRampToValueAtTime(this.masterVolume * 0.03, now + 2); // Very subtle
        
        this.ambientOscillator.connect(this.ambientGain);
        this.ambientGain.connect(this.audioCtx.destination);
        
        this.ambientOscillator.start(now);
    }

    
    
        static playMenuMusic() {
        if (this.muted) return;
        // Never play music during active gameplay
        if (typeof gameState !== 'undefined' && gameState !== GAME_STATE.MENU && gameState !== GAME_STATE.PAUSED) {
            return;
        }
        if (!this.audioCtx) this.init();
        
        let profile = {};
        if (typeof GameStorage !== 'undefined') profile = GameStorage.getProfile();
        const settings = profile.settings || { altMusic: false };

        if (settings.altMusic) {
            if (this.sounds && this.sounds.background) {
                try {
                    this.sounds.background.stop();
                } catch(e) {}
            }
            this.playEgyptianTheme();
        } else {
            this.stopAmbient();
            if (this.sounds && this.sounds.background && this.sounds.background.isLoaded()) {
                if (!this.sounds.background.isPlaying()) {
                    this.sounds.background.setVolume(this.masterVolume * 0.8);
                    this.sounds.background.setLoop(true);
                    this.sounds.background.play();
                }
            }
        }
    }

    static stopMenuMusic() {
        this.stopAmbient();
        try {
            if (this.sounds && this.sounds.background) {
                this.sounds.background.setLoop(false);
                this.sounds.background.stop();
                if (this.sounds.background.isPlaying()) {
                    this.sounds.background.pause();
                }
            }
        } catch(e) {}
    }

    static playEgyptianTheme() {
        if (this.muted || !this.audioCtx) return;
        this.stopAmbient();
        
        const now = this.audioCtx.currentTime;
        this.ambientGain = this.audioCtx.createGain();
        this.ambientGain.gain.setValueAtTime(0, now);
        this.ambientGain.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + 2);
        this.ambientGain.connect(this.audioCtx.destination);
        
        // Egyptian scale (Harmonic Minor / Phrygian Dominant)
        const notes = [
            261.63, // C4
            277.18, // Db4
            329.63, // E4
            349.23, // F4
            392.00, // G4
            415.30, // Ab4
            493.88, // B4
            523.25  // C5
        ];
        
        this.musicInterval = setInterval(() => {
            if (!this.audioCtx || this.muted || this.audioCtx.state !== "running") return;
            // Play a random note from the scale
            const note = notes[Math.floor(Math.random() * notes.length)];
            const osc = this.audioCtx.createOscillator();
            const noteGain = this.audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = note;
            
            const t = this.audioCtx.currentTime;
            noteGain.gain.setValueAtTime(0, t);
            noteGain.gain.linearRampToValueAtTime(1, t + 0.1);
            noteGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
            
            osc.connect(noteGain);
            noteGain.connect(this.ambientGain);
            
            osc.start(t);
            osc.stop(t + 0.6);
            
            setTimeout(() => { noteGain.disconnect(); }, 1000);
        }, 400); // 150 BPM 8th notes
        
        // Add a low drone
        this.ambientOscillator = this.audioCtx.createOscillator();
        this.ambientOscillator.type = 'sine';
        this.ambientOscillator.frequency.value = 65.41; // C2 drone
        this.ambientOscillator.connect(this.ambientGain);
        this.ambientOscillator.start(now);
    }
    
    static stopAmbient() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        if (this.ambientOscillator) {
            try {
                this.ambientOscillator.stop();
                this.ambientOscillator.disconnect();
                this.ambientGain.disconnect();
            } catch (e) {}
            this.ambientOscillator = null;
            this.ambientGain = null;
        }
    }

}
