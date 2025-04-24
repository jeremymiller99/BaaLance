class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
        
        // UI constants
        this.UI = {
            COLORS: {
                WOOD_PRIMARY: 0x8B4513,
                WOOD_SECONDARY: 0x663300,
                PANEL_BG: 0x5e4130,
                TEXT: '#FFFFFF',
                TEXT_SECONDARY: '#DDDDDD',
                BUTTON: 0x8B5A2B,
                BUTTON_HOVER: 0x9E6B38,
                BUTTON_DISABLED: 0x666666,
                GOLD: 0xFFD700
            },
            FONTS: {
                FAMILY: 'Arial'
            },
            PANEL: {
                WIDTH: 1000,
                HEIGHT: 600
            }
        };
        
        this.skinSystem = null;
        this.containerElements = [];
        this.shopItems = {
            skins: [],
            lances: []
        };
        
        this.selectedCategory = 'skins';
        this.previewContainer = null;
        this.previewCharacter = null;
        this.previewWeapon = null;
        
        this.categoryButtons = [];
        this.itemButtons = [];
        
        this.playerMoney = 0;
        this.moneyText = null;
    }
    
    create() {
        // Get game dimensions
        const { width: w, height: h } = this.cameras.main;
        
        // Initialize systems
        this.skinSystem = new SkinSystem(this);
        this.weaponSystem = new WeaponSystem(this);
        
        // Load player data
        this.skinSystem.loadSkinState(playerState.getState());
        this.playerMoney = playerState.getState().money;
        
        // Ensure any unlocked skins in SkinSystem are also in PlayerState
        this.syncUnlockedSkinsToPlayerState();
        
        // Create background
        this.createBackground();
        
        // Create main shop panel
        const shopPanel = this.createShopPanel();
        this.containerElements.push(shopPanel);
        
        // Create category selection buttons
        this.createCategoryButtons(shopPanel);
        
        // Create item display grid - now taking the full panel
        this.createItemsGrid(shopPanel);
        
        // Create return button at bottom
        this.createReturnButton();
        
        // Default to showing skins first
        this.showCategory('skins');
    }
    
    createBackground() {
        const { width: w, height: h } = this.cameras.main;
        
        // Add background image
        this.background = this.add.image(w/2, h/2, 'bg');
        this.background.setDisplaySize(w, h);
        
        // Add semi-transparent overlay for better UI contrast
        const overlay = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.5);
        
        this.containerElements.push(this.background, overlay);
    }
    
    createShopPanel() {
        const { width: w, height: h } = this.cameras.main;
        const { COLORS, PANEL } = this.UI;
        
        // Create main wooden panel for shop
        const shopPanel = this.createWoodenPanel(w/2, h/2, PANEL.WIDTH, PANEL.HEIGHT, "SHOP");
        
        // Add player money display at top right
        this.moneyText = this.add.text(
            PANEL.WIDTH/2 - 30, 
            -PANEL.HEIGHT/2 + 30, 
            `${this.playerMoney} coins`, 
            {
                fontSize: '24px',
                fontFamily: this.UI.FONTS.FAMILY,
                color: this.UI.COLORS.GOLD
            }
        ).setOrigin(1, 0.5);
        
        // Add coin icon
        const coinIcon = this.add.graphics();
        coinIcon.fillStyle(this.UI.COLORS.GOLD, 1);
        coinIcon.fillCircle(PANEL.WIDTH/2 - 10, -PANEL.HEIGHT/2 + 30, 12);
        coinIcon.lineStyle(2, 0x000000, 1);
        coinIcon.strokeCircle(PANEL.WIDTH/2 - 10, -PANEL.HEIGHT/2 + 30, 12);
        
        shopPanel.add([this.moneyText, coinIcon]);
        
        return shopPanel;
    }
    
    createWoodenPanel(x, y, width, height, titleText = null) {
        const { COLORS } = this.UI;
        
        const container = this.add.container(x, y);
        
        // Create wooden panel background
        const panelBg = this.add.rectangle(0, 0, width, height, COLORS.PANEL_BG);
        panelBg.setStrokeStyle(6, COLORS.WOOD_PRIMARY);
        container.add(panelBg);
        
        // Create wooden frame
        const frameWidth = 20;
        const frameGraphics = this.add.graphics();
        
        // Draw outer frame
        frameGraphics.fillStyle(COLORS.WOOD_PRIMARY);
        
        // Top frame
        frameGraphics.fillRect(-width/2, -height/2, width, frameWidth);
        
        // Bottom frame
        frameGraphics.fillRect(-width/2, height/2 - frameWidth, width, frameWidth);
        
        // Left frame
        frameGraphics.fillRect(-width/2, -height/2, frameWidth, height);
        
        // Right frame
        frameGraphics.fillRect(width/2 - frameWidth, -height/2, frameWidth, height);
        
        // Add wood grain to frame
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_SECONDARY, 0.5);
        
        // Horizontal grain lines
        for (let i = -height/2 + 5; i < height/2; i += 8) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-width/2 + 5, i);
            
            for (let x = -width/2 + 10; x < width/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        
        container.add([frameGraphics, grainGraphics]);
        
        // Add title if provided
        if (titleText) {
            // Create title background at the top
            const titleHeight = 50;
            const titleWidth = width * 0.6;
            const titleY = -height/2;
            
            const titleBg = this.add.rectangle(0, titleY, titleWidth, titleHeight, COLORS.WOOD_PRIMARY);
            titleBg.y += titleHeight/2;
            
            // Add wood grain to title
            const titleGrainGraphics = this.add.graphics();
            titleGrainGraphics.lineStyle(1, COLORS.WOOD_SECONDARY, 0.5);
            
            for (let i = -titleHeight/2 + 5; i < titleHeight/2; i += 8) {
                titleGrainGraphics.beginPath();
                titleGrainGraphics.moveTo(-titleWidth/2 + 5, -height/2 + 40 + i);
                
                for (let x = -titleWidth/2 + 10; x < titleWidth/2; x += 15) {
                    const yOffset = Phaser.Math.Between(-1, 1);
                    titleGrainGraphics.lineTo(x, -height/2 + 40 + i + yOffset);
                }
                
                titleGrainGraphics.strokePath();
            }
            
            // Title text
            const title = this.add.text(0, -height/2 + 40, titleText, {
                fontSize: '32px',
                fontFamily: this.UI.FONTS.FAMILY,
                color: this.UI.COLORS.TEXT,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            title.setShadow(2, 2, '#000000', 3);
            
            container.add([titleBg, titleGrainGraphics, title]);
        }
        
        return container;
    }
    
    createWoodenButton(container, x, y, text, width, height, callback) {
        const { COLORS, FONTS } = this.UI;
        
        // Create button container
        const buttonContainer = this.add.container(x, y);
        
        // Create wooden button background
        const button = this.add.rectangle(0, 0, width, height, COLORS.BUTTON);
        button.setStrokeStyle(4, COLORS.WOOD_PRIMARY);
        buttonContainer.add(button);
        
        // Add wood grain effect
        const grainGraphics = this.add.graphics();
        grainGraphics.lineStyle(1, COLORS.WOOD_SECONDARY, 0.4);
        
        for (let i = -height/2 + 5; i < height/2; i += 4) {
            grainGraphics.beginPath();
            grainGraphics.moveTo(-width/2 + 5, i);
            
            for (let x = -width/2 + 10; x < width/2; x += 15) {
                const yOffset = Phaser.Math.Between(-1, 1);
                grainGraphics.lineTo(x, i + yOffset);
            }
            
            grainGraphics.strokePath();
        }
        buttonContainer.add(grainGraphics);
        
        // Add button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '20px',
            fontFamily: FONTS.FAMILY,
            color: COLORS.TEXT,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        buttonText.setShadow(2, 2, '#000000', 2);
        buttonContainer.add(buttonText);
        
        // Make button interactive
        button.setInteractive({ useHandCursor: true });
        
        // Add hover effects
        button.on('pointerover', () => {
            button.setFillStyle(COLORS.BUTTON_HOVER);
            button.setScale(1.05);
            buttonText.setScale(1.05);
        });
        
        button.on('pointerout', () => {
            button.setFillStyle(COLORS.BUTTON);
            button.setScale(1);
            buttonText.setScale(1);
        });
        
        // Add click handler
        if (callback) {
            button.on('pointerdown', callback);
        }
        
        // Add to parent container
        if (container) {
            container.add(buttonContainer);
        }
        
        return buttonContainer;
    }
    
    createCategoryButtons(shopPanel) {
        const { PANEL } = this.UI;
        
        // Create category buttons at top
        const categories = [
            { id: 'skins', text: 'SKINS' },
            { id: 'lances', text: 'LANCES' }
        ];
        
        const buttonWidth = 200;
        const spacing = 30;
        let xPos = -buttonWidth - spacing/2;
        
        categories.forEach(category => {
            const button = this.createWoodenButton(
                shopPanel,
                xPos,
                -PANEL.HEIGHT/2 + 100,
                category.text,
                buttonWidth,
                40,
                () => this.showCategory(category.id)
            );
            
            // Store reference
            this.categoryButtons.push({
                id: category.id,
                button: button,
                background: button.list[0] // Access the background rectangle
            });
            
            xPos += buttonWidth + spacing;
        });
    }
    
    createItemsGrid(shopPanel) {
        const { PANEL } = this.UI;
        
        // Create container for item grid that can be updated
        this.itemsContainer = this.add.container(0, 0);
        shopPanel.add(this.itemsContainer);
        
        // Position for grid area - now covers more of the panel
        const gridArea = this.add.rectangle(
            0,
            0,
            PANEL.WIDTH - 100,
            PANEL.HEIGHT - 150,
            0x000000,
            0.2
        );
        
        this.itemsContainer.add(gridArea);
    }
    
    createReturnButton() {
        const { width: w, height: h } = this.cameras.main;
        
        // Create return button at bottom center
        const returnButton = this.createWoodenButton(
            null,
            w/2,
            h - 60,
            'RETURN TO MENU',
            200,
            50,
            () => this.scene.start('MainLoop')
        );
        
        this.containerElements.push(returnButton);
    }
    
    showCategory(categoryId) {
        // Update selected category
        this.selectedCategory = categoryId;
        
        // Update category button styles
        this.categoryButtons.forEach(button => {
            if (button.id === categoryId) {
                button.background.setFillStyle(this.UI.COLORS.BUTTON_HOVER);
            } else {
                button.background.setFillStyle(this.UI.COLORS.BUTTON);
            }
        });
        
        // Clear existing items
        this.updateItemsGrid();
    }
    
    updateItemsGrid() {
        // Clear existing items
        if (this.itemButtons && this.itemButtons.length) {
            this.itemButtons.forEach(button => button.destroy());
        }
        this.itemButtons = [];
        
        // Prepare items based on category
        let items = [];
        
        // Get current skin and lance from player state
        const currentSkin = playerState.getState().currentSkin || 'default';
        const currentLance = playerState.getState().equipment.currentLance || 'lance_0';
        
        if (this.selectedCategory === 'skins') {
            // Get all skins from skin system
            const skins = this.skinSystem.getAllSkins();
            items = Object.keys(skins).map(skinId => {
                const skin = skins[skinId];
                const isUnlocked = skin.unlocked || playerState.getState().skins[skinId];
                
                // Ensure if skin is unlocked in SkinSystem, it's also marked in PlayerState
                if (skin.unlocked && !playerState.getState().skins[skinId]) {
                    playerState.addSkin(skinId);
                }
                
                return {
                    id: skinId,
                    name: skin.name,
                    price: skin.price,
                    unlocked: isUnlocked,
                    key: skin.key,
                    isEquipped: currentSkin === skinId
                };
            });
        } 
        else if (this.selectedCategory === 'lances') {
            // Define lances
            items = [
                {
                    id: 'lance_0',
                    name: 'Basic Lance',
                    price: 0,
                    unlocked: true,
                    key: 'lance_0',
                    isEquipped: currentLance === 'lance_0'
                },
                {
                    id: 'lance_1',
                    name: 'Advanced Lance',
                    price: 300,
                    unlocked: playerState.getState().equipment.ownedLances.includes('lance_1'),
                    key: 'lance_1',
                    isEquipped: currentLance === 'lance_1'
                },
                {
                    id: 'lance_2',
                    name: 'Elite Lance',
                    price: 800,
                    unlocked: playerState.getState().equipment.ownedLances.includes('lance_2'),
                    key: 'lance_2',
                    isEquipped: currentLance === 'lance_2'
                }
            ];
        }
        
        // Create grid of item buttons - smaller size and tighter grid
        const buttonWidth = 120;
        const buttonHeight = 130;
        const columns = 5;
        const padding = 15;
        const gridWidth = (buttonWidth + padding) * columns;
        const startX = -gridWidth/2 + buttonWidth/2;
        const startY = -100;
        
        // Create items in grid
        items.forEach((item, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            
            const x = startX + column * (buttonWidth + padding);
            const y = startY + row * (buttonHeight + padding);
            
            // Create item button container
            const itemContainer = this.add.container(x, y);
            
            // Create background with color based on equipped status
            const background = this.add.rectangle(
                0,
                0,
                buttonWidth,
                buttonHeight,
                item.isEquipped ? 0x7a5a30 : this.UI.COLORS.PANEL_BG, // Darker wood color for equipped
                0.8
            );
            
            // Add border
            background.setStrokeStyle(item.isEquipped ? 3 : 2, item.isEquipped ? 0xFFD700 : this.UI.COLORS.WOOD_PRIMARY);
            
            // Make interactive if owned
            if (item.unlocked) {
                background.setInteractive({ useHandCursor: true });
                
                // Add click handler to equip
                background.on('pointerdown', () => {
                    if (!item.isEquipped) {
                        if (this.selectedCategory === 'skins') {
                            console.log(`Equipping skin: ${item.id}, Unlocked: ${item.unlocked}, In PlayerState: ${!!playerState.getState().skins[item.id]}`);
                            playerState.setCurrentSkin(item.id);
                            console.log(`Current skin after equipping: ${playerState.getState().currentSkin}`);
                        } else {
                            playerState.setCurrentLance(item.id);
                        }
                        // Update the grid to show new equipped item
                        this.updateItemsGrid();
                    }
                });
                
                // Add hover effects
                background.on('pointerover', () => {
                    background.setStrokeStyle(item.isEquipped ? 3 : 2, 0xFFFFFF);
                    background.setScale(1.05);
                });
                
                background.on('pointerout', () => {
                    background.setStrokeStyle(item.isEquipped ? 3 : 2, item.isEquipped ? 0xFFD700 : this.UI.COLORS.WOOD_PRIMARY);
                    background.setScale(1);
                });
            } else {
                // For items not owned, still allow clicking to purchase
                background.setInteractive({ useHandCursor: true });
                
                // Add hover effects for unowned items
                background.on('pointerover', () => {
                    background.setStrokeStyle(2, this.UI.COLORS.WOOD_SECONDARY);
                    background.setScale(1.05);
                });
                
                background.on('pointerout', () => {
                    background.setStrokeStyle(2, this.UI.COLORS.WOOD_PRIMARY);
                    background.setScale(1);
                });
                
                // Add click handler to purchase
                background.on('pointerdown', () => {
                    if (this.playerMoney >= item.price) {
                        this.purchaseItem(item);
                    }
                });
            }
            
            // Create item preview image
            const iconY = -20;
            let itemIcon;
            
            if (this.selectedCategory === 'skins') {
                itemIcon = this.add.sprite(0, iconY, item.key).setScale(0.35);
            } else if (this.selectedCategory === 'lances') {
                itemIcon = this.add.sprite(0, iconY, item.key).setScale(0.35);
                // Rotate weapon for better display
                itemIcon.setRotation(Math.PI / 4); // 45 degrees
            }
            
            // Add name text
            const nameText = this.add.text(
                0,
                20,
                item.name,
                {
                    fontSize: '12px',
                    fontFamily: this.UI.FONTS.FAMILY,
                    color: this.UI.COLORS.TEXT
                }
            ).setOrigin(0.5);
            
            // Add status text
            let statusText;
            
            if (item.isEquipped) {
                statusText = this.add.text(
                    0,
                    44,
                    'EQUIPPED',
                    {
                        fontSize: '11px',
                        fontFamily: this.UI.FONTS.FAMILY,
                        color: '#FFD700' // Gold color for equipped
                    }
                ).setOrigin(0.5);
            } 
            else if (item.unlocked) {
                // Just show "Owned" text for owned items
                statusText = this.add.text(
                    0,
                    44,
                    'OWNED',
                    {
                        fontSize: '11px',
                        fontFamily: this.UI.FONTS.FAMILY,
                        color: '#00FF00'
                    }
                ).setOrigin(0.5);
            } 
            else {
                // Show price for items not owned
                statusText = this.add.text(
                    0,
                    44,
                    `${item.price} coins`,
                    {
                        fontSize: '11px',
                        fontFamily: this.UI.FONTS.FAMILY,
                        color: this.UI.COLORS.GOLD
                    }
                ).setOrigin(0.5);
            }
            
            // Add all elements to container
            itemContainer.add([background, itemIcon, nameText, statusText]);
            
            // Add to items container
            this.itemsContainer.add(itemContainer);
            
            // Store reference
            this.itemButtons.push(itemContainer);
        });
    }
    
    purchaseItem(item) {
        // Verify player has enough money
        if (this.playerMoney < item.price) return;
        
        // Deduct money
        this.playerMoney -= item.price;
        playerState.getState().money = this.playerMoney;
        
        // Update money display
        this.moneyText.setText(`${this.playerMoney} coins`);
        
        if (this.selectedCategory === 'skins') {
            // Unlock skin in the skin system
            this.skinSystem.unlockSkin(item.id);
            
            // Explicitly add skin to player state
            playerState.addSkin(item.id);
            
            // Set as current skin
            playerState.setCurrentSkin(item.id);
            
            // Save skin system state to player state
            this.skinSystem.saveSkinState(playerState.getState());
        } 
        else if (this.selectedCategory === 'lances') {
            // Add lance to inventory
            playerState.addLance(item.id);
            
            // Set as current lance
            playerState.setCurrentLance(item.id);
        }
        
        // Update grid to reflect changes
        this.updateItemsGrid();
    }
    
    shutdown() {
        // Clean up all references
        if (this.skinSystem) {
            this.skinSystem.saveSkinState(playerState.getState());
        }
        
        this.containerElements.forEach(container => {
            if (container.destroy) container.destroy();
        });
        
        this.containerElements = [];
        this.categoryButtons = [];
        this.itemButtons = [];
    }
    
    // Ensure all unlocked skins in SkinSystem are also in PlayerState
    syncUnlockedSkinsToPlayerState() {
        const skins = this.skinSystem.getAllSkins();
        Object.keys(skins).forEach(skinId => {
            if (skins[skinId].unlocked) {
                playerState.addSkin(skinId);
            }
        });
    }
} 