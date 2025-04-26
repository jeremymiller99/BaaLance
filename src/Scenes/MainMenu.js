class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
        
        // UI Constants for the medieval theme (similar to MainLoop)
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
            },
            PANEL: {
                WIDTH: 350, // Panel width
                HEIGHT: 420, // Panel height
                PADDING: 20,
                BUTTON_HEIGHT: 60, // Button height
                BUTTON_SPACING: 25 // Space between buttons
            }
        };
        
        // Track UI elements for proper cleanup
        this.containerElements = [];
        
        // Settings and credits panels
        this.settingsPanel = null;
        this.settingsVisible = false;
        this.creditsPanel = null;
        this.creditsVisible = false;
        
        // Animation elements
        this.sheepRunners = [];
        this.sheepSpawnTimer = null;
        
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

        // Start background animations of running sheep - now before UI elements
        // so the sheep are drawn underneath
        this.setupBackgroundAnimations();
        
        // Create title banner and menus - with higher depth to ensure they're above sheep
        this.createTitleBanner();
        this.createMainMenu();
        
        // Create settings panel (initially hidden)
        this.createSettingsPanel();
        
        // Create credits panel (initially hidden)
        this.createCreditsPanel();
        
        // Add version text at the bottom
        const versionText = this.add.text(
            w/2,
            h - 20,
            "Version 1.0",
            {
                fontSize: '16px',
                fontFamily: this.UI.FONTS.FAMILY,
                color: this.UI.COLORS.TEXT_SECONDARY
            }
        ).setOrigin(0.5);
        versionText.setDepth(10); // Ensure it's above sheep
        this.containerElements.push(versionText);
        
        // Initialize or re-init audio system for this scene
        if (audioSystem) {
            audioSystem.scene = this;
            audioSystem.init();
        }
        
        // Initialize debug menu
        this.debugMenu = new DebugMenu(this);
        this.debugMenu.create();
    }
    
    setupBackgroundAnimations() {
        // Setup timer to spawn sheep periodically with longer delay (less frequent)
        this.sheepSpawnTimer = this.time.addEvent({
            delay: 5000, // Every 5 seconds (reduced frequency)
            callback: this.spawnRunningSheep,
            callbackScope: this,
            loop: true
        });
        
        // Spawn fewer initial sheep
        for (let i = 0; i < 2; i++) {
            this.time.delayedCall(i * 2000, () => {
                this.spawnRunningSheep();
            });
        }
    }
    
    spawnRunningSheep() {
        const { width: w, height: h } = this.cameras.main;
        
        // Choose random sheep skin from available skins
        const skins = ['sheep1_default', 'sheep1_sunglass', 'sheep1_tophat', 'sheep1_bling', 'sheep2_default', 'ram_default'];
        const skinKey = skins[Math.floor(Math.random() * skins.length)];
        
        // Choose random lance
        const lances = ['lance_0', 'lance_1', 'lance_2'];
        const lanceKey = lances[Math.floor(Math.random() * lances.length)];
        
        // Always start from left (removed the random direction)
        const startFromLeft = true;
        
        // Random Y position in the bottom third of the screen
        const minY = h * 0.7;  // Start at 70% down the screen
        const maxY = h * 0.85; // End at 85% down the screen
        const yPos = minY + Math.random() * (maxY - minY);
        
        // Create sheep container with a lower depth to ensure it's under UI
        const sheepContainer = this.add.container(-100, yPos);
        sheepContainer.setDepth(0); // Even lower depth (0) ensures it's drawn under UI elements
        
        // Add sheep sprite - much smaller now
        const sheep = this.add.sprite(0, 0, skinKey).setScale(0.35);
        sheep.setOrigin(0.5);
        // No need to flip since all sheep go left to right
        sheepContainer.add(sheep);
        
        // Create weapon system if needed
        if (!this.weaponSystem) {
            this.weaponSystem = new WeaponSystem(this);
        }
        
        // Add lance - with fixed positioning for left-to-right and smaller scale
        this.weaponSystem.equipWeapon(
            sheepContainer, 
            lanceKey, 
            55, // X offset for left-to-right sheep
            -5, // Y offset
            false, // No flipping needed since all go left to right
            0.3 // Smaller lance scale
        );
        
        // Add running animation
        const bounceAmt = 3; // Reduced bounce amount
        const bounceTween = this.tweens.add({
            targets: sheepContainer,
            y: '+=' + bounceAmt,
            duration: 300,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Create movement tween
        const moveTween = this.tweens.add({
            targets: sheepContainer,
            x: w + 100, // End position always to the right
            duration: 12000 + Math.random() * 8000, // Slower movement for background animation
            ease: 'Linear',
            onComplete: () => {
                // Clean up when off screen
                if (bounceTween) bounceTween.stop();
                if (sheepContainer) sheepContainer.destroy();
                // Remove from tracking array
                const index = this.sheepRunners.indexOf(sheepContainer);
                if (index > -1) {
                    this.sheepRunners.splice(index, 1);
                }
            }
        });
        
        // Track for cleanup
        this.sheepRunners.push(sheepContainer);
        
        // Play lance sound occasionally but with lower probability
        if (Math.random() > 0.9 && audioSystem) {
            audioSystem.playSfx('lance', { volume: 0.2 });
        }
        
        // Occasionally play sheep sound but with lower probability
        if (Math.random() > 0.9 && audioSystem) {
            audioSystem.playSfx('baa', { volume: 0.3 });
        }
    }
    
    createTitleBanner() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        // Create title banner
        const titlePanel = this.createWoodenPanel(w/2, 120, 600, 120);
        titlePanel.setDepth(10); // Ensure it's above sheep
        this.containerElements.push(titlePanel);
        
        // Add title text
        const titleText = this.add.text(0, -15, 'BaaLance', {
            fontSize: '64px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        titlePanel.add(titleText);
        
        // Add subtitle
        const subtitle = this.add.text(0, 30, "A Medieval Jousting Adventure", {
            fontSize: '24px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT_SECONDARY
        }).setOrigin(0.5);
        subtitle.setShadow(1, 1, '#000000', 2);
        titlePanel.add(subtitle);
        
        // Add decorative rope elements
        const ropeGraphics = this.add.graphics();
        ropeGraphics.lineStyle(6, 0x8B4513, 1);
        
        // Draw ropes hanging from the top of the screen to the banner
        const ropeStartY = 10;
        const ropeEndY = 60;
        const ropeLeftX = -180;
        const ropeRightX = 180;
        
        // Left rope
        ropeGraphics.beginPath();
        ropeGraphics.moveTo(ropeLeftX, -60);
        ropeGraphics.lineTo(ropeLeftX, -30);
        ropeGraphics.strokePath();
        
        // Right rope
        ropeGraphics.beginPath();
        ropeGraphics.moveTo(ropeRightX, -60);
        ropeGraphics.lineTo(ropeRightX, -30);
        ropeGraphics.strokePath();
        
        titlePanel.add(ropeGraphics);
    }
    
    createMainMenu() {
        const { width: w, height: h } = this.cameras.main;
        const { PANEL } = this.UI;
        
        // Create main menu panel - moved lower on the screen (75% down instead of center)
        // and removed the title, but moved UP from previous position
        const menuPanel = this.createWoodenPanel(w/2, h * 0.65, PANEL.WIDTH, PANEL.HEIGHT);
        menuPanel.setDepth(10); // Ensure it's above sheep
        this.containerElements.push(menuPanel);
        
        // Menu buttons
        const buttons = [
            { text: 'Enter Arena', callback: () => this.startGame() },
            { text: 'Settings', callback: () => this.toggleSettings() },
            { text: 'Credits', callback: () => this.toggleCredits() }
        ];
        
        // Calculate vertical positioning
        const buttonSpacing = PANEL.BUTTON_HEIGHT + PANEL.BUTTON_SPACING;
        const totalButtonHeight = buttons.length * buttonSpacing - PANEL.BUTTON_SPACING;
        const startY = -totalButtonHeight / 2 + PANEL.BUTTON_HEIGHT / 2;
        
        // Create menu buttons
        buttons.forEach((button, index) => {
            const buttonY = startY + (index * buttonSpacing);
            this.createWoodenButton(
                menuPanel, 
                0, 
                buttonY, 
                button.text, 
                PANEL.WIDTH - 60, 
                PANEL.BUTTON_HEIGHT, 
                button.callback
            );
        });
    }
    
    createSettingsPanel() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS, PANEL } = this.UI;
        
        // Create settings panel (initially hidden)
        this.settingsPanel = this.createWoodenPanel(w/2, h/2, PANEL.WIDTH, PANEL.HEIGHT, "SETTINGS");
        this.settingsPanel.setDepth(20); // Higher depth than other UI to be on top when visible
        this.settingsPanel.setVisible(false);
        this.containerElements.push(this.settingsPanel);
        
        // Add invisible blocker that prevents clicking on elements underneath
        const blocker = this.add.rectangle(0, 0, w * 2, h * 2, 0x000000, 0.01);
        blocker.setInteractive();
        this.settingsPanel.add(blocker);
        this.settingsPanel.sendToBack(blocker);
        
        // Add close button
        const closeButton = this.add.text(PANEL.WIDTH/2 - 40, -PANEL.HEIGHT/2 + 25, "✖", {
            fontSize: '24px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT
        }).setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => {
            this.toggleSettings();
        });
        this.settingsPanel.add(closeButton);
        
        // Music volume slider
        this.createVolumeControl(this.settingsPanel, -20, "Music Volume", (value) => {
            if (audioSystem) {
                audioSystem.setMusicVolume(value);
            }
        });
        
        // SFX volume slider
        this.createVolumeControl(this.settingsPanel, 80, "SFX Volume", (value) => {
            if (audioSystem) {
                audioSystem.setSfxVolume(value);
                // Play a test sound
                audioSystem.playClick();
            }
        });
    }
    
    createCreditsPanel() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS, PANEL } = this.UI;
        
        // Create credits panel (initially hidden)
        this.creditsPanel = this.createWoodenPanel(w/2, h/2, PANEL.WIDTH, PANEL.HEIGHT, "CREDITS");
        this.creditsPanel.setDepth(20); // Higher depth than other UI to be on top when visible
        this.creditsPanel.setVisible(false);
        this.containerElements.push(this.creditsPanel);
        
        // Add invisible blocker that prevents clicking on elements underneath
        const blocker = this.add.rectangle(0, 0, w * 2, h * 2, 0x000000, 0.01);
        blocker.setInteractive();
        this.creditsPanel.add(blocker);
        this.creditsPanel.sendToBack(blocker);
        
        // Add close button
        const closeButton = this.add.text(PANEL.WIDTH/2 - 40, -PANEL.HEIGHT/2 + 25, "✖", {
            fontSize: '24px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT
        }).setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => {
            this.toggleCredits();
        });
        this.creditsPanel.add(closeButton);
        
        // Add credit rows with simpler styling
        this.addCreditText(this.creditsPanel, -80, "Coding, Art, Sound, Design: JJ");
        this.addCreditText(this.creditsPanel, 0, "Design, QA: Cameron");
        this.addCreditText(this.creditsPanel, 80, "Music: FullCaliber");
        this.addCreditText(this.creditsPanel, 120, "https://soundcloud.com/fullcalliber", true);
    }
    
    addCreditText(container, yPos, text, isLink = false) {
        const { COLORS, FONTS } = this.UI;
        
        // Text style based on whether it's a link or not
        const textColor = isLink ? '#99ccff' : COLORS.TEXT;
        const fontSize = isLink ? '16px' : FONTS.SIZES.BODY;
        
        // Create text
        const creditText = this.add.text(0, yPos, text, {
            fontSize: fontSize,
            fontFamily: FONTS.FAMILY,
            color: textColor,
            align: 'center'
        }).setOrigin(0.5);
        
        container.add(creditText);
    }
    
    createVolumeControl(container, yPos, label, callback) {
        const { COLORS, FONTS } = this.UI;
        
        // Add label
        const titleText = this.add.text(0, yPos - 30, label, {
            fontSize: FONTS.SIZES.HEADER,
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT
        }).setOrigin(0.5);
        container.add(titleText);
        
        // Create slider background
        const sliderWidth = 200;
        const sliderHeight = 20;
        const sliderBg = this.add.rectangle(0, yPos, sliderWidth, sliderHeight, 0x333333, 1);
        sliderBg.setStrokeStyle(2, COLORS.METAL);
        container.add(sliderBg);
        
        // Get current volume from audioSystem
        let currentVolume = 0.5; // Default
        if (audioSystem) {
            currentVolume = label.includes("Music") ? audioSystem.settings.musicVolume : audioSystem.settings.sfxVolume;
        }
        
        // Create slider handle
        const handleWidth = 25;
        const handleHeight = 35;
        const handle = this.add.rectangle(
            -sliderWidth/2 + (sliderWidth * currentVolume), 
            yPos, 
            handleWidth, 
            handleHeight, 
            COLORS.WOOD_SECONDARY, 
            1
        );
        handle.setStrokeStyle(2, COLORS.WOOD_BORDER);
        container.add(handle);
        
        // Make handle interactive
        handle.setInteractive({ useHandCursor: true, draggable: true });
        
        // Handle drag
        handle.on('drag', (pointer, dragX) => {
            // Constrain to slider bounds
            const minX = -sliderWidth/2;
            const maxX = sliderWidth/2;
            const newX = Phaser.Math.Clamp(dragX, minX, maxX);
            
            // Update handle position
            handle.x = newX;
            
            // Calculate volume value (0-1)
            const value = (newX - minX) / sliderWidth;
            
            // Apply volume change
            callback(value);
        });
        
        // Add volume percentage text
        const percentText = this.add.text(sliderWidth/2 + 30, yPos, Math.round(currentVolume * 100) + "%", {
            fontSize: FONTS.SIZES.BODY,
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT_SECONDARY
        }).setOrigin(0, 0.5);
        container.add(percentText);
        
        // Update percentage text on drag
        handle.on('drag', () => {
            const value = (handle.x - (-sliderWidth/2)) / sliderWidth;
            percentText.setText(Math.round(value * 100) + "%");
        });
    }
    
    createWoodenPanel(x, y, width, height, titleText = null) {
        const { COLORS } = this.UI;
        
        // Create main container for panel
        const container = this.add.container(x, y);
        
        // Create panel background with wood texture
        const panel = this.add.rectangle(0, 0, width, height, COLORS.WOOD_PRIMARY, 1);
        panel.setStrokeStyle(6, COLORS.WOOD_BORDER);
        container.add(panel);
        
        // Add wood grain texture
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        // Create horizontal wood grain lines
        for (let i = -height/2 + 15; i < height/2; i += 20) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-width/2 + 10, i);
            
            for (let x = -width/2 + 30; x < width/2; x += 40) {
                const yOffset = Phaser.Math.Between(-5, 5);
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
            const plate = this.add.circle(pos.x, pos.y, 10, COLORS.METAL, 1);
            plate.setStrokeStyle(1, COLORS.METAL_DARK);
            container.add(plate);
            
            // Center nail/rivet
            const nail = this.add.circle(pos.x, pos.y, 4, 0x999999, 1);
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
            banner.setStrokeStyle(4, COLORS.WOOD_BORDER);
            container.add(banner);
            
            // Add title text
            const title = this.add.text(0, bannerY, titleText, {
                fontSize: '24px',
                fontFamily: this.UI.FONTS.FAMILY,
                color: COLORS.TEXT,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            title.setShadow(2, 2, '#000000', 3);
            container.add(title);
            
            // Add metal fixtures to banner
            const bannerCornerOffset = 20;
            const bannerCornerPositions = [
                {x: -bannerWidth/2 + bannerCornerOffset, y: bannerY},
                {x: bannerWidth/2 - bannerCornerOffset, y: bannerY}
            ];
            
            bannerCornerPositions.forEach(pos => {
                const plateSmall = this.add.circle(pos.x, pos.y, 6, COLORS.METAL, 1);
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
        buttonBg.setStrokeStyle(4, COLORS.WOOD_BORDER);
        buttonContainer.add(buttonBg);
        
        // Add wood grain texture
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
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
            fontSize: '24px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add shadow to text
        buttonText.setShadow(2, 2, '#000000', 3);
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
            buttonBg.setFillStyle(COLORS.BUTTON_ACTIVE);
            
            // Play click sound
            if (audioSystem) audioSystem.playClick();
            
            // Call the callback
            if (callback) callback();
            
            // Reset button appearance after a short delay
            this.time.delayedCall(100, () => {
                buttonBg.setFillStyle(COLORS.BUTTON_BG);
            });
        });
        
        container.add(buttonContainer);
        return buttonContainer;
    }
    
    // Button callbacks
    startGame() {
        // Play sounds
        if (audioSystem) {
            audioSystem.playClick();
            audioSystem.playSfx('baa');
            audioSystem.fadeOutAllSounds(300);
        }
        
        this.scene.start('MainLoop');
    }
    
    toggleSettings() {
        // Hide credits panel if visible
        if (this.creditsVisible) {
            this.creditsVisible = false;
            this.creditsPanel.setVisible(false);
        }
        
        // Toggle settings panel
        this.settingsVisible = !this.settingsVisible;
        this.settingsPanel.setVisible(this.settingsVisible);
    }
    
    toggleCredits() {
        // Hide settings panel if visible
        if (this.settingsVisible) {
            this.settingsVisible = false;
            this.settingsPanel.setVisible(false);
        }
        
        // Toggle credits panel
        this.creditsVisible = !this.creditsVisible;
        this.creditsPanel.setVisible(this.creditsVisible);
    }
    
    showCredits() {
        // Changed to use toggleCredits instead
        if (audioSystem) audioSystem.playClick();
        this.toggleCredits();
    }
    
    shutdown() {
        // Stop spawning sheep
        if (this.sheepSpawnTimer) {
            this.sheepSpawnTimer.remove();
        }
        
        // Clean up all sheep runners
        this.sheepRunners.forEach(sheep => {
            if (sheep) sheep.destroy();
        });
        this.sheepRunners = [];
        
        // Clean up weapon system
        if (this.weaponSystem) {
            this.weaponSystem.destroy();
        }
        
        // Clean up all containers
        this.containerElements.forEach(element => {
            if (element) element.destroy();
        });
        
        // Clean up debug menu
        if (this.debugMenu) {
            this.debugMenu.destroy();
            this.debugMenu = null;
        }
    }
} 