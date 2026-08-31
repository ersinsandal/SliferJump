/**
 * SliferJump 2.0: Rise of Slifer
 * UI System — Menus, HUD, Toasts, Profile Management
 */
class UI {
    static menuVisible = true;
    static gameOverVisible = false;
    static achievementsPanelVisible = false;
    static questsPanelVisible = false;
    static settingsVisible = false;
    static toasts = [];
    static challengeData = null;
    static toastDuration = 180; // frames (~3 seconds)

    // ─── DOM References ───
    static menuOverlay = null;
    static gameOverOverlay = null;
    static achievementsOverlay = null;
    static questsOverlay = null;

    /**
     * Initialize UI — create DOM overlays
     */
    static init() {
        UI.createMenuOverlay();
        UI.createGameOverOverlay();
        UI.createAchievementsOverlay();
        UI.createQuestsOverlay();
        UI.createGuideOverlay();

        // Check for challenge
        UI.challengeData = ChallengeSystem.parseChallengeFromURL();

        // Check username
        const username = GameStorage.getUsername();
        if (!username) {
            UI.showUsernamePrompt();
        }
    }

    // ═══════════════════════════════════════════
    //  MAIN MENU
    // ═══════════════════════════════════════════

    static createMenuOverlay() {
        UI.menuOverlay = document.createElement("div");
        UI.menuOverlay.id = "menu-overlay";
        UI.menuOverlay.innerHTML = `
            <div class="menu-container">
                <div class="menu-logo-area">
                    <img src="./assets/img/logo.png" alt="SliferJump" class="menu-logo" />
                    <h1 class="menu-title">SLIFER<span class="title-accent">JUMP</span></h1>
                    <p class="menu-subtitle">Rise of Slifer</p>
                </div>

                <div class="menu-profile" id="menu-profile">
                    <div class="profile-avatar">🐉</div>
                    <div class="profile-info">
                        <span class="profile-name" id="profile-name">Düellocu</span>
                        <span class="profile-score" id="profile-high-score">En Yüksek: 0</span>
                    </div>
                </div>

                ${UI.challengeData ? `
                <div class="challenge-banner">
                    <span class="challenge-icon">⚔️</span>
                    <span class="challenge-text"><strong>${UI.challengeData.challenger}</strong> sana meydan okuyor!<br>Hedef Skor: <strong>${UI.challengeData.score.toLocaleString()}</strong></span>
                </div>` : ""}

                <div class="menu-buttons">
                    <button class="menu-btn btn-play" id="btn-play">
                        <span class="btn-icon">⚡</span>
                        <span class="btn-text">BÖLÜM SEÇ</span>
                    </button>
                    <button class="menu-btn btn-secondary" id="btn-quests">
                        <span class="btn-icon">📜</span>
                        <span class="btn-text">GÖREVLER</span>
                    </button>
                    <button class="menu-btn btn-secondary" id="btn-achievements">
                        <span class="btn-icon">🏆</span>
                        <span class="btn-text">BAŞARIMLAR</span>
                    </button>
                    <button class="menu-btn btn-secondary" id="btn-guide">
                        <span class="btn-icon">📖</span>
                        <span class="btn-text">REHBER</span>
                    </button>
                    <button class="menu-btn btn-secondary" id="btn-settings">
                        <span class="btn-icon">⚙️</span>
                        <span class="btn-text">AYARLAR</span>
                    </button>
                </div>

                <p class="menu-footer">Created by SliferSoft © | slifersoft.com</p>
            </div>
        `;
        document.getElementById("game-container").appendChild(UI.menuOverlay);

        UI.createLevelSelectOverlay();

        // Event listeners
        document.getElementById("btn-play").addEventListener("click", () => {
            SoundManager.init();
            SoundManager.synthButtonClick();
            UI.hideMenu();
            UI.showLevelSelect();
        });
        document.getElementById("btn-achievements").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.showAchievements();
        });
        document.getElementById("btn-guide").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.menuOverlay.style.display = "none";
            UI.guideOverlay.style.display = "flex";
        });
        document.getElementById("btn-quests").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.showQuests();
        });
        document.getElementById("btn-settings").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.showSettings();
        });
    }
    static createLevelSelectOverlay() {
        UI.levelSelectOverlay = document.createElement("div");
        UI.levelSelectOverlay.id = "level-select-overlay";
        UI.levelSelectOverlay.style.display = "none";
        
        let levelButtonsHTML = "";
        const unlocked = typeof GameStorage !== 'undefined' ? GameStorage.getUnlockedLevel() : 1;
        for (let i = 1; i <= 25; i++) {
            const isUnlocked = i <= unlocked;
            const levelDef = typeof LEVELS !== 'undefined' ? LEVELS.find(l => l.id === i) : null;
            const name = levelDef ? levelDef.name : "Gizemli Bölüm";
            const boss = levelDef && levelDef.boss ? levelDef.boss : "Bilinmiyor";
            const bgImage = levelDef && levelDef.bgImage ? levelDef.bgImage : "assets/img/bg_level_1.png";
            
            levelButtonsHTML += `
                <div class="level-card ${isUnlocked ? 'unlocked' : 'locked'}" data-id="${i}">
                    <div class="level-card-bg" style="background-image: url('${bgImage}')"></div>
                    <div class="level-card-overlay"></div>
                    <div class="level-card-content">
                        <div class="level-card-left">
                            <span class="level-card-num">${i}</span>
                        </div>
                        <div class="level-card-center">
                            <span class="level-card-name">${name}</span>
                            <span class="level-card-boss">🛡️ ${boss}</span>
                        </div>
                        <div class="level-card-right">
                            ${isUnlocked ? '<span class="level-card-play">OYNA ▶</span>' : '<span class="level-card-lock">🔒 KİLİTLİ</span>'}
                        </div>
                    </div>
                </div>
            `;
        }

        UI.levelSelectOverlay.innerHTML = `
            <div class="panel-container level-select-panel" style="width:95%; max-width: 650px; padding-bottom:10px;">
                <div class="panel-header">
                    <h2>⚡ BÖLÜM SEÇ</h2>
                    <button class="back-btn" id="btn-close-level-select">⬅ Geri</button>
                </div>
                <div class="panel-body level-list">
                    ${levelButtonsHTML}
                </div>
            </div>
        `;
        document.getElementById("game-container").appendChild(UI.levelSelectOverlay);

        document.getElementById("btn-close-level-select").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.hideLevelSelect();
            UI.showMenu();
        });

        const btns = UI.levelSelectOverlay.querySelectorAll(".level-card.unlocked");
        btns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                SoundManager.synthButtonClick();
                const id = parseInt(e.currentTarget.getAttribute("data-id"));
                UI.hideLevelSelect();
                if (typeof startGame === 'function') startGame(id);
            });
        });
    }

    static showLevelSelect() {
        if (UI.menuOverlay) UI.menuOverlay.style.display = "none";
        
        const unlocked = GameStorage.getUnlockedLevel();
        const btns = UI.levelSelectOverlay.querySelectorAll(".level-card");
        btns.forEach((btn, idx) => {
            const id = idx + 1;
            if (id <= unlocked) {
                btn.classList.remove("locked");
                btn.classList.add("unlocked");
                const rightDiv = btn.querySelector(".level-card-right");
                if (rightDiv) rightDiv.innerHTML = '<span class="level-card-play">OYNA ▶</span>';
                
                
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener("click", (e) => {
                    SoundManager.synthButtonClick();
                    const targetId = parseInt(e.currentTarget.getAttribute("data-id"));
                    UI.hideLevelSelect();
                    if (typeof startGame === 'function') startGame(targetId);
                });
            } else {
                btn.classList.add("locked");
                const rightDivLock = btn.querySelector(".level-card-right");
                if (rightDivLock) rightDivLock.innerHTML = '<span class="level-card-lock">🔒 KİLİTLİ</span>';
                btn.classList.remove("unlocked");
                
            }
        });

        UI.levelSelectOverlay.style.display = "flex";
    }

    static hideLevelSelect() {
        if (UI.levelSelectOverlay) UI.levelSelectOverlay.style.display = "none";
    }

    static showMenu() {
        UI.menuVisible = true;
        if (UI.menuOverlay) {
            UI.menuOverlay.style.display = "flex";
            UI.updateMenuProfile();
        }
    }

    static hideMenu() {
        UI.menuVisible = false;
        if (UI.menuOverlay) UI.menuOverlay.style.display = "none";
    }

    static updateMenuProfile() {
        if (!UI.menuOverlay) return;
        const profileName = document.getElementById("profile-name");
        const profileScore = document.getElementById("profile-high-score");
        if (profileName) profileName.textContent = GameStorage.getUsername() || "Düellocu";
        if (profileScore) profileScore.textContent = "En Yüksek: " + (GameStorage.getHighScore() || 0).toLocaleString();
    }


    static createGameOverOverlay() {
        UI.gameOverOverlay = document.createElement("div");
        UI.gameOverOverlay.id = "gameover-overlay";
        UI.gameOverOverlay.style.display = "none";
        UI.gameOverOverlay.innerHTML = `
            <div class="menu-container gameover-panel">
                <h2 class="menu-title gameover-title">OYUN BİTTİ</h2>
                <div class="gameover-stats">
                    <p>Skor: <span id="go-score" class="stat-highlight">0</span></p>
                    <p>Bölüm: <span id="go-realm" class="stat-highlight">1</span></p>
                    <p>En Yüksek: <span id="go-highscore" class="stat-highlight">0</span></p>
                </div>
                
                <div id="go-challenge-result" style="display:none; margin:10px 0;"></div>
                <div id="go-new-achievements" class="achievements-unlocked-area"></div>
                
                <div class="challenge-link-section" id="challenge-link-area" style="display:none;">
                    <p>Bu skoru arkadaşınla paylaş ve meydan oku!</p>
                    <input type="text" id="challenge-link-input" readonly />
                    <button class="menu-btn btn-secondary" id="btn-copy-challenge">Kopyala</button>
                </div>
                
                <div class="menu-buttons">
                    <button class="menu-btn btn-play" id="btn-retry">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">TEKRAR OYNA</span>
                    </button>
                    <button class="menu-btn btn-secondary" id="btn-challenge-friend">
                        <span class="btn-icon">⚔️</span>
                        <span class="btn-text">MEYDAN OKU</span>
                    </button>
                    <button class="menu-btn btn-secondary" id="btn-home">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-text">ANA MENÜ</span>
                    </button>
                </div>
            </div>
        `;
        document.getElementById("game-container").appendChild(UI.gameOverOverlay);

        document.getElementById("btn-home").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.hideGameOver();
            if (typeof returnToMenu === 'function') returnToMenu();
        });
        
        document.getElementById("btn-challenge-friend").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.showChallengeLink();
        });
        
        document.getElementById("btn-copy-challenge").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            const input = document.getElementById("challenge-link-input");
            input.select();
            document.execCommand("copy");
            const btn = document.getElementById("btn-copy-challenge");
            btn.textContent = "Kopyalandı!";
            setTimeout(() => btn.textContent = "Kopyala", 2000);
        });
    }

    static showGameOver(score, realmName, highScore, newAchievements, isWin = false) {
        UI.gameOverVisible = true;
        
        const titleEl = UI.gameOverOverlay.querySelector('.gameover-title');
        titleEl.textContent = isWin ? "BÖLÜM GEÇİLDİ!" : "OYUN BİTTİ";
        titleEl.style.color = isWin ? "#FFD700" : "#ff4757";

        document.getElementById("go-score").textContent = score.toLocaleString();
        document.getElementById("go-realm").textContent = realmName;
        document.getElementById("go-highscore").textContent = highScore.toLocaleString();

        const challengeResult = document.getElementById("go-challenge-result");
        if (UI.challengeData && !isWin) {
            const result = ChallengeSystem.checkChallengeResult(score);
            if (result.won) {
                challengeResult.innerHTML = `<div class="challenge-won">🏆 ${result.challenger}'ı ${result.margin.toLocaleString()} puan farkla yendin!</div>`;
            } else {
                challengeResult.innerHTML = `<div class="challenge-lost">😤 ${result.challenger}'ı geçemedin! ${Math.abs(result.margin).toLocaleString()} puan kaldı.</div>`;
            }
            challengeResult.style.display = "block";
        } else {
            challengeResult.style.display = "none";
        }

        const achEl = document.getElementById("go-new-achievements");
        if (newAchievements && newAchievements.length > 0) {
            achEl.innerHTML = newAchievements.map(a => {
                const def = ACHIEVEMENT_DEFS.find(d => d.id === a);
                return def ? `<div class="new-achievement-badge">${def.icon} ${def.name}</div>` : "";
            }).join("");
        } else {
            achEl.innerHTML = "";
        }

        document.getElementById("challenge-link-area").style.display = "none";

        const retryBtn = document.getElementById("btn-retry");
        if (isWin) {
            retryBtn.innerHTML = `<span class="btn-icon">➡️</span><span class="btn-text">SONRAKİ BÖLÜM</span>`;
            retryBtn.onclick = () => {
                SoundManager.synthButtonClick();
                UI.hideGameOver();
                if (typeof startGame === "function") startGame(Math.min(25, currentLevelId + 1));
            };
        } else {
            retryBtn.innerHTML = `<span class="btn-icon">🔄</span><span class="btn-text">TEKRAR OYNA</span>`;
            retryBtn.onclick = () => {
                SoundManager.synthButtonClick();
                UI.hideGameOver();
                if (typeof startGame === "function") startGame(currentLevelId);
            };
        }

        UI.gameOverOverlay.style.display = "flex";
    }

    static hideGameOver() {
        UI.gameOverVisible = false;
        if (UI.gameOverOverlay) UI.gameOverOverlay.style.display = "none";
    }

    static showChallengeLink() {
        const username = GameStorage.getUsername() || "Düellocu";
        const score = parseInt(document.getElementById("go-score").textContent.replace(/\./g, "").replace(/,/g, "")) || 0;
        const realm = 1; 
        const url = ChallengeSystem.createChallengeURL(username, score, realm);

        const linkArea = document.getElementById("challenge-link-area");
        const linkInput = document.getElementById("challenge-link-input");
        linkInput.value = url;
        linkArea.style.display = "flex";
    }

    static createAchievementsOverlay() {
        UI.achievementsOverlay = document.createElement("div");
        UI.achievementsOverlay.id = "achievements-overlay";
        UI.achievementsOverlay.style.display = "none";
        UI.achievementsOverlay.innerHTML = `
            <div class="panel-container">
                <div class="panel-header">
                    <h2>🏆 Başarımlar</h2>
                    <button class="back-btn" id="btn-close-achievements">⬅ Geri</button>
                </div>
                <div class="panel-body" id="achievements-list"></div>
            </div>
        `;
        document.getElementById("game-container").appendChild(UI.achievementsOverlay);

        document.getElementById("btn-close-achievements").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.hideAchievements();
            if (typeof gameState !== 'undefined' && gameState === GAME_STATE.MENU) UI.showMenu();
        });
    }

    static showAchievements() {
        const list = document.getElementById("achievements-list");
        const allAch = typeof achievementSystem !== "undefined" ? achievementSystem.getAllAchievements() : [];
        list.innerHTML = allAch.map(a => `
            <div class="achievement-card ${a.unlocked ? "unlocked" : "locked"}">
                <span class="ach-icon">${a.unlocked ? a.icon : "🔒"}</span>
                <div class="ach-info">
                    <span class="ach-name">${a.name}</span>
                    <span class="ach-desc">${a.desc}</span>
                </div>
            </div>
        `).join("");
        UI.achievementsOverlay.style.display = "flex";
    }

    static hideAchievements() {
        UI.achievementsOverlay.style.display = "none";
    }

    static createQuestsOverlay() {
        UI.questsOverlay = document.createElement("div");
        UI.questsOverlay.id = "quests-overlay";
        UI.questsOverlay.style.display = "none";
        UI.questsOverlay.innerHTML = `
            <div class="panel-container">
                <div class="panel-header">
                    <h2>📜 Görevler</h2>
                    <button class="back-btn" id="btn-close-quests">⬅ Geri</button>
                </div>
                <div class="panel-body" id="quests-list"></div>
            </div>
        `;
        document.getElementById("game-container").appendChild(UI.questsOverlay);

        document.getElementById("btn-close-quests").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.hideQuests();
            if (typeof gameState !== 'undefined' && gameState === GAME_STATE.MENU) UI.showMenu();
        });
    }

    static showQuests() {
        const list = document.getElementById("quests-list");
        const quests = typeof questSystem !== "undefined" ? questSystem.getActiveQuests() : [];
        list.innerHTML = quests.length === 0
            ? '<p class="empty-msg">Oyuna başlayınca görevler aktif olacak!</p>'
            : quests.map(q => `
                <div class="quest-card ${q.completed ? "completed" : ""}">
                    <div class="quest-desc">${q.completed ? "✅" : "⬜"} ${q.desc}</div>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width:${Math.min(q.getProgress() * 100, 100)}%"></div>
                    </div>
                    <div class="quest-progress-text">${Math.min(q.current, q.target)} / ${q.target}</div>
                </div>
            `).join("");
        UI.questsOverlay.style.display = "flex";
    }

    static hideQuests() {
        UI.questsOverlay.style.display = "none";
    }

    static showSettings() {
        UI.showUsernamePrompt(true);
    }

    static showUsernamePrompt(isSettings = false) {
        const existing = document.getElementById("username-overlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.id = "username-overlay";
        overlay.innerHTML = `
            <div class="menu-container username-panel" style="width: 80%; padding: 30px;">
                <h2 class="menu-title" style="font-size: 26px; text-align: center; margin-bottom: 20px;">${isSettings ? "⚙️ Ayarlar" : "🐉 Hoş Geldin Düellocu!"}</h2>
                <div class="setting-group">
                    <label>Kullanıcı Adı</label>
                    <input type="text" id="username-input" placeholder="İsmini gir..." maxlength="20"
                        value="${GameStorage.getUsername() || ""}" />
                </div>
                <div class="setting-group">
                    <label>Ses</label>
                    <button class="menu-btn btn-secondary" id="btn-toggle-sound">
                        ${SoundManager.isMuted() ? "🔇 Ses Kapalı" : "🔊 Ses Açık"}
                    </button>
                </div>
                <div class="setting-group" style="margin-top: 15px; display: flex; align-items: center; justify-content: space-between;">
                    <label style="margin: 0; font-size: 14px;">Alternatif Menü Müziği</label>
                    <label class="switch">
                        <input type="checkbox" id="alt-music-checkbox" ${(GameStorage.getProfile().settings || {}).altMusic ? "checked" : ""} />
                        <span class="slider round"></span>
                    </label>
                </div>
                <button class="menu-btn btn-play" id="btn-save-settings">
                    <span class="btn-text">💾 KAYDET</span>
                </button>
            </div>
        `;
        document.getElementById("game-container").appendChild(overlay);

        document.getElementById("btn-toggle-sound").addEventListener("click", () => {
            SoundManager.toggleMute();
            document.getElementById("btn-toggle-sound").textContent = SoundManager.isMuted() ? "🔇 Ses Kapalı" : "🔊 Ses Açık";
        });

        document.getElementById("btn-save-settings").addEventListener("click", () => {
            const name = document.getElementById("username-input").value.trim();
            const altMusic = document.getElementById("alt-music-checkbox").checked;
            
            const profile = GameStorage.getProfile();
            if (name.length > 0) {
                profile.username = name;
            }
            profile.settings = profile.settings || {};
            profile.settings.altMusic = altMusic;
            GameStorage.saveProfile(profile);
            
            UI.updateMenuProfile();
            SoundManager.synthButtonClick();
            
            if (typeof gameState !== 'undefined' && gameState === GAME_STATE.MENU) {
                SoundManager.stopMenuMusic();
                SoundManager.playMenuMusic();
            }
            
            overlay.remove();
        });
    }

    // ═══════════════════════════════════════════
    //  IN-GAME HUD (drawn on canvas)
    // ═══════════════════════════════════════════

    /**
     * Draw the in-game HUD on the p5 canvas
     */
    static drawHUD(score, realm, fps, energy = 0) {
        push();
        // Inventory (Eyes & Reborn)
        fill(10, 15, 30, 180);
        stroke(255, 215, 0, 80);
        strokeWeight(1.5);
        rect(width - 70, 10, 60, 75, 8); // Taller for both items
        noStroke();
        fill(255, 215, 0);
        textSize(18);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        text("👁️ " + (gameStats.eyesCollected || 0), width - 40, 30);
        
        fill(0, 191, 255); // Blue for Reborn
        text("☥ " + (gameStats.rebornCount || 0), width - 40, 65);

        // Modern glassmorphism HUD panel
        fill(10, 15, 30, 180);
        stroke(255, 215, 0, 80);
        strokeWeight(1.5);
        rect(10, 10, 220, 65, 12);
        noStroke();

        // Level Name & Progress
        textSize(12);
        textStyle(BOLD);
        textAlign(LEFT, TOP);
        fill(150, 180, 255);
        text(realm.name.toUpperCase(), 20, 18);

        // Progress bar for Level Goal
        const progress = Math.min(score / realm.scoreGoal, 1);
        fill(0, 0, 0, 200);
        rect(20, 36, 180, 8, 4);
        
        // Progress gradient
        const ctx = drawingContext;
        const grad = ctx.createLinearGradient(20, 0, 200, 0);
        grad.addColorStop(0, '#00d2ff');
        grad.addColorStop(1, '#3a7bd5');
        ctx.fillStyle = grad;
        const pWidth = 180 * progress;
        if (pWidth > 0) {
            rect(20, 36, pWidth, 8, 4);
        }

        // Score Text
        textSize(16);
        fill(255, 215, 0);
        textStyle(BOLD);
        textAlign(RIGHT, TOP);
        text(Math.floor(score).toLocaleString(), 195, 52);
        
        textSize(11);
        fill(200);
        text("SKOR", 145, 54);

        // Thunder Force Energy Bar (Right side of screen)
        const energyW = 15;
        const energyH = 150;
        const energyX = width - 25;
        const energyY = height / 2 - energyH / 2;
        
        const isCooldown = (typeof gameStats !== 'undefined' && gameStats.thunderForceCooldown > 0);
        const cdSecs = isCooldown ? Math.ceil(gameStats.thunderForceCooldown / 60) : 0;

        fill(10, 15, 30, isCooldown ? 150 : 180);
        stroke(isCooldown ? color(100, 110, 130, 100) : color(255, 69, 0, 80));
        strokeWeight(1.5);
        rect(energyX, energyY, energyW, energyH, 8);
        noStroke();

        if (isCooldown) {
            // Deactivated bar showing remaining cooldown timer
            const cdFill = gameStats.thunderForceCooldown / 600;
            fill(80, 95, 125, 180);
            rect(energyX + 2, energyY + (energyH - (energyH * cdFill)) + 2, energyW - 4, Math.max(0, (energyH * cdFill) - 4), 4);

            // Cooldown seconds indicator
            push();
            textAlign(CENTER, CENTER);
            textSize(9);
            textStyle(BOLD);
            fill(200, 220, 255, 230);
            text(`${cdSecs}s`, energyX + energyW / 2, energyY + energyH / 2);
            pop();
        } else {
            const energyFill = Math.min(energy / 100, 1);
            const gradE = ctx.createLinearGradient(0, energyY + energyH, 0, energyY);
            gradE.addColorStop(0, '#ff416c');
            gradE.addColorStop(1, '#ff4b2b');
            ctx.fillStyle = gradE;
            const hFill = (energyH * energyFill) - 4;
            if (hFill > 0) {
                rect(energyX + 2, energyY + (energyH - (energyH * energyFill)) + 2, energyW - 4, hFill, 4);
            }
        }

        
        // FPS (small, bottom left)
        textSize(11);
        fill(100, 100, 100, 150);
        textAlign(LEFT, BOTTOM);
        text(`FPS: ${fps}`, 10, height - 8);

        // Copyright
        textAlign(RIGHT, BOTTOM);
        text("SliferSoft ©", width - 10, height - 8);

        // Challenge banner at top
        if (UI.challengeData) {
            UI.drawChallengeBanner(score);
        }

        pop();
    }

    /**
     * Draw challenge target banner at top of screen
     */
    static drawChallengeBanner(currentScore) {
        push();
        const bannerH = 30;
        // Background
        fill(0, 0, 0, 150);
        noStroke();
        rect(0, 0, width, bannerH);

        // Progress bar
        const progress = Math.min(currentScore / UI.challengeData.score, 1);
        fill(progress >= 1 ? "#00FF66" : "#FF6600");
        rect(0, bannerH - 3, width * progress, 3);

        // Text
        textSize(13);
        textAlign(CENTER, CENTER);
        fill(255);
        noStroke();
        text(
            `⚔️ ${UI.challengeData.challenger}: ${UI.challengeData.score.toLocaleString()} | Senin: ${currentScore.toLocaleString()}`,
            width / 2, bannerH / 2
        );
        pop();
    }

    // ═══════════════════════════════════════════
    //  TOAST NOTIFICATIONS (on canvas)
    // ═══════════════════════════════════════════

    /**
     * Add a toast notification
     */
    static addToast(text, icon = "🎯", color = "#FFD700") {
        if (typeof gameState !== 'undefined' && gameState === GAME_STATE.PLAYING) return;
        UI.toasts.push({
            text,
            icon,
            color,
            life: UI.toastDuration,
            maxLife: UI.toastDuration,
            y: height * 0.15,
        });
    }

    /**
     * Render and update toasts
     */
    static renderToasts() {
        push();
        for (let i = UI.toasts.length - 1; i >= 0; i--) {
            const t = UI.toasts[i];
            t.life--;

            // Fade in/out
            let alpha = 255;
            if (t.life > t.maxLife - 20) {
                alpha = map(t.life, t.maxLife, t.maxLife - 20, 0, 255);
            } else if (t.life < 30) {
                alpha = map(t.life, 30, 0, 255, 0);
            }

            // Slide to a compact block below the score HUD (Y ~ 20%)
            const targetY = height * 0.18 + (UI.toasts.length - 1 - i) * 32;
            t.y = lerp(t.y, targetY, 0.1);

            // Calculate dynamic text size based on length
            let currentTextSize = 13;
            textSize(currentTextSize);
            let combinedText = `${t.icon} ${t.text}`;
            while (textWidth(combinedText) > width - 30 && currentTextSize > 9) {
                currentTextSize--;
                textSize(currentTextSize);
            }

            // Background
            fill(0, 0, 0, alpha * 0.7);
            noStroke();
            rectMode(CENTER);
            const tw = textWidth(combinedText) + 40;
            rect(width / 2, t.y, Math.min(tw, width - 20), 28, 14);

            // Text
            textAlign(CENTER, CENTER);
            fill(red(color(t.color)), green(color(t.color)), blue(color(t.color)), alpha);
            noStroke();
            text(combinedText, width / 2, t.y);

            rectMode(CORNER);

            if (t.life <= 0) {
                UI.toasts.splice(i, 1);
            }
        }
        pop();
    }

    // ═══════════════════════════════════════════
    //  REALM TRANSITION SCREEN (on canvas)
    // ═══════════════════════════════════════════

    static realmTransitionTimer = 0;
    static realmTransitionMax = 120;
    static transitionRealm = null;

    static startRealmTransition(realm) {
        UI.transitionRealm = realm;
        UI.realmTransitionTimer = UI.realmTransitionMax;
    }

    static isTransitioning() {
        return UI.realmTransitionTimer > 0;
    }

    static renderRealmTransition() {
        if (UI.realmTransitionTimer <= 0) return false;
        UI.realmTransitionTimer--;

        push();
        const progress = 1 - (UI.realmTransitionTimer / UI.realmTransitionMax);

        // Flash white at the start
        if (progress < 0.15) {
            const flashAlpha = map(progress, 0, 0.15, 255, 0);
            fill(255, 255, 255, flashAlpha);
            rect(0, 0, width, height);
        }

        // Dark overlay
        const overlayAlpha = progress < 0.5
            ? map(progress, 0.15, 0.5, 200, 180)
            : map(progress, 0.5, 1.0, 180, 0);
        fill(0, 0, 0, Math.max(0, overlayAlpha));
        rect(0, 0, width, height);

        // Realm name
        if (progress > 0.1 && progress < 0.85) {
            const textAlpha = progress < 0.3
                ? map(progress, 0.1, 0.3, 0, 255)
                : progress > 0.7
                    ? map(progress, 0.7, 0.85, 255, 0)
                    : 255;

            textAlign(CENTER, CENTER);
            noStroke();

            // Realm number
            textSize(18);
            fill(200, 200, 200, textAlpha);
            text(`── BÖLÜM ${UI.transitionRealm.id} ──`, width / 2, height / 2 - 40);

            // Realm name
            textSize(32);
            textStyle(BOLD);
            fill(255, 215, 0, textAlpha);
            text(UI.transitionRealm.name, width / 2, height / 2);

            // Subtitle
            textSize(16);
            textStyle(ITALIC);
            fill(200, 200, 200, textAlpha);
            text(UI.transitionRealm.subtitle, width / 2, height / 2 + 35);

            textStyle(NORMAL);
        }

        pop();

        return UI.realmTransitionTimer > 0;
    }

    // ═══════════════════════════════════════════
    //  STORY MODE
    // ═══════════════════════════════════════════
    static createStoryOverlay() {
        if (document.getElementById("story-overlay")) return;
        const overlay = document.createElement("div");
        overlay.id = "story-overlay";
        overlay.innerHTML = `
            <div class="story-box">
                <div class="story-speaker" id="story-speaker">Yugi Muto</div>
                <div class="story-text" id="story-text">Karanlık krallığa giriş yapıyoruz. Hazır ol!</div>
                <button class="menu-btn btn-play" id="btn-story-continue">
                    <span class="btn-text">İlerle</span> ➡️
                </button>
            </div>
        `;
        document.getElementById("game-container").appendChild(overlay);

        document.getElementById("btn-story-continue").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            document.getElementById("story-overlay").style.display = "none";
            if (typeof startGame === "function") startGame(UI.pendingLevelId);
        });
    }

    static showStory(levelId) {
        UI.createStoryOverlay();
        UI.pendingLevelId = levelId;
        const overlay = document.getElementById("story-overlay");
        const speaker = document.getElementById("story-speaker");
        const text = document.getElementById("story-text");

        // Simple story map
        if (levelId === 1) {
            speaker.textContent = "Yugi Muto";
            text.textContent = "Düellocu Krallığına hoş geldin! Orichalcos'un mührü uyanıyor, Slifer'ın gücüne ihtiyacımız var. Gökyüzüne doğru sıçra!";
        } else if (levelId === 6) {
            speaker.textContent = "Seto Kaiba";
            text.textContent = "Hmph! Sadece zıplayarak beni yenebileceğini mi sanıyorsun? Meteor yağmurları başlıyor, ezilmemeye çalış Yugi!";
        } else if (levelId === 11) {
            speaker.textContent = "Maximillion Pegasus";
            text.textContent = "Milenyum Gözüm her hareketini görüyor... Gölgeler Diyarı'nın canavarları seni bekliyor, Yugi-boy!";
        } else if (levelId === 16) {
            speaker.textContent = "Marik Ishtar";
            text.textContent = "Aptallar! Orichalcos'un lavları yükseliyor. Aşağısı cehennem ateşiyle dolu. Düşersen ruhun Gölgeler Diyarına hapsolur!";
        } else if (levelId === 21) {
            speaker.textContent = "Atem (Firavun)";
            text.textContent = "Kaderimizi biz çizeriz! Tanrı kartının gücünü göster Slifer! Zirveye ulaşıp Orichalcos'u sonsuza dek yok etme vakti geldi!";
        } else {
            // No story for this level, just start
            if (typeof startGame === "function") startGame(levelId);
            return;
        }

        overlay.style.display = "flex";
    }

    static createGuideOverlay() {
        UI.guideOverlay = document.createElement("div");
        UI.guideOverlay.id = "guide-overlay";
        UI.guideOverlay.innerHTML = `
            <div class="panel-container" style="width: 90%; max-width: 450px; max-height: 85%; display: flex; flex-direction: column;">
                <div class="panel-header">
                    <h2>📜 Rehber</h2>
                    <button class="back-btn" id="btn-close-guide">⬅ Geri</button>
                </div>
                <div class="panel-content" style="text-align: left; padding: 20px; font-size: 14px; line-height: 1.5; overflow-y: auto; flex-grow: 1; background: rgba(0,0,0,0.6); border-radius: 10px;">
                    <p><b>🐉 Slifer'ın Yükselişi:</b> Boşluğa düşmeden ve lavlara yakalanmadan gökyüzünün zirvesine doğru tırmanın!</p>
                    <hr style="border-color: rgba(255,215,0,0.3); margin: 12px 0;">

                    <h3 style="color:#FFD700; margin-bottom: 8px;">⚡ Özel Güç: Thunder Force</h3>
                    <p>• <b>Otomatik Saldırı:</b> Yukarı tırmandıkça sağdaki dikey enerji barınız dolar. Bar <b>%100 dolduğunda otomatik olarak</b> devreye girer (veya doluyken ekrana dokunarak / F tuşuna basarak ateşlenebilir).</p>
                    <p>• <b>Ateş Tufanı & Puan:</b> Slifer devasa bir ejderha ateşi püskürterek <b>+2000 Skor</b> kazanır, tehlikeleri temizler ve süpersonik hızda göğe yükselir!</p>
                    <p>• <b>10sn Bekleme Süresi (Cooldown):</b> Saldırı sonrası enerji barı <b>10 saniye</b> deaktif olur ve sayaç geri sayar. Süre bitince tekrar dolmaya başlar.</p>
                    
                    <hr style="border-color: rgba(255,215,0,0.3); margin: 12px 0;">
                    <h3 style="color:#FFD700; margin-bottom: 8px;">🎴 Kartlar & Eşyalar</h3>
                    <p>👁️ <b>Milenyum Gözü (Toplanabilir):</b> Altın daire içindeki toplanabilir göz. Envanterde birikir; Orichalcos karadeliğine girildiğinde 1 göz feda edilerek karadeliği parçalar ve sizi kurtarır.</p>
                    <p>👁️ <b>Milenyum Yayı (Basamak):</b> Basamakların üzerindeki altın ışıltılı yay. Üzerine bastığınızda süper zıplama ile yükseklere fırlatır.</p>
                    <p>⚔️ <b>Işık Kılıçları (Swords of Revealing Light):</b> 10 saniye boyunca koruyucu kalkan açar. Meteor, canavar veya lazer çarpışmasında kalkan kırılarak sizi 1 ölümcül darbeden korur.</p>
                    <p>☥ <b>Yeniden Doğuş (Monster Reborn):</b> En fazla 3 adet birikir. Boşluğa düştüğünüzde veya lavlara temas ettiğinizde sizi kurtararak yukarı fırlatır. <i>(⚠️ Sadece Orichalcos karadeliğine karşı İŞE YARAMAZ!)</i></p>
                    <p>🏺 <b>Açgözlülük Küpü (Pot of Greed):</b> 10 saniye boyunca kazandığınız tüm tırmanma puanlarını 2 katına çıkarır.</p>
                    
                    <hr style="border-color: rgba(255,85,85,0.3); margin: 12px 0;">
                    <h3 style="color:#FF5555; margin-bottom: 8px;">⚠️ Tehlikeler</h3>
                    <p>🕳️ <b>Orichalcos Mührü:</b> Sizi yutmaya çalışan yeşil dönen karadelik. Sadece envanterinizdeki toplanabilir Milenyum Gözü ile parçalanabilir; göz yoksa Slifer'ı içine çeker.</p>
                    <p>☄️ <b>Meteorlar:</b> Gökten düşen alevli meteor taşları. Temasta öldürür; Işık Kılıçları kalkanı ile engellenebilir.</p>
                    <p>🌋 <b>Yükselen Lav:</b> Alttan yükselen ölümcül lav dalgası. Slifer lavın içine batarsa yanar, hızlı tırmanarak kaçın!</p>
                    <p>👾 <b>Canavarlar & Lazerler:</b> Basamaklarda devriye gezen veya lazer ateşleyen yaratıklar. Çarpışmada ölümcüldür (Işık Kılıçları korur).</p>
                    
                    <hr style="border-color: rgba(0,210,255,0.3); margin: 12px 0;">
                    <h3 style="color:#00d2ff; margin-bottom: 8px;">🪜 Basamak Türleri</h3>
                    <p>🟢 <b>Standart:</b> Güvenli sabit basamaklar.</p>
                    <p>🔵 <b>Hareketli:</b> Sağa ve sola sürekli hareket eden basamaklar.</p>
                    <p>⚪ <b>Kırılgan:</b> Bir kez basıldığında kırılıp yok olan basamaklar.</p>
                </div>
                
            </div>
        `;
        UI.guideOverlay.style.display = "none";
        document.getElementById("game-container").appendChild(UI.guideOverlay);

        document.getElementById("btn-close-guide").addEventListener("click", () => {
            SoundManager.synthButtonClick();
            UI.guideOverlay.style.display = "none";
            UI.menuOverlay.style.display = "flex";
        });
    }
}
