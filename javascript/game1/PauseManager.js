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

    /**
     * Pausa silenciosa: para o jogo, NÃO para a música, NÃO mostra overlay.
     * Usado ao abrir modais (Opções, Menu).
     */
    silentPause() {
        this.game.paused = true;
    }

    /**
     * Unpause silencioso: continua o jogo, NÃO mexe na música, NÃO mexe no overlay.
     * Usado ao fechar o modal de Opções.
     */
    silentUnpause() {
        if (!this.game.paused) return; // Já está rodando
        
        this.game.paused = false;
        this.game.resetHintTimer();
    }
}