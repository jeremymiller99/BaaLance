class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
        
        // Debug menu
        this.debugMenu = null;
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
        
        // Initialize debug menu
        this.debugMenu = new DebugMenu(this);
        this.debugMenu.create();
    }
    
    shutdown() {
        // Clean up debug menu
        if (this.debugMenu) {
            this.debugMenu.destroy();
            this.debugMenu = null;
        }
    }
} 