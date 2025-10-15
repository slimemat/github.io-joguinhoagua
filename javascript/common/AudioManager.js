// js/audio.js
// Centraliza o controle de todos os áudios do jogo.

export default class AudioManager {
    constructor() {
        this.isUnlocked = false;
        this.backgroundMusic = document.getElementById("background-music");
        this.collectSound = document.getElementById("collect-sound");
        this.correctSound = document.getElementById("correct-sound");
        this.wrongSound = document.getElementById("wrong-sound");
        this.celebrationSound = document.getElementById("celebration-sound");
        this.sizzleSound = document.getElementById("sizzle-sound");
        this.rushingWaterSound = document.getElementById("rushing-water-sound");
        this.toxicRushSound = document.getElementById("rushing-toxic-sound");

        this.isMusicPlaying = true;

        this.isRushing = false;
        this.isToxicRushing = false;

        if(this.backgroundMusic) {
            this.backgroundMusic.volume = 0.3;
        }

        if (this.sizzleSound) {
            this.sizzleSound.volume = 0.7;
        }
        if (this.rushingWaterSound) {
            this.rushingWaterSound.volume = 0.4;
        }
        if (this.toxicRushSound) {
            this.toxicRushSound.volume = 0.5;
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

    startSizzle() {
        if (!this.isUnlocked) return;
        if (this.sizzleSound && !this.isSizzling) {
            this.sizzleSound.currentTime = 0;
            this.sizzleSound.play();
            this.isSizzling = true;
        }
    }

    stopSizzle() {
        if (!this.isUnlocked) return;
        if (this.sizzleSound && this.isSizzling) {
            this.sizzleSound.pause();
            this.isSizzling = false;
        }
    }

    startRushingWater() {
        if (!this.isUnlocked) return;
        if (this.rushingWaterSound && !this.isRushing) {
            this.rushingWaterSound.currentTime = 0;
            this.rushingWaterSound.play();
            this.isRushing = true;
        }
    }

    stopRushingWater() {
        if (!this.isUnlocked) return;
        if (this.rushingWaterSound && this.isRushing) {
            this.rushingWaterSound.pause();
            this.isRushing = false;
        }
    }

    startToxicRush() {
        if (!this.isUnlocked) return;
        if (this.toxicRushSound && !this.isToxicRushing) {
            this.toxicRushSound.play();
            this.isToxicRushing = true;
        }
    }

    stopToxicRush() {
        if (!this.isUnlocked) return;
        if (this.toxicRushSound && this.isToxicRushing) {
            this.toxicRushSound.pause();
            this.toxicRushSound.currentTime = 0;
            this.isToxicRushing = false;
        }
    }

  
}
