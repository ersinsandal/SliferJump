class Quest {
    /**
     * @param {Object} template 
     * @param {boolean} isPersistent 
     */
    constructor(template, isPersistent) {
        this.id = template.id;
        this.desc = template.desc;
        this.target = template.target;
        this.stat = template.stat;
        this.special = template.special;
        this.current = 0;
        this.completed = false;
        this.isPersistent = isPersistent;
    }

    /**
     * @param {number} value 
     * @returns {boolean} True if just completed
     */
    updateProgress(value) {
        if (this.completed) return false;
        this.current = value;
        if (this.current >= this.target) {
            this.current = this.target;
            this.completed = true;
            return true;
        }
        return false;
    }

    /**
     * @returns {number} Value between 0 and 1
     */
    getProgress() {
        return Math.min(Math.max(this.current / this.target, 0), 1);
    }

    /**
     * @returns {boolean}
     */
    isCompleted() {
        return this.completed;
    }
}

class QuestSystem {
    constructor() {
        this.activeInstantQuests = [];
        this.persistentQuests = [];
        this.justCompleted = [];
    }

    initNewGame() {
        this.activeInstantQuests = [];
        const available = (typeof QUEST_TEMPLATES !== 'undefined' && QUEST_TEMPLATES.instant) ? QUEST_TEMPLATES.instant.slice() : [];
        
        // Shuffle and pick 3
        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
        }
        
        // Filter out completed persistent quests if needed, but instant quests are typically fresh per game
        const picked = available.slice(0, 3);
        
        for (const template of picked) {
            this.activeInstantQuests.push(new Quest(template, false));
        }
    }

    loadPersistentQuests() {
        this.persistentQuests = [];
        if (typeof QUEST_TEMPLATES === 'undefined' || !QUEST_TEMPLATES.persistent) return;
        
        const storage = (typeof GameStorage !== 'undefined') ? GameStorage.getProfile() : {};
        const completedIds = storage.completedQuests || [];
        
        for (const template of QUEST_TEMPLATES.persistent) {
            if (!completedIds.includes(template.id)) {
                this.persistentQuests.push(new Quest(template, true));
            }
        }
    }

    /**
     * @param {string} statName 
     * @param {number} value 
     */
    updateStat(statName, value) {
        const checkQuest = (quest) => {
            if (quest.stat === statName && !quest.completed) {
                if (quest.updateProgress(value)) {
                    this.justCompleted.push(quest);
                    if (quest.isPersistent && typeof GameStorage !== 'undefined') {
                        GameStorage.completeQuest(quest.id);
                    }
                }
            }
        };

        this.activeInstantQuests.forEach(checkQuest);
        this.persistentQuests.forEach(checkQuest);
    }

    /**
     * @returns {Quest[]}
     */
    getJustCompleted() {
        const completed = [...this.justCompleted];
        this.justCompleted = [];
        return completed;
    }

    /**
     * @returns {Quest[]}
     */
    getActiveQuests() {
        return [...this.activeInstantQuests, ...this.persistentQuests];
    }

    /**
     * @returns {number}
     */
    getCompletedCount() {
        let count = 0;
        this.activeInstantQuests.forEach(q => { if (q.completed) count++; });
        this.persistentQuests.forEach(q => { if (q.completed) count++; });
        return count;
    }

    evaluateGameEnd(stats, isWin) {
        if (isWin) this.updateStat("beatRealm", 1);
        if (stats && stats.score) this.updateStat("score", stats.score);
        if (stats && stats.eyesCollected) this.updateStat("eyesCollected", stats.eyesCollected);
    }

    reset() {
        this.activeInstantQuests = [];
    }
}
