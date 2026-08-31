class ChallengeSystem {
    /**
     * @param {string} username 
     * @param {number} score 
     * @param {number} realmId 
     * @returns {string}
     */
    static createChallengeURL(username, score, realmId) {
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        const url = new URL(origin + pathname);
        url.searchParams.set('challenger', encodeURIComponent(username));
        url.searchParams.set('score', score.toString());
        url.searchParams.set('realm', realmId.toString());
        return url.toString();
    }

    /**
     * @returns {Object|null}
     */
    static parseChallengeFromURL() {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        if (params.has('challenger') && params.has('score') && params.has('realm')) {
            return {
                challenger: decodeURIComponent(params.get('challenger')),
                score: parseInt(params.get('score'), 10),
                realm: parseInt(params.get('realm'), 10)
            };
        }
        return null;
    }

    /**
     * @returns {boolean}
     */
    static isChallenge() {
        return this.parseChallengeFromURL() !== null;
    }

    /**
     * @returns {Object|null}
     */
    static getChallengeData() {
        if (this._cachedChallengeData === undefined) {
            this._cachedChallengeData = this.parseChallengeFromURL();
        }
        return this._cachedChallengeData;
    }

    /**
     * @param {number} playerScore 
     * @returns {Object|null}
     */
    static checkChallengeResult(playerScore) {
        const data = this.getChallengeData();
        if (!data) return null;
        
        const won = playerScore > data.score;
        return {
            won: won,
            challenger: data.challenger,
            challengeScore: data.score,
            playerScore: playerScore,
            margin: playerScore - data.score
        };
    }

    static clearChallenge() {
        if (typeof window !== 'undefined' && window.history.replaceState) {
            const url = new URL(window.location);
            url.searchParams.delete('challenger');
            url.searchParams.delete('score');
            url.searchParams.delete('realm');
            window.history.replaceState({}, document.title, url.toString());
            this._cachedChallengeData = null;
        }
    }

    /**
     * @param {string} text 
     * @returns {Promise<boolean>}
     */
    static async copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {
                console.error("Clipboard API failed, falling back", e);
            }
        }
        
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) {
            console.error("Fallback clipboard failed", err);
        }
        
        textArea.remove();
        return success;
    }
}
