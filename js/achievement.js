class AchievementSystem {
    constructor() {
        this.unlockedIds = new Set();
        this.justUnlocked = [];
    }

    init() {
        this.unlockedIds = new Set();
        if (typeof GameStorage !== 'undefined') {
            const saved = GameStorage.getAchievements();
            if (saved && Array.isArray(saved)) {
                saved.forEach(id => this.unlockedIds.add(id));
            }
        }
    }

    /**
     * @param {string} id 
     * @returns {boolean} True if just unlocked
     */
    checkAndUnlock(id) {
        if (!this.unlockedIds.has(id)) {
            this.unlockedIds.add(id);
            this.justUnlocked.push(id);
            if (typeof GameStorage !== 'undefined') {
                GameStorage.unlockAchievement(id);
            }
            return true;
        }
        return false;
    }

    /**
     * @param {string} id 
     * @returns {boolean}
     */
    isUnlocked(id) {
        return this.unlockedIds.has(id);
    }

    /**
     * @returns {string[]} Array of achievement IDs
     */
    getJustUnlocked() {
        const unlocked = [...this.justUnlocked];
        this.justUnlocked = [];
        return unlocked;
    }

    /**
     * @returns {Object[]}
     */
    getAllAchievements() {
        if (typeof ACHIEVEMENT_DEFS === 'undefined') return [];
        return ACHIEVEMENT_DEFS.map(def => ({
            ...def,
            unlocked: this.unlockedIds.has(def.id)
        }));
    }

    /**
     * @returns {number}
     */
    getUnlockedCount() {
        return this.unlockedIds.size;
    }

    /**
     * @returns {number}
     */
    getTotalCount() {
        if (typeof ACHIEVEMENT_DEFS === 'undefined') return 0;
        return ACHIEVEMENT_DEFS.length;
    }

    checkAll(stats, level, winStatus) {
        this.checkGameEndAchievements(stats);
        if (winStatus) this.checkAndUnlock('level_clear');
    }

    /**
     * @param {Object} stats 
     */
    checkGameEndAchievements(stats) {
        this.checkAndUnlock('first_flight');

        if (stats.score >= 5000) this.checkAndUnlock('god_card');
        if (stats.highestRealm >= 3) this.checkAndUnlock('shadow_duelist');
        if (stats.meteorsDodged >= 20) this.checkAndUnlock('meteor_hunter');
        if (stats.lavaScore >= 5000) this.checkAndUnlock('lava_walker');
        
        if (stats.collectedTypes) {
            const types = Object.keys(stats.collectedTypes);
            if (types.length >= 4) {
                this.checkAndUnlock('collector');
            }
        }

        if (stats.highestRealm >= 5) this.checkAndUnlock('divine_ascent');
        if (stats.score >= 50000) this.checkAndUnlock('legend');
        if (stats.monstersEvaded >= 5) this.checkAndUnlock('lightning_breath');
        if (stats.highestRealm >= 5) this.checkAndUnlock('realm_master');
        if (stats.score >= 3000 && stats.timeSeconds <= 30) this.checkAndUnlock('speed_demon');
    }

    /**
     * @param {Object} profile 
     */
    checkLifetimeAchievements(profile) {
        if (profile.orichalcosDeaths >= 100) {
            this.checkAndUnlock('orichalcos_curse');
        }
    }
}
