class OutcomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OutcomeScene' });
        this.playerTween = null;
        this.opponentTween = null;
        this.rpsGameActive = false;
        this.playerChoice = null;
        this.opponentChoice = null;
        this.rpsResultProcessing = false; // Add flag to track result processing
        this.resultTexts = []; // Initialize resultTexts array
        
        // Debug menu
        this.debugMenu = null;
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.opponentScore = data.opponentScore || 0;
        this.matchType = data.matchType || 'quick';
        this.opponentId = data.opponentId || null;
        this.opponentSkin = data.opponentSkin || 'sheep1_default';
        this.opponentLance = data.opponentLance || 'lance_0';
        this.isTie = this.finalScore === this.opponentScore;
        this.won = this.finalScore > this.opponentScore;
        this.currentSkin = data.currentSkin || 'default';
        
        // Reset game state for this scene
        this.rpsGameActive = false;
        this.playerChoice = null;
        this.opponentChoice = null;
        this.rpsResultProcessing = false;
        this.resultTexts = [];
        this.spectators = [];
        this.joustingOutcome = null;
        this.rpsPanel = null;
        this.rpsButtonsContainer = null;
        this.rpsButtons = null;
        
        // For career mode, make sure we have the correct opponent data
        if (this.matchType === 'career' && this.opponentId && (!this.opponentSkin || !this.opponentLance)) {
            this.loadOpponentData();
        }
    }
    
    loadOpponentData() {
        // Create enemy system to get access to enemy data
        const enemySystem = new EnemySystem(this);
        
        // Get enemy data
        const enemy = enemySystem.getEnemy(this.opponentId);
        
        if (enemy) {
            // Store the skin and lance data for this enemy
            this.opponentSkin = enemy.skin;
            this.opponentLance = enemy.lance;
            
            // Log to confirm values
            console.log(`Career match: Loaded enemy ${enemy.name} with skin ${this.opponentSkin} and lance ${this.opponentLance}`);
        } else {
            console.error(`Could not find enemy with ID: ${this.opponentId}`);
        }
    }

    create() {
        // Get game dimensions
        const { width: w, height: h } = this.cameras.main;
        
        // Initialize UI style constants to match MainLoop scene
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
                SUCCESS: 0x00aa00, // Success color
                VICTORY: 0x006400, // Dark green for victories
                DEFEAT: 0x8B0000, // Dark red for defeats
                PARCHMENT: 0xF5DEB3, // Parchment color
                PARCHMENT_DARK: 0xD2B48C, // Darker parchment color
                GOLD: 0xFFD700, // Gold color
                GOLD_DARK: 0xAA8800, // Darker gold color
                BUTTON: 0x8B4513, // Wooden button color
                BUTTON_PRESSED: 0x654321, // Darker wood for pressed button
                TEXT_PRIMARY: '#FFFFFF', // Primary text color
                TEXT_STROKE: '#000000', // Text stroke color
                TEXT_BRIGHT: '#FFFFFF' // Bright text color
            },
            FONTS: {
                FAMILY: 'Georgia, serif', // Medieval serif font
                SIZES: {
                    TITLE: '32px',
                    HEADER: '24px',
                    BODY: '20px'
                }
            },
            PANEL: {
                WIDTH: 600,
                HEIGHT: 500,
                PADDING: 20,
                BUTTON_HEIGHT: 60,
                BUTTON_SPACING: 25
            }
        };
        
        // Initialize or re-init audio system for this scene
        if (audioSystem) {
            audioSystem.scene = this;
            audioSystem.init();
        }
        
        // Create background
        this.createBackground();

        // For a tie, setup the rock-paper-scissors game
        if (this.isTie) {
            this.setupRockPaperScissors();
        } else {
            // Initialize jousting outcome system with skin
            this.joustingOutcome = new JoustingOutcome(this, this.won, this.currentSkin);
            this.joustingOutcome.create();
        }

        // Initialize debug menu at the end of create method
        this.debugMenu = new DebugMenu(this);
        this.debugMenu.create();
    }
    
    createBackground() {
        const { width: w, height: h } = this.cameras.main;
        
        // Set background image
        const bg = this.add.image(0, 0, 'bg');
        bg.setOrigin(0, 0);
        const scale = Math.max(w / bg.width, h / bg.height);
        bg.setScale(scale);
        
        // Remove the overlay for a cleaner look
    }
    
    createWoodenPanel(x, y, width, height, titleText = null) {
        const { COLORS, FONTS } = this.UI;
        
        // Create main container for panel
        const container = this.add.container(x, y);
        
        // Create panel background with wood texture
        const panel = this.add.rectangle(0, 0, width, height, COLORS.WOOD_PRIMARY, 1);
        panel.setStrokeStyle(5, COLORS.WOOD_BORDER);
        container.add(panel);
        
        // Add subtle wood grain texture
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.2); // More subtle grain
        
        // Create horizontal wood grain lines
        for (let i = -height/2 + 15; i < height/2; i += 20) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-width/2 + 10, i);
            
            for (let x = -width/2 + 30; x < width/2; x += 40) {
                const yOffset = Phaser.Math.Between(-4, 4);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        container.add(grainGraphics);
        
        // Add decorative nails/metal fixtures in the corners
        const cornerOffset = 25;
        const cornerPositions = [
            {x: -width/2 + cornerOffset, y: -height/2 + cornerOffset},
            {x: width/2 - cornerOffset, y: -height/2 + cornerOffset},
            {x: -width/2 + cornerOffset, y: height/2 - cornerOffset},
            {x: width/2 - cornerOffset, y: height/2 - cornerOffset}
        ];
        
        cornerPositions.forEach(pos => {
            // Metal plate
            const plate = this.add.circle(pos.x, pos.y, 8, COLORS.METAL, 1);
            plate.setStrokeStyle(1, COLORS.METAL_DARK);
            container.add(plate);
            
            // Center nail/rivet
            const nail = this.add.circle(pos.x, pos.y, 3, 0x999999, 1);
            nail.setStrokeStyle(1, 0x777777);
            container.add(nail);
        });
        
        // Add title if provided
        if (titleText) {
            // Create title banner
            const bannerWidth = width * 0.8;
            const bannerHeight = 40;
            const bannerY = -height/2 - 10;
            
            const banner = this.add.rectangle(0, bannerY, bannerWidth, bannerHeight, COLORS.WOOD_SECONDARY, 1);
            banner.setStrokeStyle(3, COLORS.WOOD_BORDER);
            container.add(banner);
            
            // Add title text
            const title = this.add.text(0, bannerY, titleText, {
                fontSize: '26px',
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            title.setShadow(2, 2, '#000000', 2);
            container.add(title);
            
            // Add metal fixtures to banner
            const bannerCornerOffset = 20;
            const bannerCornerPositions = [
                {x: -bannerWidth/2 + bannerCornerOffset, y: bannerY},
                {x: bannerWidth/2 - bannerCornerOffset, y: bannerY}
            ];
            
            bannerCornerPositions.forEach(pos => {
                const plateSmall = this.add.circle(pos.x, pos.y, 5, COLORS.METAL, 1);
                plateSmall.setStrokeStyle(1, COLORS.METAL_DARK);
                container.add(plateSmall);
                
                const nailSmall = this.add.circle(pos.x, pos.y, 2, 0x999999, 1);
                nailSmall.setStrokeStyle(1, 0x777777);
                container.add(nailSmall);
            });
        }
        
        return container;
    }
    
    createWoodenButton(container, x, y, text, width, height, callback) {
        const { COLORS, FONTS } = this.UI;
        
        // Button container for organization
        const buttonContainer = this.add.container(x, y);
        
        // Wooden button background
        const buttonBg = this.add.rectangle(0, 0, width, height, COLORS.BUTTON_BG, 1);
        buttonBg.setStrokeStyle(3, COLORS.WOOD_BORDER);
        buttonContainer.add(buttonBg);
        
        // Add wood grain texture (lighter, more subtle)
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.15);
        
        // Horizontal wood grain lines
        for (let i = -height/2 + 5; i < height/2; i += 8) {
            // Make lines slightly wavy
            grainGraphics.beginPath();
            grainGraphics.moveTo(-width/2 + 5, i);
            
            for (let x = -width/2 + 10; x < width/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        buttonContainer.add(grainGraphics);
        
        // Button text with gold color
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '22px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add shadow to text
        buttonText.setShadow(1, 1, '#000000', 2);
        buttonContainer.add(buttonText);
        
        // Make button interactive
        buttonBg.setInteractive({ useHandCursor: true });
        
        // Hover and click effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(COLORS.BUTTON_HOVER);
            buttonContainer.setScale(1.05);
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(COLORS.BUTTON_BG);
            buttonContainer.setScale(1);
        });
        
        buttonBg.on('pointerdown', () => {
            // Pressed effect
            buttonContainer.setScale(0.95);
            
            // Play click sound
            if (audioSystem) {
                audioSystem.playClick();
            }
            
            // Call the callback
            if (callback) {
                callback();
            }
        });
        
        // Add the button container to the parent container
        container.add(buttonContainer);
        
        return buttonContainer;
    }

    setupRockPaperScissors() {
        const { width: w, height: h } = this.cameras.main;
        this.rpsGameActive = true;
        
        // Create spectators for tie scenario
        this.createSpectators();
        
        // Initialize weapon system and skin system
        this.weaponSystem = new WeaponSystem(this);
        const skinSystem = new SkinSystem(this);
        
        // Create player container starting from left
        this.playerContainer = this.add.container(-100, h/2 + 175);
        this.playerContainer.setDepth(10); // Set depth higher than spectators but lower than UI
        const playerSkinKey = skinSystem.getSkinTextureKey(this.currentSkin);
        const player = this.add.sprite(0, 0, playerSkinKey).setScale(0.75);
        player.setOrigin(0.5);
        this.playerContainer.add(player);
        
        // Get player lance
        const playerLance = playerState.getState().equipment.currentLance || 'lance_0';
        this.weaponSystem.equipWeapon(this.playerContainer, playerLance);
        
        // Create opponent container starting from right
        this.opponentContainer = this.add.container(w + 100, h/2 + 175);
        this.opponentContainer.setDepth(10); // Set depth higher than spectators but lower than UI
        const opponentSkinKey = skinSystem.getSkinTextureKey(this.opponentSkin);
        const opponent = this.add.sprite(0, 0, opponentSkinKey).setScale(0.75);
        opponent.setOrigin(0.5);
        opponent.setFlipX(true);
        this.opponentContainer.add(opponent);
        this.weaponSystem.equipWeapon(this.opponentContainer, this.opponentLance, null, null, true);
        
        // Animate both characters to center positions
        this.tieAnimationInProgress = true;
        
        // Move player and opponent to center positions
        this.tweens.add({
            targets: this.playerContainer,
            x: w/4,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => {
                // Drop lance (remove it) when animation completes
                this.weaponSystem.unequipWeapon(this.playerContainer);
            }
        });
        
        this.tweens.add({
            targets: this.opponentContainer,
            x: 3*w/4,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => {
                // Drop lance (remove it) when animation completes
                this.weaponSystem.unequipWeapon(this.opponentContainer);
                this.tieAnimationInProgress = false;
                
                // Only show UI after both characters have arrived
                this.showRockPaperScissorsUI();
            }
        });
    }

    // Add spectators for tie scenario
    createSpectators() {
        const { width: w, height: h } = this.cameras.main;
        
        // Create spectators positioned higher up
        const spectatorY = h/2 + 100;
        const spectatorCount = 15;
        
        this.spectators = [];
        
        // Initialize skin system to use actual character skins
        const skinSystem = new SkinSystem(this);
        
        // Available skin keys to use for spectators
        const skinOptions = [
            'sheep1_default', 
            'sheep1_sunglass', 
            'sheep1_tophat', 
            'sheep1_bling',
            'sheep2_default',
            'ram_default'
        ];
        
        // Create spectator group (randomly placed)
        for (let i = 0; i < spectatorCount; i++) {
            // Randomly distribute along the X axis but avoid the center
            let x;
            if (Math.random() > 0.5) {
                // Right side
                x = (w * 0.6) + (Math.random() * w * 0.35);
            } else {
                // Left side
                x = (Math.random() * w * 0.35);
            }
            
            // Randomize Y position slightly for varied heights
            const randomY = spectatorY - (Math.random() * 15);
            
            // Pick a random skin
            const skinKey = skinOptions[Math.floor(Math.random() * skinOptions.length)];
            
            // Create spectator using actual character sprite
            const spectator = this.add.sprite(x, randomY, skinKey);
            
            // Scale down the spectators
            const scale = 0.3 + (Math.random() * 0.15);
            spectator.setScale(scale);
            
            // Set depth to be behind players and UI (lower value)
            spectator.setDepth(5);
            
            // Randomly flip some spectators
            if (Math.random() > 0.5) {
                spectator.setFlipX(true);
            }
            
            // Create spectator animation
            const animationType = Math.floor(Math.random() * 3); // 0, 1, or 2
            
            switch (animationType) {
                case 0: // Up and down
                    this.tweens.add({
                        targets: spectator,
                        y: '-=5',
                        duration: 500 + Math.random() * 500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Math.random() * 1000
                    });
                    break;
                case 1: // Side to side
                    this.tweens.add({
                        targets: spectator,
                        x: '+=10',
                        duration: 1000 + Math.random() * 500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Math.random() * 1000
                    });
                    break;
                case 2: // Scaling/bouncing
                    this.tweens.add({
                        targets: spectator,
                        scaleY: spectator.scaleY * 1.1,
                        duration: 300 + Math.random() * 200,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Math.random() * 1000
                    });
                    break;
            }
            
            // Store reference to clean up later
            this.spectators.push(spectator);
        }
        
        // Play crowd sound
        if (audioSystem) {
            audioSystem.playSfx('crowd_sheep', { volume: 0.3, loop: true });
        }
    }

    showRockPaperScissorsUI() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        // Create a medieval wooden panel for the tie-breaker
        const panelWidth = 600;
        const panelHeight = 400;
        
        // Create the panel with decorative elements
        this.rpsPanel = this.createWoodenPanel(w/2, h/2, panelWidth, panelHeight, "JOUSTING TIE!");
        this.rpsPanel.setDepth(20); // Set UI depth higher than players and spectators
        
        // Add instruction text
        const instructionText = this.add.text(0, -120, 
            'Choose thy weapon to break the tie:', {
            fontSize: '24px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT_SECONDARY,
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.rpsPanel.add(instructionText);
        
        // Create medieval-styled score display
        const scoreText = this.add.text(0, -70, 
            `${this.finalScore} - ${this.opponentScore}`, {
            fontSize: '36px',
            fontStyle: 'bold',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        scoreText.setShadow(1, 1, '#000000', 2);
        this.rpsPanel.add(scoreText);
        
        // Player choice display
        this.playerChoiceText = this.add.text(-100, 20, '', {
            fontSize: '28px',
            fontFamily: FONTS.FAMILY,
            fontStyle: 'bold',
            color: COLORS.TEXT,
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.playerChoiceText.setShadow(1, 1, '#000000', 2);
        this.rpsPanel.add(this.playerChoiceText);
        
        // Player label
        this.playerPrompt = this.add.text(-100, -20, 'YOUR CHOICE:', {
            fontSize: '20px',
            fontFamily: FONTS.FAMILY,
            fontStyle: 'bold',
            color: COLORS.TEXT_SECONDARY
        }).setOrigin(0.5);
        this.rpsPanel.add(this.playerPrompt);
        
        // Opponent choice display
        this.opponentChoiceText = this.add.text(100, 20, '???', {
            fontSize: '28px',
            fontFamily: FONTS.FAMILY,
            fontStyle: 'bold',
            color: COLORS.TEXT,
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.opponentChoiceText.setShadow(1, 1, '#000000', 2);
        this.rpsPanel.add(this.opponentChoiceText);
        
        // Opponent label
        this.opponentPrompt = this.add.text(100, -20, 'OPPONENT:', {
            fontSize: '20px',
            fontFamily: FONTS.FAMILY,
            fontStyle: 'bold',
            color: COLORS.TEXT_SECONDARY
        }).setOrigin(0.5);
        this.rpsPanel.add(this.opponentPrompt);
        
        // Create RPS buttons
        this.createRPSButtons();
    }
    
    createRPSButtons() {
        const { COLORS, FONTS } = this.UI;
        const buttonY = 100;
        const spacing = 130;
        
        // Create a container for all buttons
        this.rpsButtonsContainer = this.add.container(0, buttonY);
        this.rpsPanel.add(this.rpsButtonsContainer);
        
        // Define button properties
        const buttonWidth = 120;
        const buttonHeight = 50;
        
        // Create medieval-styled wooden buttons
        const rockButton = this.createWoodenButton(
            this.rpsButtonsContainer,
            -spacing,
            0,
            'ROCK',
            buttonWidth,
            buttonHeight,
            () => this.makeRPSChoice('Rock')
        );
        
        const paperButton = this.createWoodenButton(
            this.rpsButtonsContainer,
            0,
            0,
            'PAPER',
            buttonWidth,
            buttonHeight,
            () => this.makeRPSChoice('Paper')
        );
        
        const scissorsButton = this.createWoodenButton(
            this.rpsButtonsContainer,
            spacing,
            0,
            'SCISSORS',
            buttonWidth,
            buttonHeight,
            () => this.makeRPSChoice('Scissors')
        );
        
        // Store buttons for disabling later (find the rectangle backgrounds)
        this.rpsButtons = [
            { 
                background: rockButton.list[0], 
                text: rockButton.list.find(item => item.type === 'Text'),
                choice: 'Rock' 
            },
            { 
                background: paperButton.list[0], 
                text: paperButton.list.find(item => item.type === 'Text'),
                choice: 'Paper' 
            },
            { 
                background: scissorsButton.list[0], 
                text: scissorsButton.list.find(item => item.type === 'Text'),
                choice: 'Scissors' 
            }
        ];
    }
    
    makeRPSChoice(choice) {
        if (!this.rpsGameActive || this.rpsResultProcessing) return;
        
        // Play click sound
        if (audioSystem) {
            audioSystem.playClick();
        }
        
        // Set player choice
        this.playerChoice = choice;
        this.playerChoiceText.setText(choice);
        
        // Disable and hide buttons after choice is made
        this.rpsButtonsContainer.setVisible(false);
        
        // Delay opponent choice for suspense
        this.time.delayedCall(1000, () => {
            if (!this.scene.isActive()) return; // Check if scene is still active
            
            // Generate opponent choice randomly - ensure it's different each time
            const choices = ['Rock', 'Paper', 'Scissors'];
            
            // If there's a previous opponent choice and it resulted in a tie,
            // remove it from possible choices to ensure variation
            if (this.opponentChoice && this.opponentChoice === this.playerChoice) {
                choices.splice(choices.indexOf(this.opponentChoice), 1);
            }
            
            // Get random choice from remaining options
            this.opponentChoice = choices[Math.floor(Math.random() * choices.length)];
            
            if (this.opponentChoiceText && this.opponentChoiceText.active) {
                this.opponentChoiceText.setText(this.opponentChoice);
            }
            
            // Play opponent choice sound
            if (audioSystem) {
                audioSystem.playSfx('baa', { volume: 0.7 });
            }
            
            // Delay result calculation for dramatic effect
            this.time.delayedCall(1000, () => {
                if (!this.scene.isActive()) return; // Check if scene is still active
                this.calculateRPSResult();
            });
        });
    }
    
    calculateRPSResult() {
        // Prevent multiple calls during processing
        if (this.rpsResultProcessing) return;
        this.rpsResultProcessing = true;
        this.rpsGameActive = false;
        
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        let result;
        let resultText;
        let resultColor;
        
        // Determine winner based on RPS rules
        if (this.playerChoice === this.opponentChoice) {
            result = 'tie';
            resultText = 'A STALEMATE!';
            resultColor = COLORS.TEXT;
            
            // Play sounds for tie
            if (audioSystem) {
                // Instead of using a non-existent 'tie' sound, use existing sounds with modifications
                audioSystem.playSfx('baa', { volume: 0.6, detune: -300 });
                
                // Play crowd murmurs
                audioSystem.playSfx('crowd_sheep', { volume: 0.5 });
                
                // Also play a UI sound
                this.time.delayedCall(200, () => {
                    audioSystem.playClick();
                });
            }
            
            // Animate spectators for tie (mixed reactions)
            this.animateSpectators('mixed');
            
            // Reset the game for another round after a delay
            this.time.delayedCall(2000, () => {
                this.resetRPSGame();
                // Allow new game cycle to start
                this.rpsResultProcessing = false;
                this.rpsGameActive = true;
            });
            
        } else if (
            (this.playerChoice === 'Rock' && this.opponentChoice === 'Scissors') ||
            (this.playerChoice === 'Paper' && this.opponentChoice === 'Rock') ||
            (this.playerChoice === 'Scissors' && this.opponentChoice === 'Paper')
        ) {
            result = 'win';
            resultText = 'VICTORY IS YOURS!';
            resultColor = '#00AA00';
            
            // Update scores
            this.finalScore += 1;
            
            // Animate spectators with excitement
            this.animateSpectators('excited');
            
            // Play victory sound
            if (audioSystem) {
                // First play the crowd cheer
                audioSystem.playSfx('crowdCheer', { volume: 0.6 });
                
                // Then play baa sound for the victory sheep
                this.time.delayedCall(100, () => {
                    audioSystem.playSfx('baa', { volume: 0.7, detune: 200 });
                });
                
                // Also play lance hit for impact
                this.time.delayedCall(50, () => {
                    audioSystem.playSfx('lanceHit', { volume: 0.6 });
                });
            }
            
            // Show game UI after short delay
            this.time.delayedCall(2500, () => {
                this.showGameOverUI('win');
            });
            
        } else {
            result = 'lose';
            resultText = 'THE OPPONENT PREVAILS!';
            resultColor = '#AA0000';
            
            // Update scores
            this.opponentScore += 1;
            
            // Animate spectators with disappointment
            this.animateSpectators('disappointed');
            
            // Play defeat sound
            if (audioSystem) {
                // Play disappointed crowd sound
                audioSystem.playSfx('crowd_sheep', { volume: 0.5 });
                
                // Play sad baa
                this.time.delayedCall(200, () => {
                    audioSystem.playSfx('baa', { volume: 0.6, detune: -500 });
                });
                
                // Also play lance hit for impact
                this.time.delayedCall(50, () => {
                    audioSystem.playSfx('lanceHit', { volume: 0.5 });
                });
            }
            
            // Animate player falling off with rotation and fade out to opacity 0
            if (this.playerContainer) {
                this.tweens.add({
                    targets: this.playerContainer,
                    y: h + 200, // Fall below screen
                    rotation: 1.5, // Rotate as falling
                    alpha: 0, // Fade out completely
                    duration: 1500,
                    ease: 'Power2.easeIn'
                });
            }
            
            // Show game UI after short delay
            this.time.delayedCall(2500, () => {
                this.showGameOverUI('lose');
            });
        }
        
        // Create a clean text result display without banners
        const resultText1 = this.add.text(w/2, h/2 - 50, resultText, {
            fontSize: '40px',
            fontStyle: 'bold',
            fontFamily: FONTS.FAMILY,
            color: resultColor,
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        resultText1.setDepth(25); // Set depth higher than UI
        
        // Add to resultTexts array for cleanup
        this.resultTexts.push(resultText1);
        
        // Add soft shadow to text for better readability
        const shadowText = this.add.text(w/2 + 2, h/2 - 50 + 2, resultText, {
            fontSize: '40px',
            fontStyle: 'bold',
            fontFamily: FONTS.FAMILY,
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5);
        shadowText.setAlpha(0.3);
        shadowText.setDepth(24); // Just below the main text
        this.resultTexts.push(shadowText);
        
        // Animate text appearance
        this.tweens.add({
            targets: [resultText1, shadowText],
            scaleX: { from: 0.2, to: 1 },
            scaleY: { from: 0.2, to: 1 },
            ease: 'Back.out',
            duration: 500
        });
    }
    
    // Add spectator animation method for tie scenario
    animateSpectators(reaction) {
        if (!this.spectators || this.spectators.length === 0) return;
        
        // Make spectators react based on outcome
        this.spectators.forEach(spectator => {
            // Clear any existing tweens
            this.tweens.killTweensOf(spectator);
            
            if (reaction === 'excited') {
                // Excited jump animation
                const jumpHeight = 15 + Math.random() * 20;
                
                // Create jumping animation
                this.tweens.add({
                    targets: spectator,
                    y: `-=${jumpHeight}`,
                    duration: 300,
                    yoyo: true,
                    repeat: 3,
                    ease: 'Sine.easeOut'
                });
                
                // Add rotation for extra excitement
                this.tweens.add({
                    targets: spectator,
                    angle: spectator.flipX ? -10 : 10,
                    duration: 200,
                    yoyo: true,
                    repeat: 5,
                    ease: 'Sine.easeInOut'
                });
                
                // Scale up and down rapidly (bouncing with excitement)
                this.tweens.add({
                    targets: spectator,
                    scaleY: spectator.scaleY * 1.15,
                    duration: 200,
                    yoyo: true,
                    repeat: 5,
                    ease: 'Sine.easeInOut'
                });
            } else if (reaction === 'disappointed') {
                // Disappointed/subdued animation
                
                // Slump down slightly
                this.tweens.add({
                    targets: spectator,
                    y: `+=${3 + Math.random() * 5}`,
                    duration: 500,
                    ease: 'Sine.easeOut'
                });
                
                // Shrink slightly (hunching down)
                this.tweens.add({
                    targets: spectator,
                    scaleY: spectator.scaleY * 0.9,
                    scaleX: spectator.scaleX * 0.95,
                    duration: 500,
                    ease: 'Sine.easeOut'
                });
                
                // Slight side-to-side shake (head shake of disappointment)
                this.tweens.add({
                    targets: spectator,
                    x: `+=${spectator.flipX ? -3 : 3}`,
                    duration: 300,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Sine.easeInOut'
                });
            } else if (reaction === 'mixed') {
                // For tie results, create mixed reactions
                // Some spectators are excited, some disappointed
                if (Math.random() > 0.5) {
                    // Mild excitement - small hops
                    this.tweens.add({
                        targets: spectator,
                        y: `-=${5 + Math.random() * 10}`,
                        duration: 200,
                        yoyo: true,
                        repeat: 2,
                        ease: 'Sine.easeOut'
                    });
                    
                    // Small rotation
                    this.tweens.add({
                        targets: spectator,
                        angle: spectator.flipX ? -5 : 5,
                        duration: 150,
                        yoyo: true,
                        repeat: 3,
                        ease: 'Sine.easeInOut'
                    });
                } else {
                    // Mild disappointment - small slump
                    this.tweens.add({
                        targets: spectator,
                        y: `+=${2 + Math.random() * 3}`,
                        duration: 300,
                        ease: 'Sine.easeOut'
                    });
                    
                    // Small scale change
                    this.tweens.add({
                        targets: spectator,
                        scaleY: spectator.scaleY * 0.95,
                        duration: 300,
                        ease: 'Sine.easeOut'
                    });
                }
            }
        });
    }
    
    resetRPSGame() {
        // Reset choices
        this.playerChoice = null;
        this.opponentChoice = null;
        
        // Reset text displays if they exist
        if (this.playerChoiceText && this.playerChoiceText.active) {
            this.playerChoiceText.setText('');
        }
        
        if (this.opponentChoiceText && this.opponentChoiceText.active) {
            this.opponentChoiceText.setText('???');
        }
        
        // Make buttons visible again if they exist
        if (this.rpsButtonsContainer && this.rpsButtonsContainer.active) {
            this.rpsButtonsContainer.setVisible(true);
        }
        
        // Reset button colors if they exist
        if (this.rpsButtons && this.rpsButtons.length > 0) {
            this.rpsButtons.forEach(button => {
                if (button.background && button.background.active) {
                    button.background.setFillStyle(this.UI.COLORS.BUTTON);
                }
                if (button.text && button.text.active) {
                    button.text.setScale(1);
                }
            });
        }
        
        // Clean up result texts safely
        if (this.resultTexts && this.resultTexts.length > 0) {
            this.resultTexts.forEach(text => {
                if (text && text.active) {
                    text.destroy();
                }
            });
            this.resultTexts = [];
        }
        
        // Update the score display if RPS panel exists
        if (this.rpsPanel && this.rpsPanel.active) {
            // Look for score text in the panel
            const scoreObjects = this.rpsPanel.list.filter(obj => 
                obj.type === 'Text' && 
                obj.text && 
                obj.text.includes('-') && 
                obj.text.length <= 7); // Assuming score text is short like "3 - 2"
            
            // Update the first matching text object
            if (scoreObjects.length > 0) {
                scoreObjects[0].setText(`${this.finalScore} - ${this.opponentScore}`);
            }
        }
    }

    showGameOverUI(result) {
        const { width: w, height: h } = this.cameras.main;
        const centerX = w / 2;
        const centerY = h / 2;
        const { COLORS, FONTS } = this.UI;
        
        // Create a container for the game over UI
        const container = this.add.container(centerX, centerY);
        container.setDepth(30); // Set higher depth to ensure it appears above everything
        
        // Determine if player won based on result parameter or score comparison
        let playerWon = false;
        
        if (result === 'win') {
            playerWon = true;
        } else if (result === 'lose') {
            playerWon = false;
        } else {
            // If no specific result provided, determine by score
            playerWon = this.finalScore > this.opponentScore;
        }
        
        // Create medieval-styled wooden panel with appropriate title
        const titleText = playerWon ? 'VICTORY!' : 'DEFEAT!';
        const panelWidth = 420;
        const panelHeight = 320;
        
        // Create the wooden panel
        const gameOverPanel = this.createWoodenPanel(0, 0, panelWidth, panelHeight, titleText);
        container.add(gameOverPanel);
        
        // Show score display with medieval styling
        const scoreText = this.add.text(0, -90, `${this.finalScore} - ${this.opponentScore}`, {
            fontSize: '38px',
            fontFamily: FONTS.FAMILY,
            fontStyle: 'bold',
            color: COLORS.TEXT,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        scoreText.setShadow(1, 1, '#000000', 2);
        gameOverPanel.add(scoreText);
        
        // Calculate reward
        let moneyEarned = 0;
        
        // Different money calculation based on match type
        if (this.matchType === 'career' && playerWon) {
            // Use enemy system to get proper money reward
            const enemySystem = new EnemySystem(this);
            
            // Get the enemy data using the opponent ID
            if (this.opponentId) {
                const enemy = enemySystem.getEnemy(this.opponentId);
                
                // Calculate reward based on score
                moneyEarned = enemy.calculateMoneyReward(this.finalScore);
                // Update career progression
                playerState.updateCareerProgress(this.opponentId, true, { moneyReward: moneyEarned });
            }
        } else if (playerWon) {
            // For quick match, give a base reward + bonus for score
            moneyEarned = 30 + (this.finalScore * 3);
        } else if (!playerWon && this.finalScore > 0) {
            // Small consolation prize if player scored some points
            moneyEarned = Math.floor(this.finalScore * 1.5);
        }
        
        // Ensure money is added to player state
        if (moneyEarned > 0) {
            playerState.updateMoney(moneyEarned);
        }
        
        // Show reward if there is one
        if (moneyEarned > 0) {
            const rewardText = this.add.text(0, -25, `+$${moneyEarned}`, {
                fontSize: '32px',
                fontFamily: FONTS.FAMILY,
                fontStyle: 'bold',
                color: COLORS.TEXT,
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5);
            rewardText.setShadow(1, 1, '#FFD700', 1);
            gameOverPanel.add(rewardText);
        }
        
        // Create a wooden continue button
        this.createWoodenButton(
            gameOverPanel,
            0,
            70,
            'CONTINUE',
            200,
            50,
            () => {
                // Play click sound handled by the button
                
                // Stop all crowd sounds
                if (audioSystem && audioSystem.sfx) {
                    if (audioSystem.sfx.crowdCheer) {
                        audioSystem.sfx.crowdCheer.stop();
                    }
                    if (audioSystem.sfx.crowd_sheep) {
                        audioSystem.sfx.crowd_sheep.stop();
                    }
                    if (audioSystem.sfx.baa) {
                        audioSystem.sfx.baa.stop();
                    }
                }
                
                // Update player stats using the global PlayerState
                playerState.updateStats(this.finalScore, playerWon);
                playerState.updateRankAndLeagues();
                this.scene.start('MainLoop');
            }
        );
        
        // Simple fade-in animation
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 300
        });
    }

    shutdown() {
        // Make sure all sounds are stopped when scene is shut down
        if (audioSystem && audioSystem.sfx) {
            // Explicitly stop common sounds
            const soundKeys = ['crowdCheer', 'crowd_sheep', 'baa', 'lanceHit'];
            soundKeys.forEach(key => {
                if (audioSystem.sfx[key]) {
                    audioSystem.sfx[key].stop();
                }
            });
            
            // Fade out other sounds
            audioSystem.fadeOutAllSounds(500);
        }
        
        // Stop all tweens
        this.tweens.killAll();
        
        // Clean up tweens for player and opponent
        if (this.playerTween) {
            this.playerTween.stop();
            this.playerTween = null;
        }
        if (this.opponentTween) {
            this.opponentTween.stop();
            this.opponentTween = null;
        }
        
        // Clean up jousting outcome
        if (this.joustingOutcome) {
            this.joustingOutcome.destroy();
            this.joustingOutcome = null;
        }
        
        // Clean up RPS UI elements
        if (this.rpsPanel) {
            this.rpsPanel.destroy();
            this.rpsPanel = null;
        }
        
        if (this.rpsButtonsContainer) {
            this.rpsButtonsContainer.destroy();
            this.rpsButtonsContainer = null;
        }
        
        // Clean up player and opponent containers if they exist
        if (this.playerContainer) {
            this.playerContainer.destroy();
            this.playerContainer = null;
        }
        
        if (this.opponentContainer) {
            this.opponentContainer.destroy();
            this.opponentContainer = null;
        }
        
        // Clean up spectators
        if (this.spectators && this.spectators.length > 0) {
            this.spectators.forEach(spectator => {
                if (spectator && spectator.destroy) {
                    spectator.destroy();
                }
            });
            this.spectators = [];
        }
        
        // Clean up result texts
        if (this.resultTexts && this.resultTexts.length > 0) {
            this.resultTexts.forEach(text => {
                if (text && text.destroy) {
                    text.destroy();
                }
            });
            this.resultTexts = [];
        }
        
        // Clean up debug menu
        if (this.debugMenu) {
            this.debugMenu.destroy();
            this.debugMenu = null;
        }
        
        // Save the game state
        if (playerState) {
            playerState.saveToLocalStorage();
        }
    }

    startJoustingAnimation() {
        const { width: w } = this.scene.cameras.main;
        const centerX = w / 2;

        const baseDuration = 1000;
        const baseSpeed = 2;
        const speedIncreasePerPoint = 0.5;
        const speedMultiplier = 2.5;

        // Calculate player speed based on their score
        const playerSpeed = baseSpeed + (this.finalScore * speedIncreasePerPoint);
        const playerSpeedFactor = (playerSpeed / baseSpeed) * speedMultiplier;
        const playerDuration = baseDuration / playerSpeedFactor;

        // Calculate opponent speed based on their score
        const opponentSpeed = baseSpeed + (this.opponentScore * speedIncreasePerPoint);
        const opponentSpeedFactor = (opponentSpeed / baseSpeed) * speedMultiplier;
        const opponentDuration = baseDuration / opponentSpeedFactor;

        // Create tweens with separate durations
        this.playerTween = this.tweens.add({
            targets: this.playerContainer,
            x: centerX - 225,
            duration: playerDuration,
            ease: 'Linear'
        });

        this.opponentTween = this.tweens.add({
            targets: this.opponentContainer,
            x: centerX + 225,
            duration: opponentDuration,
            ease: 'Linear',
            onComplete: () => {
                this.handleCollision();
            }
        });
    }

    handleCareerRewards() {
        if (this.matchType === 'career' && this.opponentId) {
            const enemySystem = new EnemySystem(this);
            const enemy = enemySystem.getEnemy(this.opponentId);
            
            if (enemy) {
                // Only update career progress - we'll show rewards in showGameOverUI
                playerState.updateCareerProgress(this.opponentId, this.won, null);
            }
        }
    }
} 