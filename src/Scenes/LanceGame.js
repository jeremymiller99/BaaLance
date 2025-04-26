class LanceGame extends Phaser.Scene {
    constructor() {
        super({ key: 'LanceGame' }); 
        
        // UI Constants for the medieval theme (similar to MainMenu)
        this.UI = {
            COLORS: {
                BACKGROUND: 0x2a1a0a, // Dark brown background
                BACKGROUND_ALPHA: 0.7,
                TEXT: '#FFD700', // Gold text
                TEXT_SECONDARY: '#ffffff', // White text for secondary content
                WOOD_PRIMARY: 0x8B4513, // Primary wood color
                WOOD_SECONDARY: 0x5c4033, // Darker wood color
                WOOD_BORDER: 0x3c2a21, // Wood border color
                WOOD_GRAIN: 0x3c2a21, // Wood grain color
                BUTTON_BG: 0x8B4513, // Wooden button color
                BUTTON_HOVER: 0x654321, // Darker wood for hover
                BUTTON_ACTIVE: 0x4e3524, // Even darker wood for active
                METAL: 0x696969, // Metal color for nails
                METAL_DARK: 0x444444, // Darker metal
                SUCCESS: 0x00aa00 // Success color
            },
            FONTS: {
                FAMILY: 'Georgia, serif', // Medieval serif font
                SIZES: {
                    TITLE: '32px',
                    HEADER: '24px',
                    BODY: '20px'
                }
            }
        };
        
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
        this.scrollSpeedIncrease = 25; // Amount to increase scroll speed in pixels per second
        this.scrollSpeed = 120; // Base scroll speed in pixels per second
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
            // Calculate and set opponent score
            this.opponentScore = selectedEnemy.calculateScore();
        }
    }
    
    create() {
        // Get game dimensions
        const { width: w, height: h } = this.cameras.main;
        
        // Initialize or re-init audio system for this scene
        if (audioSystem) {
            audioSystem.scene = this;
            audioSystem.init();
            
            // Play background crowd sounds for atmosphere
            audioSystem.playSfx('crowdSheep', { loop: true, volume: 0.3 });
        }
        
        // For debugging - log opponent data
        console.log(`LanceGame: Using opponent skin=${this.opponentSkin}, lance=${this.opponentLance}`);
        
        // Create background group for better organization
        this.backgrounds = this.add.group();
        
        // Create two background images side by side
        this.bg1 = this.add.image(0, 0, 'bg');
        
        // Set origins to top-left corner
        this.bg1.setOrigin(0, 0);
        
        // Scale backgrounds to fit screen height while maintaining aspect ratio
        const scale = Math.max(w / this.bg1.width, h / this.bg1.height);
        this.bg1.setScale(scale);
        
        // Calculate the actual width of the scaled background
        this.bgWidth = this.bg1.width * scale;
        
        // Create the second background and position it exactly at the end of the first one
        this.bg2 = this.add.image(this.bgWidth, 0, 'bg');
        this.bg2.setOrigin(0, 0);
        this.bg2.setScale(scale);
        
        // Add backgrounds to group
        this.backgrounds.add(this.bg1);
        this.backgrounds.add(this.bg2);

        // Create player container
        this.playerContainer = this.add.container(0, h/2 + 175);
        
        // Create player sprite with selected skin
        const skinSystem = new SkinSystem(this);
        const skinKey = skinSystem.getSkinTextureKey(this.currentSkin);
        const player = this.add.sprite(0, 0, skinKey).setScale(0.75);
        player.setOrigin(0.5);
        
        // Add player to container
        this.playerContainer.add(player);

        // Create dust particle emitter for running effect
        try {
            // Check if 'particle' texture exists
            if (this.textures.exists('particle')) {
                this.dustParticles = this.add.particles(0, 0, 'particle', {
                    frame: 0,
                    lifespan: 800,
                    speed: { min: 20, max: 40 },
                    scale: { start: 0.05, end: 0 },
                    alpha: { start: 0.5, end: 0 },
                    quantity: 1,
                    emitZone: {
                        source: new Phaser.Geom.Rectangle(-20, 30, 40, 5),
                        type: 'random'
                    },
                    tint: 0xffffff,
                    on: false
                });
                
                // Add particles to container
                this.playerContainer.add(this.dustParticles);
                
                // Start emitting dust particles
                this.dustParticles.start();
            } else {
                // Create a simple graphics object for particles if texture doesn't exist
                this.createSimpleDustParticles();
            }
        } catch (e) {
            console.log("Couldn't create particle emitter, using fallback:", e);
            this.createSimpleDustParticles();
        }

        // Add a subtle bouncing animation to simulate riding on horseback
        this.bounceTween = this.tweens.add({
            targets: this.playerContainer,
            y: '+=5', // Move 5 pixels up and down from original position
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true, // Return to original position
            repeat: -1 // Repeat indefinitely
        });

        // Get the player's current lance from PlayerState
        const playerLance = playerState.getState().equipment.currentLance || 'lance_0';
        
        // Get QTE parameters for the player's lance
        const playerWeaponQteParams = this.weaponSystem.getWeaponQTEParams(playerLance);
        
        // Equip the player's lance
        this.weaponSystem.equipWeapon(this.playerContainer, playerLance);
        
        // Play lance equip sound
        if (audioSystem) {
            audioSystem.playSfx('lance');
        }
        
        // Create tween for single left-to-right movement
        this.playerTween = this.tweens.add({
            targets: this.playerContainer,
            x: w, // Move to right edge 
            duration: this.gameDuration, // Use the consistent game duration
            ease: 'Linear',
            repeat: 0 // No repeat
        });

        // Create medieval-style score display container
        this.createScorePanel();

        // Initialize button manager with match type and QTE parameters
        this.buttonManager = new ButtonManager(this, this.matchType, playerWeaponQteParams);
        this.buttonManager.create();
        
        // Style the button manager UI elements with medieval theme
        this.styleQTEElements();
        
        // Add a slight delay before starting the game to ensure everything is ready
        this.time.delayedCall(500, () => {
            this.buttonManager.startGame();
            this.isGameActive = true;
            
            // Play sheep sound when the game starts
            if (audioSystem) {
                audioSystem.playSfx('baa');
            }
        });

        // Listen for game end event
        this.events.on('gameEnded', (data) => {
            // For debugging
            console.log(`LanceGame ended: Passing opponent skin=${this.opponentSkin}, lance=${this.opponentLance} to OutcomeScene`);
            
            // Play lance hit sound for game end
            if (audioSystem) {
                audioSystem.playSfx('lanceHit');
            }
            
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
        
        // Monkey patch ButtonManager to add screen shake but prevent double spawning
        const originalHandleSuccessfulHit = this.buttonManager.handleSuccessfulHit;
        this.buttonManager.handleSuccessfulHit = function(points, message) {
            // Don't call the original method to avoid double spawning
            // Instead, reimplement the necessary parts
            
            // Visual feedback for hit
            this.targetZone.setStrokeStyle(2, 0x00ff00);
            
            // Calculate total points
            const totalPoints = points;
            
            // Update score
            this.score += totalPoints;
            
            // Play success sound
            if (audioSystem) {
                audioSystem.playSfx('qteCorrect', { volume: points >= 3 ? 1.0 : 0.8 });
            }
            
            // Increase scroll speed on hit
            if (this.scene.increaseScrollSpeed) {
                this.scene.increaseScrollSpeed();
            }
            
            // Increment stability (successful hit = more stable)
            this.consecutiveMistakes = 0;
            
            // Improve stability by 1 level if there was any instability
            if (this.stabilityLevel > 0) {
                this.updateStability(-1); // Reduce instability by 1 level
            }
            
            // Create score popup with medieval styling if available
            const textStyle = {
                fontSize: '28px',
                fontFamily: this.scene.UI && this.scene.UI.FONTS ? this.scene.UI.FONTS.FAMILY : 'Arial',
                color: this.scene.UI && this.scene.UI.COLORS ? this.scene.UI.COLORS.TEXT : '#00ff00',
                stroke: '#000000',
                strokeThickness: 4
            };
            
            const scorePopup = this.scene.add.text(
                this.targetZone.x,
                this.targetZone.y - 30,
                `${message} +${points}`,
                textStyle
            ).setOrigin(0.5);
    
            // Animate score popup
            this.scene.tweens.add({
                targets: scorePopup,
                y: scorePopup.y - 40,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    scorePopup.destroy();
                }
            });
            
            // Flash effect on perfect/good zones
            this.scene.tweens.add({
                targets: [this.perfectZone, this.goodZone],
                alpha: 0.2,
                yoyo: true,
                duration: 100,
                repeat: 2
            });
            
            // Spawn a new target after a short delay - THIS IS THE ONLY PLACE TO SPAWN NEW TARGETS
            this.scene.time.delayedCall(250, () => {
                if (this.isGameStarted) {
                    this.spawnTarget();
                }
            });
            
            // Trigger screen shake
            this.scene.createScreenShake(points);
        };
    }

    createScorePanel() {
        const { width: w } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        // Create wooden panel container for score
        this.scorePanel = this.add.container(w/2, 50);
        
        // Create wooden background
        const panelWidth = 180;
        const panelHeight = 60;
        const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, COLORS.WOOD_PRIMARY, 1);
        panel.setStrokeStyle(4, COLORS.WOOD_BORDER);
        this.scorePanel.add(panel);
        
        // Add wood grain texture
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        // Create horizontal wood grain lines
        for (let i = -panelHeight/2 + 5; i < panelHeight/2; i += 10) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-panelWidth/2 + 5, i);
            
            for (let x = -panelWidth/2 + 10; x < panelWidth/2; x += 20) {
                const yOffset = Phaser.Math.Between(-2, 2);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        this.scorePanel.add(grainGraphics);
        
        // Add metal bolts in corners
        const cornerOffset = 15;
        const cornerPositions = [
            {x: -panelWidth/2 + cornerOffset, y: -panelHeight/2 + cornerOffset},
            {x: panelWidth/2 - cornerOffset, y: -panelHeight/2 + cornerOffset},
            {x: -panelWidth/2 + cornerOffset, y: panelHeight/2 - cornerOffset},
            {x: panelWidth/2 - cornerOffset, y: panelHeight/2 - cornerOffset}
        ];
        
        cornerPositions.forEach(pos => {
            // Metal plate
            const plate = this.add.circle(pos.x, pos.y, 5, COLORS.METAL, 1);
            plate.setStrokeStyle(1, COLORS.METAL_DARK);
            this.scorePanel.add(plate);
            
            // Center nail/rivet
            const nail = this.add.circle(pos.x, pos.y, 2, 0x999999, 1);
            nail.setStrokeStyle(1, 0x777777);
            this.scorePanel.add(nail);
        });
        
        // Create score text with medieval style
        const scoreStyle = {
            fontSize: FONTS.SIZES.HEADER,
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            stroke: '#000000',
            strokeThickness: 3
        };
        
        this.scoreText = this.add.text(0, 0, 'Score: 0', scoreStyle).setOrigin(0.5);
        this.scorePanel.add(this.scoreText);
        
        // Initialize score display but don't create its own UI elements
        this.scoreDisplay = new ScoreDisplay(this);
        // Override the score display's create method to use our medieval UI
        this.scoreDisplay.create = () => {}; // Empty function to prevent default UI creation
        this.scoreDisplay.update = (score, delta) => {
            // Store the new score value
            this.scoreDisplay.scoreValue = score;
            
            // If this is the first update or delta is provided, use smooth animation
            if (delta && this.scoreDisplay.displayValue !== this.scoreDisplay.scoreValue) {
                // Calculate how much to increment based on animation speed and delta
                const deltaSeconds = delta / 1000;
                const increment = this.scoreDisplay.animationSpeed * deltaSeconds;
                
                if (this.scoreDisplay.displayValue < this.scoreDisplay.scoreValue) {
                    this.scoreDisplay.displayValue = Math.min(this.scoreDisplay.displayValue + increment, this.scoreDisplay.scoreValue);
                } else if (this.scoreDisplay.displayValue > this.scoreDisplay.scoreValue) {
                    this.scoreDisplay.displayValue = Math.max(this.scoreDisplay.displayValue - increment, this.scoreDisplay.scoreValue);
                }
                
                this.scoreText.setText(`Score: ${Math.round(this.scoreDisplay.displayValue)}`);
            } else {
                // Immediate update if no delta is provided
                this.scoreDisplay.displayValue = this.scoreDisplay.scoreValue;
                this.scoreText.setText(`Score: ${this.scoreDisplay.scoreValue}`);
            }
        };
    }

    styleQTEElements() {
        if (!this.buttonManager || !this.buttonManager.meterBar) return;
        
        const { COLORS } = this.UI;
        
        // Style the meter bar with wood texture
        this.buttonManager.meterBar.setFillStyle(COLORS.WOOD_SECONDARY);
        this.buttonManager.meterBar.setStrokeStyle(4, COLORS.WOOD_BORDER);
        
        // Style the meter border
        if (this.buttonManager.meterBorder) {
            this.buttonManager.meterBorder.setStrokeStyle(3, COLORS.METAL);
        }
        
        // Style the moving indicator
        if (this.buttonManager.movingIndicator) {
            this.buttonManager.movingIndicator.setFillStyle(COLORS.TEXT);
            this.buttonManager.movingIndicator.setStrokeStyle(1, 0x000000);
        }
        
        // Style target and perfect zones if they exist
        if (this.buttonManager.targetZone) {
            this.buttonManager.targetZone.setStrokeStyle(2, COLORS.TEXT);
        }
        
        if (this.buttonManager.perfectZone) {
            this.buttonManager.perfectZone.setFillStyle(COLORS.TEXT, 0.3);
        }
        
        // Update stability indicators with medieval style
        if (this.buttonManager.stabilityIndicators && this.buttonManager.stabilityIndicators.length > 0) {
            // Apply medieval style to all indicators
            for (let i = 0; i < this.buttonManager.stabilityIndicators.length; i++) {
                const indicator = this.buttonManager.stabilityIndicators[i];
                indicator.setStrokeStyle(2, COLORS.METAL);
            }
        }
    }

    createScreenShake(intensity = 5) {
        // Shake intensity based on points (higher points = stronger shake)
        const shakeIntensity = Math.min(Math.max(intensity / 2, 3), 15);
        const shakeDuration = 100 + (intensity * 5);
        
        // Create screen shake effect
        this.cameras.main.shake(shakeDuration, shakeIntensity / 1000);
        
        // Emit event to ButtonManager to handle success feedback
        this.events.emit('screenShakeComplete');
    }

    createSimpleDustParticles() {
        // Create a graphics object to draw a circle that will be used as a particle
        const particleGraphic = this.make.graphics({});
        particleGraphic.fillStyle(0xffffff, 1);
        particleGraphic.fillCircle(4, 4, 4);
        particleGraphic.generateTexture('dustParticle', 8, 8);
        
        // Create particle emitter with generated texture
        this.dustParticles = this.add.particles(0, 0, 'dustParticle', {
            frame: 0,
            lifespan: 800,
            speed: { min: 15, max: 30 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.3, end: 0 },
            quantity: 1,
            frequency: 50,
            emitZone: {
                source: new Phaser.Geom.Rectangle(-20, 30, 40, 5),
                type: 'random'
            },
            tint: [0xdddddd, 0xffffff, 0xcccccc]
        });
        
        // Add particles to container
        this.playerContainer.add(this.dustParticles);
    }

    update(time, delta) {
        // Calculate delta time in seconds for smooth movement
        const deltaSeconds = delta / 1000;
        
        // Move both backgrounds based on delta time for consistent speed
        this.bg1.x -= this.scrollSpeed * deltaSeconds;
        this.bg2.x -= this.scrollSpeed * deltaSeconds;

        // Reset positions when a background moves completely off screen
        if (this.bg1.x <= -this.bgWidth) {
            this.bg1.x = this.bg2.x + this.bgWidth - 1; // Slight overlap to prevent gaps
        }
        
        if (this.bg2.x <= -this.bgWidth) {
            this.bg2.x = this.bg1.x + this.bgWidth - 1; // Slight overlap to prevent gaps
        }

        // Update button manager with delta time
        this.buttonManager.update(time, delta);

        // Update score display with delta time
        this.scoreDisplay.update(this.buttonManager.score, delta);
        
        // Update dust particles emission rate based on scroll speed
        if (this.dustParticles && this.dustParticles.setFrequency) {
            try {
                // Update the emit zone
                this.dustParticles.setEmitZone({
                    source: new Phaser.Geom.Rectangle(-20, 30, 40, 5),
                    type: 'random'
                });
                
                // Adjust frequency based on speed (faster = more particles)
                const newFrequency = 1000 / (this.scrollSpeed / 40);
                this.dustParticles.setFrequency(newFrequency);
            } catch (e) {
                console.log("Error updating particles:", e);
            }
        }
    }

    shutdown() {
        // Stop any scene-specific sounds
        if (audioSystem) {
            // Fade out sounds properly
            audioSystem.fadeOutAllSounds(500);
        }
        
        // Clean up tweens and groups when scene is shut down
        if (this.playerTween) {
            this.playerTween.stop();
        }
        if (this.bounceTween) {
            this.bounceTween.stop();
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
        if (this.dustParticles) {
            this.dustParticles.destroy();
        }
        
        // Clean up debug menu
        if (this.debugMenu) {
            this.debugMenu.destroy();
            this.debugMenu = null;
        }
        
        // Clean up event listeners
        this.events.off('gameEnded');
        this.events.off('screenShakeComplete');
        this.isGameActive = false;
    }

    increaseScrollSpeed() {
        this.scrollSpeed += this.scrollSpeedIncrease;
    }
}
