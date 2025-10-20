export default class PauseManager {
    // Pass the audio manager into the constructor
    constructor(game, audioManager) {
        this.game = game;
        this.audioManager = audioManager; // Store reference
        this.overlay = document.getElementById('pause-overlay');
        this.paused = false;
    }

    togglePause() {
        this.paused = !this.paused;
        this.game.paused = this.paused;
        this.overlay.classList.toggle('hidden', !this.paused);
        this.audioManager.setPaused(this.paused);
    }
    
    unpause() {
        if (this.paused) {
            this.togglePause();
        }
    }
}