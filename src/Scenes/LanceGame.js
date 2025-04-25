class LanceGame extends Phaser.Scene {
    constructor() {
        super({ key: 'LanceGame' }); 
        
        // Debug menu
        this.debugMenu = null;
    }
    
    init(data) {
        this.opponentScore = data.opponentScore || 0;
        this.matchType = data.matchType || 'quick';
        this.currentSkin = data.currentSkin || 'default';
        this.opponentId = data.opponentId || null;
        this.opponentLeague = data.opponentLeague || 'rookie'; // Add league for quick matches
        this.opponentSkin = data.opponentSkin || 'sheep1_default'; // Add opponent skin
        this.opponentLance = data.opponentLance || 'lance_0'; // Add opponent lance
        this.score = 0;
        this.isGameActive = false;
        this.scrollSpeedIncrease = 0.5; // Amount to increase scroll speed by each button press
        this.scrollSpeed = 2.0; // Base scroll speed is now constant
        this.gameDuration = 15000; // Define game duration here for consistency
        
        // Initialize weapon system to get QTE parameters
        this.weaponSystem = new WeaponSystem(this);
        
        // If we're in quick match mode and don't have an opponent ID yet, select a random one
        if (this.matchType === 'quick' && !this.opponentId) {
            this.setupQuickMatchOpponent();
        }
    }
    
    setupQuickMatchOpponent() {
        // Create enemy system to get access to enemy data
        const enemySystem = new EnemySystem(this);
        
        // Get enemies in the specified league
        const leagueEnemies = enemySystem.getEnemiesInLeague(this.opponentLeague);
        
        // If we have enemies, pick a random one
        if (leagueEnemies && leagueEnemies.length > 0) {
            const randomIndex = Phaser.Math.Between(0, leagueEnemies.length - 1);
            const selectedEnemy = leagueEnemies[randomIndex];
            
            // Set opponent properties
            this.opponentId = selectedEnemy.id;
            this.opponentSkin = selectedEnemy.skin;
            this.opponentLance = selectedEnemy.lance;
        }
    }
    
    create() {
        // Get game dimensions
        const { width: w, height: h } = this.cameras.main;
        
        // For debugging - log opponent data
        console.log(`LanceGame: Using opponent skin=${this.opponentSkin}, lance=${this.opponentLance}`);
        
        // Create background group for better organization
        this.backgrounds = this.add.group();
        
        // Create two background images side by side
        this.bg1 = this.add.image(0, 0, 'bg');
        this.bg2 = this.add.image(w, 0, 'bg');
        
        // Add backgrounds to group
        this.backgrounds.add(this.bg1);
        this.backgrounds.add(this.bg2);
        
        // Set origins to top-left corner
        this.bg1.setOrigin(0, 0);
        this.bg2.setOrigin(0, 0);
        
        // Scale backgrounds to fit screen height while maintaining aspect ratio
        const scale = Math.max(w / this.bg1.width, h / this.bg1.height);
        this.bg1.setScale(scale);
        this.bg2.setScale(scale);

        // Create player container
        this.playerContainer = this.add.container(0, h/2 + 175);
        
        // Create player sprite with selected skin
        const skinSystem = new SkinSystem(this);
        const skinKey = skinSystem.getSkinTextureKey(this.currentSkin);
        const player = this.add.sprite(0, 0, skinKey).setScale(0.75);
        player.setOrigin(0.5);
        
        // Add player to container
        this.playerContainer.add(player);

        // Get the player's current lance from PlayerState
        const playerLance = playerState.getState().equipment.currentLance || 'lance_0';
        
        // Get QTE parameters for the player's lance
        const playerWeaponQteParams = this.weaponSystem.getWeaponQTEParams(playerLance);
        
        // Equip the player's lance
        this.weaponSystem.equipWeapon(this.playerContainer, playerLance);
        
        // Create tween for single left-to-right movement
        this.playerTween = this.tweens.add({
            targets: this.playerContainer,
            x: w, // Move to right edge 
            duration: this.gameDuration, // Use the consistent game duration
            ease: 'Linear',
            repeat: 0 // No repeat
        });

        // Initialize button manager with match type and QTE parameters
        this.buttonManager = new ButtonManager(this, this.matchType, playerWeaponQteParams);
        this.buttonManager.create();

        // Initialize score display
        this.scoreDisplay = new ScoreDisplay(this);
        this.scoreDisplay.create();
        
        // Add a slight delay before starting the game to ensure everything is ready
        this.time.delayedCall(500, () => {
            this.buttonManager.startGame();
            this.isGameActive = true;
        });

        // Listen for game end event
        this.events.on('gameEnded', (data) => {
            // For debugging
            console.log(`LanceGame ended: Passing opponent skin=${this.opponentSkin}, lance=${this.opponentLance} to OutcomeScene`);
            
            this.scene.start('OutcomeScene', {
                score: data.score,
                opponentScore: this.opponentScore,
                matchType: this.matchType,
                opponentId: this.opponentId,
                opponentSkin: this.opponentSkin,
                opponentLance: this.opponentLance,
                currentSkin: this.currentSkin
            });
        });

        // Initialize debug menu at the end
        this.debugMenu = new DebugMenu(this);
        this.debugMenu.create();
    }

    update(time, delta) {
        // Move both backgrounds
        this.bg1.x -= this.scrollSpeed;
        this.bg2.x -= this.scrollSpeed;

        // Reset position when image moves off screen
        const { width: w } = this.cameras.main;
        if (this.bg1.x <= -w) {
            this.bg1.x = w;
        }
        if (this.bg2.x <= -w) {
            this.bg2.x = w;
        }

        // Update button manager
        this.buttonManager.update(time);

        // Update score display
        this.scoreDisplay.update(this.buttonManager.score);
    }

    shutdown() {
        // Clean up tweens and groups when scene is shut down
        if (this.playerTween) {
            this.playerTween.stop();
        }
        if (this.backgrounds) {
            this.backgrounds.destroy(true);
        }
        if (this.buttonManager) {
            this.buttonManager.reset();
        }
        if (this.scoreDisplay) {
            this.scoreDisplay.destroy();
        }
        if (this.weaponSystem) {
            this.weaponSystem.destroy();
        }
        
        // Clean up debug menu
        if (this.debugMenu) {
            this.debugMenu.destroy();
            this.debugMenu = null;
        }
        
        this.events.off('gameEnded'); // Remove event listener
        this.isGameActive = false;
    }

    increaseScrollSpeed() {
        this.scrollSpeed += this.scrollSpeedIncrease;
    }
}
