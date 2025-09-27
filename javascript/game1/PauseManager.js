export default class PauseManager {
    constructor(game) {
        this.game = game;
        this.overlay = document.getElementById('pause-overlay');
        this.paused = false;

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            }
        });
    }

    togglePause() {
        this.paused = !this.paused;
        this.game.paused = this.paused;
        this.overlay.classList.toggle('hidden', !this.paused);
    }
}
