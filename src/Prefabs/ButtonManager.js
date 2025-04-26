class ButtonManager {
    constructor(scene, matchType = 'quick', qteParams = null) {
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
        
        // Stability tracking - new properties
        this.consecutiveMistakes = 0; // Track consecutive mistakes
        this.stabilityLevel = 0; // 0 = stable, 1 = wobble, 2 = severe wobble, 3 = critical
        this.wobbleTween = null; // Reference to the wobble animation
        this.stabilityIndicators = []; // Array to store UI indicators for stability
        
        // Default QTE parameters
        this.defaultQteParams = {
            speedModifier: 1.0,
            barWidth: 400,
            buttonCount: 4 // Default to all 4 buttons
        };
        
        // Apply provided QTE parameters or use defaults
        this.qteParams = qteParams || this.defaultQteParams;
        
        // Set the QTE speed modifier from parameters
        this.qteSpeedModifier = this.qteParams.speedModifier;
        
        // QTE meter properties
        this.meterWidth = this.qteParams.barWidth || 400;
        this.meterHeight = 30;
        this.indicatorSize = 15;
        this.indicatorPosition = 0;
        
        // Use pixels per second for consistent movement across frame rates
        this.baseIndicatorSpeedPerSecond = 120; // Base speed in pixels per second
        this.indicatorSpeedPerSecond = this.baseIndicatorSpeedPerSecond * this.qteSpeedModifier; // Apply speed modifier
        this.indicatorDirection = 1; // 1 for right, -1 for left
        this.targetPosition = 0;
        this.targetWidth = 40;
        this.hitThreshold = 20; // How close the indicator needs to be to the target to count as a "hit"
        this.perfectThreshold = 10; // How close for a perfect hit
        
        // Get active buttons based on buttonCount
        this.activeButtonCount = this.qteParams.buttonCount || 4;
        this.activeButtons = this.buttons.slice(0, this.activeButtonCount);
        
        // QTE visual elements
        this.meterBar = null;
        this.movingIndicator = null;
        this.targetZone = null;
        this.perfectZone = null; // Perfect hit zone
        this.goodZone = null; // Good hit zone
        
        // Last update time for delta calculations
        this.lastUpdateTime = 0;
    }

    create() {
        // Create keyboard input for active buttons only
        const keyString = this.activeButtons.join(',');
        this.keys = this.scene.input.keyboard.addKeys(keyString);

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
        
        // Create stability indicators
        this.createStabilityIndicators();
        
        // Listen for screen shake complete event
        this.scene.events.on('screenShakeComplete', () => {
            // This event callback could be used to synchronize animations
            // after screen shake completes
        });
    }

    createStabilityIndicators() {
        // Clear existing indicators
        this.clearStabilityIndicators();
        
        const { width: w, height: h } = this.scene.cameras.main;
        
        // Create a container for the stability UI at the top center
        const indicatorSize = 20;
        const indicatorSpacing = 10;
        const indicatorCount = 3; // We need 3 indicators for levels 0-3
        
        // Calculate total width of all indicators with spacing
        const totalWidth = (indicatorSize * indicatorCount) + (indicatorSpacing * (indicatorCount - 1));
        let startX = (w / 2) - (totalWidth / 2) + (indicatorSize / 2);
        
        // Adjusted Y position for indicators - moved below score panel at Y=100
        const indicatorY = 100;
        
        // Create the indicators (removed the label text)
        for (let i = 0; i < indicatorCount; i++) {
            const indicator = this.scene.add.circle(
                startX + (i * (indicatorSize + indicatorSpacing)),
                indicatorY,
                indicatorSize / 2,
                0x333333
            );
            
            // Add stroke
            indicator.setStrokeStyle(2, 0xffffff);
            
            // Set depth to ensure the indicators are visible but behind other UI
            indicator.setDepth(5);
            
            this.stabilityIndicators.push(indicator);
        }
        
        // Update indicators to match current stability level
        this.updateStabilityIndicators();
    }
    
    updateStabilityIndicators() {
        // Skip if there are no indicators
        if (this.stabilityIndicators.length < 3) return;
        
        // Use red for all filled indicators
        const filledColor = 0xff0000; // Red for all levels
        
        // Update color of each indicator based on stability level
        for (let i = 0; i < 3; i++) {
            const indicator = this.stabilityIndicators[i];
            
            if (i < this.stabilityLevel) {
                // All filled indicators are red
                indicator.setFillStyle(filledColor);
            } else {
                // Reset to gray
                indicator.setFillStyle(0x333333);
            }
        }
        
        // Flash all indicators if at critical level
        if (this.stabilityLevel === 3) {
            this.scene.tweens.add({
                targets: this.stabilityIndicators,
                alpha: 0.3,
                duration: 200,
                yoyo: true,
                repeat: 2
            });
        }
    }
    
    clearStabilityIndicators() {
        // Destroy all existing stability indicators
        this.stabilityIndicators.forEach(indicator => {
            if (indicator) {
                indicator.destroy();
            }
        });
        this.stabilityIndicators = [];
    }

    startGame() {
        // Get the duration from the scene's player tween if it exists
        if (this.scene.playerTween) {
            this.gameDuration = this.scene.playerTween.duration;
        }
        
        this.startTime = this.scene.time.now;
        this.isGameStarted = true;
        this.score = 0; // Reset score
        
        // Reset stability tracking
        this.consecutiveMistakes = 0;
        this.stabilityLevel = 0;
        if (this.wobbleTween) {
            this.wobbleTween.stop();
            this.wobbleTween = null;
        }
        
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

    update(time, delta) {
        // Store the last update time for delta calculations
        if (this.lastUpdateTime === 0) {
            this.lastUpdateTime = time;
        }
        
        // Calculate delta time in seconds
        const deltaSeconds = delta / 1000;
        
        // Only process game logic if the game has actually started
        if (!this.isGameStarted || this.startTime === null) return;
        
        // Check if game is over
        const elapsedTime = time - this.startTime;
        if (elapsedTime >= this.gameDuration) {
            this.endGame();
            return;
        }
        
        // Don't process any more input if player has fallen off
        if (this.stabilityLevel >= 4) {
            return;
        }
        
        // Update indicator position using delta time
        this.updateIndicator(deltaSeconds);
        
        // Check keyboard input
        if (this.currentButton && this.targetZone && !this.buttonPressed) {
            // Check if any key is pressed
            for (const button of this.activeButtons) {
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
                    
                    break; // Exit the loop after handling the first key press
                }
            }
        }
        
        // Update last update time
        this.lastUpdateTime = time;
    }
    
    updateIndicator(deltaSeconds) {
        // Update indicator position with speed, direction, and delta time
        this.indicatorPosition += this.indicatorSpeedPerSecond * this.indicatorDirection * deltaSeconds;
        
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
        
        // Calculate total points
        const totalPoints = points;
        
        // Update score
        this.score += totalPoints;
        
        // Play success sound
        if (audioSystem) {
            audioSystem.playSfx('qteCorrect', { volume: points >= 3 ? 1.0 : 0.8 });
        }
        
        // Increase scroll speed on hit
        if (this.scene.increaseScrollSpeed) {
            this.scene.increaseScrollSpeed();
        }
        
        // Increment stability (successful hit = more stable)
        this.consecutiveMistakes = 0;
        this.updateStability(-1); // Reduce instability, negative makes it more stable
        
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
        
        // NOTE: Spawn target code is removed to prevent double spawning in monkey-patched version
    }
    
    handleFailedHit(message = 'MISS!') {
        // Visual feedback for miss
        this.targetZone.setStrokeStyle(2, 0xff0000);
        
        // Play fail sound
        if (audioSystem) {
            audioSystem.playSfx('qteMistake');
        }
        
        // Increase consecutive mistakes count and update stability
        this.consecutiveMistakes++;
        if (this.consecutiveMistakes >= 1) {
            // Use the delta parameter to increase stability level, capped at 3 (critical)
            this.updateStability(1); // Increase instability by 1 level
            
            // If this is the 4th consecutive mistake, trigger game over
            if (this.consecutiveMistakes >= 4) {
                this.stabilityLevel = 4; // Fallen off
                
                // Immediately hide all QTE elements to make clear the game over
                if (this.meterBar) this.meterBar.setVisible(false);
                if (this.meterBorder) this.meterBorder.setVisible(false);
                if (this.movingIndicator) this.movingIndicator.setVisible(false);
                if (this.targetZone) this.targetZone.setVisible(false);
                if (this.perfectZone) this.perfectZone.setVisible(false);
                if (this.goodZone) this.goodZone.setVisible(false);
                if (this.buttonText) this.buttonText.setVisible(false);
                
                // Stop all further input processing
                this.isGameStarted = false;
                
                this.updateStability();
                return; // Early return as game over will be handled by the fall animation
            }
        }
        
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
        
        // Spawn a new target after a delay (only if not at critical level 4)
        if (this.stabilityLevel < 4) {
            this.buttonPressed = true;
            this.scene.time.delayedCall(400, () => {
                if (this.isGameStarted) {
                    this.spawnTarget();
                }
            });
        }
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
        this.indicatorSpeedPerSecond = this.baseIndicatorSpeedPerSecond * this.qteSpeedModifier;
        
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
        
        // Choose a random button from the active buttons for this target
        const buttonIndex = Phaser.Math.Between(0, this.activeButtonCount - 1);
        this.currentButton = this.activeButtons[buttonIndex];
        
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
        // Stop all ongoing tweens
        if (this.wobbleTween) {
            this.wobbleTween.stop();
            this.wobbleTween = null;
        }
        
        // Reset game state
        this.score = 0;
        this.isGameStarted = false;
        this.startTime = null;
        this.currentButton = null;
        this.buttonPressed = false;
        
        // Reset stability tracking
        this.consecutiveMistakes = 0;
        this.stabilityLevel = 0;
        
        // Clean up UI elements
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
        
        // Clean up stability indicators
        this.clearStabilityIndicators();
        
        // Reset indicator properties to ensure proper positioning on next creation
        this.indicatorPosition = this.meterWidth / 2;
        this.indicatorDirection = 1;
        
        // Clean up event listeners
        if (this.keys) {
            // Assuming we created keys with scene.input.keyboard.addKeys
            Object.values(this.keys).forEach(key => {
                if (key.removeAllListeners) key.removeAllListeners();
            });
            
            // Reset keys object
            this.keys = null;
        }
        
        // Remove custom event listeners
        this.scene.events.off('screenShakeComplete');
    }

    updateStability(delta = 0) {
        // Stop any existing wobble tween
        if (this.wobbleTween) {
            this.wobbleTween.stop();
            this.wobbleTween = null;
        }
        
        // Return if the player isn't even created yet
        if (!this.scene.playerContainer) {
            return;
        }
        
        // If delta is provided, adjust stability level
        if (delta !== 0) {
            // Adjust stability level (negative delta = more stable, positive = less stable)
            this.stabilityLevel = Math.max(0, Math.min(3, this.stabilityLevel + delta));
        }
        
        // Update the stability indicators
        this.updateStabilityIndicators();
        
        // Apply wobble effect based on stability level
        switch(this.stabilityLevel) {
            case 0: // Stable - no wobble
                // Reset to normal rotation
                this.scene.playerContainer.rotation = 0;
                break;
                
            case 1: // Slight wobble
                this.wobbleTween = this.scene.tweens.add({
                    targets: this.scene.playerContainer,
                    rotation: { from: -0.05, to: 0.05 },
                    duration: 400,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
                break;
                
            case 2: // Moderate wobble
                this.wobbleTween = this.scene.tweens.add({
                    targets: this.scene.playerContainer,
                    rotation: { from: -0.1, to: 0.1 },
                    duration: 300,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
                break;
                
            case 3: // Severe wobble - critical
                this.wobbleTween = this.scene.tweens.add({
                    targets: this.scene.playerContainer,
                    rotation: { from: -0.2, to: 0.2 },
                    duration: 200,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
                break;
                
            case 4: // Fall off - game over
                // Animate falling off
                this.scene.tweens.add({
                    targets: this.scene.playerContainer,
                    rotation: 1.5, // 90 degrees tilt
                    y: '+=200', // Fall downward
                    duration: 1000,
                    ease: 'Power2.easeIn',
                    onComplete: () => this.endGameDueToFall()
                });
                break;
        }
    }
    
    endGameDueToFall() {
        // Reset score to 0 when fallen off
        this.score = 0;
        
        // Ensure opponent score is at least 1 to guarantee they win
        if (this.scene.opponentScore === 0) {
            this.scene.opponentScore = 1;
        }
        
        // Play fall sound
        if (audioSystem) {
            audioSystem.playSfx('baa', { volume: 1.5 });
        }
        
        // Make sure player stays off screen by moving it further down
        if (this.scene.playerContainer) {
            this.scene.playerContainer.y += 300;
            this.scene.playerContainer.alpha = 0; // Fully hide the player when falling off
        }
        
        // Create game over text with message about falling
        const { width: w, height: h } = this.scene.cameras.main;
        const fallText = this.scene.add.text(
            w / 2, 
            h / 3,
            'FELL OFF!',
            {
                fontSize: '64px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setDepth(100);
        
        // Flash the text
        this.scene.tweens.add({
            targets: fallText,
            alpha: { from: 0, to: 1 },
            duration: 200,
            repeat: 2,
            yoyo: true,
            onComplete: () => {
                // End the game with score of 0
                this.endGame();
            }
        });
    }
} 