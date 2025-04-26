class ScoreDisplay {
    constructor(scene) {
        this.scene = scene;
        this.scoreText = null;
        this.scoreValue = 0;
        this.displayValue = 0;
        this.lastUpdateTime = 0;
        
        // Animation parameters
        this.animationSpeed = 10; // Points per second for score animation
    }

    create() {
        // Get game dimensions
        const { width: w, height: h } = this.scene.cameras.main;
        
        // Create score text
        const scoreStyle = {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };
        
        this.scoreText = this.scene.add.text(w/2, 50, 'Score: 0', scoreStyle).setOrigin(0.5);
    }

    update(score, delta) {
        // Store the new score value
        this.scoreValue = score;
        
        // If this is the first update or delta is provided, use smooth animation
        if (delta && this.displayValue !== this.scoreValue) {
            // Calculate how much to increment based on animation speed and delta
            const deltaSeconds = delta / 1000;
            const increment = this.animationSpeed * deltaSeconds;
            
            if (this.displayValue < this.scoreValue) {
                this.displayValue = Math.min(this.displayValue + increment, this.scoreValue);
            } else if (this.displayValue > this.scoreValue) {
                this.displayValue = Math.max(this.displayValue - increment, this.scoreValue);
            }
            
            this.scoreText.setText(`Score: ${Math.round(this.displayValue)}`);
        } else {
            // Immediate update if no delta is provided
            this.displayValue = this.scoreValue;
            this.scoreText.setText(`Score: ${this.scoreValue}`);
        }
    }

    destroy() {
        if (this.scoreText) {
            this.scoreText.destroy();
        }
    }
} 