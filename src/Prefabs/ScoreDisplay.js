class ScoreDisplay {
    constructor(scene) {
        this.scene = scene;
        this.scoreText = null;
        this.lastScore = 0;
    }

    create() {
        // Create score text style
        this.textStyle = {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        // Create score display
        this.scoreText = this.scene.add.text(20, 20, 'Score: 0', this.textStyle);
    }

    update(score) {
        // Animate score change
        if (score !== this.lastScore) {
            this.animateScoreChange(score);
            this.lastScore = score;
        }
    }

    animateScoreChange(newValue) {
        // Create a temporary text for the animation
        const diff = newValue - this.lastScore;
        const sign = diff > 0 ? '+' : '';
        const tempText = this.scene.add.text(
            this.scoreText.x,
            this.scoreText.y,
            `${sign}${diff}`,
            {
                ...this.textStyle,
                color: diff > 0 ? '#00ff00' : '#ff0000'
            }
        );

        // Animate the temporary text
        this.scene.tweens.add({
            targets: tempText,
            y: tempText.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                tempText.destroy();
            }
        });

        // Update the main text
        this.scoreText.setText(`Score: ${newValue}`);

        // Add a quick scale animation to the main text
        this.scene.tweens.add({
            targets: this.scoreText,
            scale: 1.2,
            duration: 200,
            yoyo: true
        });
    }

    destroy() {
        if (this.scoreText) {
            this.scoreText.destroy();
        }
    }
} 