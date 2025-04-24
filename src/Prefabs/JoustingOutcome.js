class JoustingOutcome {
    constructor(scene, playerWon, currentSkin) {
        this.scene = scene;
        this.playerWon = playerWon;
        this.currentSkin = currentSkin || 'default';
        this.playerContainer = null;
        this.opponentContainer = null;
        this.weaponSystem = null;
        this.animationComplete = false;
        
        // For debugging
        console.log(`JoustingOutcome: Created with playerWon=${playerWon}, currentSkin=${currentSkin}`);
        console.log(`JoustingOutcome: Scene has opponentSkin=${scene.opponentSkin}, opponentLance=${scene.opponentLance}`);
    }

    create() {
        const { width: w, height: h } = this.scene.cameras.main;
        const centerX = w / 2;
        const centerY = h / 2;

        // Initialize weapon system
        this.weaponSystem = new WeaponSystem(this.scene);

        // Initialize skin system
        const skinSystem = new SkinSystem(this.scene);

        // Create player container starting from left
        this.playerContainer = this.scene.add.container(-100, h/2 + 175);
        const playerSkinKey = skinSystem.getSkinTextureKey(this.currentSkin);
        const player = this.scene.add.sprite(0, 0, playerSkinKey).setScale(0.75);
        player.setOrigin(0.5);
        this.playerContainer.add(player);
        
        // Get player lance from player state
        const playerLance = playerState.getState().equipment.currentLance || 'lance_0';
        this.weaponSystem.equipWeapon(this.playerContainer, playerLance);

        // Get opponent skin and lance from scene data
        const opponentSkin = this.scene.opponentSkin || 'sheep1_default';
        const opponentLance = this.scene.opponentLance || 'lance_0';
        
        console.log(`JoustingOutcome: Using opponent skin=${opponentSkin}, lance=${opponentLance}`);
        
        // Create opponent container starting from right
        this.opponentContainer = this.scene.add.container(w + 100, h/2 + 175);
        const opponentSkinKey = skinSystem.getSkinTextureKey(opponentSkin);
        const opponent = this.scene.add.sprite(0, 0, opponentSkinKey).setScale(0.75);
        opponent.setOrigin(0.5);
        opponent.setFlipX(true);
        this.opponentContainer.add(opponent);
        this.weaponSystem.equipWeapon(this.opponentContainer, opponentLance, null, null, true);

        // Start the jousting animation
        this.startJoustingAnimation();
    }

    startJoustingAnimation() {
        const { width: w } = this.scene.cameras.main;
        const centerX = w / 2;

        // Create tweens for both players
        const playerTween = this.scene.tweens.add({
            targets: this.playerContainer,
            x: centerX - 225,
            duration: 2000,
            ease: 'Linear'
        });

        const opponentTween = this.scene.tweens.add({
            targets: this.opponentContainer,
            x: centerX + 225,
            duration: 2000,
            ease: 'Linear',
            onComplete: () => {
                this.handleCollision();
            }
        });
    }

    handleCollision() {
        if (this.animationComplete) return;
        this.animationComplete = true;

        const { width: w, height: h } = this.scene.cameras.main;
        const centerX = w / 2;

        // Determine winner and loser
        const winnerContainer = this.playerWon ? this.playerContainer : this.opponentContainer;
        const loserContainer = this.playerWon ? this.opponentContainer : this.playerContainer;

        // Animate winner continuing off screen
        const winnerExitX = this.playerWon ? w + 200 : -200;
        this.scene.tweens.add({
            targets: winnerContainer,
            x: winnerExitX,
            duration: 4000,
            ease: 'Linear'
        });

        // Animate loser being knocked back
        const finalX = this.playerWon ? w + 300 : -300;
        const finalY = h + 300; // Fly off the bottom of the screen

        this.scene.tweens.add({
            targets: loserContainer,
            x: finalX,
            y: finalY,
            rotation: this.playerWon ? 3 : -3,
            duration: 2500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.showGameOverUI();
            }
        });

        // Add impact effect at the collision point
        this.createImpactEffect();
    }

    createImpactEffect() {
        const { width: w, height: h } = this.scene.cameras.main;
        const centerX = w / 2;
        const centerY = h / 2;

        // Get the losing player's position
        const loserContainer = this.playerWon ? this.opponentContainer : this.playerContainer;
        const startX = loserContainer.x;
        const startY = loserContainer.y;

        // Create a group for impact particles
        const particles = this.scene.add.group();

        // Create 40 particles in a circle pattern
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            const distance = 20 + Math.random() * 30; // Reduced initial distance since we're starting from player
            const x = startX + Math.cos(angle) * distance;
            const y = startY + Math.sin(angle) * distance;

            // Create a particle with random size and color
            const size = 3 + Math.random() * 4;
            const color = Math.random() > 0.5 ? 0xffffff : 0xff0000; // White or red particles
            const particle = this.scene.add.circle(x, y, size, color);
            particles.add(particle);

            // Animate each particle with more dramatic movement
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * (200 + Math.random() * 100),
                y: y + Math.sin(angle) * (200 + Math.random() * 100),
                alpha: 0,
                scale: 0,
                duration: 800 + Math.random() * 400,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    destroy() {
        if (this.weaponSystem) {
            this.weaponSystem.destroy();
        }
        if (this.playerContainer) {
            this.playerContainer.destroy();
        }
        if (this.opponentContainer) {
            this.opponentContainer.destroy();
        }
    }
} 