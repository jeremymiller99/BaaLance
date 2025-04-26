class Enemy {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.difficulty = config.difficulty || 1;
        this.skin = config.skin || 'sheep1_default';
        this.lance = config.lance || 'lance_0';
        this.baseScore = config.baseScore || 5;
        this.scoreVariance = config.scoreVariance || 2;
        this.minScore = config.minScore || (this.baseScore - this.scoreVariance);
        this.maxScore = config.maxScore || (this.baseScore + this.scoreVariance);
        this.description = config.description || '';
        this.unlocked = config.unlocked || false;
        this.league = config.league || 'rookie';
        this.moneyReward = config.moneyReward || 50;
    }

    // Calculate a score for this enemy based on their score range
    calculateScore() {
        return Math.floor(Math.random() * (this.maxScore - this.minScore + 1)) + this.minScore;
    }

    // Get score range as string
    getScoreRange() {
        return `${this.minScore}-${this.maxScore}`;
    }

    // Calculate money reward for defeating this enemy
    calculateMoneyReward(playerScore) {
        // Base money reward
        let money = this.moneyReward;
        
        // Bonus based on player's performance
        if (playerScore > this.maxScore) {
            money = Math.floor(money * 1.5); // 50% bonus for exceeding max score
        }
        
        return money;
    }
}

class EnemySystem {
    constructor(scene) {
        this.scene = scene;
        
        // Define enemy presets
        this.enemies = {
            // Rookie League
            'novice_sheep': new Enemy({
                id: 'novice_sheep',
                name: 'Novice Sheep',
                difficulty: 1,
                skin: 'sheep2_default',
                lance: 'lance_0',
                minScore: 8,
                maxScore: 12,
                description: 'A beginner with little experience.',
                unlocked: true,
                league: 'rookie',
                moneyReward: 50
            }),
            'eager_ram': new Enemy({
                id: 'eager_ram',
                name: 'Eager Ram',
                difficulty: 2,
                skin: 'ram_default',
                lance: 'lance_1',
                minScore: 12,
                maxScore: 18,
                description: 'Enthusiastic but lacking technique.',
                unlocked: true,
                league: 'rookie',
                moneyReward: 75
            }),
            
            // Amateur League
            'veteran_sheep': new Enemy({
                id: 'veteran_sheep',
                name: 'Veteran Sheep',
                difficulty: 3,
                skin: 'sheep1_sunglass',
                lance: 'lance_2',
                minScore: 15,
                maxScore: 22,
                description: 'Experienced and confident.',
                unlocked: false,
                league: 'amateur',
                moneyReward: 100
            }),
            'stylish_ram': new Enemy({
                id: 'stylish_ram',
                name: 'Stylish Ram',
                difficulty: 4,
                skin: 'sheep1_tophat',
                lance: 'lance_3',
                minScore: 22,
                maxScore: 25,
                description: 'All about flair and technique.',
                unlocked: false,
                league: 'amateur',
                moneyReward: 150
            }),
            
            // Pro League
            'champion_sheep': new Enemy({
                id: 'champion_sheep',
                name: 'Champion Sheep',
                difficulty: 5,
                skin: 'sheep1_bling',
                lance: 'lance_4',
                minScore: 25,
                maxScore: 30,
                description: 'A true jousting champion.',
                unlocked: false,
                league: 'pro',
                moneyReward: 200
            }),
            'master_ram': new Enemy({
                id: 'master_ram',
                name: 'Master Ram',
                difficulty: 6,
                skin: 'ram_default',
                lance: 'lance_5',
                minScore: 30,
                maxScore: 35,
                description: 'The final boss of jousting.',
                unlocked: false,
                league: 'pro',
                moneyReward: 300
            })
        };
        
        // Define league structure
        this.leagues = {
            'rookie': {
                name: 'Rookie League',
                unlocked: true,
                enemies: ['novice_sheep', 'eager_ram'],
                requiredWins: 0
            },
            'amateur': {
                name: 'Amateur League',
                unlocked: false,
                enemies: ['veteran_sheep', 'stylish_ram'],
                requiredWins: 3
            },
            'pro': {
                name: 'Pro League',
                unlocked: false,
                enemies: ['champion_sheep', 'master_ram'],
                requiredWins: 5
            }
        };
    }

    // Get enemy by ID
    getEnemy(enemyId) {
        return this.enemies[enemyId];
    }
    
    // Get all enemies
    getAllEnemies() {
        return this.enemies;
    }
    
    // Get enemies in a specific league
    getEnemiesInLeague(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) return [];
        
        return league.enemies.map(enemyId => this.enemies[enemyId]);
    }
    
    // Get all leagues
    getLeagues() {
        return this.leagues;
    }
    
    // Check if a league is unlocked
    isLeagueUnlocked(leagueId) {
        return this.leagues[leagueId]?.unlocked || false;
    }
    
    // Unlock a league
    unlockLeague(leagueId) {
        if (this.leagues[leagueId]) {
            this.leagues[leagueId].unlocked = true;
            return true;
        }
        return false;
    }
    
    // Check if player can unlock leagues based on rank
    checkLeagueUnlocks(playerData) {
        try {
            // Always use the global playerState for rank
            const rank = playerState.getRank();
            
            // Map ranks to minimal leagues that should be unlocked
            const rankLeagueMap = {
                'Novice': ['rookie'],
                'Squire': ['rookie', 'amateur'],
                'Knight': ['rookie', 'amateur', 'pro'],
                'Veteran': ['rookie', 'amateur', 'pro'],
                'Champion': ['rookie', 'amateur', 'pro'],
                'Master': ['rookie', 'amateur', 'pro'],
                'Legendary': ['rookie', 'amateur', 'pro']
            };
            
            // Get leagues player should have access to
            const accessibleLeagues = rankLeagueMap[rank.name] || ['rookie'];
            
            // Unlock leagues based on rank
            accessibleLeagues.forEach(leagueId => {
                if (this.leagues[leagueId]) {
                    this.unlockLeague(leagueId);
                }
            });
        } catch (error) {
            console.error("Error in checkLeagueUnlocks:", error);
            // At minimum, unlock rookie league as fallback
            this.unlockLeague('rookie');
        }
    }
    
    // Load enemy unlocks from player state
    loadEnemyState(playerState) {
        if (playerState.enemyProgress) {
            // Update leagues
            Object.keys(playerState.enemyProgress.leagues || {}).forEach(leagueId => {
                if (this.leagues[leagueId]) {
                    this.leagues[leagueId].unlocked = playerState.enemyProgress.leagues[leagueId];
                }
            });
            
            // Update enemies
            Object.keys(playerState.enemyProgress.enemies || {}).forEach(enemyId => {
                if (this.enemies[enemyId]) {
                    this.enemies[enemyId].unlocked = playerState.enemyProgress.enemies[enemyId];
                }
            });
        }
    }
    
    // Save enemy state to player state
    saveEnemyState(playerState) {
        if (!playerState.enemyProgress) {
            playerState.enemyProgress = {
                leagues: {},
                enemies: {}
            };
        }
        
        // Save leagues
        Object.keys(this.leagues).forEach(leagueId => {
            playerState.enemyProgress.leagues[leagueId] = this.leagues[leagueId].unlocked;
        });
        
        // Save enemies
        Object.keys(this.enemies).forEach(enemyId => {
            playerState.enemyProgress.enemies[enemyId] = this.enemies[enemyId].unlocked;
        });
    }
} 