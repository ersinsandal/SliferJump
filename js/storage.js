/**
 * GameStorage handles all local storage operations for player profile,
 * statistics, achievements, and quest tracking.
 */
class GameStorage {
    static PREFIX = 'sliferJump_';

    /**
     * Initializes or retrieves the player profile.
     * @returns {Object} Player profile object
     */
    static getProfile() {
        const data = localStorage.getItem(this.PREFIX + 'profile');
        if (data) {
            return JSON.parse(data);
        }
        
        // Default profile
        const defaultProfile = {
            username: 'Player',
            unlockedLevel: 1, // Start at level 1
            highScore: 0,
            totalGames: 0,
            totalScore: 0,
            lifetimeCollected: 0,
            orichalcosDeaths: 0,
            highestRealm: 1, // Legacy tracking
            createdAt: Date.now()
        };
        this.saveProfile(defaultProfile);
        return defaultProfile;
    }

    /**
     * Saves the player profile to local storage.
     * @param {Object} profile 
     */
    static saveProfile(profile) {
        localStorage.setItem(this.PREFIX + 'profile', JSON.stringify(profile));
    }

    /**
     * @returns {number} The highest unlocked level (1-25)
     */
    static getUnlockedLevel() {
        return this.getProfile().unlockedLevel || 1;
    }

    /**
     * Unlocks the given level if it is higher than the current unlocked level.
     * @param {number} levelId 
     */
    static unlockLevel(levelId) {
        const profile = this.getProfile();
        if (levelId > (profile.unlockedLevel || 1)) {
            profile.unlockedLevel = levelId;
            this.saveProfile(profile);
        }
    }

    /**
     * Sets the player's username.
     * @param {string} name 
     */
    static setUsername(name) {
        const profile = this.getProfile();
        profile.username = name;
        this.saveProfile(profile);
    }

    /**
     * Gets the player's username.
     * @returns {string|null}
     */
    static getUsername() {
        return this.getProfile().username;
    }

    /**
     * Gets the current high score.
     * @returns {number}
     */
    static getHighScore() {
        return this.getProfile().highScore;
    }

    /**
     * Sets the high score if the new score is higher.
     * @param {number} score 
     */
    static setHighScore(score) {
        const profile = this.getProfile();
        if (score > (profile.highScore || 0)) {
            profile.highScore = score;
            this.saveProfile(profile);
        }
    }

    static saveHighScore(score) {
        this.setHighScore(score);
    }

    /**
     * Gets the current game stats.
     * @returns {Object}
     */
    static getStats() {
        const profile = this.getProfile();
        return {
            totalGames: profile.totalGames,
            totalScore: profile.totalScore,
            lifetimeCollected: profile.lifetimeCollected,
            orichalcosDeaths: profile.orichalcosDeaths,
            highestRealm: profile.highestRealm
        };
    }

    /**
     * Updates game stats by merging/adding values.
     * @param {Object} statsObj 
     */
    static updateStats(statsObj) {
        const profile = this.getProfile();
        
        if (statsObj.totalGames) profile.totalGames += statsObj.totalGames;
        if (statsObj.totalScore) profile.totalScore += statsObj.totalScore;
        if (statsObj.lifetimeCollected) profile.lifetimeCollected += statsObj.lifetimeCollected;
        if (statsObj.orichalcosDeaths) profile.orichalcosDeaths += statsObj.orichalcosDeaths;
        if (statsObj.highestRealm && statsObj.highestRealm > profile.highestRealm) {
            profile.highestRealm = statsObj.highestRealm;
        }
        
        this.saveProfile(profile);
    }

    /**
     * Gets unlocked achievements.
     * @returns {Array<string>} Array of unlocked achievement IDs
     */
    static getAchievements() {
        const data = localStorage.getItem(this.PREFIX + 'achievements');
        return data ? JSON.parse(data) : [];
    }

    /**
     * Unlocks an achievement if not already unlocked.
     * @param {string} id Achievement ID
     */
    static unlockAchievement(id) {
        const achievements = this.getAchievements();
        if (!achievements.includes(id)) {
            achievements.push(id);
            localStorage.setItem(this.PREFIX + 'achievements', JSON.stringify(achievements));
        }
    }

    /**
     * Gets completed quests.
     * @returns {Array<string>} Array of completed quest IDs
     */
    static getCompletedQuests() {
        const data = localStorage.getItem(this.PREFIX + 'quests');
        return data ? JSON.parse(data) : [];
    }

    /**
     * Completes a quest if not already completed.
     * @param {string} id Quest ID
     */
    static completeQuest(id) {
        const quests = this.getCompletedQuests();
        if (!quests.includes(id)) {
            quests.push(id);
            localStorage.setItem(this.PREFIX + 'quests', JSON.stringify(quests));
        }
    }
}
