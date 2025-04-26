class Weapon {
    constructor(scene, type, x, y, flipped = false) {
        this.scene = scene;
        this.type = type;
        this.sprite = scene.add.sprite(x, y, type);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(0.75);
        if (flipped) {
            this.sprite.setFlipX(true);
        }
    }

    setPosition(x, y) {
        this.sprite.setPosition(x, y);
    }

    setRotation(angle) {
        this.sprite.setRotation(angle);
    }

    destroy() {
        this.sprite.destroy();
    }
}

class WeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.weapons = new Map(); // Map of containerId -> weapon
        
        // Weapon configurations - easily add new weapons here
        this.weaponConfigs = {
            'lance_0': {
                offsetX: 220,
                offsetY: -15,
                scale: 0.75,
                name: 'Basic Lance',
                description: 'A simple wooden lance for beginners.',
                price: 0,
                unlocked: true, // Starter lance is unlocked by default
                qteParams: {
                    speedModifier: 1.2,
                    barWidth: 400,
                    buttonCount: 2 // Only Z and X buttons
                }
            },
            'lance_1': {
                offsetX: 220,
                offsetY: -15,
                scale: 0.75,
                name: 'Solid Lance',
                description: 'A sturdy lance with better balance.',
                price: 250,
                unlocked: false,
                qteParams: {
                    speedModifier: 1.5,
                    barWidth: 325,
                    buttonCount: 3 // Z, X, and C buttons
                }
            },
            'lance_3': {
                offsetX: 220,
                offsetY: -15,
                scale: 0.75,
                name: 'Knights Lance',
                description: 'A lance worth of a knight.',
                price: 500,
                unlocked: false,
                qteParams: {
                    speedModifier: 1.75,
                    barWidth: 275,
                    buttonCount: 3 // All buttons Z, X, C
                }
            },
            'lance_2': {
                offsetX: 220,
                offsetY: -15,
                scale: 0.75,
                name: 'Champions Lance',
                description: 'A masterfully crafted lance for tournament champions.',
                price: 1000,
                unlocked: false,
                qteParams: {
                    speedModifier: 2,
                    barWidth: 250,
                    buttonCount: 4 // All buttons Z, X, C, V
                }
            },
            'lance_4': {
                offsetX: 220,
                offsetY: -15,
                scale: 0.75,
                name: 'Fish Lance',
                description: 'A lance that can catch fish.',
                price: 1500,
                unlocked: false,
                qteParams: {
                    speedModifier: 2.25,
                    barWidth: 300,
                    buttonCount: 4 // All buttons Z, X, C, V
                }   
            },
            'lance_5': {
                offsetX: 220,
                offsetY: -15,
                scale: 0.75,
                name: 'Cloud Lance',
                description: 'A mystical lance forged from clouds and lightning.',
                price: 1500,
                unlocked: false,
                qteParams: {
                    speedModifier: 2,
                    barWidth: 200,
                    buttonCount: 3
                }
            }
        };
    }

    equipWeapon(container, weaponType, customOffsetX = null, customOffsetY = null, flipped = false, customScale = null) {
        // Remove existing weapon if any
        this.unequipWeapon(container);

        // Get weapon configuration or use defaults
        const config = this.weaponConfigs[weaponType] || {
            offsetX: 0,
            offsetY: 0,
            scale: 0.75
        };

        // Use custom offsets if provided, otherwise use config
        let offsetX = customOffsetX !== null ? customOffsetX : config.offsetX;
        const offsetY = customOffsetY !== null ? customOffsetY : config.offsetY;

        // Adjust offset for flipped weapons
        if (flipped) {
            offsetX = -offsetX; // Invert the X offset for flipped weapons
        }

        // Create new weapon with flip parameter
        const weapon = new Weapon(this.scene, weaponType, offsetX, offsetY, flipped);
        
        // Apply scale from config or use custom scale if provided
        weapon.sprite.setScale(customScale !== null ? customScale : config.scale);
        
        // Add weapon to container
        container.add(weapon.sprite);
        
        // Store reference
        this.weapons.set(container, weapon);
        
        return weapon;
    }

    unequipWeapon(container) {
        if (!container) return;
        
        const existingWeapon = this.weapons.get(container);
        if (existingWeapon) {
            existingWeapon.destroy();
            this.weapons.delete(container);
        }
    }

    updateWeaponPosition(container, offsetX, offsetY) {
        const weapon = this.weapons.get(container);
        if (weapon) {
            weapon.setPosition(offsetX, offsetY);
        }
    }

    updateWeaponRotation(container, angle) {
        const weapon = this.weapons.get(container);
        if (weapon) {
            weapon.setRotation(angle);
        }
    }

    // Add a new weapon configuration
    addWeaponConfig(weaponType, config) {
        this.weaponConfigs[weaponType] = config;
    }

    // Get current weapon configuration
    getWeaponConfig(weaponType) {
        return this.weaponConfigs[weaponType];
    }

    // Get QTE parameters for a specific weapon
    getWeaponQTEParams(weaponType) {
        const config = this.weaponConfigs[weaponType];
        return config?.qteParams || {
            speedModifier: 1.0,
            barWidth: 400,
            buttonCount: 2
        };
    }

    // Get all available weapons for shop display
    getAllWeapons() {
        const weapons = {};
        Object.keys(this.weaponConfigs).forEach(id => {
            const config = this.weaponConfigs[id];
            weapons[id] = {
                id: id,
                key: id,
                texture: id,
                name: config.name,
                description: config.description,
                price: config.price,
                unlocked: config.unlocked,
                qteParams: config.qteParams
            };
        });
        return weapons;
    }

    // Check if a weapon is unlocked
    isWeaponUnlocked(weaponId) {
        return this.weaponConfigs[weaponId]?.unlocked || false;
    }

    // Unlock a weapon
    unlockWeapon(weaponId) {
        if (this.weaponConfigs[weaponId]) {
            this.weaponConfigs[weaponId].unlocked = true;
            return true;
        }
        return false;
    }

    // Load weapon state from player state
    loadWeaponState(playerState) {
        if (playerState.weapons) {
            Object.keys(playerState.weapons).forEach(weaponId => {
                if (this.weaponConfigs[weaponId]) {
                    this.weaponConfigs[weaponId].unlocked = playerState.weapons[weaponId];
                }
            });
        }
    }

    // Save weapon state to player state
    saveWeaponState(playerState) {
        if (!playerState.weapons) {
            playerState.weapons = {};
        }
        Object.keys(this.weaponConfigs).forEach(weaponId => {
            playerState.weapons[weaponId] = this.weaponConfigs[weaponId].unlocked;
        });
    }

    destroy() {
        this.weapons.forEach(weapon => weapon.destroy());
        this.weapons.clear();
    }
} 