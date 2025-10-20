// js/game2/AudioManager.js
// Centraliza o controle de todos os áudios do jogo 2.

export default class AudioManager {
    constructor() {
        this.isUnlocked = false;
        this.sizzleSound = document.getElementById("sizzle-sound");
        this.rushingWaterSound = document.getElementById("rushing-water-sound");
        this.toxicRushSound = document.getElementById("rushing-toxic-sound");

        this.isSizzling = false;
        this.isRushing = false;
        this.isToxicRushing = false;

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

    // Call this after the first user interaction (e.g., mouse click)
    unlock() {
        if (this.isUnlocked) return;
        this.isUnlocked = true;
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

    /**
     * Stops all currently playing game sounds.
     */
    stopAllSounds() {
        this.stopSizzle();
        this.stopRushingWater();
        this.stopToxicRush();
    }
}