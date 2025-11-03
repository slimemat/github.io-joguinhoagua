// js/game2/AudioManager.js
// Centraliza o controle de todos os áudios do jogo 2
// 
import { globalOptions } from '../../javascript/menu/OptionsManager.js';

export default class AudioManager {
    constructor() {
        this.isUnlocked = false;
        this.backgroundMusic = document.getElementById("background-music");
        this.sizzleSound = document.getElementById("sizzle-sound");
        this.rushingWaterSound = document.getElementById("rushing-water-sound");
        this.toxicRushSound = document.getElementById("rushing-toxic-sound");

        this.isSizzling = false;
        this.isRushing = false;
        this.isToxicRushing = false;
        this.gameIsPaused = false;

        this.handleGlobalUpdate();

        window.addEventListener('globalOptionsUpdated', () => this.handleGlobalUpdate());
    }

    handleGlobalUpdate() {
        this.applyMusicVolume();
        this.applySfxVolume(this.sizzleSound);
        this.applySfxVolume(this.rushingWaterSound);
        this.applySfxVolume(this.toxicRushSound);

        if (globalOptions.isMusicEnabled()) {
            this.playMusic();
        } else {
            this.pauseMusic();
        }
    }

    /**
     * Helper para aplicar o volume de MÚSICA.
     */
    applyMusicVolume() {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = globalOptions.getMusicVolume();
        }
    }

    /**
     * Tenta tocar a música de fundo (se permitido).
     */
    playMusic() {
        if (this.isUnlocked && globalOptions.isMusicEnabled() && !this.gameIsPaused) {
            this.backgroundMusic?.play();
        }
    }

    /**
     * Pausa a música de fundo incondicionalmente.
     */
    pauseMusic() {
        this.backgroundMusic?.pause();
    }

    /**
     * Helper para aplicar o volume de SFX a um elemento.
     */
    applySfxVolume(element) {
        if (element) {
            element.volume = globalOptions.getSfxVolume();
        }
    }

    // Call this after the first user interaction (e.g., mouse click)
    unlock() {
        if (this.isUnlocked) return;
        this.isUnlocked = true;
        this.playMusic();
    }

    startSizzle() {
        if (!this.isUnlocked || globalOptions.getSfxVolume() === 0) return;
        
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
        if (!this.isUnlocked || globalOptions.getSfxVolume() === 0) return;
        
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
        if (!this.isUnlocked || globalOptions.getSfxVolume() === 0) return;
        
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
        this.pauseMusic();
        this.stopSizzle();
        this.stopRushingWater();
        this.stopToxicRush();
    }

    /**
     * método para ser chamado pelo 'fullPause' e 'fullUnpause' do Game.
     */
    setPaused(isPaused) {
        this.gameIsPaused = isPaused;
        if (isPaused) {
            this.stopAllSounds();
        } else {
            this.playMusic(); 
        }
    }
}