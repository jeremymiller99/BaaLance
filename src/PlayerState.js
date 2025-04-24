/**
 * Singleton class to maintain player state across scene transitions
 */
class PlayerState {
    constructor() {
        // Check if instance already exists
        if (PlayerState.instance) {
            return PlayerState.instance;
        }
        
        // Create a new instance if one doesn't exist
        PlayerState.instance = this;
        
        // Initialize default player state
        this.data = {
            money: 100,
            stats: {
                wins: 0,
                losses: 0,
                highestScore: 0
            },
            equipment: {
                currentLance: 'lance_0',
                ownedLances: ['lance_0', 'lance_1', 'lance_2']
            },
            currentSkin: 'default',
            skins: {
                'default': true
            }
        };
        
        // Pending stats update for when scene is not ready
        this.pendingStatsUpdate = null;
        
        return this;
    }
    
    /**
     * Get a copy of player state data
     * @returns {Object} Player state data
     */
    getState() {
        return this.data;
    }
    
    /**
     * Update player stats after a game
     * @param {number} score - The player's score
     * @param {boolean} won - Whether the player won
     */
    updateStats(score, won) {
        // Update wins/losses
        if (won) {
            this.data.stats.wins += 1;
        } else {
            this.data.stats.losses += 1;
        }

        // Update highest score if current score is higher
        if (score > this.data.stats.highestScore) {
            this.data.stats.highestScore = score;
        }

        // Add some money for playing (more for winning)
        const moneyEarned = won ? 50 : 20;
        this.data.money += moneyEarned;
        
        // Store pending stats update for other scenes to use
        this.pendingStatsUpdate = { score, won };
    }
    
    /**
     * Get pending stats update and clear it
     * @returns {Object|null} Pending stats update
     */
    getPendingStatsUpdate() {
        const update = this.pendingStatsUpdate;
        this.pendingStatsUpdate = null;
        return update;
    }
    
    /**
     * Update current skin
     * @param {string} skinId - The ID of the skin to set as current
     */
    setCurrentSkin(skinId) {
        if (this.data.skins[skinId]) {
            this.data.currentSkin = skinId;
        }
    }
    
    /**
     * Add a new skin to the player's collection
     * @param {string} skinId - The ID of the skin to add
     */
    addSkin(skinId) {
        this.data.skins[skinId] = true;
    }
    
    /**
     * Update current lance
     * @param {string} lanceId - The ID of the lance to set as current
     */
    setCurrentLance(lanceId) {
        if (this.data.equipment.ownedLances.includes(lanceId)) {
            this.data.equipment.currentLance = lanceId;
        }
    }
    
    /**
     * Add a new lance to the player's collection
     * @param {string} lanceId - The ID of the lance to add
     */
    addLance(lanceId) {
        if (!this.data.equipment.ownedLances.includes(lanceId)) {
            this.data.equipment.ownedLances.push(lanceId);
        }
    }
    
    /**
     * Update career progress
     * @param {string} enemyId - ID of the defeated enemy
     * @param {boolean} won - Whether the player won
     * @param {Object} rewards - Rewards earned (money instead of experience)
     */
    updateCareerProgress(enemyId, won, rewards) {
        if (!this.data.careerProgress) {
            this.data.careerProgress = {
                defeatedEnemies: {},
                currentLeague: 'rookie',
                leagueWins: 0
            };
        }
        
        // Update defeated enemies record
        if (!this.data.careerProgress.defeatedEnemies[enemyId]) {
            this.data.careerProgress.defeatedEnemies[enemyId] = 0;
        }
        
        if (won) {
            this.data.careerProgress.defeatedEnemies[enemyId]++;
            this.data.careerProgress.leagueWins++;
            
            // Add money reward directly to player's money
            if (rewards && rewards.moneyReward) {
                this.data.money += rewards.moneyReward;
            }
        }
    }
    
    /**
     * Get career progress
     * @returns {Object} Career progress data
     */
    getCareerProgress() {
        if (!this.data.careerProgress) {
            this.data.careerProgress = {
                defeatedEnemies: {},
                currentLeague: 'rookie',
                leagueWins: 0
            };
        }
        return this.data.careerProgress;
    }
    
    /**
     * Get player rank based on wins
     * @returns {Object} Player rank info
     */
    getRank() {
        const wins = this.data.stats.wins;
        
        // Define rank tiers
        const ranks = [
            { name: 'Novice', minWins: 0, color: '#FFFFFF' },
            { name: 'Squire', minWins: 3, color: '#00FF00' },
            { name: 'Knight', minWins: 7, color: '#0088FF' },
            { name: 'Veteran', minWins: 12, color: '#FF00FF' },
            { name: 'Champion', minWins: 18, color: '#FFFF00' },
            { name: 'Master', minWins: 25, color: '#FF0000' },
            { name: 'Legendary', minWins: 35, color: '#FF8800' }
        ];
        
        // Find current rank based on wins
        let currentRank = ranks[0];
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (wins >= ranks[i].minWins) {
                currentRank = ranks[i];
                break;
            }
        }
        
        // Calculate progress to next rank
        let nextRank = null;
        let progress = 100;  // 100% if at max rank
        
        for (let i = 0; i < ranks.length; i++) {
            if (ranks[i].name === currentRank.name && i < ranks.length - 1) {
                nextRank = ranks[i + 1];
                const totalWinsNeeded = nextRank.minWins - currentRank.minWins;
                const winsGained = wins - currentRank.minWins;
                progress = Math.min(100, Math.floor((winsGained / totalWinsNeeded) * 100));
                break;
            }
        }
        
        return {
            name: currentRank.name,
            color: currentRank.color,
            wins: wins,
            progress: progress,
            nextRank: nextRank ? nextRank.name : null,
            winsToNextRank: nextRank ? nextRank.minWins - wins : 0
        };
    }
    
    /**
     * Get the list of leagues that are unlocked for the player
     * @returns {string[]} Array of unlocked league IDs
     */
    getUnlockedLeagues() {
        // Initialize enemyProgress if it doesn't exist
        if (!this.data.enemyProgress) {
            this.data.enemyProgress = { 
                leagues: { 'rookie': true },
                enemies: {} 
            };
        }
        
        // Return array of league IDs that are unlocked (true)
        return Object.keys(this.data.enemyProgress.leagues).filter(
            leagueId => this.data.enemyProgress.leagues[leagueId] === true
        );
    }
    
    /**
     * Check and update league access based on rank
     */
    updateRankAndLeagues() {
        try {
            const rank = this.getRank();
            
            // Map ranks to league access
            const rankLeagueMap = {
                'Novice': ['rookie'],
                'Squire': ['rookie', 'amateur'],
                'Knight': ['rookie', 'amateur', 'pro'],
                'Veteran': ['rookie', 'amateur', 'pro'],
                'Champion': ['rookie', 'amateur', 'pro'],
                'Master': ['rookie', 'amateur', 'pro'],
                'Legendary': ['rookie', 'amateur', 'pro']
            };
            
            // Initialize enemyProgress if it doesn't exist
            if (!this.data.enemyProgress) {
                this.data.enemyProgress = { 
                    leagues: { 'rookie': true },
                    enemies: {} 
                };
            }
            
            // Get leagues player should have access to
            const accessibleLeagues = rankLeagueMap[rank.name] || ['rookie'];
            
            // Unlock leagues based on rank
            accessibleLeagues.forEach(leagueId => {
                this.data.enemyProgress.leagues[leagueId] = true;
            });
            
            return rank;
        } catch (error) {
            console.error("Error in updateRankAndLeagues:", error);
            
            // Initialize rookie league at minimum in case of error
            if (!this.data.enemyProgress) {
                this.data.enemyProgress = { 
                    leagues: { 'rookie': true },
                    enemies: {} 
                };
            }
            
            return { 
                name: 'Novice', 
                color: '#FFFFFF', 
                wins: this.data.stats.wins || 0,
                progress: 0,
                nextRank: 'Squire',
                winsToNextRank: 3 - (this.data.stats.wins || 0)
            };
        }
    }
} 