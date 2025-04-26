class CareerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CareerScene' });
        
        // UI Constants
        this.UI = {
            COLORS: {
                BACKGROUND: 0x000000,
                BACKGROUND_ALPHA: 0.7,
                TEXT: '#ffffff',
                BUTTON_BG: '#444444',
                BUTTON_HOVER: '#666666',
                BUTTON_ACTIVE: '#888888',
                SUCCESS: '#00ff00',
                LOCKED: '#888888',
                PANEL_BORDER: 0xaaaaaa,
                CARD_BG: 0x333333,
                CARD_BORDER: 0x555555,
                ROOKIE_LEAGUE: 0x66ff66,
                AMATEUR_LEAGUE: 0xffaa00,
                PRO_LEAGUE: 0xff6666
            },
            FONTS: {
                FAMILY: 'Arial',
                SIZES: {
                    TITLE: '32px',
                    HEADER: '24px',
                    BODY: '20px'
                }
            },
            PANEL: {
                WIDTH: 800,
                HEIGHT: 500,
                PADDING: 20,
                BUTTON_HEIGHT: 60,
                BUTTON_SPACING: 20
            }
        };
        
        // Debug menu
        this.debugMenu = null;
    }
    
    create() {
        // Get game dimensions
        const { width: w, height: h } = this.cameras.main;
        
        // Initialize or re-init audio system for this scene
        if (audioSystem) {
            audioSystem.scene = this;
            audioSystem.init();
        }
        
        // Create background with parallax effect
        this.createBackground();
        
        // Initialize systems
        this.enemySystem = new EnemySystem(this);
        this.enemySystem.loadEnemyState(playerState.getState());
        
        // Create decorative elements
        this.createDecorations();
        
        // Display player rank
        this.displayPlayerRank();
        
        // Create main panel
        this.createMainPanel();
        
        // Create return button
        this.createReturnButton();
        
        // Initialize debug menu
        this.debugMenu = new DebugMenu(this);
        this.debugMenu.create();
    }
    
    createBackground() {
        const { width: w, height: h } = this.cameras.main;
        
        // Create background similar to MainLoop
        this.background = this.add.image(0, 0, 'bg');
        this.background.setOrigin(0, 0);
        const scale = Math.max(w / this.background.width, h / this.background.height);
        this.background.setScale(scale);
        
        // Add semi-transparent overlay for better contrast with UI
        this.overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.3);
        this.overlay.setOrigin(0, 0);
    }
    
    createDecorations() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS } = this.UI;
        
        // We're removing the horizontal lines for a cleaner medieval look
        // No decorative elements needed here
    }
    
    createMainPanel() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS, PANEL } = this.UI;
        
        // Create panel background with border
        this.mainPanel = this.add.rectangle(
            w/2, h/2, 
            PANEL.WIDTH, PANEL.HEIGHT, 
            COLORS.BACKGROUND, COLORS.BACKGROUND_ALPHA
        ).setOrigin(0.5);
        this.mainPanel.setStrokeStyle(2, COLORS.PANEL_BORDER);
        
        // Create title with simple effect
        const title = this.add.text(
            w/2, h/2 - PANEL.HEIGHT/2 + PANEL.PADDING,
            'Career Progression', 
            {
                fontSize: FONTS.SIZES.TITLE,
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT
            }
        ).setOrigin(0.5, 0);
        
        // Add simple animation to title
        this.tweens.add({
            targets: title,
            alpha: 0.8,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Add subtitle text
        this.add.text(
            w/2, h/2 - PANEL.HEIGHT/2 + PANEL.PADDING + 40,
            'Defeat all opponents in a league to advance!', 
            {
                fontSize: FONTS.SIZES.BODY,
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT
            }
        ).setOrigin(0.5, 0);
        
        // Create linear opponent progression view
        this.createOpponentProgression();
    }
    
    createOpponentProgression() {
        // First, check player's rank and unlock appropriate leagues
        playerState.updateRankAndLeagues();
        this.enemySystem.checkLeagueUnlocks(playerState.getState());
        
        // Get player's unlocked leagues
        const unlockedLeagues = playerState.getUnlockedLeagues();
        
        // Find the appropriate league to display
        let currentLeague = 'rookie';
        
        // Use rank to determine which league to show
        const rankData = playerState.getRank();
        if (rankData.name === 'Novice') {
            currentLeague = 'rookie';
        } else if (['Squire', 'Knight'].includes(rankData.name)) {
            currentLeague = 'amateur';
        } else {
            currentLeague = 'pro';
        }
        
        // Make sure the current league is unlocked
        if (!unlockedLeagues.includes(currentLeague)) {
            currentLeague = unlockedLeagues[unlockedLeagues.length - 1];
        }
        
        // Display current league info
        this.displayLeagueInfo(currentLeague);
        
        // Create opponents in linear progression
        this.createEnemyProgression(currentLeague);
    }
    
    displayLeagueInfo(leagueId) {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        // Get league data
        const league = this.enemySystem.getLeagues()[leagueId];
        
        // League color
        let leagueColor = COLORS.ROOKIE_LEAGUE;
        if (leagueId === 'amateur') leagueColor = COLORS.AMATEUR_LEAGUE;
        if (leagueId === 'pro') leagueColor = COLORS.PRO_LEAGUE;
        
        // Create league banner
        const leagueBanner = this.add.container(w/2, h/2 - 160);
        
        const bannerBg = this.add.rectangle(
            0, 0,
            300, 40,
            leagueColor,
            0.7
        ).setOrigin(0.5);
        leagueBanner.add(bannerBg);
        
        const bannerText = this.add.text(
            0, 0,
            league.name,
            {
                fontSize: FONTS.SIZES.HEADER,
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        leagueBanner.add(bannerText);
        
        // Slight pulse effect on banner
        this.tweens.add({
            targets: bannerBg,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }
    
    createEnemyProgression(leagueId) {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS, PANEL } = this.UI;
        
        // Get enemies in selected league
        const enemies = this.enemySystem.getEnemiesInLeague(leagueId);
        
        // Get player's defeated enemies
        const playerData = playerState.getState();
        const defeatedEnemies = playerData.careerProgress?.defeatedEnemies || {};
        
        // Clear previous opponent containers if any
        if (this.opponentContainers) {
            this.opponentContainers.forEach(container => container.destroy());
        }
        
        // Create wooden bulletin board backdrop
        this.createWoodenBulletinBoard();
        
        // Create opponent containers array
        this.opponentContainers = [];
        
        // Calculate layout for wanted posters
        const postersPerRow = 2;
        const posterWidth = 280;
        const posterHeight = 380;
        const horizontalSpacing = 320;
        const verticalSpacing = 400;
        const startX = w/2 - (postersPerRow - 1) * horizontalSpacing / 2;
        const startY = h/2 + 30;
        
        // Create wanted posters for each enemy
        enemies.forEach((enemy, index) => {
            // Calculate position based on grid layout
            const row = Math.floor(index / postersPerRow);
            const col = index % postersPerRow;
            const x = startX + col * horizontalSpacing;
            const y = startY + row * verticalSpacing;
            
            // Add some randomness to the poster positions
            const randomOffsetX = Phaser.Math.Between(-10, 10);
            const randomOffsetY = Phaser.Math.Between(-10, 10);
            const finalX = x + randomOffsetX;
            const finalY = y + randomOffsetY;
            
            // Check if enemy is defeated
            const isDefeated = defeatedEnemies[enemy.id] && defeatedEnemies[enemy.id] > 0;
            
            // Check if enemy should be accessible (first enemy or previous is defeated)
            const isPreviousDefeated = index === 0 || 
                (enemies[index-1] && defeatedEnemies[enemies[index-1].id] && defeatedEnemies[enemies[index-1].id] > 0);
            
            const isAccessible = isPreviousDefeated;
            
            // Create poster container
            const posterContainer = this.add.container(finalX, finalY);
            
            // Poster background
            let posterBgColor = 0x444444; // Locked
            if (isDefeated) {
                posterBgColor = 0x00aa00; // Defeated
            } else if (isAccessible) {
                posterBgColor = 0xaaaa33; // Current challenge - yellowish paper color
            }
            
            // Create paper texture for the poster
            const paperTexture = this.add.rectangle(0, 0, posterWidth, posterHeight, posterBgColor, 1);
            paperTexture.setStrokeStyle(3, 0x000000);
            posterContainer.add(paperTexture);
            
            // Add a slight rotation to make posters look more natural
            posterContainer.setRotation(Phaser.Math.Between(-5, 5) * 0.01);
            
            // Create "WANTED" text at the top
            let wantedText;
            if (isDefeated) {
                wantedText = this.add.text(0, -posterHeight/2 + 30, "DEFEATED", {
                    fontSize: '32px',
                    fontFamily: 'Georgia, serif',
                    color: '#dd0000',
                    fontStyle: 'bold'
                });
                
                // Add "defeated" stamp or diagonal text
                const defeatedStamp = this.add.text(0, 0, "DEFEATED", {
                    fontSize: '48px',
                    fontFamily: 'Impact, fantasy',
                    color: '#dd0000',
                    fontStyle: 'bold'
                });
                defeatedStamp.setRotation(Math.PI / 8); // Slight diagonal angle
                defeatedStamp.setAlpha(0.7);
                posterContainer.add(defeatedStamp);
                
            } else if (!isAccessible) {
                wantedText = this.add.text(0, -posterHeight/2 + 30, "LOCKED", {
                    fontSize: '32px',
                    fontFamily: 'Georgia, serif',
                    color: '#777777',
                    fontStyle: 'bold'
                });
            } else {
                wantedText = this.add.text(0, -posterHeight/2 + 30, "WANTED", {
                    fontSize: '32px',
                    fontFamily: 'Georgia, serif',
                    color: '#000000',
                    fontStyle: 'bold'
                });
            }
            wantedText.setOrigin(0.5);
            posterContainer.add(wantedText);
            
            // Add decorative line under the title
            const titleLine = this.add.graphics();
            titleLine.lineStyle(2, 0x000000, 0.8);
            titleLine.beginPath();
            titleLine.moveTo(-posterWidth/2 + 20, -posterHeight/2 + 60);
            titleLine.lineTo(posterWidth/2 - 20, -posterHeight/2 + 60);
            titleLine.strokePath();
            posterContainer.add(titleLine);
            
            // Add enemy portrait (larger for the poster)
            const portraitBg = this.add.circle(0, -posterHeight/2 + 160, 80, 0xffffff, 1);
            portraitBg.setStrokeStyle(3, 0x000000);
            posterContainer.add(portraitBg);
            
            const portrait = this.add.sprite(0, -posterHeight/2 + 160, enemy.skin).setScale(0.4);
            posterContainer.add(portrait);
            
            // Add enemy name with "fancy" style
            const nameText = this.add.text(0, -posterHeight/2 + 250, enemy.name, {
                fontSize: '24px',
                fontFamily: 'Georgia, serif',
                color: '#000000',
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5);
            posterContainer.add(nameText);
            
            // Add reward text
            const rewardText = this.add.text(0, -posterHeight/2 + 290, `REWARD: $${enemy.moneyReward}`, {
                fontSize: '28px',
                fontFamily: 'Georgia, serif',
                color: '#dd0000',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            posterContainer.add(rewardText);
            
            // Add decorative line above stats
            const statsLine = this.add.graphics();
            statsLine.lineStyle(2, 0x000000, 0.8);
            statsLine.beginPath();
            statsLine.moveTo(-posterWidth/2 + 20, -posterHeight/2 + 320);
            statsLine.lineTo(posterWidth/2 - 20, -posterHeight/2 + 320);
            statsLine.strokePath();
            posterContainer.add(statsLine);
            
            // Add "Last seen" text for flavor
            const flavorText = this.add.text(0, -posterHeight/2 + 345, "LAST SEEN AT:", {
                fontSize: '16px',
                fontFamily: 'Georgia, serif',
                color: '#000000',
                fontStyle: 'italic'
            }).setOrigin(0.5);
            posterContainer.add(flavorText);
            
            // Add enemy "location"
            const locations = ["Woolly Meadows", "Ram Ranch", "Shepherd's Valley", "Fleece Fields", "Hoof Haven", "Baa-tle Arena"];
            const location = this.add.text(0, -posterHeight/2 + 370, locations[index % locations.length], {
                fontSize: '18px',
                fontFamily: 'Georgia, serif',
                color: '#000000',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            posterContainer.add(location);
            
            // Add difficulty with star rating
            const difficultyStars = '★'.repeat(enemy.difficulty);
            const difficultyText = this.add.text(0, posterHeight/2 - 50, `Difficulty: ${difficultyStars}`, {
                fontSize: '18px',
                fontFamily: 'Georgia, serif',
                color: '#000000'
            }).setOrigin(0.5);
            posterContainer.add(difficultyText);
            
            // Add tear effect at the edges/corners to make poster look worn
            this.addPosterTearEffects(posterContainer, posterWidth, posterHeight);
            
            // Make poster interactive if accessible
            if (isAccessible) {
                paperTexture.setInteractive({ useHandCursor: true });
                
                // Hover effect
                paperTexture.on('pointerover', () => {
                    posterContainer.setScale(1.05);
                    this.showEnemyTooltip(enemy, finalX, finalY);
                });
                
                paperTexture.on('pointerout', () => {
                    posterContainer.setScale(1.0);
                    this.hideEnemyTooltip();
                });
                
                // Click to show matchup preview
                paperTexture.on('pointerdown', () => {
                    // Play click sound
                    if (audioSystem) {
                        audioSystem.playClick();
                    }
                    this.showMatchupPreview(enemy);
                });
                
                // Add subtle pulsing effect to current challenge if not defeated
                if (!isDefeated) {
                    this.tweens.add({
                        targets: paperTexture,
                        alpha: 0.9,
                        duration: 1200,
                        yoyo: true,
                        repeat: -1
                    });
                    
                    // Add a "NEW" badge for the current challenge
                    const newBadge = this.add.circle(-posterWidth/2 + 30, -posterHeight/2 + 30, 25, 0xff0000);
                    posterContainer.add(newBadge);
                    
                    const newText = this.add.text(-posterWidth/2 + 30, -posterHeight/2 + 30, "NEW", {
                        fontSize: '16px',
                        fontFamily: 'Arial',
                        color: '#ffffff',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                    posterContainer.add(newText);
                    
                    // Make the badge pulse
                    this.tweens.add({
                        targets: [newBadge, newText],
                        scale: 1.2,
                        duration: 600,
                        yoyo: true,
                        repeat: -1
                    });
                }
            } else if (!isAccessible) {
                // Add a lock icon for locked enemies
                const lockIcon = this.add.text(0, 0, "🔒", {
                    fontSize: '80px'
                }).setOrigin(0.5);
                posterContainer.add(lockIcon);
                
                // Make the whole poster darker and semi-transparent
                posterContainer.list.forEach(item => {
                    if (item !== lockIcon) {
                        item.setAlpha(0.7);
                    }
                });
            }
            
            this.opponentContainers.push(posterContainer);
        });
        
        // Add "thumbtack" decorations to each poster to make them look pinned
        this.opponentContainers.forEach(container => {
            const thumbtack = this.add.circle(0, -container.list[0].height/2 + 15, 8, 0xff0000);
            container.add(thumbtack);
            
            // Add a shadow under the thumbtack
            const thumtackShadow = this.add.circle(2, -container.list[0].height/2 + 17, 8, 0x000000, 0.3);
            container.addAt(thumtackShadow, 0);
        });
    }
    
    // Helper method to add tear effects to poster edges
    addPosterTearEffects(container, width, height) {
        const graphics = this.add.graphics();
        
        // Draw little tears or worn edges at random positions
        for (let i = 0; i < 8; i++) {
            const side = i % 4; // 0: top, 1: right, 2: bottom, 3: left
            let x, y;
            
            switch (side) {
                case 0: // top
                    x = Phaser.Math.Between(-width/2 + 20, width/2 - 20);
                    y = -height/2;
                    break;
                case 1: // right
                    x = width/2;
                    y = Phaser.Math.Between(-height/2 + 20, height/2 - 20);
                    break;
                case 2: // bottom
                    x = Phaser.Math.Between(-width/2 + 20, width/2 - 20);
                    y = height/2;
                    break;
                case 3: // left
                    x = -width/2;
                    y = Phaser.Math.Between(-height/2 + 20, height/2 - 20);
                    break;
            }
            
            // Draw a small irregular polygon for tear effect
            const tearSize = Phaser.Math.Between(5, 10);
            graphics.fillStyle(0x000000, 0.2);
            graphics.fillCircle(x, y, tearSize);
        }
        
        container.add(graphics);
    }
    
    showEnemyTooltip(enemy, x, y) {
        // Remove existing tooltip if any
        this.hideEnemyTooltip();
        
        const { COLORS, FONTS } = this.UI;
        
        // Create tooltip container
        this.tooltip = this.add.container(x + 120, y);
        
        // Tooltip background
        const tooltipBg = this.add.rectangle(
            0, 0,
            200, 160,
            COLORS.CARD_BG,
            0.9
        ).setOrigin(0.5);
        tooltipBg.setStrokeStyle(1, COLORS.CARD_BORDER);
        this.tooltip.add(tooltipBg);
        
        // Tooltip content
        const titleText = this.add.text(
            0, -60,
            enemy.name,
            {
                fontSize: '18px',
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.tooltip.add(titleText);
        
        // Statistics
        const statsTexts = [
            `Score Range: ${enemy.getScoreRange()}`,
            `Reward: $${enemy.moneyReward}`,
            `Description: ${enemy.description}`
        ];
        
        statsTexts.forEach((text, i) => {
            const statsText = this.add.text(
                0, -30 + (i * 24),
                text,
                {
                    fontSize: '14px',
                    fontFamily: FONTS.FAMILY,
                    color: COLORS.TEXT,
                    wordWrap: { width: 180 },
                    align: 'center'
                }
            ).setOrigin(0.5);
            this.tooltip.add(statsText);
        });
        
        // Fade in tooltip
        this.tooltip.alpha = 0;
        this.tweens.add({
            targets: this.tooltip,
            alpha: 1,
            duration: 200
        });
    }
    
    hideEnemyTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }
    
    showMatchupPreview(enemy) {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        // Disable all interactive elements underneath
        this.disableInteractionsUnderneath();
        
        // Create a container for all preview elements
        this.matchupPreview = this.add.container(0, 0);
        
        // Add darkened overlay with a parchment texture
        const overlay = this.add.rectangle(w/2, h/2, w, h, 0x2a1a0a, 0.9);
        overlay.setInteractive(); // Make overlay capture input events to prevent clicking through
        this.matchupPreview.add(overlay);
        
        // Add parchment background texture
        this.createParchmentTexture(w/2, h/2, w - 100, h - 100);
        
        // Initialize weapon system and skin system
        this.weaponSystem = new WeaponSystem(this);
        const skinSystem = new SkinSystem(this);
        
        // Get player data
        const playerData = playerState.getState();
        const playerLance = playerData.equipment.currentLance || 'lance_0';
        const playerSkin = playerData.currentSkin;
        
        // Create divider design in the middle (inspired by medieval tournament lists)
        this.createMedievalDivider(w/2, h/2);
        
        // ---- PLAYER SIDE (LEFT) ----
        
        // Create heraldic banner for player side
        this.createHeraldryBanner(w/4, 150, 0x3c275a, "CHALLENGER", true); // Royal purple
        
        // Create player container starting from left (off-screen)
        const playerContainer = this.add.container(-200, h/2);
        const playerSkinKey = skinSystem.getSkinTextureKey(playerSkin);
        const player = this.add.sprite(0, 0, playerSkinKey).setScale(1.0);
        playerContainer.add(player);
        
        // Equip smaller lance at -30-degree angle for player, moved forward and slightly up
        const playerWeapon = this.weaponSystem.equipWeapon(playerContainer, playerLance, -15, -15, false, 0.5); // Offset X by -15, Y by -15, smaller scale (0.5)
        this.weaponSystem.updateWeaponRotation(playerContainer, -Math.PI / 6); // -30 degrees in radians (inverted)
        
        this.matchupPreview.add(playerContainer);
        
        // Player name with medieval styling
        const playerNameBg = this.add.rectangle(w/4, h - 150, 300, 80, 0x3c275a, 0.8);
        playerNameBg.setStrokeStyle(3, 0xd4af37);
        this.matchupPreview.add(playerNameBg);
        
        const playerName = this.add.text(w/4, h - 150, "YOU", {
            fontSize: '42px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        playerName.setShadow(3, 3, '#000000', 5);
        this.matchupPreview.add(playerName);
        
        // ---- ENEMY SIDE (RIGHT) ----
        
        // Create heraldic banner for enemy side
        this.createHeraldryBanner(3*w/4, 150, 0x8b0000, "OPPONENT", false); // Dark red
        
        // Create enemy container starting from right (off-screen)
        const enemyContainer = this.add.container(w + 200, h/2);
        const enemySkinKey = skinSystem.getSkinTextureKey(enemy.skin);
        const enemySprite = this.add.sprite(0, 0, enemySkinKey).setScale(1.0);
        enemySprite.setFlipX(true);
        enemyContainer.add(enemySprite);
        
        // Equip smaller lance at 30-degree angle for enemy, moved forward and slightly up
        const enemyWeapon = this.weaponSystem.equipWeapon(enemyContainer, enemy.lance, 15, -15, true, 0.5); // Offset X by 15 (positive for flipped), Y by -15, smaller scale (0.5)
        this.weaponSystem.updateWeaponRotation(enemyContainer, Math.PI / 6); // 30 degrees in radians (inverted)
        
        this.matchupPreview.add(enemyContainer);
        
        // Enemy name with medieval styling
        const enemyNameBg = this.add.rectangle(3*w/4, h - 150, 300, 80, 0x8b0000, 0.8);
        enemyNameBg.setStrokeStyle(3, 0xd4af37);
        this.matchupPreview.add(enemyNameBg);
        
        const enemyName = this.add.text(3*w/4, h - 150, enemy.name, {
            fontSize: '42px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        enemyName.setShadow(3, 3, '#000000', 5);
        this.matchupPreview.add(enemyName);
        
        // ---- TITLE AND BUTTONS ----
        
        // Create title with medieval styling
        const titleBg = this.add.rectangle(w/2, 80, 400, 100, 0x32230c, 0.8);
        titleBg.setStrokeStyle(4, 0xd4af37); // Gold border
        this.matchupPreview.add(titleBg);
        
        const title = this.add.text(w/2, 80, "League Matchup", {
            fontSize: '44px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37', // Gold text
            fontStyle: 'bold'
        }).setOrigin(0.5);
        title.setShadow(3, 3, '#000000', 5);
        this.matchupPreview.add(title);
        
        // Add buttons
        const buttonY = h - 70;
        
        // Fight button
        const fightButton = this.add.rectangle(w/2 - 150, buttonY + 20, 220, 80, 0x8b0000, 0.8);
        fightButton.setStrokeStyle(3, 0xd4af37);
        this.matchupPreview.add(fightButton);
        
        const fightText = this.add.text(w/2 - 150, buttonY + 20, "FIGHT!", {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        fightText.setShadow(2, 2, '#000000', 3);
        this.matchupPreview.add(fightText);
        
        // Cancel button
        const cancelButton = this.add.rectangle(w/2 + 150, buttonY + 20, 220, 80, 0x32230c, 0.8);
        cancelButton.setStrokeStyle(3, 0xd4af37);
        this.matchupPreview.add(cancelButton);
        
        const cancelText = this.add.text(w/2 + 150, buttonY + 20, "CANCEL", {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.matchupPreview.add(cancelText);
        
        // ---- ANIMATIONS ----
        
        // Initial alpha - everything starts invisible
        this.matchupPreview.alpha = 1;
        playerContainer.alpha = 0;
        enemyContainer.alpha = 0;
        playerNameBg.alpha = 0;
        playerName.alpha = 0;
        enemyNameBg.alpha = 0;
        enemyName.alpha = 0;
        titleBg.alpha = 0;
        title.alpha = 0;
        fightButton.alpha = 0;
        fightText.alpha = 0;
        cancelButton.alpha = 0;
        cancelText.alpha = 0;
        
        // Animation sequence
        
        // 1. Flash the screen
        this.tweens.add({
            targets: overlay,
            alpha: 0.4,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                // 2. Show the title with a scale effect
                titleBg.alpha = 1;
                title.alpha = 1;
                title.setScale(2);
                
                this.tweens.add({
                    targets: title,
                    scale: 1,
                    duration: 500,
                    ease: 'Back.out',
                    onComplete: () => {
                        // 3. Player slides in from left with flash
                        playerContainer.alpha = 1;
                        
                        this.tweens.add({
                            targets: playerContainer,
                            x: w/4,
                            duration: 800,
                            ease: 'Back.out',
                            onComplete: () => {
                                // Show player name
                                playerNameBg.alpha = 1;
                                playerName.alpha = 1;
                                playerName.setScale(0.5);
                                
                                this.tweens.add({
                                    targets: playerName,
                                    scale: 1,
                                    duration: 300,
                                    ease: 'Back.out'
                                });
                                
                                // Add flashes behind player
                                this.createFlashEffect(w/4, h/2, 0xd4af37);
                            }
                        });
                        
                        // 4. After a short delay, enemy slides in from right
                        this.time.delayedCall(400, () => {
                            enemyContainer.alpha = 1;
                            
                            this.tweens.add({
                                targets: enemyContainer,
                                x: 3*w/4,
                                duration: 800,
                                ease: 'Back.out',
                                onComplete: () => {
                                    // Show enemy name
                                    enemyNameBg.alpha = 1;
                                    enemyName.alpha = 1;
                                    enemyName.setScale(0.5);
                                    
                                    this.tweens.add({
                                        targets: enemyName,
                                        scale: 1,
                                        duration: 300,
                                        ease: 'Back.out'
                                    });
                                    
                                    // Add flashes behind enemy
                                    this.createFlashEffect(3*w/4, h/2, 0x8b0000);
                                    
                                    // 5. Finally show buttons with bounce effect
                                    this.time.delayedCall(300, () => {
                                        fightButton.alpha = 1;
                                        fightText.alpha = 1;
                                        cancelButton.alpha = 1;
                                        cancelText.alpha = 1;
                                        
                                        // Make fight button pulse
                                        this.tweens.add({
                                            targets: [fightButton, fightText],
                                            scale: 1.1,
                                            duration: 600,
                                            yoyo: true,
                                            repeat: -1
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
        });
        
        // Make buttons interactive
        fightButton.setInteractive({ useHandCursor: true });
        cancelButton.setInteractive({ useHandCursor: true });
        
        // Button hover effects
        fightButton.on('pointerover', () => {
            fightButton.setScale(1.1);
            fightText.setScale(1.1);
        });
        
        fightButton.on('pointerout', () => {
            fightButton.setScale(1);
            fightText.setScale(1);
        });
        
        fightButton.on('pointerdown', () => {
            // Play click sound
            if (audioSystem) {
                audioSystem.playClick();
            }
            
            // Stop all tweens to prevent animation conflicts
            this.tweens.killAll();
            
            // Flash effect
            const flash = this.add.rectangle(w/2, h/2, w, h, 0xffffff, 0);
            flash.setDepth(1000);
            
            this.tweens.add({
                targets: flash,
                alpha: 1,
                duration: 300,
                onComplete: () => {
                    this.hideMatchupPreview();
                    this.startCareerMatch(enemy);
                }
            });
        });
        
        cancelButton.on('pointerover', () => {
            cancelButton.setScale(1.05);
            cancelText.setScale(1.05);
        });
        
        cancelButton.on('pointerout', () => {
            cancelButton.setScale(1);
            cancelText.setScale(1);
        });
        
        cancelButton.on('pointerdown', () => {
            // Play click sound
            if (audioSystem) {
                audioSystem.playClick();
            }
            this.hideMatchupPreview();
        });
    }
    
    // Helper method to create a medieval-style divider
    createMedievalDivider(x, y) {
        const { width: w, height: h } = this.cameras.main;
        
        // Create a container for the divider elements
        const dividerContainer = this.add.container(x, y);
        this.matchupPreview.add(dividerContainer);
        
        // Create jousting barrier (the "list")
        const dividerGraphics = this.add.graphics();
        // Draw wooden barrier
        dividerGraphics.fillStyle(0x8b4513, 1); // Brown
        dividerGraphics.fillRect(-10, -h/2, 20, h);
        
        // Add wooden texture with lines
        dividerGraphics.lineStyle(1, 0x3c2a21, 0.8);
        
        // Horizontal wood grain
        for (let i = -h/2 + 20; i < h/2; i += 30) {
            dividerGraphics.beginPath();
            dividerGraphics.moveTo(-10, i);
            dividerGraphics.lineTo(10, i);
            dividerGraphics.strokePath();
        }
        
        // Add vertical support posts
        for (let i = -h/2 + 100; i < h/2; i += 200) {
            dividerGraphics.fillStyle(0x654321, 1);
            dividerGraphics.fillRect(-15, i, 30, 40);
            
            // Add nail details
            dividerGraphics.fillStyle(0x444444, 1);
            dividerGraphics.fillRect(-8, i + 10, 5, 5);
            dividerGraphics.fillRect(3, i + 10, 5, 5);
            dividerGraphics.fillRect(-8, i + 25, 5, 5);
            dividerGraphics.fillRect(3, i + 25, 5, 5);
        }
        
        dividerContainer.add(dividerGraphics);
        
        // Add "VS" emblem at center of divider
        const vsCircle = this.add.circle(0, 0, 70, 0x32230c, 0.9);
        vsCircle.setStrokeStyle(5, 0xd4af37); // Gold border
        dividerContainer.add(vsCircle);
        
        const vsText = this.add.text(0, 0, "VS", {
            fontSize: '80px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37', // Gold text
            fontStyle: 'bold'
        }).setOrigin(0.5);
        vsText.setShadow(3, 3, '#000000', 5);
        dividerContainer.add(vsText);
        
        // Add pulsing animation to VS
        this.tweens.add({
            targets: vsCircle,
            scale: 1.2,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Add medieval banner decorations above and below VS emblem
        this.createBannerDecoration(dividerContainer, 0, -150, 0x800000); // Above VS
        this.createBannerDecoration(dividerContainer, 0, 150, 0x013220);  // Below VS
        
        // Add custom particles
        this.createCustomParticles(dividerContainer, 0, 0);
        
        return dividerContainer;
    }
    
    // Create medieval banner decoration
    createBannerDecoration(container, x, y, color) {
        // Banner rectangle
        const banner = this.add.rectangle(x, y, 100, 60, color, 0.9);
        banner.setStrokeStyle(2, 0xd4af37); // Gold border
        container.add(banner);
        
        // Add tassels at bottom
        const tassel1 = this.add.triangle(x - 25, y + 40, 0, 0, 15, 30, 30, 0, color);
        const tassel2 = this.add.triangle(x, y + 40, 0, 0, 15, 30, 30, 0, color);
        const tassel3 = this.add.triangle(x + 25, y + 40, 0, 0, 15, 30, 30, 0, color);
        container.add(tassel1);
        container.add(tassel2);
        container.add(tassel3);
        
        // Add simple symbol
        const symbol = Phaser.Math.Between(0, 1) === 0 ? "⚔️" : "🛡️";
        const symbolText = this.add.text(x, y, symbol, {
            fontSize: '30px'
        }).setOrigin(0.5);
        container.add(symbolText);
    }
    
    // Create a parchment texture background
    createParchmentTexture(x, y, width, height) {
        // Create a parchment-colored background
        const parchment = this.add.rectangle(x, y, width, height, 0xf0e6d2, 0.9);
        parchment.setStrokeStyle(10, 0xd2b48c);
        this.matchupPreview.add(parchment);
        
        // Add parchment texture effect
        const textureGraphics = this.add.graphics();
        
        // Add random stains and marks
        for (let i = 0; i < 20; i++) {
            const stainX = Phaser.Math.Between(-width/2 + 50, width/2 - 50);
            const stainY = Phaser.Math.Between(-height/2 + 50, height/2 - 50);
            const stainSize = Phaser.Math.Between(15, 40);
            const stainColor = Phaser.Utils.Array.GetRandom([0xd2b48c, 0xc19a6b, 0xe6ccb3]);
            const stainAlpha = Phaser.Math.FloatBetween(0.1, 0.3);
            
            textureGraphics.fillStyle(stainColor, stainAlpha);
            textureGraphics.fillCircle(stainX, stainY, stainSize);
        }
        
        // Add scroll-like curls at corners
        this.createScrollCurl(x - width/2 + 20, y - height/2 + 20, 0); // Top left
        this.createScrollCurl(x + width/2 - 20, y - height/2 + 20, 1); // Top right
        this.createScrollCurl(x - width/2 + 20, y + height/2 - 20, 2); // Bottom left
        this.createScrollCurl(x + width/2 - 20, y + height/2 - 20, 3); // Bottom right
        
        this.matchupPreview.add(textureGraphics);
    }
    
    // Create curl effect at parchment corners
    createScrollCurl(x, y, corner) {
        const curlGraphics = this.add.graphics();
        
        // Shadow under curl
        curlGraphics.fillStyle(0x000000, 0.2);
        
        // Create a shadow using polygon points
        const radius = 40;
        const points = [];
        
        // Calculate points for different corners
        switch(corner) {
            case 0: // Top left
                points.push({x: x, y: y});
                points.push({x: x - radius, y: y});
                points.push({x: x - radius, y: y - radius});
                points.push({x: x, y: y - radius});
                break;
            case 1: // Top right
                points.push({x: x, y: y});
                points.push({x: x, y: y - radius});
                points.push({x: x + radius, y: y - radius});
                points.push({x: x + radius, y: y});
                break;
            case 2: // Bottom left
                points.push({x: x, y: y});
                points.push({x: x, y: y + radius});
                points.push({x: x - radius, y: y + radius});
                points.push({x: x - radius, y: y});
                break;
            case 3: // Bottom right
                points.push({x: x, y: y});
                points.push({x: x + radius, y: y});
                points.push({x: x + radius, y: y + radius});
                points.push({x: x, y: y + radius});
                break;
        }
        
        // Draw a filled polygon for the shadow
        curlGraphics.beginPath();
        curlGraphics.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            curlGraphics.lineTo(points[i].x, points[i].y);
        }
        
        curlGraphics.closePath();
        curlGraphics.fillPath();
        
        // Add to scene
        this.matchupPreview.add(curlGraphics);
    }
    
    // Create heraldic banner
    createHeraldryBanner(x, y, color, text, isLeft) {
        // Create banner container
        const bannerContainer = this.add.container(x, y);
        this.matchupPreview.add(bannerContainer);
        
        // Banner height
        const bannerHeight = 300;
        
        // Main banner rectangle
        const banner = this.add.rectangle(0, 0, 200, bannerHeight, color, 0.8);
        banner.setStrokeStyle(3, 0xd4af37); // Gold border
        bannerContainer.add(banner);
        
        // Bottom triangular tassel shape
        const trianglePath = new Phaser.Geom.Triangle(
            -100, bannerHeight/2, 
            0, bannerHeight/2 + 50, 
            100, bannerHeight/2
        );
        
        const triangleGraphics = this.add.graphics();
        triangleGraphics.fillStyle(color, 0.8);
        triangleGraphics.fillTriangleShape(trianglePath);
        triangleGraphics.lineStyle(3, 0xd4af37);
        triangleGraphics.strokeTriangleShape(trianglePath);
        bannerContainer.add(triangleGraphics);
        
        // Add banner header text
        const headerText = this.add.text(0, -bannerHeight/2 + 30, text, {
            fontSize: '26px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        headerText.setShadow(2, 2, '#000000', 3);
        bannerContainer.add(headerText);
        
        // Add decorative line under text
        const lineGraphics = this.add.graphics();
        lineGraphics.lineStyle(2, 0xd4af37, 0.8);
        lineGraphics.beginPath();
        lineGraphics.moveTo(-80, -bannerHeight/2 + 50);
        lineGraphics.lineTo(80, -bannerHeight/2 + 50);
        lineGraphics.strokePath();
        bannerContainer.add(lineGraphics);
        
        // Add heraldic symbol
        const symbol = isLeft ? "⚔️" : "🛡️";
        const symbolText = this.add.text(0, 0, symbol, {
            fontSize: '80px'
        }).setOrigin(0.5);
        bannerContainer.add(symbolText);
        
        // Add rope at top
        const ropeGraphics = this.add.graphics();
        ropeGraphics.lineStyle(5, 0x8B4513);
        ropeGraphics.beginPath();
        ropeGraphics.moveTo(-100, -bannerHeight/2);
        ropeGraphics.lineTo(100, -bannerHeight/2);
        ropeGraphics.strokePath();
        bannerContainer.add(ropeGraphics);
        
        // Add slight swaying animation
        this.tweens.add({
            targets: bannerContainer,
            angle: isLeft ? 3 : -3,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    // Helper method to create custom particles without using the emitter system
    createCustomParticles(container, x, y) {
        // Create a container for all particles
        const particleContainer = this.add.container(x, y);
        container.add(particleContainer);
        
        // Create 20 particles
        for (let i = 0; i < 20; i++) {
            this.createSingleParticle(particleContainer);
        }
        
        // Set up a timer to continuously create new particles
        this.time.addEvent({
            delay: 300,
            callback: () => {
                // Create a new particle every 300ms
                this.createSingleParticle(particleContainer);
            },
            repeat: -1
        });
    }
    
    // Create a single particle
    createSingleParticle(container) {
        // Random position around the center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 30;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        // Random size
        const size = Math.random() * 10 + 5;
        
        // Random color (gold/yellow shades for VS effect)
        const colors = [0xd4af37, 0xffd700, 0xdaa520, 0xb8860b, 0xffe866];
        const color = Phaser.Utils.Array.GetRandom(colors);
        
        // Create a circle as a particle
        const particle = this.add.circle(x, y, size, color, 0.7);
        container.add(particle);
        
        // Animate the particle
        this.tweens.add({
            targets: particle,
            x: x + (Math.random() - 0.5) * 200,
            y: y + (Math.random() - 0.5) * 200,
            alpha: 0,
            scale: 0,
            duration: 1000 + Math.random() * 1000,
            onComplete: () => {
                // Remove particle when animation completes
                particle.destroy();
            }
        });
    }
    
    // Helper method to create flash effects behind characters
    createFlashEffect(x, y, color) {
        // Create a circle flash
        const flash = this.add.circle(x, y, 150, 0xd4af37, 0.7); // Use gold color for flash
        this.matchupPreview.addAt(flash, 0); // Add to back
        
        // Flash animation
        this.tweens.add({
            targets: flash,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Create some random smaller flashes
        for (let i = 0; i < 5; i++) {
            const smallFlash = this.add.circle(
                x + Phaser.Math.Between(-100, 100),
                y + Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(20, 50),
                0xd4af37, // Use gold color
                0.7
            );
            this.matchupPreview.addAt(smallFlash, 0);
            
            this.tweens.add({
                targets: smallFlash,
                scale: Phaser.Math.FloatBetween(1.5, 2.5),
                alpha: 0,
                duration: Phaser.Math.Between(300, 600),
                onComplete: () => {
                    smallFlash.destroy();
                }
            });
        }
    }
    
    hideMatchupPreview() {
        if (this.matchupPreview) {
            // Kill all existing tweens
            this.tweens.killTweensOf(this.matchupPreview.list);
            
            // Create a white flash
            const { width: w, height: h } = this.cameras.main;
            const flash = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0);
            
            this.tweens.add({
                targets: flash,
                alpha: 1,
                duration: 300,
                onComplete: () => {
                    this.matchupPreview.destroy();
                    this.matchupPreview = null;
                    flash.destroy();
                    
                    // Re-enable interactions
                    this.enableInteractionsUnderneath();
                }
            });
        }
    }
    
    startCareerMatch(enemy) {
        // Add transition effect
        const { width: w, height: h } = this.cameras.main;
        const flash = this.add.rectangle(w/2, h/2, w, h, 0xffffff, 0);
        
        // Log enemy data for debugging
        console.log(`Starting career match with enemy: ${enemy.name}`);
        console.log(`Enemy skin: ${enemy.skin}, lance: ${enemy.lance}`);
        
        // Fade out any sounds that might be playing
        if (audioSystem) {
            audioSystem.fadeOutAllSounds(300);
        }
        
        this.tweens.add({
            targets: flash,
            alpha: 0.8,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                flash.destroy();
                this.scene.start('LanceGame', {
                    opponentId: enemy.id,
                    opponentScore: enemy.calculateScore(),
                    matchType: 'career',
                    opponentSkin: enemy.skin,     // Explicitly pass enemy skin
                    opponentLance: enemy.lance,   // Explicitly pass enemy lance
                    currentSkin: playerState.getState().currentSkin
                });
            }
        });
    }
    
    createReturnButton() {
        const { width: w, height: h } = this.cameras.main;
        
        // Create button container for better organization
        const buttonContainer = this.add.container(w/2, h - 50);
        
        // Size for wooden button similar to the BOUNTY BOARD header
        const buttonWidth = 280;
        const buttonHeight = 50;
        
        // Wooden background - same style as the Bounty Board header
        const woodenButton = this.add.rectangle(
            0, 0,
            buttonWidth, buttonHeight,
            0x8B4513, 1
        ).setOrigin(0.5);
        woodenButton.setStrokeStyle(4, 0x3c2a21);
        buttonContainer.add(woodenButton);
        
        // Add wood grain texture effect (similar to bulletin board)
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, 0x3c2a21, 0.3);
        
        // Horizontal wood grain lines
        for (let i = -buttonHeight/2 + 5; i < buttonHeight/2; i += 8) {
            // Make lines slightly wavy
            grainGraphics.beginPath();
            grainGraphics.moveTo(-buttonWidth/2 + 5, i);
            
            for (let x = -buttonWidth/2 + 10; x < buttonWidth/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        buttonContainer.add(grainGraphics);
        
        // Button text with gold color and medieval font (matching BOUNTY BOARD header)
        const buttonText = this.add.text(
            0, 0,
            'RETURN TO HUB',
            {
                fontSize: '24px',
                fontFamily: 'Georgia, serif',
                color: '#FFD700', // Gold text
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        // Add shadow to text for better readability
        buttonText.setShadow(2, 2, '#000000', 3);
        buttonContainer.add(buttonText);
        
        // Make button interactive
        woodenButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                woodenButton.setFillStyle(0x9c6243); // Lighter color on hover
                buttonText.setScale(1.05);
            })
            .on('pointerout', () => {
                woodenButton.setFillStyle(0x8B4513); // Reset to original color
                buttonText.setScale(1);
            })
            .on('pointerdown', () => {
                // Play click sound
                if (audioSystem) {
                    audioSystem.playClick();
                    // Fade out any sounds that might be playing
                    audioSystem.fadeOutAllSounds(300);
                }
                
                this.scene.start('MainLoop');
            });
    }
    
    displayPlayerRank() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        try {
            // Get rank data
            const rankData = playerState.getRank();
            
            // Create simple stats panel at top similar to MainLoop
            const statsPanel = this.add.rectangle(w/2, 50, w * 0.8, 80, COLORS.BACKGROUND, COLORS.BACKGROUND_ALPHA);
            statsPanel.setOrigin(0.5);
            
            // Player stats
            const playerData = playerState.getState();
            const stats = [
                `Money: $${playerData.money}`,
                `Wins: ${playerData.stats.wins}`,
                `Losses: ${playerData.stats.losses}`,
                `High Score: ${playerData.stats.highestScore}`
            ];
            
            const spacing = 200;
            const yPos = 50;
            
            stats.forEach((stat, index) => {
                this.add.text(w/2 - (spacing * 1.5) + (spacing * index), yPos, stat, {
                    fontSize: FONTS.SIZES.BODY,
                    fontFamily: FONTS.FAMILY,
                    color: COLORS.TEXT
                }).setOrigin(0.5);
            });
            
            // Create rank display below stats
            const rankPanel = this.add.rectangle(w/2, 130, w * 0.3, 60, COLORS.BACKGROUND, COLORS.BACKGROUND_ALPHA);
            rankPanel.setOrigin(0.5);
            
            // Rank title
            this.add.text(w/2, 115, "RANK", {
                fontSize: FONTS.SIZES.BODY,
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT
            }).setOrigin(0.5);
            
            // Rank name
            const rankName = this.add.text(w/2, 140, rankData.name, {
                fontSize: FONTS.SIZES.HEADER,
                fontFamily: FONTS.FAMILY,
                color: rankData.color,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Progress text
            if (rankData.nextRank) {
                this.add.text(
                    w/2, 165, 
                    `${rankData.progress}% to ${rankData.nextRank} (${rankData.winsToNextRank} wins needed)`, 
                    {
                        fontSize: '16px',
                        fontFamily: FONTS.FAMILY,
                        color: COLORS.TEXT
                    }
                ).setOrigin(0.5);
            }
        } catch (error) {
            console.error("Error in displayPlayerRank:", error);
        }
    }
    
    createWoodenBulletinBoard() {
        const { width: w, height: h } = this.cameras.main;
        const { PANEL } = this.UI;
        
        // Create a container for the bulletin board
        this.bulletinBoard = this.add.container(w/2, h/2);
        
        // Define the bulletin board dimensions
        const boardWidth = PANEL.WIDTH + 100;
        const boardHeight = PANEL.HEIGHT + 150;
        
        // Create the wooden background
        const woodBackdrop = this.add.rectangle(0, 0, boardWidth, boardHeight, 0x5c4033, 1);
        woodBackdrop.setStrokeStyle(10, 0x3c2a21);
        this.bulletinBoard.add(woodBackdrop);
        
        // Add wood grain texture effect using lines
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, 0x3c2a21, 0.4);
        
        // Horizontal wood grain lines
        for (let i = -boardHeight/2 + 20; i < boardHeight/2; i += 20) {
            // Make lines wavy
            grainGraphics.beginPath();
            grainGraphics.moveTo(-boardWidth/2 + 10, i);
            
            for (let x = -boardWidth/2 + 30; x < boardWidth/2; x += 20) {
                const yOffset = Phaser.Math.Between(-3, 3);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        
        this.bulletinBoard.add(grainGraphics);
        
        // Add decorative nails/metal fixtures in the corners
        const cornerOffset = 30;
        const cornerPositions = [
            {x: -boardWidth/2 + cornerOffset, y: -boardHeight/2 + cornerOffset},
            {x: boardWidth/2 - cornerOffset, y: -boardHeight/2 + cornerOffset},
            {x: -boardWidth/2 + cornerOffset, y: boardHeight/2 - cornerOffset},
            {x: boardWidth/2 - cornerOffset, y: boardHeight/2 - cornerOffset}
        ];
        
        cornerPositions.forEach(pos => {
            // Metal plate
            const plate = this.add.rectangle(pos.x, pos.y, 40, 40, 0x696969, 1);
            plate.setStrokeStyle(1, 0x444444);
            this.bulletinBoard.add(plate);
            
            // Center nail/rivet
            const nail = this.add.circle(pos.x, pos.y, 8, 0x999999, 1);
            nail.setStrokeStyle(1, 0x777777);
            this.bulletinBoard.add(nail);
            
            // Add shadow to nail
            const nailShadow = this.add.circle(pos.x + 1, pos.y + 1, 8, 0x000000, 0.3);
            this.bulletinBoard.addAt(nailShadow, this.bulletinBoard.getIndex(plate));
        });
        
        // Add some rope or chain at the top to make it look hung on the wall
        const ropeGraphics = this.add.graphics();
        ropeGraphics.lineStyle(8, 0x8B4513, 1);
        
        // Draw rope going up from the top two corners
        ropeGraphics.beginPath();
        ropeGraphics.moveTo(-boardWidth/2 + cornerOffset, -boardHeight/2);
        ropeGraphics.lineTo(-boardWidth/2 + cornerOffset, -boardHeight/2 - 50);
        ropeGraphics.lineTo(boardWidth/2 - cornerOffset, -boardHeight/2 - 50);
        ropeGraphics.lineTo(boardWidth/2 - cornerOffset, -boardHeight/2);
        ropeGraphics.strokePath();
        
        this.bulletinBoard.add(ropeGraphics);
        
        // Add a header sign to the bulletin board
        const headerBoard = this.add.rectangle(0, -boardHeight/2 + 55, boardWidth * 0.6, 60, 0x8B4513, 1);
        headerBoard.setStrokeStyle(4, 0x3c2a21);
        this.bulletinBoard.add(headerBoard);
        
        // Add wood grain texture to the header panel
        const headerGrainGraphics = this.add.graphics();
        headerGrainGraphics.lineStyle(1, 0x3c2a21, 0.3);
        
        // Get header dimensions
        const headerWidth = boardWidth * 0.6;
        const headerHeight = 60;
        
        // Horizontal wood grain lines for header
        for (let i = -headerHeight/2 + 5; i < headerHeight/2; i += 8) {
            // Make lines slightly wavy
            headerGrainGraphics.beginPath();
            headerGrainGraphics.moveTo(-headerWidth/2 + 5, -boardHeight/2 + 55 + i);
            
            for (let x = -headerWidth/2 + 10; x < headerWidth/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                headerGrainGraphics.lineTo(x, -boardHeight/2 + 55 + i + yOffset);
            }
            
            headerGrainGraphics.strokePath();
        }
        this.bulletinBoard.add(headerGrainGraphics);
        
        // Add header text
        const headerText = this.add.text(0, -boardHeight/2 + 55, "BOUNTY BOARD", {
            fontSize: '32px',
            fontFamily: 'Georgia, serif',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add slight shadow to text for better readability
        headerText.setShadow(2, 2, '#000000', 3);
        this.bulletinBoard.add(headerText);
        
        // Add some random stains or marks to make the board look used
        const stainGraphics = this.add.graphics();
        
        // Add 5-8 random stains
        for (let i = 0; i < Phaser.Math.Between(5, 8); i++) {
            const stainX = Phaser.Math.Between(-boardWidth/2 + 50, boardWidth/2 - 50);
            const stainY = Phaser.Math.Between(-boardHeight/2 + 80, boardHeight/2 - 50);
            const stainSize = Phaser.Math.Between(15, 40);
            const stainColor = Phaser.Utils.Array.GetRandom([0x3c2a21, 0x2c1a11, 0x4c3a31]);
            const stainAlpha = Phaser.Math.FloatBetween(0.1, 0.3);
            
            stainGraphics.fillStyle(stainColor, stainAlpha);
            
            // Make irregular stain shape
            stainGraphics.beginPath();
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const radiusVariation = Phaser.Math.FloatBetween(0.7, 1.3);
                const radius = stainSize * radiusVariation;
                const x = stainX + Math.cos(angle) * radius;
                const y = stainY + Math.sin(angle) * radius;
                
                if (angle === 0) {
                    stainGraphics.moveTo(x, y);
                } else {
                    stainGraphics.lineTo(x, y);
                }
            }
            stainGraphics.closePath();
            stainGraphics.fillPath();
        }
        
        this.bulletinBoard.add(stainGraphics);
        
        // Add a subtle shadow behind the bulletin board to give it depth
        const shadow = this.add.rectangle(10, 10, boardWidth, boardHeight, 0x000000, 0.3);
        this.bulletinBoard.addAt(shadow, 0);
        
        return this.bulletinBoard;
    }
    
    // Helper method to disable all interactive elements underneath the preview
    disableInteractionsUnderneath() {
        // Store current interactive state to restore later
        this.interactiveElementsState = [];
        
        // Disable main panel interactive elements
        if (this.bulletinBoard) {
            this.disableContainerInteractive(this.bulletinBoard);
        }
        
        // Disable all opponent containers
        if (this.opponentContainers) {
            this.opponentContainers.forEach(container => {
                this.disableContainerInteractive(container);
            });
        }
    }
    
    // Helper method to re-enable all interactive elements
    enableInteractionsUnderneath() {
        // Restore interactive states
        this.interactiveElementsState.forEach(item => {
            if (item.gameObject && !item.gameObject.destroyed) {
                item.gameObject.setInteractive(item.config);
            }
        });
        
        // Clear the stored states
        this.interactiveElementsState = [];
    }
    
    // Helper to disable interaction on a container and all its children
    disableContainerInteractive(container) {
        if (!container) return;
        
        // Process all items in the container
        container.list.forEach(item => {
            if (item.input && item.input.enabled) {
                // Store the current state
                this.interactiveElementsState.push({
                    gameObject: item,
                    config: item.input.hitArea
                });
                
                // Disable interaction
                item.disableInteractive();
            }
            
            // If this item is a container, process recursively
            if (item.type === 'Container') {
                this.disableContainerInteractive(item);
            }
        });
    }
    
    // Update or add a shutdown method to clean up the debug menu
    shutdown() {
        // Fade out any playing sounds
        if (audioSystem) {
            audioSystem.fadeOutAllSounds(300);
        }
        
        // Clean up tweens and input listeners
        this.tweens.killAll();
        this.input.off('pointerdown');
        this.input.off('pointermove');
        
        // Clean up any UI elements
        if (this.enemyTooltip) {
            this.enemyTooltip.destroy();
            this.enemyTooltip = null;
        }
        
        if (this.matchupPreview) {
            this.matchupPreview.destroy();
            this.matchupPreview = null;
        }
        
        // Clean up debug menu
        if (this.debugMenu) {
            this.debugMenu.destroy();
            this.debugMenu = null;
        }
    }
} 
