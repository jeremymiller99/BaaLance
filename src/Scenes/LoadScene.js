class LoadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadScene' });
    }

    preload() {
        // Create loading bar
        const { width: w, height: h } = this.cameras.main;
        const loadingText = this.add.text(w/2, h/2 - 50, 'Loading...', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(w/2 - 160, h/2, 320, 50);

        // Update progress bar
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(w/2 - 150, h/2 + 10, 300 * value, 30);
        });

        // Remove progress bar when complete
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load all game assets
        this.loadAssets();
    }

    loadAssets() {
        // Backgrounds
        this.load.image('bg', 'assets/temp_bg.jpg');

        // sheep1 sprites and skins
        this.load.image('sheep1_default', 'assets/sheep1_default.png');
        this.load.image('sheep1_sunglass', 'assets/sheep1_sunglass.png');
        this.load.image('sheep1_tophat', 'assets/sheep1_tophat.png');
        this.load.image('sheep1_bling', 'assets/sheep1_bling.png');

        // sheep2 sprites and skins
        this.load.image('sheep2_default', 'assets/sheep2_default.png');

        // ram sprites and skins
        this.load.image('ram_default', 'assets/ram_default.png');
                
        // Lance sprites
        this.load.image('lance_0', 'assets/lance_0.png');
        this.load.image('lance_1', 'assets/lance_1.png');
        this.load.image('lance_2', 'assets/lance_2.png');
    }

    create() {
        // Start the main menu scene
        this.scene.start('MainMenu');
    }
} 