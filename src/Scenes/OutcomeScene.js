class OutcomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OutcomeScene' });
        this.playerTween = null;
        this.opponentTween = null;
        this.rpsGameActive = false;
        this.playerChoice = null;
        this.opponentChoice = null;
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
        this.qteSpeedModifier = data.qteSpeedModifier || 1.0; // Renamed from finalSpeed
        this.currentSkin = data.currentSkin || 'default';
        
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
        
        // Create background
        const bg = this.add.image(0, 0, 'bg');
        bg.setOrigin(0, 0);
        
        // Scale background to fit screen
        const scale = Math.max(w / bg.width, h / bg.height);
        bg.setScale(scale);

        // For a tie, setup the rock-paper-scissors game
        if (this.isTie) {
            this.setupRockPaperScissors();
        } else {
            // Initialize jousting outcome system with skin
            this.joustingOutcome = new JoustingOutcome(this, this.won, this.currentSkin);
            this.joustingOutcome.create();
        }
    }

    setupRockPaperScissors() {
        const { width: w, height: h } = this.cameras.main;
        this.rpsGameActive = true;
        
        // Initialize weapon system and skin system
        this.weaponSystem = new WeaponSystem(this);
        const skinSystem = new SkinSystem(this);
        
        // Create player container starting from left
        this.playerContainer = this.add.container(-100, h/2 + 175);
        const playerSkinKey = skinSystem.getSkinTextureKey(this.currentSkin);
        const player = this.add.sprite(0, 0, playerSkinKey).setScale(0.75);
        player.setOrigin(0.5);
        this.playerContainer.add(player);
        
        // Get player lance
        const playerLance = playerState.getState().equipment.currentLance || 'lance_0';
        this.weaponSystem.equipWeapon(this.playerContainer, playerLance);
        
        // Create opponent container starting from right
        this.opponentContainer = this.add.container(w + 100, h/2 + 175);
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

    showRockPaperScissorsUI() {
        const { width: w, height: h } = this.cameras.main;
        
        // Create title text
        const textStyle = {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };
        
        this.add.text(w/2, h/4, 'TIE!', {
            ...textStyle,
            color: '#ffff00'  // Yellow for tie
        }).setOrigin(0.5);
        
        this.add.text(w/2, h/4 + 80, 'Choose Rock, Paper, or Scissors to break the tie', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Create score display
        this.add.text(w/2, h/4 + 140, `${this.finalScore} - ${this.opponentScore}`, {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Create prompt texts above each character
        this.playerPrompt = this.add.text(w/4, h/2, 'Your Choice:', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.opponentPrompt = this.add.text(3*w/4, h/2, 'Opponent\'s Choice:', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Create choice displays (initially empty)
        this.playerChoiceText = this.add.text(w/4, h/2 + 30, '', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.opponentChoiceText = this.add.text(3*w/4, h/2 + 30, '???', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ff00ff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Create RPS buttons
        this.createRPSButtons();
    }
    
    createRPSButtons() {
        const { width: w, height: h } = this.cameras.main;
        const buttonY = h * 0.75;
        const spacing = 180;
        
        // Button style
        const buttonStyle = {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 },
            stroke: '#000000',
            strokeThickness: 2
        };
        
        // Create rock button
        const rockButton = this.add.text(w/2 - spacing, buttonY, '🪨 Rock', buttonStyle)
            .setOrigin(0.5)
            .setInteractive();
            
        rockButton.on('pointerover', () => {
            rockButton.setBackgroundColor('#666666');
            rockButton.setScale(1.1);
        });
        
        rockButton.on('pointerout', () => {
            rockButton.setBackgroundColor('#444444');
            rockButton.setScale(1);
        });
        
        rockButton.on('pointerdown', () => {
            this.makeRPSChoice('Rock');
        });
        
        // Create paper button
        const paperButton = this.add.text(w/2, buttonY, '📄 Paper', buttonStyle)
            .setOrigin(0.5)
            .setInteractive();
            
        paperButton.on('pointerover', () => {
            paperButton.setBackgroundColor('#666666');
            paperButton.setScale(1.1);
        });
        
        paperButton.on('pointerout', () => {
            paperButton.setBackgroundColor('#444444');
            paperButton.setScale(1);
        });
        
        paperButton.on('pointerdown', () => {
            this.makeRPSChoice('Paper');
        });
        
        // Create scissors button
        const scissorsButton = this.add.text(w/2 + spacing, buttonY, '✂️ Scissors', buttonStyle)
            .setOrigin(0.5)
            .setInteractive();
            
        scissorsButton.on('pointerover', () => {
            scissorsButton.setBackgroundColor('#666666');
            scissorsButton.setScale(1.1);
        });
        
        scissorsButton.on('pointerout', () => {
            scissorsButton.setBackgroundColor('#444444');
            scissorsButton.setScale(1);
        });
        
        scissorsButton.on('pointerdown', () => {
            this.makeRPSChoice('Scissors');
        });
        
        // Store buttons in an array for disabling later
        this.rpsButtons = [rockButton, paperButton, scissorsButton];
    }
    
    makeRPSChoice(choice) {
        if (!this.rpsGameActive) return;
        
        // Set player choice
        this.playerChoice = choice;
        this.playerChoiceText.setText(choice);
        
        // Disable and hide buttons after choice is made
        this.rpsButtons.forEach(button => {
            button.setVisible(false);
        });
        
        // Delay opponent choice for suspense
        this.time.delayedCall(1000, () => {
            // Generate opponent choice randomly
            const choices = ['Rock', 'Paper', 'Scissors'];
            this.opponentChoice = choices[Math.floor(Math.random() * choices.length)];
            this.opponentChoiceText.setText(this.opponentChoice);
            
            // Delay result calculation for dramatic effect
            this.time.delayedCall(1000, () => {
                this.calculateRPSResult();
            });
        });
    }
    
    calculateRPSResult() {
        // Calculate who won
        let playerWins = false;
        
        if (this.playerChoice === this.opponentChoice) {
            // Another tie - restart RPS game
            this.showRPSResult('Tie! Play again.');
            this.time.delayedCall(2000, () => {
                this.resetRPSGame();
            });
            return;
        } else if (
            (this.playerChoice === 'Rock' && this.opponentChoice === 'Scissors') ||
            (this.playerChoice === 'Paper' && this.opponentChoice === 'Rock') ||
            (this.playerChoice === 'Scissors' && this.opponentChoice === 'Paper')
        ) {
            playerWins = true;
        }
        
        // Set the winner
        this.won = playerWins;
        this.rpsGameActive = false;
        
        // Show result
        this.showRPSResult(playerWins ? 'You win!' : 'Opponent wins!');
        
        // Remove tutorial text and choice prompts
        this.clearRPSInstructionTexts();
        
        // Delay transition to result screen
        this.time.delayedCall(2000, () => {
            this.showGameOverUI();
        });
    }
    
    clearRPSInstructionTexts() {
        // Remove all instruction and prompt texts immediately
        this.children.list.forEach(child => {
            if (child.text) {
                // Check for tutorial and instruction texts
                if (child.text.includes('Choose Rock, Paper, or Scissors') ||
                    child.text === 'Your Choice:' ||
                    child.text === "Opponent's Choice:" ||
                    // Also remove the score text by checking for hyphen between numbers pattern
                    /^\d+\s*-\s*\d+$/.test(child.text) ||
                    child.text === 'TIE!') {
                    child.destroy();
                }
            }
        });
        
        // Hide the choice text displays after a short delay (so player can still see the final choices)
        this.time.delayedCall(1500, () => {
            if (this.playerChoiceText) this.playerChoiceText.setVisible(false);
            if (this.opponentChoiceText) this.opponentChoiceText.setVisible(false);
            
            // Also ensure the player prompt texts are removed (redundant check for safety)
            this.children.list.forEach(child => {
                if (child.text) {
                    if (child.text === 'Your Choice:' || child.text === "Opponent's Choice:") {
                        child.destroy();
                    }
                }
            });
        });
    }
    
    showRPSResult(message) {
        const { width: w, height: h } = this.cameras.main;
        
        // Remove any previous result text to avoid overlay
        this.children.list.forEach(child => {
            if (child.text && (child.text.includes('You win') || child.text.includes('Opponent wins') || child.text.includes('Tie! Play again'))) {
                child.destroy();
            }
        });
        
        // Create result text with animation
        const resultText = this.add.text(w/2, h/2 + 200, message, {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: message.includes('Tie') ? '#ffff00' : (message.includes('You win') ? '#00ff00' : '#ff0000'),
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Animate result text
        this.tweens.add({
            targets: resultText,
            scale: 1.3,
            duration: 300,
            yoyo: true,
            repeat: 1
        });
        
        // Make the result text fade away after a few seconds (if not a tie)
        if (!message.includes('Tie')) {
            this.time.delayedCall(3000, () => {
                this.tweens.add({
                    targets: resultText,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        resultText.destroy();
                    }
                });
            });
        }
    }
    
    resetRPSGame() {
        // Reset choices
        this.playerChoice = null;
        this.opponentChoice = null;
        
        // Reset text displays and make them visible again
        if (this.playerChoiceText) {
            this.playerChoiceText.setText('');
            this.playerChoiceText.setVisible(true);
        }
        
        if (this.opponentChoiceText) {
            this.opponentChoiceText.setText('???');
            this.opponentChoiceText.setVisible(true);
        }
        
        // Make buttons visible again
        this.rpsButtons.forEach(button => {
            button.setVisible(true);
            button.setInteractive();
            button.setBackgroundColor('#444444');
            button.setAlpha(1);
            button.setScale(1);
        });
        
        // Remove any result text
        this.children.list.forEach(child => {
            if (child.text && (child.text.includes('You win') || child.text.includes('Opponent wins') || child.text.includes('Tie! Play again'))) {
                child.destroy();
            }
        });
    }

    showGameOverUI() {
        const { width: w, height: h } = this.cameras.main;
        const centerX = w / 2;
        const centerY = h / 2;

        // Clear ALL previous UI elements to prevent overlay
        this.children.list.forEach(child => {
            // Don't remove the background or player/opponent containers
            if (child.type !== 'Image' && 
                child !== this.playerContainer && 
                child !== this.opponentContainer && 
                child.texture && child.texture.key !== 'bg') {
                child.destroy();
            }
        });
        
        // Ensure we disable RPS game state
        this.rpsGameActive = false;

        // Create text style
        const textStyle = {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        // Create title
        this.add.text(centerX, centerY - 150, this.won ? 'Victory!' : 'Defeat!', {
            ...textStyle,
            color: this.won ? '#00ff00' : '#ff0000'
        }).setOrigin(0.5);

        // Create score displays
        this.add.text(centerX, centerY - 50, `Your Score: ${this.finalScore}`, {
            ...textStyle,
            fontSize: '48px'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY, `Opponent Score: ${this.opponentScore}`, {
            ...textStyle,
            fontSize: '48px'
        }).setOrigin(0.5);

        // If it was a tie originally, show that it was decided by RPS
        if (this.finalScore === this.opponentScore) {
            this.add.text(centerX, centerY + 50, `Tie broken by Rock-Paper-Scissors!`, {
                ...textStyle,
                fontSize: '32px'
            }).setOrigin(0.5);
        }

        // Create opponent info text if available (for both quick match and career modes)
        if (this.opponentId) {
            const enemySystem = new EnemySystem(this);
            const enemy = enemySystem.getEnemy(this.opponentId);
            
            if (enemy) {
                this.add.text(centerX, this.finalScore === this.opponentScore ? centerY + 100 : centerY + 50, `Opponent: ${enemy.name}`, {
                    ...textStyle,
                    fontSize: '32px'
                }).setOrigin(0.5);
            }
        }

        // Show money rewards for career mode
        if (this.matchType === 'career' && this.won) {
            this.handleCareerRewards();
        }

        // Create return to hub button
        const returnButton = this.add.text(centerX, this.finalScore === this.opponentScore ? centerY + 170 : centerY + 120, 'Return to Hub', {
            ...textStyle,
            fontSize: '32px'
        }).setOrigin(0.5).setInteractive();

        // Add hover effect
        returnButton.on('pointerover', () => {
            returnButton.setScale(1.2);
        });

        returnButton.on('pointerout', () => {
            returnButton.setScale(1);
        });

        // Add click handler
        returnButton.on('pointerdown', () => {
            // Update player stats using the global PlayerState
            playerState.updateStats(this.finalScore, this.won);
            playerState.updateRankAndLeagues();
            this.scene.start('MainLoop');
        });

        // Create return to main menu button
        const mainMenuButton = this.add.text(centerX, this.finalScore === this.opponentScore ? centerY + 220 : centerY + 170, 'Return to Main Menu', {
            ...textStyle,
            fontSize: '32px'
        }).setOrigin(0.5).setInteractive();

        // Add hover effect
        mainMenuButton.on('pointerover', () => {
            mainMenuButton.setScale(1.2);
        });

        mainMenuButton.on('pointerout', () => {
            mainMenuButton.setScale(1);
        });

        // Add click handler
        mainMenuButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    shutdown() {
        if (this.playerTween) {
            this.playerTween.stop();
            this.playerTween = null;
        }
        if (this.opponentTween) {
            this.opponentTween.stop();
            this.opponentTween = null;
        }
        // Clean up when scene is shut down
        if (this.joustingOutcome) {
            this.joustingOutcome.destroy();
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
                const moneyReward = enemy.calculateMoneyReward(this.finalScore);
                
                // Update player's money with reward
                playerState.updateCareerProgress(this.opponentId, this.won, { moneyReward });
                
                // Add money reward text
                const { width: w, height: h } = this.cameras.main;
                const rewardsText = this.add.text(
                    w/2, this.finalScore === this.opponentScore ? h/2 + 140 : h/2 + 70,
                    `Money Earned: $${moneyReward}`,
                    {
                        fontSize: '32px',
                        fontFamily: 'Arial',
                        color: '#00ff00', // Green color for money
                        stroke: '#000000',
                        strokeThickness: 2
                    }
                ).setOrigin(0.5);
                
                // Animate rewards text
                this.tweens.add({
                    targets: rewardsText,
                    scale: 1.2,
                    duration: 200,
                    yoyo: true,
                    repeat: 1
                });
            }
        }
    }
} 