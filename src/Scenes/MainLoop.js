class MainLoop extends Phaser.Scene {
    constructor() {
        super({ key: 'MainLoop' });
        
        // UI Constants updated with medieval theme
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
                WIDTH: 350, // Reduced from 380 for better fit
                HEIGHT: 420, // Reduced from 460 for better fit 
                PADDING: 20,
                BUTTON_HEIGHT: 60, // Adjusted from 70
                BUTTON_SPACING: 25 // Adjusted from 30
            }
        };
        
        // Track created containers for proper cleanup
        this.containerElements = [];
        
        // Debug menu
        this.debugMenu = null;
    }

    init(data) {
        // Reset all UI references
        this.statsTexts = [];
        this.statsPanel = null;
        this.background = null;
        this.previewElements = [];
        this.menuPanel = null;
        this.menuButtons = [];
        this.skinSystem = null;
        this.containerElements = [];
    }

    create() {
        // Get game dimensions
        const { width: w, height: h } = this.cameras.main;
        
        // Create background
        this.createBackground();
        
        // Initialize skin system
        this.skinSystem = new SkinSystem(this);
        this.skinSystem.loadSkinState(playerState.getState());
        
        // Create all UI elements
        this.createStatsBoard();
        this.createPlayerAvatar();
        this.createMainMenuBoard();
        
        // Apply any pending stats update
        const pendingUpdate = playerState.getPendingStatsUpdate();
        if (pendingUpdate) {
            this.createStatsBoard(); // Refresh stats
        }
        
        // Initialize debug menu
        this.debugMenu = new DebugMenu(this);
        this.debugMenu.create();
    }

    createBackground() {
        const { width: w, height: h } = this.cameras.main;
        
        // Set background image
        this.background = this.add.image(0, 0, 'bg');
        this.background.setOrigin(0, 0);
        const scale = Math.max(w / this.background.width, h / this.background.height);
        this.background.setScale(scale);
        
        // Add semi-transparent overlay for better contrast with UI
        this.overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.3);
        this.overlay.setOrigin(0, 0);
    }
    
    createWoodenPanel(x, y, width, height, titleText = null) {
        const { COLORS, FONTS } = this.UI;
        
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
                fontFamily: FONTS.FAMILY,
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
    
    // Helper function to create a medieval wooden button
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

    createStatsBoard() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        const playerData = playerState.getState();
        
        // Clear existing stats elements if they exist
        if (this.statsPanel) {
            this.statsPanel.destroy();
        }
        
        // Clear existing stats text elements
        if (this.statsTexts && this.statsTexts.length > 0) {
            this.statsTexts.forEach(text => {
                if (text && text.destroy) {
                    text.destroy();
                }
            });
            this.statsTexts = [];
        }
        
        // Get player rank data
        const rankData = playerState.getRank();
        playerState.updateRankAndLeagues();
        
        // Create a wooden board for stats - moved down from 90 to 110
        this.statsPanel = this.createWoodenPanel(w/2, 110, w * 0.75, 150, "ROYAL RECORDS");
        
        // Get the stats container reference
        const statsContainer = this.statsPanel;
        
        // Create stats display
        const spacing = 180;
        const stats = [
            { label: "TREASURY", value: `$${playerData.money}` },
            { label: "VICTORIES", value: `${playerData.stats.wins}` },
            { label: "DEFEATS", value: `${playerData.stats.losses}` },
            { label: "RANK", value: `${rankData.name}` }
        ];

        // Add stats with medieval styling
        stats.forEach((stat, index) => {
            const xPos = -270 + (spacing * index);
            const yPos = 15;
            
            // Create label
            const labelText = this.add.text(xPos, yPos - 25, stat.label, {
                fontSize: '14px',
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT_SECONDARY,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            statsContainer.add(labelText);
            
            // Create value with gold text and shadow - use yellow for rank value
            const isRank = stat.label === "RANK";
            const valueText = this.add.text(xPos, yPos + 5, stat.value, {
                fontSize: '22px',
                fontFamily: FONTS.FAMILY,
                color: isRank ? '#ffff00' : COLORS.TEXT, // Yellow for rank
                fontStyle: 'bold'
            }).setOrigin(0.5);
            valueText.setShadow(2, 2, '#000000', 3);
            statsContainer.add(valueText);
            
            this.statsTexts.push(labelText, valueText);
            
            // Add progress meter for rank
            if (isRank && rankData.nextRank) {
                // Create background meter (empty)
                const meterBg = this.add.rectangle(xPos, yPos + 35, 120, 8, 0x333333, 1);
                meterBg.setStrokeStyle(1, 0x000000);
                statsContainer.add(meterBg);
                
                // Calculate filled width based on progress
                const filledWidth = Math.max(1, (rankData.progress / 100) * 120);
                
                // Create filled part of meter
                const meterFill = this.add.rectangle(
                    xPos - 60 + (filledWidth / 2), 
                    yPos + 35, 
                    filledWidth, 
                    8, 
                    0xffff00, // Yellow fill
                    1
                );
                meterFill.setOrigin(0.5, 0.5); // Center origin
                statsContainer.add(meterFill);
                
                // Add small text with next rank name
                if (rankData.nextRank) {
                    const nextRankText = this.add.text(xPos + 65, yPos + 35, rankData.nextRank, {
                        fontSize: '10px',
                        fontFamily: FONTS.FAMILY,
                        color: COLORS.TEXT_SECONDARY
                    }).setOrigin(0, 0.5);
                    statsContainer.add(nextRankText);
                    this.statsTexts.push(nextRankText);
                }
                
                this.statsTexts.push(meterBg, meterFill);
            }
        });
    }

    createPlayerAvatar() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, PANEL } = this.UI;
        const playerData = playerState.getState();
        
        // Clear existing preview elements if they exist
        if (this.previewElements && this.previewElements.length > 0) {
            this.previewElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.previewElements = [];
        }
        
        // Calculate positions for three evenly spaced panels across the screen
        const panelWidth = (PANEL.WIDTH * 0.85); // Slightly smaller panels
        const totalWidth = w;
        const panelSpacing = (totalWidth - (panelWidth * 3)) / 4; // Space between panels and edges
        
        // Calculate panel X positions
        const leftPanelX = panelSpacing + (panelWidth / 2);
        const middlePanelX = w / 2;
        const rightPanelX = w - panelSpacing - (panelWidth / 2);
        const panelY = h * 0.62;
        
        // Create champion panel (left)
        const championPanel = this.createWoodenPanel(leftPanelX, panelY, panelWidth, PANEL.HEIGHT, "BAA");
        
        // Create lance panel (middle)
        const lancePanel = this.createWoodenPanel(middlePanelX, panelY, panelWidth, PANEL.HEIGHT, "LANCE");
        
        // Create menu panel (right) - replacing the createMainMenuBoard call
        const menuPanel = this.createWoodenPanel(rightPanelX, panelY, panelWidth, PANEL.HEIGHT, "MENU");
        
        // Make BAA panel interactive and play baa sound when clicked
        const baaClickArea = this.add.rectangle(0, 0, panelWidth, PANEL.HEIGHT, 0xffffff, 0.001);
        baaClickArea.setInteractive({ useHandCursor: true });
        baaClickArea.on('pointerdown', () => {
            if (audioSystem) {
                audioSystem.playSfx('baa');
            }
            
            // Add visual feedback
            this.createClickFeedback(championPanel);
            
            // Make the sheep sprite bounce
            this.tweens.add({
                targets: playerSprite,
                y: -20, 
                duration: 150, 
                yoyo: true, 
                ease: 'Sine.easeOut'
            });
        });
        championPanel.add(baaClickArea);
        
        // Make LANCE panel interactive and play lance sound when clicked
        const lanceClickArea = this.add.rectangle(0, 0, panelWidth, PANEL.HEIGHT, 0xffffff, 0.001);
        lanceClickArea.setInteractive({ useHandCursor: true });
        lanceClickArea.on('pointerdown', () => {
            if (audioSystem) {
                audioSystem.playSfx('lance');
            }
            
            // Add visual feedback
            this.createClickFeedback(lancePanel);
            
            // Make the lance rotate slightly
            this.tweens.add({
                targets: lanceSprite,
                rotation: -Math.PI/2 - 0.2,
                duration: 100,
                yoyo: true,
                ease: 'Sine.easeOut'
            });
        });
        lancePanel.add(lanceClickArea);
        
        // Create player container inside the champion panel
        const playerContainer = this.add.container(0, 15);
        championPanel.add(playerContainer);
        
        // Create player sprite
        const skinKey = this.skinSystem.getSkinTextureKey(playerData.currentSkin);
        const playerSprite = this.add.sprite(0, 0, skinKey);
        playerSprite.setScale(0.7);
        playerContainer.add(playerSprite);
        
        // Initialize weapon system for reference
        this.weaponSystem = new WeaponSystem(this);
        
        // Get lance type
        const lanceType = playerData.equipment.currentLance;
        
        // Add a lance sprite directly - no background decoration
        const lanceSprite = this.add.sprite(0, -20, lanceType);
        lanceSprite.setScale(0.45);
        lanceSprite.setRotation(-Math.PI/2); // Rotate 90 degrees to make it vertical
        lancePanel.add(lanceSprite);
        
        // Add lance name
        const lanceNames = {
            'lance_0': 'Novice Lance',
            'lance_1': 'Knight Lance',
            'lance_2': 'Royal Lance'
        };
        const lanceName = lanceNames[lanceType] || lanceType;
        
        // Add lance info in lance panel
        const lanceTitle = this.add.text(0, 100, lanceName, {
            fontSize: '20px',
            fontFamily: this.UI.FONTS.FAMILY,
            color: this.UI.COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        lanceTitle.setShadow(2, 2, '#000000', 3);
        lancePanel.add(lanceTitle);
        
        // Add lance stats
        const lanceStats = {
            'lance_0': { power: 2, weight: 1, range: 3 },
            'lance_1': { power: 3, weight: 2, range: 4 },
            'lance_2': { power: 5, weight: 3, range: 5 }
        };
        
        const currentLanceStats = lanceStats[lanceType] || { power: 1, weight: 1, range: 1 };
        
        // Add stat labels and values
        const statY = 135;
        const statSpacing = 30;
        const stats = [
            { label: "POWER", value: currentLanceStats.power },
            { label: "WEIGHT", value: currentLanceStats.weight },
            { label: "RANGE", value: currentLanceStats.range }
        ];
        
        stats.forEach((stat, index) => {
            const yPos = statY + (index * statSpacing);
            
            // Label
            const statLabel = this.add.text(-50, yPos, stat.label + ":", {
                fontSize: '14px',
                fontFamily: this.UI.FONTS.FAMILY,
                color: this.UI.COLORS.TEXT_SECONDARY,
            }).setOrigin(0, 0.5);
            lancePanel.add(statLabel);
            
            // Value with stars
            let stars = "";
            for (let i = 0; i < stat.value; i++) {
                stars += "★";
            }
            
            const statValue = this.add.text(10, yPos, stars, {
                fontSize: '14px',
                fontFamily: this.UI.FONTS.FAMILY,
                color: this.UI.COLORS.TEXT,
            }).setOrigin(0, 0.5);
            lancePanel.add(statValue);
        });
        
        // Add menu buttons to the menu panel
        this.createMenuButtons(menuPanel);
        
        // Store references for cleanup
        this.previewElements = [championPanel, lancePanel, menuPanel];
        this.menuPanel = menuPanel; // Store reference to the menu panel
    }
    
    // Helper method to create menu buttons
    createMenuButtons(panel) {
        const { COLORS, FONTS, PANEL } = this.UI;
        
        // Create menu buttons
        const buttons = [
            { text: 'Quick Match', callback: () => this.startQuickMatch() },
            { text: 'Bounty', callback: () => this.startCareerMode() },
            { text: 'Shop', callback: () => this.openShop() },
            { text: 'Main Menu', callback: () => this.returnToMainMenu() }
        ];
        
        // Store menu button references for cleanup
        if (!this.menuButtons) {
            this.menuButtons = [];
        } else {
            this.menuButtons.forEach(button => {
                if (button && button.destroy) {
                    button.destroy();
                }
            });
            this.menuButtons = [];
        }

        // Calculate vertical positioning
        const buttonSpacing = PANEL.BUTTON_HEIGHT + PANEL.BUTTON_SPACING;
        const totalButtonHeight = buttons.length * buttonSpacing - PANEL.BUTTON_SPACING;
        const startY = -totalButtonHeight / 2 + PANEL.BUTTON_HEIGHT / 2;

        buttons.forEach((button, index) => {
            const buttonY = startY + (index * buttonSpacing);
            const buttonContainer = this.createWoodenButton(
                panel, 
                0, 
                buttonY, 
                button.text, 
                PANEL.WIDTH - 60, // Slightly narrower than before 
                PANEL.BUTTON_HEIGHT, 
                button.callback
            );
            // Store the button reference
            this.menuButtons.push(buttonContainer);
        });
    }
    
    // This method won't be used directly anymore, as we're integrating the menu into the three-panel layout
    createMainMenuBoard() {
        // Redirecting to createPlayerAvatar() which now handles all three panels
        this.createPlayerAvatar();
    }

    startQuickMatch() {
        // Play click sound
        if (audioSystem) {
            audioSystem.playClick();
        }
        
        // Create a submenu for opponent selection
        this.showQuickMatchMenu();
    }

    showQuickMatchMenu() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS, PANEL } = this.UI;
        
        // Create an overlay to darken the background
        const overlay = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7);
        overlay.setDepth(100);
        
        // Create a panel for the quick match menu
        const menuPanel = this.add.container(w/2, h/2);
        menuPanel.setDepth(101);
        
        // Create wooden panel background
        const panel = this.createWoodenPanel(0, 0, 500, 400, "SELECT OPPONENT");
        menuPanel.add(panel);
        
        // Initialize enemy system to get league data
        const enemySystem = new EnemySystem(this);
        
        // Get available leagues
        const leagues = enemySystem.getLeagues();
        const unlockedLeagues = playerState.getUnlockedLeagues();
        
        // Create league selection buttons
        let buttonY = -120;
        const buttonSpacing = 90;
        
        Object.keys(leagues).forEach(leagueId => {
            const league = leagues[leagueId];
            const isUnlocked = unlockedLeagues.includes(leagueId);
            
            // Create league button
            const buttonWidth = 350;
            const buttonHeight = 70;
            const buttonContainer = this.createWoodenButton(
                panel,
                0,
                buttonY,
                league.name,
                buttonWidth,
                buttonHeight,
                () => {
                    if (isUnlocked) {
                        this.startLanceGameWithLeague(leagueId);
                        
                        // Clean up menu
                        menuPanel.destroy();
                        overlay.destroy();
                    } else {
                        // Show locked message
                        const errorText = this.add.text(0, 150, "This league is locked! Win more matches to unlock.", {
                            fontSize: '20px',
                            fontFamily: FONTS.FAMILY,
                            color: '#ff0000',
                            stroke: '#000000',
                            strokeThickness: 2
                        }).setOrigin(0.5);
                        panel.add(errorText);
                        
                        // Remove error message after 2 seconds
                        this.time.delayedCall(2000, () => {
                            errorText.destroy();
                        });
                    }
                }
            );
            
            // Add icon based on unlock status
            const icon = isUnlocked ? "🏆" : "🔒";
            const iconText = this.add.text(-buttonWidth/2 + 30, 0, icon, {
                fontSize: '24px',
                fontFamily: FONTS.FAMILY
            }).setOrigin(0.5);
            buttonContainer.add(iconText);
            
            // Add description
            const descText = this.add.text(0, buttonHeight/2 + 10, 
                isUnlocked ? `Compete against ${league.name.toLowerCase()} opponents` : "Win more matches to unlock",
                {
                    fontSize: '14px',
                    fontFamily: FONTS.FAMILY,
                    color: isUnlocked ? COLORS.TEXT_SECONDARY : '#ff6666',
                }
            ).setOrigin(0.5);
            buttonContainer.add(descText);
            
            // Dim the button if locked
            if (!isUnlocked) {
                buttonContainer.setAlpha(0.7);
            }
            
            buttonY += buttonSpacing;
        });
        
        // Add back button
        const backButton = this.createWoodenButton(
            panel,
            0,
            buttonY,
            "BACK",
            200,
            50,
            () => {
                // Play click sound
                if (audioSystem) {
                    audioSystem.playClick();
                }
                
                // Clean up menu
                menuPanel.destroy();
                overlay.destroy();
            }
        );
    }
    
    startLanceGameWithLeague(leagueId) {
        // Fade out any current sounds
        if (audioSystem) {
            audioSystem.fadeOutAllSounds(300);
        }
        
        // Set mode and start lance game
        this.scene.start('LanceGame', {
            matchType: 'quick',
            currentSkin: playerState.getState().currentSkin,
            opponentLeague: leagueId
        });
    }

    returnToMainMenu() {
        // Play click sound
        if (audioSystem) {
            audioSystem.playClick();
        }
        
        // Return to main menu scene
        this.scene.start('MainMenu');
    }

    openShop() {
        this.scene.start('ShopScene');
    }

    startCareerMode() {
        this.scene.start('CareerScene');
    }
    
    openOptions() {
        // Play click sound
        if (audioSystem) {
            audioSystem.playClick();
        }
        
        console.log('Options menu coming soon!');
        // TODO: Implement options menu in future update
    }

    // This method is now called from OutcomeScene through the global playerState
    updatePlayerStats(score, won) {
        playerState.updateStats(score, won);
        
        // If scene is not ready, return early
        if (!this.cameras || !this.cameras.main) {
            return;
        }

        // Clear and recreate the stats panel with updated values
        this.createStatsBoard();
    }

    shutdown() {
        // Clean up all references
        this.statsTexts = [];
        this.statsPanel = null;
        this.background = null;
        this.previewElements = [];
        this.menuPanel = null;
        this.menuButtons = [];
        this.skinSystem = null;
        this.containerElements.forEach(container => container.destroy());
        this.containerElements = [];
        
        // Clean up debug menu
        if (this.debugMenu) {
            this.debugMenu.destroy();
            this.debugMenu = null;
        }
    }

    createTitleAndMenus() {
        const { COLORS, FONTS } = this.UI;
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Create title banner at the top
        const titlePanel = this.createWoodenPanel(centerX, 100, 600, 120, "BaaLance");
        this.containerElements.push(titlePanel);
        
        // Add decorative rope elements to title
        const ropeGraphics = this.add.graphics();
        ropeGraphics.lineStyle(6, 0x8B4513, 1);
        
        // Draw two ropes hanging from the top of the screen to the banner
        const ropeStartY = 10;
        const ropeEndY = 60;
        const ropeLeftX = centerX - 150;
        const ropeRightX = centerX + 150;
        
        // Left rope
        ropeGraphics.beginPath();
        ropeGraphics.moveTo(ropeLeftX, ropeStartY);
        ropeGraphics.lineTo(ropeLeftX, ropeEndY);
        ropeGraphics.strokePath();
        
        // Right rope
        ropeGraphics.beginPath();
        ropeGraphics.moveTo(ropeRightX, ropeStartY);
        ropeGraphics.lineTo(ropeRightX, ropeEndY);
        ropeGraphics.strokePath();
        
        titlePanel.add(ropeGraphics);
        
        // Add subtitle
        const subtitle = this.add.text(0, 30, "A Medieval Balance Game", {
            fontSize: '18px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT_SECONDARY
        }).setOrigin(0.5);
        subtitle.setShadow(1, 1, '#000000', 2);
        titlePanel.add(subtitle);
        
        // Create main menu
        this.createMenu();
        
        // Add version text at the bottom
        const versionText = this.add.text(
            centerX,
            this.cameras.main.height - 20,
            "Version 1.0",
            {
                fontSize: '16px',
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT_SECONDARY
            }
        ).setOrigin(0.5);
        this.containerElements.push(versionText);
    }

    createMenu() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS, PANEL } = this.UI;
        
        // Position for menu in right side of screen - moved down to 0.62
        const menuX = w * 0.75;
        const menuY = h * 0.62;
        
        // Create wooden panel for the menu
        this.menuPanel = this.createWoodenPanel(menuX, menuY, PANEL.WIDTH, PANEL.HEIGHT, "COMMANDS");
        
        // Menu items with icons and descriptions
        const menuItems = [
            { text: "QUICK MATCH", icon: "⚔️", desc: "Battle against a random opponent", action: () => this.startQuickMatch() },
            { text: "BOUNTY", icon: "👑", desc: "Start your jousting career", action: () => this.startCareerMode() },
            { text: "SHOP", icon: "🛡️", desc: "Buy and equip gear", action: () => this.openShop() },
            { text: "OPTIONS", icon: "⚙️", desc: "Adjust game settings", action: () => this.openOptions() }
        ];
        
        // Calculate proper vertical spacing
        const buttonSpacing = 75;
        const totalButtonsHeight = menuItems.length * buttonSpacing - buttonSpacing/2;
        const startY = -totalButtonsHeight/2 + buttonSpacing/2;
        
        // Create wooden buttons for menu items
        this.menuButtons = [];
        
        menuItems.forEach((item, index) => {
            // Position for this button
            const yPos = startY + (index * buttonSpacing);
            
            // Create wooden button using helper function
            const buttonWidth = 280;
            const buttonHeight = 50;
            const buttonContainer = this.createWoodenButton(
                this.menuPanel,
                0,
                yPos,
                item.text,
                buttonWidth,
                buttonHeight,
                item.action
            );
            
            // Add icon to the left of the button
            const iconText = this.add.text(-buttonWidth/2 + 30, 0, item.icon, {
                fontSize: '22px',
                fontFamily: FONTS.FAMILY
            }).setOrigin(0.5);
            buttonContainer.add(iconText);
            
            // Add description under button
            const descText = this.add.text(0, buttonHeight/2 + 10, item.desc, {
                fontSize: '14px',
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT_SECONDARY,
            }).setOrigin(0.5);
            buttonContainer.add(descText);
            
            // Store button reference
            this.menuButtons.push(buttonContainer);
        });
        
        // Add version text at bottom
        const versionText = this.add.text(0, 170, "Version 1.0", {
            fontSize: '14px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT_SECONDARY
        }).setOrigin(0.5);
        this.menuPanel.add(versionText);
    }

    createClickFeedback(panel) {
        // Create a flash effect that fades out
        const flash = this.add.rectangle(0, 0, panel.width, panel.height, 0xffffff, 0.5);
        panel.add(flash);
        
        // Animate the flash to fade out
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Create a simple particle effect with circles
        const particleCount = 10;
        const particleObjects = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within panel
            const x = Phaser.Math.Between(-panel.width/2 + 20, panel.width/2 - 20);
            const y = Phaser.Math.Between(-panel.height/2 + 20, panel.height/2 - 20);
            
            // Create circle with random color
            const colors = [0xffffff, 0xffff00, 0xff8800];
            const color = Phaser.Utils.Array.GetRandom(colors);
            const size = Phaser.Math.Between(3, 8);
            
            const particle = this.add.circle(x, y, size, color, 0.8);
            panel.add(particle);
            particleObjects.push(particle);
            
            // Animate each particle
            this.tweens.add({
                targets: particle,
                x: x + Phaser.Math.Between(-40, 40),
                y: y + Phaser.Math.Between(-40, 40),
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(300, 600),
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
} 