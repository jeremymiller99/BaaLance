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
                scale: 0.75
            },
            'lance_1': {
                offsetX: 220,
                offsetY: -15,
                scale: 0.75
            },
            'lance_2': {
                offsetX: 220,
                offsetY: -15,
                scale: 0.75
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

    destroy() {
        this.weapons.forEach(weapon => weapon.destroy());
        this.weapons.clear();
    }
} 