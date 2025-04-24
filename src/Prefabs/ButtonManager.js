class ButtonManager {
    constructor(scene, matchType = 'quick', qteSpeedModifier = 1.0) {
        this.scene = scene;
        this.buttons = ['Z', 'X', 'C', 'V'];
        this.currentButton = null;
        this.buttonText = null;
        this.score = 0;
        this.gameDuration = this.scene.playerTween ? this.scene.playerTween.duration : 15000; // Sync with player tween duration
        this.startTime = null; // Changed from 0 to null to indicate not started
        this.keys = null;
        this.buttonPressed = false; // Track if button has been pressed
        this.matchType = matchType;
        this.isGameStarted = false;
        this.qteSpeedModifier = qteSpeedModifier; // Store the QTE speed modifier
        
        // QTE meter properties
        this.meterWidth = 400;
        this.meterHeight = 30;
        this.indicatorSize = 15;
        this.indicatorPosition = 0;
        this.baseIndicatorSpeed = 2; // Base speed before modification
        this.indicatorSpeed = this.baseIndicatorSpeed * this.qteSpeedModifier; // Apply speed modifier
        this.indicatorDirection = 1; // 1 for right, -1 for left
        this.targetPosition = 0;
        this.targetWidth = 40;
        this.hitThreshold = 20; // How close the indicator needs to be to the target to count as a "hit"
        this.perfectThreshold = 10; // How close for a perfect hit
        
        // QTE visual elements
        this.meterBar = null;
        this.movingIndicator = null;
        this.targetZone = null;
        this.perfectZone = null; // Perfect hit zone
        this.goodZone = null; // Good hit zone
    }

    create() {
        // Create keyboard input
        this.keys = this.scene.input.keyboard.addKeys('Z,X,C,V');

        // Create button text style
        this.buttonStyle = {
            fontSize: '40px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            backgroundColor: '#00000080'
        };
        
        // Get game dimensions
        const { width: w, height: h } = this.scene.cameras.main;
        
        // Create meter bar at the center of the screen with slight upward offset
        this.meterBar = this.scene.add.rectangle(
            w / 2,
            h / 2 - 50, // Center with upward offset
            this.meterWidth,
            this.meterHeight,
            0x333333
        ).setOrigin(0.5);
        
        // Add border to meter
        this.meterBorder = this.scene.add.rectangle(
            w / 2,
            h / 2 - 50, // Match meter position
            this.meterWidth + 4,
            this.meterHeight + 4,
            0xffffff
        ).setOrigin(0.5);
        this.meterBorder.setFillStyle(0x000000, 0);
        this.meterBorder.setStrokeStyle(2, 0xffffff);
        
        // Get the meter bounds
        this.meterLeftEdge = this.meterBar.x - (this.meterWidth / 2);
        this.meterRightEdge = this.meterBar.x + (this.meterWidth / 2);
        
        // Create a thin vertical line as the moving indicator
        const lineHeight = this.meterHeight * 1.5; // Make line slightly taller than the meter
        this.movingIndicator = this.scene.add.rectangle(
            this.meterBar.x, // Start at exact center of meter
            this.meterBar.y,
            4, // Increased from 2 to 4 pixels for better visibility
            lineHeight,
            0xffffff
        ).setOrigin(0.5);
        
        // Add stroke to make it more visible if needed
        this.movingIndicator.setStrokeStyle(1, 0x000000);
        
        // Initially hide the meter elements
        this.meterBar.setVisible(false);
        this.meterBorder.setVisible(false);
        this.movingIndicator.setVisible(false);
        
        // Reset indicator position to be at the center initially
        this.indicatorPosition = this.meterWidth / 2;
    }

    startGame() {
        // Get the duration from the scene's player tween if it exists
        if (this.scene.playerTween) {
            this.gameDuration = this.scene.playerTween.duration;
        }
        
        this.startTime = this.scene.time.now;
        this.isGameStarted = true;
        this.score = 0; // Reset score
        
        // Set indicator to center position initially
        this.indicatorPosition = this.meterWidth / 2;
        
        // Update indicator to center position (only update x position, keep y offset)
        this.movingIndicator.x = this.meterBar.x;
        // We don't update y here to preserve the vertical offset
        
        // Make meter elements visible
        this.meterBar.setVisible(true);
        this.meterBorder.setVisible(true);
        this.movingIndicator.setVisible(true);
        
        // Spawn first target
        this.spawnTarget();
    }

    update(time) {
        // Only process game logic if the game has actually started
        if (!this.isGameStarted || this.startTime === null) return;
        
        // Check if game is over
        const elapsedTime = time - this.startTime;
        if (elapsedTime >= this.gameDuration) {
            this.endGame();
            return;
        }
        
        // Update indicator position
        this.updateIndicator();
        
        // Check keyboard input
        if (this.currentButton && this.targetZone && !this.buttonPressed) {
            // Check if any key is pressed
            for (const button of this.buttons) {
                if (this.keys[button].isDown) {
                    // Check if correct button is pressed
                    if (button === this.currentButton) {
                        // Check if indicator is within hit threshold of target
                        const indicatorPos = this.movingIndicator.x;
                        const targetPos = this.targetZone.x;
                        const distance = Math.abs(indicatorPos - targetPos);
                        
                        if (distance <= this.perfectThreshold) {
                            // Perfect hit - maximum points
                            this.handleSuccessfulHit(3, 'PERFECT!');
                        } else if (distance <= this.hitThreshold) {
                            // Good hit - partial points
                            this.handleSuccessfulHit(1, 'GOOD!');
                        } else {
                            // Miss - wrong timing
                            this.handleFailedHit('BAD TIMING!');
                        }
                    } else {
                        // Wrong button pressed
                        this.handleFailedHit('WRONG BUTTON!');
                    }
                    
                    this.buttonPressed = true;
                    
                    // Create a short delay before spawning next target
                    this.scene.time.delayedCall(500, () => {
                        this.spawnTarget();
                    });
                    
                    break; // Exit the loop after handling the first key press
                }
            }
        }
    }
    
    updateIndicator() {
        // Update indicator position with speed and direction
        this.indicatorPosition += this.indicatorSpeed * this.indicatorDirection;
        
        // Set boundaries more precisely
        const indicatorWidth = 4; // Width of our line (increased from 2 to 4)
        const maxRight = this.meterWidth - (indicatorWidth / 2);
        const minLeft = indicatorWidth / 2;
        
        // Reverse direction if indicator reaches the bounds
        if (this.indicatorPosition >= maxRight || this.indicatorPosition <= minLeft) {
            this.indicatorDirection *= -1;
            
            // Ensure indicator stays within bounds
            this.indicatorPosition = Math.max(minLeft, Math.min(this.indicatorPosition, maxRight));
        }
        
        // Calculate actual x position based on meter position and indicator position
        const meterLeftEdge = this.meterBar.x - (this.meterWidth / 2);
        this.movingIndicator.x = meterLeftEdge + this.indicatorPosition;
        
        // Ensure the indicator is always on top by setting its depth
        this.movingIndicator.setDepth(10);
    }
    
    handleSuccessfulHit(points, message) {
        // Visual feedback for hit
        this.targetZone.setStrokeStyle(2, 0x00ff00);
        this.score += points;
        
        // Increase scroll speed on hit
        this.scene.increaseScrollSpeed();
        
        // Create score popup
        const scorePopup = this.scene.add.text(
            this.targetZone.x,
            this.targetZone.y - 30,
            `${message} +${points}`,
            {
                fontSize: '28px',
                fontFamily: 'Arial',
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Animate score popup
        this.scene.tweens.add({
            targets: scorePopup,
            y: scorePopup.y - 40,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                scorePopup.destroy();
            }
        });
        
        // Flash effect on perfect/good zones
        this.scene.tweens.add({
            targets: [this.perfectZone, this.goodZone],
            alpha: 0.2,
            yoyo: true,
            duration: 100,
            repeat: 2
        });
    }
    
    handleFailedHit(message = 'MISS!') {
        // Visual feedback for miss
        this.targetZone.setStrokeStyle(2, 0xff0000);
        
        // Add Miss text
        const missText = this.scene.add.text(
            this.targetZone.x,
            this.targetZone.y - 30,
            message,
            {
                fontSize: '28px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Animate miss text
        this.scene.tweens.add({
            targets: missText,
            y: missText.y - 40,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                missText.destroy();
            }
        });
        
        // Shake effect on miss
        this.scene.tweens.add({
            targets: this.targetZone,
            x: this.targetZone.x + 5,
            yoyo: true,
            repeat: 3,
            duration: 50
        });
    }

    spawnTarget() {
        // Clear any previous targets
        if (this.targetZone) {
            this.targetZone.destroy();
        }
        if (this.perfectZone) {
            this.perfectZone.destroy();
        }
        if (this.goodZone) {
            this.goodZone.destroy();
        }
        if (this.buttonText) {
            this.buttonText.destroy();
        }
        
        // Reset the button pressed flag
        this.buttonPressed = false;
        
        // Get game dimensions
        const { width: w, height: h } = this.scene.cameras.main;
        
        // Reset the indicator speed to base value * modifier for each new target
        // This ensures consistent speed throughout the game
        this.indicatorSpeed = this.baseIndicatorSpeed * this.qteSpeedModifier;
        
        // Calculate random position for target zone
        // Make sure the target is within the meter bounds
        const meterLeftEdge = this.meterBar.x - (this.meterWidth / 2);
        const meterRightEdge = this.meterBar.x + (this.meterWidth / 2);
        
        // Choose a random position for the target that's at least a bit away from the edges
        const buffer = this.targetWidth * 2; // Buffer from edges
        this.targetPosition = Phaser.Math.Between(
            buffer, 
            this.meterWidth - buffer
        );
        
        // Create target zone
        const targetX = meterLeftEdge + this.targetPosition;
        
        // Create the good hit zone (slightly wider)
        this.goodZone = this.scene.add.rectangle(
            targetX,
            this.meterBar.y,
            this.hitThreshold * 2, // Width based on hit threshold
            this.meterHeight,
            0xffaa00 // Orange for good hits
        ).setOrigin(0.5);
        
        // Create the perfect hit zone (narrower)
        this.perfectZone = this.scene.add.rectangle(
            targetX,
            this.meterBar.y,
            this.perfectThreshold * 2, // Width based on perfect threshold
            this.meterHeight,
            0x00ff00 // Green for perfect hits
        ).setOrigin(0.5);
        
        // Store reference to the main target zone (using perfect zone)
        this.targetZone = this.perfectZone;
        
        // Choose a random button for this target
        const buttonIndex = Phaser.Math.Between(0, this.buttons.length - 1);
        this.currentButton = this.buttons[buttonIndex];
        
        // Create button prompt
        this.buttonText = this.scene.add.text(
            targetX,
            this.meterBar.y - this.meterHeight * 2,
            this.currentButton,
            this.buttonStyle
        ).setOrigin(0.5);
        
        // Set the depth to ensure the targets and button text appear above the meter
        this.goodZone.setDepth(1);
        this.perfectZone.setDepth(2);
        this.buttonText.setDepth(3);
        
        // Make sure the indicator is always on top
        this.movingIndicator.setDepth(4);
    }

    endGame() {
        // Clean up any remaining elements
        if (this.buttonText) {
            this.buttonText.destroy();
            this.buttonText = null;
        }
        
        if (this.targetZone) {
            this.targetZone.destroy();
            this.targetZone = null;
        }
        
        if (this.perfectZone) {
            this.perfectZone.destroy();
            this.perfectZone = null;
        }
        
        if (this.goodZone) {
            this.goodZone.destroy();
            this.goodZone = null;
        }
        
        if (this.meterBar) {
            this.meterBar.setVisible(false);
        }
        
        if (this.meterBorder) {
            this.meterBorder.setVisible(false);
        }
        
        if (this.movingIndicator) {
            this.movingIndicator.setVisible(false);
        }

        // Let the scene handle the transition with the score
        this.scene.events.emit('gameEnded', {
            score: this.score,
            matchType: this.matchType
        });
    }

    reset() {
        this.score = 0;
        this.startTime = null;
        this.isGameStarted = false;
        
        if (this.buttonText) {
            this.buttonText.destroy();
            this.buttonText = null;
        }
        
        if (this.targetZone) {
            this.targetZone.destroy();
            this.targetZone = null;
        }
        
        if (this.perfectZone) {
            this.perfectZone.destroy();
            this.perfectZone = null;
        }
        
        if (this.goodZone) {
            this.goodZone.destroy();
            this.goodZone = null;
        }
        
        if (this.meterBar) {
            this.meterBar.destroy();
            this.meterBar = null;
        }
        
        if (this.meterBorder) {
            this.meterBorder.destroy();
            this.meterBorder = null;
        }
        
        if (this.movingIndicator) {
            this.movingIndicator.destroy();
            this.movingIndicator = null;
        }
        
        if (this.keys) {
            this.scene.input.keyboard.removeKeys('Z,X,C,V');
            this.keys = null;
        }
        
        // Reset indicator properties to ensure proper positioning on next creation
        this.indicatorPosition = this.meterWidth / 2;
        this.indicatorDirection = 1;
    }
} 