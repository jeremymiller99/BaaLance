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
            
            // Play click sound if available
            // this.sound.play('click');
            
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
            { text: 'Career Mode', callback: () => this.startCareerMode() },
            { text: 'Tournament', callback: () => this.startTournament() },
            { text: 'Shop', callback: () => this.openShop() }
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
        // Get player data
        const playerData = playerState.getState();
        
        // Clear any existing dialog
        if (this.quickMatchDialog) {
            this.quickMatchDialog.destroy();
            this.quickMatchDialog = null;
        }
        
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        // Create medieval style dialog container
        this.quickMatchDialog = this.add.container(w/2, h/2);
        
        // Add darkened overlay with medieval texture
        const overlay = this.add.rectangle(0, 0, w, h, 0x2a1a0a, 0.7);
        overlay.setOrigin(0.5);
        overlay.setInteractive(); // Make overlay capture input events to prevent clicking through
        this.quickMatchDialog.add(overlay);
        
        // Create wooden panel for the dialog
        const dialogWidth = 450;
        const dialogHeight = 500;
        
        // Create the wooden background
        const woodPanel = this.add.rectangle(0, 0, dialogWidth, dialogHeight, COLORS.WOOD_SECONDARY, 1);
        woodPanel.setStrokeStyle(8, COLORS.WOOD_BORDER);
        this.quickMatchDialog.add(woodPanel);
        
        // Add wood grain texture
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.4);
        
        // Horizontal wood grain lines
        for (let i = -dialogHeight/2 + 20; i < dialogHeight/2; i += 20) {
            // Make lines wavy
            grainGraphics.beginPath();
            grainGraphics.moveTo(-dialogWidth/2 + 10, i);
            
            for (let x = -dialogWidth/2 + 30; x < dialogWidth/2; x += 20) {
                const yOffset = Phaser.Math.Between(-3, 3);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        this.quickMatchDialog.add(grainGraphics);
        
        // Add decorative nails/metal fixtures in the corners
        const cornerOffset = 30;
        const cornerPositions = [
            {x: -dialogWidth/2 + cornerOffset, y: -dialogHeight/2 + cornerOffset},
            {x: dialogWidth/2 - cornerOffset, y: -dialogHeight/2 + cornerOffset},
            {x: -dialogWidth/2 + cornerOffset, y: dialogHeight/2 - cornerOffset},
            {x: dialogWidth/2 - cornerOffset, y: dialogHeight/2 - cornerOffset}
        ];
        
        cornerPositions.forEach(pos => {
            // Metal plate
            const plate = this.add.rectangle(pos.x, pos.y, 30, 30, COLORS.METAL, 1);
            plate.setStrokeStyle(1, COLORS.METAL_DARK);
            this.quickMatchDialog.add(plate);
            
            // Center nail/rivet
            const nail = this.add.circle(pos.x, pos.y, 6, 0x999999, 1);
            nail.setStrokeStyle(1, 0x777777);
            this.quickMatchDialog.add(nail);
            
            // Add shadow to nail
            const nailShadow = this.add.circle(pos.x + 1, pos.y + 1, 6, 0x000000, 0.3);
            this.quickMatchDialog.add(nailShadow);
        });
        
        // Create title banner
        const titleWidth = dialogWidth * 0.8;
        const titleHeight = 60;
        const titleBg = this.add.rectangle(0, -dialogHeight/2 + 40, titleWidth, titleHeight, COLORS.WOOD_PRIMARY, 1);
        titleBg.setStrokeStyle(4, COLORS.WOOD_BORDER);
        this.quickMatchDialog.add(titleBg);
        
        // Add wood grain to title banner
        const titleGrainGraphics = this.add.graphics();
        titleGrainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        for (let i = -titleHeight/2 + 5; i < titleHeight/2; i += 8) {
            titleGrainGraphics.beginPath();
            titleGrainGraphics.moveTo(-titleWidth/2 + 5, -dialogHeight/2 + 40 + i);
            
            for (let x = -titleWidth/2 + 10; x < titleWidth/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                titleGrainGraphics.lineTo(x, -dialogHeight/2 + 40 + i + yOffset);
            }
            
            titleGrainGraphics.strokePath();
        }
        this.quickMatchDialog.add(titleGrainGraphics);
        
        // Add title text
        const titleText = this.add.text(0, -dialogHeight/2 + 40, 'Quick Match', {
            fontSize: '28px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        titleText.setShadow(2, 2, '#000000', 3);
        this.quickMatchDialog.add(titleText);
        
        // Create league buttons with medieval styling
        const leagues = [
            { id: 'rookie', name: 'Rookie League', color: '#66ff66', description: 'For new jousters' },
            { id: 'amateur', name: 'Amateur League', color: '#ffaa00', description: 'Experienced competitors' },
            { id: 'pro', name: 'Pro League', color: '#ff6666', description: 'Elite champions' }
        ];
        
        // Check which leagues are unlocked
        const unlockedLeagues = playerState.getUnlockedLeagues();
        
        leagues.forEach((league, index) => {
            const isUnlocked = unlockedLeagues.includes(league.id);
            const yPos = -80 + (index * 120);
            
            // Create medieval scroll/banner for each league
            const leaguePanel = this.add.container(0, yPos);
            this.quickMatchDialog.add(leaguePanel);
            
            // League banner
            let bannerColor = isUnlocked ? 
                (league.id === 'rookie' ? 0x006600 : 
                 league.id === 'amateur' ? 0x885500 : 0x660000) : 
                0x333333;
            
            const leagueBanner = this.add.rectangle(0, 0, 350, 80, bannerColor, 0.9);
            leagueBanner.setStrokeStyle(3, isUnlocked ? 0xd4af37 : 0x555555);
            leaguePanel.add(leagueBanner);
            
            // Add wood grain texture if unlocked
            if (isUnlocked) {
                const leagueGrain = this.add.graphics();
                leagueGrain.lineStyle(1, 0x000000, 0.2);
                
                for (let i = -40 + 5; i < 40; i += 10) {
                    leagueGrain.beginPath();
                    leagueGrain.moveTo(-175 + 5, i);
                    
                    for (let x = -175 + 10; x < 175; x += 15) {
                        const yOffset = Phaser.Math.Between(-1, 1);
                        leagueGrain.lineTo(x, i + yOffset);
                    }
                    
                    leagueGrain.strokePath();
                }
                leaguePanel.add(leagueGrain);
            }
            
            // Add league name with medieval styling
            const leagueText = this.add.text(0, -15, league.name, {
                fontSize: '26px',
                fontFamily: FONTS.FAMILY,
                color: isUnlocked ? COLORS.TEXT : '#888888',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            if (isUnlocked) {
                leagueText.setShadow(2, 2, '#000000', 3);
            }
            
            leaguePanel.add(leagueText);
            
            // Add league description
            const descText = this.add.text(0, 15, league.description, {
                fontSize: '18px',
                fontFamily: FONTS.FAMILY,
                color: isUnlocked ? COLORS.TEXT_SECONDARY : '#666666'
            }).setOrigin(0.5);
            leaguePanel.add(descText);
            
            // Add lock icon for locked leagues
            if (!isUnlocked) {
                const lockContainer = this.add.container(120, 0);
                
                // Metal plate behind lock
                const lockPlate = this.add.circle(0, 0, 22, 0x696969, 1);
                lockPlate.setStrokeStyle(1, 0x444444);
                lockContainer.add(lockPlate);
                
                // Lock symbol
                const lockText = this.add.text(0, 0, '🔒', {
                    fontSize: '28px',
                    fontFamily: FONTS.FAMILY
                }).setOrigin(0.5);
                lockContainer.add(lockText);
                
                leaguePanel.add(lockContainer);
            }
            
            // Make button interactive if unlocked
            if (isUnlocked) {
                leagueBanner.setInteractive({ useHandCursor: true });
                
                // Add hover effects
                leagueBanner.on('pointerover', () => {
                    leagueBanner.setScale(1.05);
                    leagueText.setScale(1.05);
                    descText.setScale(1.05);
                });
                
                leagueBanner.on('pointerout', () => {
                    leagueBanner.setScale(1);
                    leagueText.setScale(1);
                    descText.setScale(1);
                });
                
                // Add click handler
                leagueBanner.on('pointerdown', () => {
                    const opponentScore = Phaser.Math.Between(5, 15);
                    
                    // Start the lance game with selected league
                    this.scene.start('LanceGame', {
                        opponentScore: opponentScore,
                        matchType: 'quick',
                        opponentLeague: league.id,
                        currentSkin: playerData.currentSkin
                    });
                    
                    // Destroy dialog
                    this.quickMatchDialog.destroy();
                    this.quickMatchDialog = null;
                });
            }
        });
        
        // Add wooden cancel button at bottom
        const cancelButtonWidth = 200;
        const cancelButtonHeight = 50;
        const cancelY = dialogHeight/2 - 40;
        
        // Wooden cancel button
        const cancelButton = this.add.rectangle(0, cancelY, cancelButtonWidth, cancelButtonHeight, COLORS.WOOD_PRIMARY, 1);
        cancelButton.setStrokeStyle(4, COLORS.WOOD_BORDER);
        this.quickMatchDialog.add(cancelButton);
        
        // Add wood grain to cancel button
        const cancelGrain = this.add.graphics();
        cancelGrain.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        for (let i = -cancelButtonHeight/2 + 5; i < cancelButtonHeight/2; i += 8) {
            cancelGrain.beginPath();
            cancelGrain.moveTo(-cancelButtonWidth/2 + 5, cancelY + i);
            
            for (let x = -cancelButtonWidth/2 + 10; x < cancelButtonWidth/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                cancelGrain.lineTo(x, cancelY + i + yOffset);
            }
            
            cancelGrain.strokePath();
        }
        this.quickMatchDialog.add(cancelGrain);
        
        // Add cancel text
        const cancelText = this.add.text(0, cancelY, 'RETURN', {
            fontSize: '24px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        cancelText.setShadow(2, 2, '#000000', 3);
        this.quickMatchDialog.add(cancelText);
        
        // Make cancel button interactive
        cancelButton.setInteractive({ useHandCursor: true });
        
        // Add hover effects
        cancelButton.on('pointerover', () => {
            cancelButton.setFillStyle(COLORS.BUTTON_HOVER);
            cancelButton.setScale(1.05);
            cancelText.setScale(1.05);
        });
        
        cancelButton.on('pointerout', () => {
            cancelButton.setFillStyle(COLORS.WOOD_PRIMARY);
            cancelButton.setScale(1);
            cancelText.setScale(1);
        });
        
        // Add click handler
        cancelButton.on('pointerdown', () => {
            this.quickMatchDialog.destroy();
            this.quickMatchDialog = null;
        });
    }

    startTournament() {
        // TODO: Implement tournament mode
        console.log('Tournament mode coming soon!');
    }

    openShop() {
        // TODO: Implement shop
        console.log('Shop coming soon!');
    }

    startCareerMode() {
        this.scene.start('CareerScene');
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
            { text: "CAREER MODE", icon: "👑", desc: "Start your jousting career", action: () => this.startCareerMode() },
            { text: "ARMORY", icon: "🛡️", desc: "View and equip your gear", action: () => this.openArmory() },
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
} 