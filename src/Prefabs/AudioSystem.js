class AudioSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Audio categories
        this.music = null;
        this.sfx = {};
        
        // Playlist functionality
        this.playlist = ['song_0', 'song_1'];
        this.currentSongIndex = 0;
        this.isPlaylistPlaying = false;
        
        // Audio settings
        this.settings = {
            masterVolume: 1.0,
            musicVolume: 0.5,
            sfxVolume: 0.8,
            muteMusic: false,
            muteSfx: false
        };
        
        // Load settings from localStorage if available
        this.loadSettings();
    }

    // Initialize audio system with scene
    init() {
        // Initialize any scene specific sounds
        this.setupSounds();
        return this;
    }
    
    // Set up common sounds used throughout the game
    setupSounds() {
        // UI sounds
        this.sfx.click = this.scene.sound.add('ui_click', { volume: 0.5 });
        
        // Shop sounds
        this.sfx.buy = this.scene.sound.add('shop_buy', { volume: 0.7 });
        this.sfx.equip = this.scene.sound.add('shop_equip', { volume: 0.6 });
        
        // Game sounds
        this.sfx.baa = this.scene.sound.add('baa', { volume: 0.7 });
        this.sfx.lance = this.scene.sound.add('lance', { volume: 0.6 });
        this.sfx.lanceHit = this.scene.sound.add('lance_hit', { volume: 0.8 });
        
        // QTE sounds - pitch down the correct sound by 500 cents (5 semitones)
        this.sfx.qteCorrect = this.scene.sound.add('qte_correct', { 
            volume: 0.6,
            detune: -500 // Lower the pitch by 5 semitones
        });
        this.sfx.qteMistake = this.scene.sound.add('qte_mistake', { volume: 0.5 });
        
        // Crowd sounds
        this.sfx.crowdCheer = this.scene.sound.add('crowd_cheer', { volume: 0.5 });
        this.sfx.crowdSheep = this.scene.sound.add('crowd_sheep', { volume: 0.4 });

        // Apply volume settings to all sounds
        this.applyVolumeSettings();
    }
    
    // Start the music playlist
    startMusicPlaylist() {
        if (!this.isPlaylistPlaying) {
            this.isPlaylistPlaying = true;
            this.playCurrentSong();
        }
    }
    
    // Play the current song in the playlist
    playCurrentSong() {
        const currentSong = this.playlist[this.currentSongIndex];
        
        // Stop any currently playing music
        if (this.music) {
            this.music.stop();
        }
        
        // Create music configuration - don't loop individual songs
        const musicConfig = {
            loop: false,
            volume: this.settings.musicVolume * this.settings.masterVolume
        };
        
        // Add the music to the scene
        this.music = this.scene.sound.add(currentSong, musicConfig);
        
        // Set up completion callback to play next song
        this.music.once('complete', () => {
            this.nextSong();
        });
        
        // Play the music if not muted
        if (!this.settings.muteMusic && this.isPlaylistPlaying) {
            this.music.play();
        }
    }
    
    // Move to the next song in the playlist
    nextSong() {
        // Advance to the next song in the playlist
        this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
        
        // Play the new current song if playlist is active
        if (this.isPlaylistPlaying) {
            this.playCurrentSong();
        }
    }
    
    // Play UI click sound
    playClick() {
        if (!this.settings.muteSfx && this.sfx.click) {
            this.sfx.click.play();
        }
    }
    
    // Play any sound effect by key
    playSfx(key, config = {}) {
        if (this.settings.muteSfx || !this.sfx[key]) return;
        
        // Check if we should stop the sound
        if (config.stop) {
            if (this.sfx[key]) {
                this.sfx[key].stop();
            }
            return;
        }
        
        // Create a combined config with defaults
        const soundConfig = {
            volume: this.settings.sfxVolume * this.settings.masterVolume,
            ...config
        };
        
        this.sfx[key].play(soundConfig);
    }
    
    // Play a single music track (not part of playlist)
    playMusic(key, config = {}) {
        // Stop playlist playback
        this.isPlaylistPlaying = false;
        
        // Stop any currently playing music
        if (this.music) {
            this.music.stop();
        }
        
        // Default music config
        const musicConfig = {
            loop: true,
            volume: this.settings.musicVolume * this.settings.masterVolume,
            ...config
        };
        
        // Add the music to the scene
        this.music = this.scene.sound.add(key, musicConfig);
        
        // Play the music if not muted
        if (!this.settings.muteMusic) {
            this.music.play();
        }
    }
    
    // Stop currently playing music
    stopMusic() {
        if (this.music) {
            this.music.stop();
            this.music = null;
        }
        this.isPlaylistPlaying = false;
    }
    
    // Pause currently playing music
    pauseMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.pause();
        }
    }
    
    // Resume paused music
    resumeMusic() {
        if (this.music && !this.music.isPlaying && !this.settings.muteMusic) {
            this.music.resume();
        }
    }
    
    // Toggle mute state of sound effects
    toggleSfxMute() {
        this.settings.muteSfx = !this.settings.muteSfx;
        this.saveSettings();
    }
    
    // Toggle mute state of music
    toggleMusicMute() {
        this.settings.muteMusic = !this.settings.muteMusic;
        
        if (this.settings.muteMusic && this.music) {
            this.music.pause();
        } else if (!this.settings.muteMusic && this.music) {
            this.music.resume();
        }
        
        this.saveSettings();
    }
    
    // Set master volume (0.0 to 1.0)
    setMasterVolume(volume) {
        this.settings.masterVolume = Math.max(0, Math.min(1, volume));
        this.applyVolumeSettings();
        this.saveSettings();
    }
    
    // Set music volume (0.0 to 1.0)
    setMusicVolume(volume) {
        this.settings.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.music) {
            this.music.setVolume(this.settings.musicVolume * this.settings.masterVolume);
        }
        
        this.saveSettings();
    }
    
    // Set sound effects volume (0.0 to 1.0)
    setSfxVolume(volume) {
        this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
        this.applyVolumeSettings();
        this.saveSettings();
    }
    
    // Apply volume settings to all sound effects
    applyVolumeSettings() {
        const finalVolume = this.settings.sfxVolume * this.settings.masterVolume;
        
        Object.values(this.sfx).forEach(sound => {
            if (sound) {
                sound.setVolume(finalVolume);
            }
        });
    }
    
    // Fade out and stop all currently playing sounds
    fadeOutAllSounds(duration = 1000) {
        // Fade out crowd cheering and other ambient sounds
        Object.keys(this.sfx).forEach(key => {
            const sound = this.sfx[key];
            if (sound && sound.isPlaying) {
                // Some sounds like crowd cheering should be stopped immediately
                if (key === 'crowdCheer') {
                    sound.stop();
                    // Reset volume for future plays
                    sound.setVolume(this.settings.sfxVolume * this.settings.masterVolume);
                }
                // Only fade out looping sounds or certain sound effects
                else if (sound.loop || key === 'crowdSheep' || key === 'baa') {
                    this.scene.tweens.add({
                        targets: sound,
                        volume: 0,
                        duration: duration,
                        onComplete: () => {
                            sound.stop();
                            // Reset volume for future plays
                            sound.setVolume(this.settings.sfxVolume * this.settings.masterVolume);
                        }
                    });
                }
            }
        });
    }
    
    // Save audio settings to localStorage
    saveSettings() {
        try {
            localStorage.setItem('baalance_audio', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save audio settings:', e);
        }
    }
    
    // Load audio settings from localStorage
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('baalance_audio');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (e) {
            console.error('Failed to load audio settings:', e);
        }
    }
    
    // Clean up audio resources
    destroy() {
        // Fade out any playing sounds
        this.fadeOutAllSounds(300);
        
        // Stop all sounds
        Object.values(this.sfx).forEach(sound => {
            if (sound) {
                sound.stop();
            }
        });
        
        if (this.music) {
            this.music.stop();
            this.music = null;
        }
        
        this.sfx = {};
        this.isPlaylistPlaying = false;
    }
} 