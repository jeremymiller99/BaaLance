class SkinSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Define available skins with their properties
        this.availableSkins = {
            'sheep1_default': {
                key: 'sheep1_default',
                name: 'Sheep 1 Default',
                price: 0,
                unlocked: true
            },
            'sheep1_sunglass': {
                key: 'sheep1_sunglass',
                name: 'Sheep 1 Sunglass',
                price: 250,
                unlocked: false
            },
            'sheep1_tophat': {
                key: 'sheep1_tophat',
                name: 'Sheep 1 Top Hat',
                price: 250,
                unlocked: false
            },
            'sheep1_bling': {
                key: 'sheep1_bling',
                name: 'Sheep 1 Bling',
                price: 250,
                unlocked: false
            },
            'sheep2_default': {
                key: 'sheep2_default',
                name: 'Sheep 2 Default',
                price: 250,
                unlocked: false
            },
            'ram_default': {
                key: 'ram_default',
                name: 'Ram Default',
                price: 250,
                unlocked: false
            },
            
        };
    }

    // Get the texture key for a skin
    getSkinTextureKey(skinId) {
        return this.availableSkins[skinId]?.key || 'sheep1_default';
    }

    // Check if a skin is unlocked
    isSkinUnlocked(skinId) {
        return this.availableSkins[skinId]?.unlocked || false;
    }

    // Get skin price
    getSkinPrice(skinId) {
        return this.availableSkins[skinId]?.price || 0;
    }

    // Unlock a skin
    unlockSkin(skinId) {
        if (this.availableSkins[skinId]) {
            this.availableSkins[skinId].unlocked = true;
            return true;
        }
        return false;
    }

    // Get all available skins
    getAllSkins() {
        return this.availableSkins;
    }

    // Load skin state from player state
    loadSkinState(playerState) {
        if (playerState.skins) {
            Object.keys(playerState.skins).forEach(skinId => {
                if (this.availableSkins[skinId]) {
                    this.availableSkins[skinId].unlocked = playerState.skins[skinId];
                }
            });
        }
    }

    // Save skin state to player state
    saveSkinState(playerState) {
        if (!playerState.skins) {
            playerState.skins = {};
        }
        Object.keys(this.availableSkins).forEach(skinId => {
            playerState.skins[skinId] = this.availableSkins[skinId].unlocked;
        });
    }
} 