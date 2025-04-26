class DebugMenu {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.container = null;
        this.toggleButton = null;
        this.playerState = playerState; // Global player state reference
        this.dragStartX = 0;
        this.dragStartY = 0;
    }

    create() {
        // Debug menu functionality is disabled
        // This method is intentionally empty to prevent the debug menu from being created
    }
    
    createTitleBar(w, h) {
        // Debug menu functionality is disabled
    }
    
    createDebugButtons() {
        // Debug menu functionality is disabled
    }
    
    createButton(text, x, y, callback, textColor = '#ffffff') {
        // Debug menu functionality is disabled
    }
    
    toggleVisibility() {
        // Debug menu functionality is disabled
    }
    
    showFeedbackMessage(message) {
        // Debug menu functionality is disabled
    }
    
    // Debug actions - all disabled
    addMoney(amount) {
        // Debug menu functionality is disabled
    }
    
    addWins(count) {
        // Debug menu functionality is disabled
    }
    
    unlockItem(itemId) {
        // Debug menu functionality is disabled
    }
    
    unlockAllSkins() {
        // Debug menu functionality is disabled
    }
    
    unlockAllLeagues() {
        // Debug menu functionality is disabled
    }
    
    maxPlayerRank() {
        // Debug menu functionality is disabled
    }
    
    resetPlayerState() {
        // Debug menu functionality is disabled
    }
    
    testMatch(outcome) {
        // Debug menu functionality is disabled
    }
    
    // Audio control methods - all disabled
    toggleMusicMute() {
        // Debug menu functionality is disabled
    }
    
    toggleSfxMute() {
        // Debug menu functionality is disabled
    }
    
    adjustSfxVolume(volume) {
        // Debug menu functionality is disabled
    }
    
    // Next song control - disabled
    nextSong() {
        // Debug menu functionality is disabled
    }
    
    // Music volume control - disabled
    adjustMusicVolume(volume) {
        // Debug menu functionality is disabled
    }
    
    // Save/Load methods - disabled
    saveGame() {
        // Debug menu functionality is disabled
    }
    
    loadGame() {
        // Debug menu functionality is disabled
    }
    
    deleteSave() {
        // Debug menu functionality is disabled
    }
    
    destroy() {
        // No need to clean up since we're not creating anything
    }
} 