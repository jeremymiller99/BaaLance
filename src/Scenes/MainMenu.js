class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
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

        // Create title text
        const titleStyle = {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };
        
        this.add.text(w/2, h/3, 'BaaLance', titleStyle)
            .setOrigin(0.5);

        // Create button style
        const buttonStyle = {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        };

        // Create play button
        const playButton = this.add.text(w/2, h/2, 'Enter Arena', buttonStyle)
            .setOrigin(0.5)
            .setInteractive();

        // Add hover effect
        playButton.on('pointerover', () => {
            playButton.setScale(1.2);
        });

        playButton.on('pointerout', () => {
            playButton.setScale(1);
        });

        // Add click handler
        playButton.on('pointerdown', () => {
            this.scene.start('MainLoop');
        });

        // Create debug buttons
        const debugButtonStyle = {
            ...buttonStyle,
            fontSize: '24px',
            color: '#ff0000'
        };

        // Debug Victory button
        const debugVictoryButton = this.add.text(w/2 - 150, h/2 + 100, 'Debug: Victory', debugButtonStyle)
            .setOrigin(0.5)
            .setInteractive();

        debugVictoryButton.on('pointerover', () => {
            debugVictoryButton.setScale(1.2);
        });

        debugVictoryButton.on('pointerout', () => {
            debugVictoryButton.setScale(1);
        });

        debugVictoryButton.on('pointerdown', () => {
            this.scene.start('OutcomeScene', {
                score: 10,
                opponentScore: 5,
                matchType: 'debug'
            });
        });

        // Debug Defeat button
        const debugDefeatButton = this.add.text(w/2, h/2 + 100, 'Debug: Defeat', debugButtonStyle)
            .setOrigin(0.5)
            .setInteractive();

        debugDefeatButton.on('pointerover', () => {
            debugDefeatButton.setScale(1.2);
        });

        debugDefeatButton.on('pointerout', () => {
            debugDefeatButton.setScale(1);
        });

        debugDefeatButton.on('pointerdown', () => {
            this.scene.start('OutcomeScene', {
                score: 5,
                opponentScore: 10,
                matchType: 'debug'
            });
        });
        
        // Debug Tie button
        const debugTieButton = this.add.text(w/2 + 150, h/2 + 100, 'Debug: Tie', debugButtonStyle)
            .setOrigin(0.5)
            .setInteractive();

        debugTieButton.on('pointerover', () => {
            debugTieButton.setScale(1.2);
        });

        debugTieButton.on('pointerout', () => {
            debugTieButton.setScale(1);
        });

        debugTieButton.on('pointerdown', () => {
            this.scene.start('OutcomeScene', {
                score: 8,
                opponentScore: 8,
                matchType: 'debug',
                currentSkin: 'sheep1_default',
                opponentSkin: 'ram_default'
            });
        });
    }
} 