let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true
    },
    //pixelArt: true,
    width: 1280,
    height: 720,
    zoom: 1,
    physics: {
        default: "arcade",
        arcade: {
            //debug: true,
        }
    },
    scene: [ LoadScene, MainMenu, MainLoop, LanceGame, OutcomeScene, CareerScene, ShopScene ],
    // Add global sound manager to ensure music persists between scenes
    audio: {
        disableWebAudio: false,
        noAudio: false
    }
}

const game = new Phaser.Game(config)

// Initialize global player state
const playerState = new PlayerState();

// Initialize global audio system (will be properly set up in LoadScene)
let audioSystem = null;

// globals
const centerX = game.config.width / 2
const centerY = game.config.height / 2
const w = game.config.width
const h = game.config.height
let cursors = null