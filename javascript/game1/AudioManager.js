// js/game1/AudioManager.js
// Centraliza o controle de todos os áudios do jogo 1.

export default class AudioManager {
    constructor() {
        this.isUnlocked = false;
        this.backgroundMusic = document.getElementById("background-music");
        this.collectSound = document.getElementById("collect-sound");
        this.correctSound = document.getElementById("correct-sound");
        this.wrongSound = document.getElementById("wrong-sound");
        this.celebrationSound = document.getElementById("celebration-sound");

        this.isMusicPlaying = true;

        if (this.backgroundMusic) {
            this.backgroundMusic.volume = 0.3;
        }
    }

    playMusic() {
        this.backgroundMusic?.play();
        this.isMusicPlaying = true;
        this.updateButtonText();
    }

    pauseMusic() {
        this.backgroundMusic?.pause();
        this.isMusicPlaying = false;
        this.updateButtonText();
    }

    unlockAudioContext() {
        if (this.isUnlocked) return;
        this.isUnlocked = true;
        this.playMusic();
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }
    
    updateButtonText() {
        const button = document.getElementById("toggle-music");
        if (button) {
            button.innerText = this.isMusicPlaying ? "Pausar Música" : "Reproduzir Música";
        }
    }

    playCollectSound() {
        if (this.collectSound) {
            this.collectSound.currentTime = 0;
            this.collectSound.play();
        }
    }

    playCorrectSound() {
        if (this.correctSound) {
            this.correctSound.currentTime = 0;
            this.correctSound.play();
        }
    }

    playWrongSound() {
        if (this.wrongSound) {
            this.wrongSound.currentTime = 0;
            this.wrongSound.play();
        }
    }

    playCelebration() {
        if (this.celebrationSound) {
            this.celebrationSound.currentTime = 0;
            this.celebrationSound.play();
        }
    }
}