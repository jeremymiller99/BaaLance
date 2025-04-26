class JoustingOutcome {
    constructor(scene, playerWon, currentSkin) {
        this.scene = scene;
        this.playerWon = playerWon;
        this.currentSkin = currentSkin || 'default';
        this.playerContainer = null;
        this.opponentContainer = null;
        this.weaponSystem = null;
        this.animationComplete = false;
        this.spectators = [];
        
        // For debugging
        console.log(`JoustingOutcome: Created with playerWon=${playerWon}, currentSkin=${currentSkin}`);
        console.log(`JoustingOutcome: Scene has opponentSkin=${scene.opponentSkin}, opponentLance=${scene.opponentLance}`);
    }

    create() {
        const { width: w, height: h } = this.scene.cameras.main;
        const centerX = w / 2;
        const centerY = h / 2;

        // Add decorative elements to make background more medieval
        this.createDecorativeElements();
        
        // Create spectator silhouettes
        this.createSpectators();

        // Initialize weapon system
        this.weaponSystem = new WeaponSystem(this.scene);

        // Initialize skin system
        const skinSystem = new SkinSystem(this.scene);

        // Create player container starting from left
        this.playerContainer = this.scene.add.container(-100, h/2 + 175);
        this.playerContainer.setDepth(20); // Set high depth to ensure player is in front
        
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
        this.opponentContainer.setDepth(20); // Set high depth to ensure opponent is in front
        
        const opponentSkinKey = skinSystem.getSkinTextureKey(opponentSkin);
        const opponent = this.scene.add.sprite(0, 0, opponentSkinKey).setScale(0.75);
        opponent.setOrigin(0.5);
        opponent.setFlipX(true);
        this.opponentContainer.add(opponent);
        this.weaponSystem.equipWeapon(this.opponentContainer, opponentLance, null, null, true);

        // Add subtle bouncing animations to simulate riding horses
        this.playerBounceTween = this.scene.tweens.add({
            targets: this.playerContainer,
            y: '+=5', // Move 5 pixels up and down from original position
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        this.opponentBounceTween = this.scene.tweens.add({
            targets: this.opponentContainer,
            y: '+=5', // Move 5 pixels up and down from original position
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            // Offset the timing slightly from player bounce for natural look
            delay: 250
        });

        // Start the jousting animation
        this.startJoustingAnimation();
    }
    
    createDecorativeElements() {
        // Path elements removed as requested
    }
    
    createSpectators() {
        const { width: w, height: h } = this.scene.cameras.main;
        
        // Create spectators positioned higher up
        const spectatorY = h/2 + 100; // Moved up from previous position
        const spectatorCount = 15;
        
        // Initialize skin system to use actual character skins
        const skinSystem = new SkinSystem(this.scene);
        
        // Available skin keys to use for spectators
        const skinOptions = [
            'sheep1_default', 
            'sheep1_sunglass', 
            'sheep1_tophat', 
            'sheep1_bling',
            'sheep2_default',
            'ram_default'
        ];
        
        // Create spectator group (randomly placed)
        for (let i = 0; i < spectatorCount; i++) {
            // Randomly distribute along the X axis but avoid the center
            let x;
            if (Math.random() > 0.5) {
                // Right side
                x = (w * 0.6) + (Math.random() * w * 0.35);
            } else {
                // Left side
                x = (Math.random() * w * 0.35);
            }
            
            // Randomize Y position slightly for varied heights
            const randomY = spectatorY - (Math.random() * 15);
            
            // Pick a random skin
            const skinKey = skinOptions[Math.floor(Math.random() * skinOptions.length)];
            
            // Create spectator using actual character sprite
            const spectator = this.scene.add.sprite(x, randomY, skinKey);
            
            // Scale down the spectators further
            const scale = 0.3 + (Math.random() * 0.15); // between 0.3 and 0.45 (smaller than before)
            spectator.setScale(scale);
            
            // Set depth to be behind players but in front of background
            spectator.setDepth(8);
            
            // Randomly flip some spectators
            if (Math.random() > 0.5) {
                spectator.setFlipX(true);
            }
            
            // Create spectator animation
            const animationType = Math.floor(Math.random() * 3); // 0, 1, or 2
            
            switch (animationType) {
                case 0: // Up and down
                    this.scene.tweens.add({
                        targets: spectator,
                        y: '-=5',
                        duration: 500 + Math.random() * 500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Math.random() * 1000
                    });
                    break;
                case 1: // Side to side
                    this.scene.tweens.add({
                        targets: spectator,
                        x: '+=10',
                        duration: 1000 + Math.random() * 500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Math.random() * 1000
                    });
                    break;
                case 2: // Scaling/bouncing
                    this.scene.tweens.add({
                        targets: spectator,
                        scaleY: spectator.scaleY * 1.1,
                        duration: 300 + Math.random() * 200,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Math.random() * 1000
                    });
                    break;
            }
            
            // Store reference to clean up later
            this.spectators.push(spectator);
        }
        
        // Play crowd sound
        if (audioSystem) {
            audioSystem.playSfx('crowd_sheep', { volume: 0.3, loop: true });
        }
    }

    startJoustingAnimation() {
        const { width: w } = this.scene.cameras.main;
        const centerX = w / 2;

        // Create tweens for both players with fixed duration for consistent speed
        const playerTween = this.scene.tweens.add({
            targets: this.playerContainer,
            x: centerX - 225,
            duration: 2000, // Fixed duration in milliseconds
            ease: 'Linear'
        });

        const opponentTween = this.scene.tweens.add({
            targets: this.opponentContainer,
            x: centerX + 225,
            duration: 2000, // Fixed duration in milliseconds
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

        // Stop the bouncing animations
        if (this.playerBounceTween) this.playerBounceTween.stop();
        if (this.opponentBounceTween) this.opponentBounceTween.stop();

        // Play collision sound effects
        if (audioSystem) {
            audioSystem.playSfx('lanceHit', { volume: 1.0 });
            
            // Delay crowd reaction for slightly more realism
            this.scene.time.delayedCall(300, () => {
                // Crowd reaction sounds based on outcome
                if (this.playerWon) {
                    audioSystem.playSfx('crowd_sheep', { volume: 0.7 });
                    this.scene.time.delayedCall(200, () => {
                        audioSystem.playSfx('crowdCheer', { volume: 0.6 });
                    });
                } else {
                    audioSystem.playSfx('crowd_sheep', { volume: 0.5 });
                    // Mix of cheers and disappointment depending on which side won
                    this.scene.time.delayedCall(200, () => {
                        audioSystem.playSfx('baa', { volume: 0.6, detune: -200 });
                    });
                }
            });
        }

        // Determine winner and loser
        const winnerContainer = this.playerWon ? this.playerContainer : this.opponentContainer;
        const loserContainer = this.playerWon ? this.opponentContainer : this.playerContainer;

        // Animate winner continuing off screen with fixed duration
        const winnerExitX = this.playerWon ? w + 200 : -200;
        this.scene.tweens.add({
            targets: winnerContainer,
            x: winnerExitX,
            duration: 4000, // Fixed duration in milliseconds
            ease: 'Linear'
        });

        // Animate loser being knocked back with fixed duration
        const finalX = this.playerWon ? w + 300 : -300;
        const finalY = h + 300; // Fly off the bottom of the screen

        // Add impact effect at the collision point
        this.createImpactEffect();
        
        // Make spectators react to the outcome - delay slightly for realism
        this.scene.time.delayedCall(300, () => {
            this.animateSpectators(this.playerWon);
        });

        // Animate the loser flying off
        this.scene.tweens.add({
            targets: loserContainer,
            x: finalX,
            y: finalY,
            rotation: this.playerWon ? 3 : -3,
            duration: 2500, // Fixed duration in milliseconds
            ease: 'Power2'
        });
        
        // Show game UI slightly delayed for more dramatic effect
        this.scene.time.delayedCall(1800, () => {
            // Check if scene is still active before calling methods
            if (this.scene && this.scene.scene && this.scene.scene.isActive()) {
                // Check if showGameOverUI exists on the scene
                if (typeof this.scene.showGameOverUI === 'function') {
                    this.scene.showGameOverUI(this.playerWon ? 'win' : 'lose');
                } else {
                    console.warn('showGameOverUI method not found on scene');
                }
            }
        });
    }
    
    animateSpectators(playerWon) {
        // Make spectators react based on outcome
        this.spectators.forEach(spectator => {
            // Create different animations depending on spectator position
            // Spectators on the left side generally root for the player
            // Spectators on the right generally root for the opponent
            const isLeftSide = spectator.x < this.scene.cameras.main.width / 2;
            const isExcited = (isLeftSide && playerWon) || (!isLeftSide && !playerWon);
            
            // Clear any existing tweens
            this.scene.tweens.killTweensOf(spectator);
            
            if (isExcited) {
                // Excited jump animation - smaller jumps for smaller spectators
                const jumpHeight = 15 + Math.random() * 20;
                
                // Create jumping animation
                this.scene.tweens.add({
                    targets: spectator,
                    y: `-=${jumpHeight}`,
                    duration: 300,
                    yoyo: true,
                    repeat: 3,
                    ease: 'Sine.easeOut'
                });
                
                // Add rotation for extra excitement - smaller rotation for smaller spectators
                this.scene.tweens.add({
                    targets: spectator,
                    angle: spectator.flipX ? -10 : 10,
                    duration: 200,
                    yoyo: true,
                    repeat: 5,
                    ease: 'Sine.easeInOut'
                });
                
                // Scale up and down rapidly (bouncing with excitement)
                this.scene.tweens.add({
                    targets: spectator,
                    scaleY: spectator.scaleY * 1.15,
                    duration: 200,
                    yoyo: true,
                    repeat: 5,
                    ease: 'Sine.easeInOut'
                });
            } else {
                // Disappointed/subdued animation
                
                // Slump down slightly - smaller movement for smaller spectators
                this.scene.tweens.add({
                    targets: spectator,
                    y: `+=${3 + Math.random() * 5}`,
                    duration: 500,
                    ease: 'Sine.easeOut'
                });
                
                // Shrink slightly (hunching down)
                this.scene.tweens.add({
                    targets: spectator,
                    scaleY: spectator.scaleY * 0.9,
                    scaleX: spectator.scaleX * 0.95,
                    duration: 500,
                    ease: 'Sine.easeOut'
                });
                
                // Slight side-to-side shake (head shake of disappointment)
                this.scene.tweens.add({
                    targets: spectator,
                    x: `+=${spectator.flipX ? -3 : 3}`,
                    duration: 300,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Sine.easeInOut'
                });
            }
        });
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

            // Animate each particle with fixed duration
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * (200 + Math.random() * 100),
                y: y + Math.sin(angle) * (200 + Math.random() * 100),
                alpha: 0,
                scale: 0,
                duration: 800 + Math.random() * 400, // Fixed duration with small randomness
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        // Create a flash effect for dramatic impact
        const flash = this.scene.add.rectangle(centerX, centerY, w, h, 0xffffff);
        flash.setAlpha(0.3);
        flash.setDepth(100);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                flash.destroy();
            }
        });
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
        
        // Clean up spectators
        this.spectators.forEach(spectator => {
            if (spectator) {
                spectator.destroy();
            }
        });
        this.spectators = [];
        
        // Clean up tweens
        if (this.playerBounceTween) {
            this.playerBounceTween.stop();
        }
        if (this.opponentBounceTween) {
            this.opponentBounceTween.stop();
        }
        
        // Stop crowd sounds
        if (audioSystem && audioSystem.sfx && audioSystem.sfx.crowd_sheep) {
            audioSystem.sfx.crowd_sheep.stop();
        }
    }
} 