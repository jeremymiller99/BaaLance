class DebugMenu {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.container = null;
        this.toggleButton = null;
        this.playerState = playerState; // Global player state reference
        this.dragStartX = 0;
        this.dragStartY = 0;
    }

    create() {
        const { width: w, height: h } = this.scene.cameras.main;
        
        // Create toggle button in top left corner
        this.toggleButton = this.scene.add.text(20, 20, '🛠️', {
            fontSize: '28px',
            fontStyle: 'bold',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setInteractive({ useHandCursor: true });
        
        // Set depth to be above everything else
        this.toggleButton.setDepth(1000);
        
        // Toggle debug menu on click
        this.toggleButton.on('pointerdown', () => {
            this.toggleVisibility();
        });
        
        // Create invisible container for debug menu
        this.container = this.scene.add.container(150, 100);
        this.container.setVisible(false);
        this.container.setDepth(1000);
        
        // Create background panel
        const panel = this.scene.add.rectangle(0, 0, 300, 450, 0x333333, 0.9);
        panel.setStrokeStyle(2, 0xffffff);
        this.container.add(panel);
        
        // Add title bar with close button
        this.createTitleBar(w, h);
        
        // Create buttons
        this.createDebugButtons();
        
        // Add help text
        const helpText = this.scene.add.text(0, 220, 'Press ~ to toggle menu | Drag title to move', {
            fontSize: '12px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        this.container.add(helpText);
        
        // Add keyboard shortcut (Tilde key ~) to toggle debug menu
        this.keyToggle = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
        this.scene.input.keyboard.on('keydown-BACKTICK', () => {
            this.toggleVisibility();
        });
    }
    
    createTitleBar(w, h) {
        // Create title bar background
        const titleBar = this.scene.add.rectangle(0, -200, 300, 40, 0x222222, 1);
        titleBar.setStrokeStyle(1, 0x444444);
        this.container.add(titleBar);
        
        // Make title bar draggable
        titleBar.setInteractive({ useHandCursor: true, draggable: true });
        
        titleBar.on('dragstart', (pointer, dragX, dragY) => {
            this.dragStartX = this.container.x - pointer.x;
            this.dragStartY = this.container.y - pointer.y;
        });
        
        titleBar.on('drag', (pointer, dragX, dragY) => {
            // Constrain to screen bounds
            const newX = Phaser.Math.Clamp(
                pointer.x + this.dragStartX, 
                150, // Min X (panel width/2)
                w - 150 // Max X (screen width - panel width/2)
            );
            const newY = Phaser.Math.Clamp(
                pointer.y + this.dragStartY,
                225, // Min Y (panel height/2)
                h - 225 // Max Y (screen height - panel height/2)
            );
            
            this.container.setPosition(newX, newY);
        });
        
        // Add title text
        const title = this.scene.add.text(-50, -200, 'DEBUG MENU', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffff00'
        }).setOrigin(0, 0.5);
        this.container.add(title);
        
        // Create a separate close button container
        const closeButtonContainer = this.scene.add.container(0, 0);
        
        // Add close button - positioned on right side of title bar
        const closeButtonBg = this.scene.add.rectangle(130, -200, 30, 30, 0x444444, 1);
        closeButtonBg.setStrokeStyle(1, 0x666666);
        closeButtonContainer.add(closeButtonBg);
        
        const closeButtonText = this.scene.add.text(130, -200, '✖', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ff5555'
        }).setOrigin(0.5);
        closeButtonContainer.add(closeButtonText);
        
        // Make the button interactive
        closeButtonBg.setInteractive({ useHandCursor: true });
        
        // Add hover effects
        closeButtonBg.on('pointerover', () => {
            closeButtonBg.setFillStyle(0x666666);
            closeButtonText.setColor('#ff0000');
        });
        
        closeButtonBg.on('pointerout', () => {
            closeButtonBg.setFillStyle(0x444444);
            closeButtonText.setColor('#ff5555');
        });
        
        // Add click handler
        closeButtonBg.on('pointerdown', () => {
            this.toggleVisibility();
        });
        
        // Add the close button container to the main container
        this.container.add(closeButtonContainer);
    }
    
    createDebugButtons() {
        // First section: Resources and player stats
        const playerButtons = [
            { text: 'Add $100', callback: () => this.addMoney(100) },
            { text: 'Add $1000', callback: () => this.addMoney(1000) },
            { text: 'Add 1 Win', callback: () => this.addWins(1) },
            { text: 'Add 5 Wins', callback: () => this.addWins(5) },
            { text: 'Unlock Knight Lance', callback: () => this.unlockItem('lance_1') },
            { text: 'Unlock Royal Lance', callback: () => this.unlockItem('lance_2') },
            { text: 'Unlock All Skins', callback: () => this.unlockAllSkins() },
            { text: 'Unlock All Leagues', callback: () => this.unlockAllLeagues() },
            { text: 'Max Rank', callback: () => this.maxPlayerRank() },
            { text: 'Reset Player', callback: () => this.resetPlayerState() }
        ];
        
        // Second section: Match testing options
        const matchButtons = [
            { text: 'Test Victory', callback: () => this.testMatch('victory') },
            { text: 'Test Defeat', callback: () => this.testMatch('defeat') },
            { text: 'Test Tie', callback: () => this.testMatch('tie') }
        ];
        
        // Calculate button positioning
        const buttonSpacing = 40;
        const startY = -160;
        
        // Create player buttons
        playerButtons.forEach((button, index) => {
            const y = startY + (index * buttonSpacing);
            this.createButton(button.text, 0, y, button.callback);
        });
        
        // Add separator
        const separator = this.scene.add.line(0, startY + (playerButtons.length * buttonSpacing) + 10, -125, 0, 125, 0, 0xffffff, 0.5);
        this.container.add(separator);
        
        // Create match testing buttons
        matchButtons.forEach((button, index) => {
            const y = startY + ((playerButtons.length + 1) * buttonSpacing) + (index * buttonSpacing);
            this.createButton(button.text, 0, y, button.callback, '#ff6666');
        });
    }
    
    createButton(text, x, y, callback, textColor = '#ffffff') {
        // Create button background
        const buttonBg = this.scene.add.rectangle(x, y, 250, 35, 0x555555, 1);
        buttonBg.setStrokeStyle(1, 0xaaaaaa);
        this.container.add(buttonBg);
        
        // Create button text
        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: '18px',
            color: textColor
        }).setOrigin(0.5);
        this.container.add(buttonText);
        
        // Make button interactive
        buttonBg.setInteractive({ useHandCursor: true });
        
        // Add hover effect
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x777777);
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x555555);
        });
        
        // Add click handler
        buttonBg.on('pointerdown', () => {
            buttonBg.setFillStyle(0x333333);
            
            // Play a click sound if available
            // if (this.scene.sound.get('click')) this.scene.sound.play('click');
            
            // Call the button's callback
            callback();
            
            // Show feedback message
            this.showFeedbackMessage(text + ' executed');
            
            // Update stats in main scene if needed
            if (this.scene.createStatsBoard) {
                this.scene.createStatsBoard();
            }
            
            // Reset button color after a short delay
            this.scene.time.delayedCall(100, () => {
                buttonBg.setFillStyle(0x555555);
            });
        });
    }
    
    toggleVisibility() {
        this.visible = !this.visible;
        this.container.setVisible(this.visible);
        
        // Update toggle button appearance
        if (this.visible) {
            this.toggleButton.setBackgroundColor('#ff000080');
        } else {
            this.toggleButton.setBackgroundColor('#00000080');
        }
    }
    
    showFeedbackMessage(message) {
        // Create temporary feedback message
        const feedback = this.scene.add.text(0, 195, message, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#00ff00',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        this.container.add(feedback);
        
        // Fade out and remove after 1.5 seconds
        this.scene.tweens.add({
            targets: feedback,
            alpha: 0,
            y: 180,
            duration: 1500,
            onComplete: () => {
                feedback.destroy();
            }
        });
    }
    
    // Debug actions
    addMoney(amount) {
        this.playerState.updateMoney(amount);
    }
    
    addWins(count) {
        for (let i = 0; i < count; i++) {
            this.playerState.updateStats(10, true);
        }
        this.playerState.updateRankAndLeagues();
    }
    
    unlockItem(itemId) {
        if (itemId.startsWith('lance_')) {
            this.playerState.unlockWeapon(itemId);
        } else {
            this.playerState.unlockSkin(itemId);
        }
    }
    
    unlockAllSkins() {
        const skinSystem = new SkinSystem(this.scene);
        const allSkins = skinSystem.getAllSkins();
        
        Object.keys(allSkins).forEach(skinId => {
            this.playerState.unlockSkin(skinId);
        });
    }
    
    unlockAllLeagues() {
        const enemySystem = new EnemySystem(this.scene);
        const leagues = enemySystem.getLeagues();
        
        // Update both the enemySystem and player state
        Object.keys(leagues).forEach(leagueId => {
            enemySystem.unlockLeague(leagueId);
            
            // Make sure player state also has these leagues unlocked
            if (!this.playerState.data.enemyProgress) {
                this.playerState.data.enemyProgress = { leagues: {}, enemies: {} };
            }
            this.playerState.data.enemyProgress.leagues[leagueId] = true;
        });
        
        // Apply changes through player state method
        this.playerState.updateRankAndLeagues();
    }
    
    maxPlayerRank() {
        // Add 40 wins to reach Legendary rank
        this.addWins(40);
        
        // Ensure all leagues are unlocked
        this.unlockAllLeagues();
    }
    
    resetPlayerState() {
        // Reset player state to default values
        this.playerState.data = {
            money: 100,
            stats: {
                wins: 0,
                losses: 0,
                highestScore: 0
            },
            equipment: {
                currentLance: 'lance_0'
            },
            currentSkin: 'default',
            skins: {
                'default': true
            },
            weapons: {
                'lance_0': true
            }
        };
    }
    
    testMatch(outcome) {
        // Set up data for different outcomes
        let data = {
            matchType: 'debug',
            currentSkin: 'sheep1_default',
            opponentSkin: 'ram_default'
        };
        
        // Configure based on desired outcome
        switch(outcome) {
            case 'victory':
                data.score = 10;
                data.opponentScore = 5;
                break;
            case 'defeat':
                data.score = 5;
                data.opponentScore = 10;
                break;
            case 'tie':
                data.score = 8;
                data.opponentScore = 8;
                break;
        }
        
        // Start the outcome scene with the configured data
        this.scene.scene.start('OutcomeScene', data);
    }
    
    destroy() {
        if (this.toggleButton) {
            this.toggleButton.destroy();
        }
        if (this.container) {
            this.container.destroy();
        }
        
        // Remove keyboard event listener
        if (this.keyToggle) {
            this.keyToggle.reset();
            this.scene.input.keyboard.off('keydown-BACKTICK');
        }
    }
} 