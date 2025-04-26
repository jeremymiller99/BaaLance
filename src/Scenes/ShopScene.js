class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
        
        // UI constants - simplified
        this.UI = {
            COLORS: {
                BACKGROUND: 0x2a1a0a,
                BACKGROUND_ALPHA: 0.7,
                TEXT: '#FFD700',
                TEXT_SECONDARY: '#ffffff',
                WOOD_PRIMARY: 0x8B4513,
                WOOD_SECONDARY: 0x5c4033,
                WOOD_BORDER: 0x3c2a21,
                WOOD_GRAIN: 0x3c2a21,
                BUTTON_BG: 0x8B4513,
                BUTTON_HOVER: 0x654321,
                BUTTON_ACTIVE: 0x4e3524,
                METAL: 0x696969,
                METAL_DARK: 0x444444,
                GOLD: 0xFFD700
            },
            FONTS: {
                FAMILY: 'Georgia, serif',
                SIZES: {
                    TITLE: '32px',
                    HEADER: '24px',
                    BODY: '20px'
                }
            },
            PANEL: {
                WIDTH: 900,
                HEIGHT: 600,
                PADDING: 20
            }
        };
        
        this.skinSystem = null;
        this.weaponSystem = null;
        this.selectedCategory = 'skins';
        this.playerMoney = 0;
        
        // Debug menu
        this.debugMenu = null;
    }
    
    create() {
        // Get game dimensions
        const { width, height } = this.cameras.main;
        
        // Initialize or re-init audio system for this scene
        if (audioSystem) {
            audioSystem.scene = this;
            audioSystem.init();
        }
        
        // Initialize systems
        this.skinSystem = new SkinSystem(this);
        this.weaponSystem = new WeaponSystem(this);
        
        // Validate playerState exists
        if (typeof playerState === 'undefined' || !playerState.getState) {
            console.error('playerState is not defined');
            window.playerState = this.createFallbackPlayerState();
        }
        
        // Load player data
        this.playerMoney = playerState.getState().money;
        
        // Load weapon state from PlayerState
        this.weaponSystem.loadWeaponState(playerState.getState());
        
        // Sync unlocked items
        this.syncUnlockedItems();
        
        // Create basic UI elements
        this.createBackground();
        this.createMainPanel();
        
        // Show default category
        this.showCategory('skins');
        
        // Initialize debug menu
        this.debugMenu = new DebugMenu(this);
        this.debugMenu.create();
    }
    
    createFallbackPlayerState() {
        return {
            getState: () => ({ 
                money: 0, 
                skins: {}, 
                equipment: { currentLance: null },
                weapons: {}
            }),
            updateMoney: () => {},
            unlockSkin: () => {},
            setCurrentSkin: () => {},
            unlockWeapon: () => {},
            setCurrentLance: () => {},
            addSkin: () => {}
        };
    }
    
    createBackground() {
        const { width, height } = this.cameras.main;
        
        this.add.image(0, 0, 'bg')
            .setOrigin(0, 0)
            .setDisplaySize(width, height);
            
        this.add.rectangle(0, 0, width, height, 0x000000, 0.3)
            .setOrigin(0, 0);
    }
    
    createMainPanel() {
        const { width, height } = this.cameras.main;
        const { PANEL, COLORS, FONTS } = this.UI;
        
        // Main panel
        this.mainPanel = this.add.container(width/2, height/2);
        
        // Panel background with wood texture
        const panel = this.add.rectangle(0, 0, PANEL.WIDTH, PANEL.HEIGHT, COLORS.WOOD_SECONDARY, 1);
        panel.setStrokeStyle(6, COLORS.WOOD_BORDER);
        this.mainPanel.add(panel);
        
        // Add wood grain texture
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.4);
        
        // Create horizontal wood grain lines
        for (let i = -PANEL.HEIGHT/2 + 15; i < PANEL.HEIGHT/2; i += 20) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-PANEL.WIDTH/2 + 10, i);
            
            for (let x = -PANEL.WIDTH/2 + 30; x < PANEL.WIDTH/2; x += 40) {
                const yOffset = Phaser.Math.Between(-5, 5);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        this.mainPanel.add(grainGraphics);
        
        // Add decorative nails/metal fixtures in the corners
        const cornerOffset = 25;
        const cornerPositions = [
            {x: -PANEL.WIDTH/2 + cornerOffset, y: -PANEL.HEIGHT/2 + cornerOffset},
            {x: PANEL.WIDTH/2 - cornerOffset, y: -PANEL.HEIGHT/2 + cornerOffset},
            {x: -PANEL.WIDTH/2 + cornerOffset, y: PANEL.HEIGHT/2 - cornerOffset},
            {x: PANEL.WIDTH/2 - cornerOffset, y: PANEL.HEIGHT/2 - cornerOffset}
        ];
        
        cornerPositions.forEach(pos => {
            // Metal plate
            const plate = this.add.circle(pos.x, pos.y, 10, COLORS.METAL, 1);
            plate.setStrokeStyle(1, COLORS.METAL_DARK);
            this.mainPanel.add(plate);
            
            // Center nail/rivet
            const nail = this.add.circle(pos.x, pos.y, 4, 0x999999, 1);
            nail.setStrokeStyle(1, 0x777777);
            this.mainPanel.add(nail);
        });
        
        // Create title banner
        const titleWidth = PANEL.WIDTH * 0.6;
        const titleHeight = 60;
        const titleY = -PANEL.HEIGHT/2 - 10;
        
        const titleBg = this.add.rectangle(0, titleY, titleWidth, titleHeight, COLORS.WOOD_PRIMARY, 1);
        titleBg.setStrokeStyle(4, COLORS.WOOD_BORDER);
        this.mainPanel.add(titleBg);
        
        // Add wood grain to title banner
        const titleGrain = this.add.graphics();
        titleGrain.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        for (let i = -titleHeight/2 + 5; i < titleHeight/2; i += 8) {
            titleGrain.beginPath();
            titleGrain.moveTo(-titleWidth/2 + 5, titleY + i);
            
            for (let x = -titleWidth/2 + 10; x < titleWidth/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                titleGrain.lineTo(x, titleY + i + yOffset);
            }
            
            titleGrain.strokePath();
        }
        this.mainPanel.add(titleGrain);
        
        // Add title text
        const title = this.add.text(0, titleY, "SHOP", {
            fontSize: '28px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        title.setShadow(2, 2, '#000000', 3);
        this.mainPanel.add(title);
        
        // Money display with coin icon
        this.moneyText = this.add.text(
            PANEL.WIDTH/2 - 30, 
            -PANEL.HEIGHT/2 + 30, 
            `${this.playerMoney} coins`, 
            {
                fontSize: '24px',
                fontFamily: FONTS.FAMILY,
                color: COLORS.GOLD,
                fontStyle: 'bold'
            }
        ).setOrigin(1, 0.5);
        this.moneyText.setShadow(2, 2, '#000000', 2);
        
        // Add coin icon
        const coinIcon = this.add.graphics();
        coinIcon.fillStyle(COLORS.GOLD, 1);
        coinIcon.fillCircle(PANEL.WIDTH/2 - 10, -PANEL.HEIGHT/2 + 30, 12);
        coinIcon.lineStyle(2, 0x000000, 1);
        coinIcon.strokeCircle(PANEL.WIDTH/2 - 10, -PANEL.HEIGHT/2 + 30, 12);
        
        this.mainPanel.add([this.moneyText, coinIcon]);
        
        // Category buttons
        this.createCategoryButtons();
        
        // Items grid
        this.itemsContainer = this.add.container(0, 20);
        this.mainPanel.add(this.itemsContainer);
        
        // Preview container
        this.previewContainer = this.add.container(-PANEL.WIDTH/4 - 50, 50);
        this.mainPanel.add(this.previewContainer);
        
        // Return button
        this.createReturnButton();
    }
    
    createCategoryButtons() {
        const { PANEL, COLORS, FONTS } = this.UI;
        
        // Categories
        const categories = [
            { id: 'skins', name: 'Character Skins' },
            { id: 'weapons', name: 'Weapons' }
        ];
        
        // Create container
        this.categoryButtons = [];
        const buttonContainer = this.add.container(0, -PANEL.HEIGHT/2 + 100);
        
        // Add buttons
        categories.forEach((category, index) => {
            const xPos = index === 0 ? -120 : 120;
            
            const button = this.add.container(xPos, 0);
            button.categoryId = category.id;
            
            // Button background
            const bg = this.add.rectangle(0, 0, 200, 40, COLORS.BUTTON_BG, 1)
                .setStrokeStyle(3, COLORS.WOOD_BORDER);
            
            // Add wood grain texture
            const grainGraphics = this.add.graphics();
            grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
            
            for (let i = -20 + 5; i < 20; i += 8) {
                grainGraphics.beginPath();
                grainGraphics.moveTo(-100 + 5, i);
                
                for (let x = -100 + 10; x < 100; x += 15) {
                    const yOffset = Phaser.Math.Between(-1, 1);
                    grainGraphics.lineTo(x, i + yOffset);
                }
                
                grainGraphics.strokePath();
            }
            
            // Button text
            const text = this.add.text(0, 0, category.name, {
                fontSize: FONTS.SIZES.BODY,
                fontFamily: FONTS.FAMILY,
                color: COLORS.TEXT
            }).setOrigin(0.5);
            text.setShadow(1, 1, '#000000', 2);
            
            // Make interactive
            bg.setInteractive()
                .on('pointerover', () => {
                    bg.fillColor = COLORS.BUTTON_HOVER;
                    text.setScale(1.1);
                })
                .on('pointerout', () => {
                    bg.fillColor = COLORS.BUTTON_BG;
                    text.setScale(1);
                })
                .on('pointerdown', () => {
                    // Play click sound
                    if (audioSystem) {
                        audioSystem.playClick();
                    }
                    this.showCategory(category.id);
                });
            
            button.add([bg, grainGraphics, text]);
            this.categoryButtons.push(button);
            buttonContainer.add(button);
        });
        
        this.mainPanel.add(buttonContainer);
    }
    
    createReturnButton() {
        const { PANEL, COLORS, FONTS } = this.UI;
        
        const button = this.add.container(0, PANEL.HEIGHT/2 - 40);
        
        // Button background with wood texture
        const bg = this.add.rectangle(0, 0, 200, 50, COLORS.WOOD_PRIMARY, 1)
            .setStrokeStyle(4, COLORS.WOOD_BORDER);
        
        // Add wood grain texture
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        for (let i = -25 + 5; i < 25; i += 8) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-100 + 5, i);
            
            for (let x = -100 + 10; x < 100; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        
        // Button text
        const text = this.add.text(0, 0, "Return", {
            fontSize: FONTS.SIZES.HEADER,
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        text.setShadow(2, 2, '#000000', 2);
        
        // Make interactive
        bg.setInteractive()
            .on('pointerover', () => {
                bg.fillColor = COLORS.BUTTON_HOVER;
                text.setScale(1.1);
            })
            .on('pointerout', () => {
                bg.fillColor = COLORS.WOOD_PRIMARY;
                text.setScale(1);
            })
            .on('pointerdown', () => {
                // Play click sound
                if (audioSystem) {
                    audioSystem.playClick();
                    // Fade out all sounds
                    audioSystem.fadeOutAllSounds(300);
                }
                this.scene.start('MainLoop');
            });
        
        button.add([bg, grainGraphics, text]);
        this.mainPanel.add(button);
    }
    
    showCategory(categoryId) {
        // Update selected category
        this.selectedCategory = categoryId;
        
        // Update button styling
        this.categoryButtons.forEach(button => {
            const isSelected = button.categoryId === categoryId;
            const bg = button.getAt(0);
            
            bg.fillColor = isSelected ? this.UI.COLORS.BUTTON_ACTIVE : this.UI.COLORS.BUTTON_BG;
            bg.lineWidth = isSelected ? 3 : 2;
        });
        
        // Clear item grid
        this.itemsContainer.removeAll(true);
        
        // Clear preview
        this.previewContainer.removeAll(true);
        
        // Update item grid
        this.createItemsGrid();
    }
    
    createItemsGrid() {
        const { COLORS, FONTS } = this.UI;
        
        // Get items based on category
        let items = [];
        
        if (this.selectedCategory === 'skins') {
            const allSkins = this.skinSystem.getAllSkins();
            items = Object.keys(allSkins).map(id => ({
                id,
                ...allSkins[id]
            }));
        } else {
            const allWeapons = this.weaponSystem.getAllWeapons();
            items = Object.keys(allWeapons).map(id => ({
                id,
                ...allWeapons[id]
            }));
        }
        
        // Current player state
        const playerData = playerState.getState();
        
        // Create scrollable grid
        const gridContainer = this.add.container(200, 0);
        this.itemsContainer.add(gridContainer);
        
        // Create items
        const itemsPerRow = 3;
        const itemWidth = 150;
        const itemHeight = 170;
        const padding = 15;
        
        items.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            
            const x = (col * (itemWidth + padding)) - ((itemsPerRow-1) * (itemWidth + padding) / 2);
            const y = (row * (itemHeight + padding)) - 80;
            
            // Check if unlocked
            const isUnlocked = this.isItemUnlocked(item.id, playerData);
            
            // Create item container with medieval scroll/banner styling
            const itemContainer = this.add.container(x, y);
            
            // Item background - wooden panel
            const bg = this.add.rectangle(0, 0, itemWidth, itemHeight, isUnlocked ? COLORS.WOOD_SECONDARY : 0x333333, 1);
            bg.setStrokeStyle(3, isUnlocked ? COLORS.WOOD_BORDER : 0x222222);
            itemContainer.add(bg);
            
            // Add wood grain if unlocked
            if (isUnlocked) {
                const grainGraphics = this.add.graphics();
                grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
                
                for (let i = -itemHeight/2 + 10; i < itemHeight/2; i += 12) {
                    grainGraphics.beginPath();
                    grainGraphics.moveTo(-itemWidth/2 + 5, i);
                    
                    for (let x = -itemWidth/2 + 10; x < itemWidth/2; x += 15) {
                        const yOffset = Phaser.Math.Between(-1, 1);
                        grainGraphics.lineTo(x, i + yOffset);
                    }
                    
                    grainGraphics.strokePath();
                }
                itemContainer.add(grainGraphics);
            }
            
            // Add decorative nails in corners
            const cornerOffset = 10;
            const cornerPositions = [
                {x: -itemWidth/2 + cornerOffset, y: -itemHeight/2 + cornerOffset},
                {x: itemWidth/2 - cornerOffset, y: -itemHeight/2 + cornerOffset},
                {x: -itemWidth/2 + cornerOffset, y: itemHeight/2 - cornerOffset},
                {x: itemWidth/2 - cornerOffset, y: itemHeight/2 - cornerOffset}
            ];
            
            cornerPositions.forEach(pos => {
                const nail = this.add.circle(pos.x, pos.y, 3, isUnlocked ? COLORS.METAL : 0x444444, 1);
                nail.setStrokeStyle(1, isUnlocked ? COLORS.METAL_DARK : 0x333333);
                itemContainer.add(nail);
            });
            
            // Item image
            let itemImage;
            const key = this.selectedCategory === 'skins' ? (item.key || 'sheep1_default') : (item.key || 'lance_default');
            const frame = this.selectedCategory === 'skins' ? (item.defaultFrame || 0) : undefined;
            
            try {
                itemImage = this.add.sprite(0, -30, key, frame).setScale(0.25);
                
                // Apply rotation only to lances (weapons), not character skins
                if (this.selectedCategory === 'weapons') {
                    itemImage.setRotation(Math.PI / 4); // 45 degrees in radians
                    itemImage.setScale(0.2); // Make lances slightly smaller
                }
                
                if (!isUnlocked) itemImage.setTint(0x777777);
                itemContainer.add(itemImage);
            } catch (error) {
                console.error(`Error creating image: ${key}`, error);
                itemContainer.add(this.add.rectangle(0, -30, 50, 50, 0xAA0000));
            }
            
            // Item name
            const nameText = this.add.text(0, 25, item.name || 'Unknown', {
                fontSize: '16px',
                fontFamily: FONTS.FAMILY,
                color: isUnlocked ? COLORS.TEXT : '#888888',
                fontStyle: isUnlocked ? 'bold' : 'normal'
            }).setOrigin(0.5);
            
            if (isUnlocked) {
                nameText.setShadow(1, 1, '#000000', 1);
            }
            
            itemContainer.add(nameText);
            
            // Price or status
            const priceText = isUnlocked ? 
                'OWNED' : 
                `${item.price || 0} coins`;
                
            const priceTextObj = this.add.text(0, 50, priceText, {
                fontSize: '14px',
                fontFamily: FONTS.FAMILY,
                color: isUnlocked ? '#FFFFFF' : COLORS.GOLD
            }).setOrigin(0.5);
            
            if (!isUnlocked) {
                priceTextObj.setShadow(1, 1, '#000000', 1);
            }
            
            itemContainer.add(priceTextObj);
            
            // Action button
            const buttonText = !isUnlocked ? "Purchase" : 
                (this.isItemSelected(item.id, playerData) ? "Equipped" : "Select");
                
            const buttonColor = !isUnlocked ? COLORS.BUTTON_BG : 
                (buttonText === "Equipped" ? 0x006600 : COLORS.BUTTON_BG);
                
            const actionBtn = this.add.rectangle(0, 80, 100, 30, buttonColor, 1)
                .setStrokeStyle(2, isUnlocked ? COLORS.WOOD_BORDER : 0x000000);
                
            // Add wood grain to button if unlocked
            if (isUnlocked) {
                const buttonGrain = this.add.graphics();
                buttonGrain.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
                
                for (let i = -15 + 3; i < 15; i += 5) {
                    buttonGrain.beginPath();
                    buttonGrain.moveTo(-50 + 3, 80 + i);
                    
                    for (let x = -50 + 6; x < 50; x += 10) {
                        const yOffset = Phaser.Math.Between(-1, 1);
                        buttonGrain.lineTo(x, 80 + i + yOffset);
                    }
                    
                    buttonGrain.strokePath();
                }
                itemContainer.add(buttonGrain);
            }
                
            const actionBtnText = this.add.text(0, 80, buttonText, {
                fontSize: '14px',
                fontFamily: FONTS.FAMILY,
                color: '#FFFFFF'
            }).setOrigin(0.5);
            actionBtnText.setShadow(1, 1, '#000000', 1);
            
            itemContainer.add([actionBtn, actionBtnText]);
            
            // Add lock icon for locked items
            if (!isUnlocked) {
                const lockContainer = this.add.container(itemWidth/2 - 20, -itemHeight/2 + 20);
                
                // Metal plate behind lock
                const lockPlate = this.add.circle(0, 0, 10, COLORS.METAL, 1);
                lockPlate.setStrokeStyle(1, COLORS.METAL_DARK);
                lockContainer.add(lockPlate);
                
                // Lock symbol
                const lockText = this.add.text(0, 0, '🔒', {
                    fontSize: '12px',
                    fontFamily: FONTS.FAMILY
                }).setOrigin(0.5);
                lockContainer.add(lockText);
                
                itemContainer.add(lockContainer);
            }
            
            // Make interactive
            if (!isUnlocked || buttonText === "Select") {
                actionBtn.setInteractive()
                    .on('pointerover', () => {
                        actionBtn.fillColor = COLORS.BUTTON_HOVER;
                        actionBtnText.setScale(1.1);
                    })
                    .on('pointerout', () => {
                        actionBtn.fillColor = buttonColor;
                        actionBtnText.setScale(1);
                    })
                    .on('pointerdown', () => {
                        // Play click sound
                        if (audioSystem) {
                            audioSystem.playClick();
                        }
                        
                        if (!isUnlocked) {
                            this.purchaseItem(item);
                        } else {
                            this.selectItem(item);
                        }
                    });
            }
            
            // Make whole item clickable for preview
            bg.setInteractive()
                .on('pointerover', () => {
                    if (isUnlocked) bg.fillColor = 0x6c5043;
                })
                .on('pointerout', () => {
                    if (isUnlocked) bg.fillColor = COLORS.WOOD_SECONDARY;
                })
                .on('pointerdown', () => {
                    // Play click sound
                    if (audioSystem) {
                        audioSystem.playClick();
                    }
                    this.previewItem(item);
                });
            
            gridContainer.add(itemContainer);
        });
        
        // If we have items, preview the first one
        if (items.length > 0) {
            this.previewItem(items[0]);
        }
    }
    
    previewItem(item) {
        if (!item) return;
        
        // Clear preview container
        this.previewContainer.removeAll(true);
        
        const { COLORS, FONTS } = this.UI;
        
        // Preview wooden background
        const previewWidth = 240;
        const previewHeight = 320;
        
        const previewBg = this.add.rectangle(0, 0, previewWidth, previewHeight, COLORS.WOOD_SECONDARY, 1);
        previewBg.setStrokeStyle(4, COLORS.WOOD_BORDER);
        this.previewContainer.add(previewBg);
        
        // Add wood grain
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        for (let i = -previewHeight/2 + 15; i < previewHeight/2; i += 20) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-previewWidth/2 + 10, i);
            
            for (let x = -previewWidth/2 + 30; x < previewWidth/2; x += 40) {
                const yOffset = Phaser.Math.Between(-5, 5);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        this.previewContainer.add(grainGraphics);
        
        // Add corner decorations
        const cornerOffset = 15;
        const cornerPositions = [
            {x: -previewWidth/2 + cornerOffset, y: -previewHeight/2 + cornerOffset},
            {x: previewWidth/2 - cornerOffset, y: -previewHeight/2 + cornerOffset},
            {x: -previewWidth/2 + cornerOffset, y: previewHeight/2 - cornerOffset},
            {x: previewWidth/2 - cornerOffset, y: previewHeight/2 - cornerOffset}
        ];
        
        cornerPositions.forEach(pos => {
            // Metal plate
            const plate = this.add.circle(pos.x, pos.y, 8, COLORS.METAL, 1);
            plate.setStrokeStyle(1, COLORS.METAL_DARK);
            this.previewContainer.add(plate);
            
            // Nail
            const nail = this.add.circle(pos.x, pos.y, 3, 0x999999, 1);
            nail.setStrokeStyle(1, 0x777777);
            this.previewContainer.add(nail);
        });
        
        // Add preview title banner
        const titleBanner = this.add.rectangle(0, -previewHeight/2 + 30, previewWidth * 0.7, 40, COLORS.WOOD_PRIMARY, 1);
        titleBanner.setStrokeStyle(3, COLORS.WOOD_BORDER);
        this.previewContainer.add(titleBanner);
        
        const title = this.add.text(0, -previewHeight/2 + 30, "PREVIEW", {
            fontSize: '22px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        title.setShadow(2, 2, '#000000', 2);
        this.previewContainer.add(title);
        
        // Item image
        const key = this.selectedCategory === 'skins' ? (item.key || 'sheep1_default') : (item.key || 'lance_default');
        const frame = this.selectedCategory === 'skins' ? (item.defaultFrame || 0) : undefined;
        
        try {
            const itemImage = this.add.sprite(0, -50, key, frame).setScale(0.35);
            
            // Apply rotation only to lances (weapons), not character skins
            if (this.selectedCategory === 'weapons') {
                itemImage.setRotation(Math.PI / 4); // 45 degrees in radians
                itemImage.setScale(0.3);
            }
            
            // Try to play animation if available
            if (this.selectedCategory === 'skins' && item.animations && item.animations.length > 0) {
                try {
                    const anim = item.animations[0];
                    if (typeof anim === 'string' && this.anims.exists(anim)) {
                        itemImage.play(anim);
                    }
                } catch (e) {
                    console.error('Animation error:', e);
                }
            }
            
            this.previewContainer.add(itemImage);
        } catch (error) {
            console.error(`Preview image error: ${key}`, error);
            this.previewContainer.add(this.add.rectangle(0, -50, 100, 100, 0xAA0000));
        }
        
        // Item name
        const nameText = this.add.text(0, 40, item.name || 'Unknown Item', {
            fontSize: '22px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        nameText.setShadow(2, 2, '#000000', 2);
        this.previewContainer.add(nameText);
        
        // Item description
        if (item.description) {
            this.previewContainer.add(
                this.add.text(0, 80, item.description, {
                    fontSize: '16px',
                    fontFamily: FONTS.FAMILY,
                    color: COLORS.TEXT_SECONDARY,
                    wordWrap: { width: 200 },
                    align: 'center'
                }).setOrigin(0.5, 0)
            );
        }
    }
    
    isItemUnlocked(itemId, playerData) {
        if (this.selectedCategory === 'skins') {
            return playerData.skins && playerData.skins[itemId];
        } else {
            return playerData.weapons && playerData.weapons[itemId];
        }
    }
    
    isItemSelected(itemId, playerData) {
        if (this.selectedCategory === 'skins') {
            return playerData.currentSkin === itemId;
        } else {
            return playerData.equipment && 
                   playerData.equipment.currentLance === itemId;
        }
    }
    
    purchaseItem(item) {
        if (!item.price || item.price <= 0) {
            console.error('Invalid item price:', item);
            return;
        }
        
        if (this.playerMoney >= item.price) {
            // Deduct money
            this.playerMoney -= item.price;
            playerState.updateMoney(-item.price);
            
            // Update money display
            this.moneyText.setText(`${this.playerMoney} coins`);
            
            // Unlock item
            if (this.selectedCategory === 'skins') {
                playerState.unlockSkin(item.id);
                playerState.setCurrentSkin(item.id);
            } else {
                playerState.unlockWeapon(item.id);
                playerState.setCurrentLance(item.id);
            }
            
            // Play purchase sound
            if (audioSystem) {
                audioSystem.playSfx('buy');
            }
            
            // Show success message
            this.showMessage(`You've acquired: ${item.name}!`, true);
            
            // Refresh the display
            this.showCategory(this.selectedCategory);
        } else {
            // Play error click for insufficient funds
            if (audioSystem) {
                audioSystem.playSfx('qteMistake');
            }
            
            // Show insufficient funds message
            this.showMessage("You don't have enough coins for this purchase.", false);
        }
    }
    
    selectItem(item) {
        if (!item || !item.id) return;
        
        // For debugging
        console.log(`Selecting item: ${item.id} in category: ${this.selectedCategory}`);
        console.log(`Player state before selection:`, playerState.getState());
        
        // Update player state
        if (this.selectedCategory === 'skins') {
            playerState.setCurrentSkin(item.id);
        } else {
            playerState.setCurrentLance(item.id);
        }
        
        // Play equip sound
        if (audioSystem) {
            audioSystem.playSfx('equip');
        }
        
        // For debugging
        console.log(`Player state after selection:`, playerState.getState());
        
        // Refresh the display to update button states
        this.showCategory(this.selectedCategory);
        
        // Show equipped message
        this.showMessage(`${item.name} equipped!`, true);
    }
    
    showMessage(message, isSuccess) {
        const { width, height } = this.cameras.main;
        const { COLORS, FONTS } = this.UI;
        
        // Create message container
        const msgContainer = this.add.container(width/2, height/2);
        
        // Backdrop overlay
        const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setInteractive()
            .setOrigin(0.5);
        msgContainer.add(backdrop);
        
        // Message wooden panel
        const msgWidth = 400;
        const msgHeight = 230;
        
        const panel = this.add.rectangle(0, 0, msgWidth, msgHeight, COLORS.WOOD_SECONDARY, 1)
            .setStrokeStyle(5, COLORS.WOOD_BORDER);
        msgContainer.add(panel);
        
        // Add wood grain texture
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        for (let i = -msgHeight/2 + 10; i < msgHeight/2; i += 15) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-msgWidth/2 + 10, i);
            
            for (let x = -msgWidth/2 + 20; x < msgWidth/2; x += 30) {
                const yOffset = Phaser.Math.Between(-2, 2);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        msgContainer.add(grainGraphics);
        
        // Add decorative corners
        const cornerOffset = 20;
        const cornerPositions = [
            {x: -msgWidth/2 + cornerOffset, y: -msgHeight/2 + cornerOffset},
            {x: msgWidth/2 - cornerOffset, y: -msgHeight/2 + cornerOffset},
            {x: -msgWidth/2 + cornerOffset, y: msgHeight/2 - cornerOffset},
            {x: msgWidth/2 - cornerOffset, y: msgHeight/2 - cornerOffset}
        ];
        
        cornerPositions.forEach(pos => {
            // Metal plate
            const plate = this.add.circle(pos.x, pos.y, 8, COLORS.METAL, 1);
            plate.setStrokeStyle(1, COLORS.METAL_DARK);
            msgContainer.add(plate);
            
            // Nail
            const nail = this.add.circle(pos.x, pos.y, 3, 0x999999, 1);
            nail.setStrokeStyle(1, 0x777777);
            msgContainer.add(nail);
        });
        
        // Title text with appropriate color
        const titleText = this.add.text(0, -60, isSuccess ? "Purchase Successful!" : "Insufficient Funds", {
            fontSize: '28px',
            fontFamily: FONTS.FAMILY,
            color: isSuccess ? COLORS.TEXT : '#FF4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        titleText.setShadow(2, 2, '#000000', 3);
        msgContainer.add(titleText);
        
        // Message text
        const msgText = this.add.text(0, -10, message, {
            fontSize: '20px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT_SECONDARY,
            align: 'center',
            wordWrap: { width: 350 }
        }).setOrigin(0.5);
        msgContainer.add(msgText);
        
        // Close button - wooden style
        const buttonWidth = 150;
        const buttonHeight = 50;
        const buttonY = 60;
        
        const closeBtn = this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, COLORS.WOOD_PRIMARY, 1)
            .setStrokeStyle(3, COLORS.WOOD_BORDER);
        
        // Add wood grain to button
        const buttonGrain = this.add.graphics();
        buttonGrain.lineStyle(1, COLORS.WOOD_GRAIN, 0.3);
        
        for (let i = -buttonHeight/2 + 5; i < buttonHeight/2; i += 8) {
            buttonGrain.beginPath();
            buttonGrain.moveTo(-buttonWidth/2 + 5, buttonY + i);
            
            for (let x = -buttonWidth/2 + 10; x < buttonWidth/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                buttonGrain.lineTo(x, buttonY + i + yOffset);
            }
            
            buttonGrain.strokePath();
        }
        msgContainer.add(buttonGrain);
        
        const closeBtnText = this.add.text(0, buttonY, "Continue", {
            fontSize: '22px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        closeBtnText.setShadow(2, 2, '#000000', 2);
        
        msgContainer.add([closeBtn, closeBtnText]);
        
        // Button interactivity
        closeBtn.setInteractive()
            .on('pointerover', () => {
                closeBtn.fillColor = COLORS.BUTTON_HOVER;
                closeBtnText.setScale(1.1);
            })
            .on('pointerout', () => {
                closeBtn.fillColor = COLORS.WOOD_PRIMARY;
                closeBtnText.setScale(1);
            })
            .on('pointerdown', () => msgContainer.destroy());
    }
    
    syncUnlockedItems() {
        // Sync skins
        const skins = this.skinSystem.getAllSkins();
        const playerData = playerState.getState();
        
        // Initialize skins if not exists
        if (!playerData.skins) {
            playerData.skins = {};
        }
        
        // Sync skins in both directions
        Object.keys(skins).forEach(skinId => {
            if (skins[skinId].unlocked) {
                playerState.addSkin(skinId);
            }
            if (playerData.skins[skinId]) {
                this.skinSystem.unlockSkin(skinId);
            }
        });
        
        // Sync weapons
        const weapons = this.weaponSystem.getAllWeapons();
        
        // Sync weapons from WeaponSystem to PlayerState
        if (!playerData.weapons) {
            playerData.weapons = {};
        }
        
        // Sync in both directions
        Object.keys(weapons).forEach(weaponId => {
            if (weapons[weaponId].unlocked) {
                playerState.unlockWeapon(weaponId);
            }
            if (playerData.weapons[weaponId]) {
                this.weaponSystem.unlockWeapon(weaponId);
            }
        });
        
        // Set default weapon if none selected
        if (!playerData.equipment.currentLance && Object.keys(playerData.weapons).some(id => playerData.weapons[id])) {
            const firstUnlockedWeapon = Object.keys(playerData.weapons).find(id => playerData.weapons[id]);
            playerData.equipment.currentLance = firstUnlockedWeapon;
        }
        
        console.log('Item systems synchronized');
    }
    
    shutdown() {
        // Clean up references to avoid memory leaks
        if (this.previewContainer) {
            this.previewContainer.removeAll(true);
        }
        
        if (this.itemsContainer) {
            this.itemsContainer.removeAll(true);
        }
        
        if (this.mainPanel) {
            this.mainPanel.removeAll(true);
        }
        
        // Clean up debug menu
        if (this.debugMenu) {
            this.debugMenu.destroy();
            this.debugMenu = null;
        }
    }
} 