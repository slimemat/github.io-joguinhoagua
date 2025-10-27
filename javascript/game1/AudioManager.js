// js/game1/AudioManager.js
// Centraliza o controle de todos os áudios do jogo 1.

import { globalOptions } from '../menu/OptionsManager.js';

export default class AudioManager {
    constructor() {
        this.isUnlocked = false;
        this.backgroundMusic = document.getElementById("background-music");
        this.collectSound = document.getElementById("collect-sound");
        this.correctSound = document.getElementById("correct-sound");
        this.wrongSound = document.getElementById("wrong-sound");
        this.celebrationSound = document.getElementById("celebration-sound");

        this.isMusicPlaying = true;
        this.gameIsPaused = false;

        this.updateMusicVolume();
        window.addEventListener('globalOptionsUpdated', () => this.handleGlobalUpdate());
    }

    handleGlobalUpdate() {
        this.updateMusicVolume();

        const isGlobalyEnabled = globalOptions.isMusicEnabled();
        const isCurrentlyPlaying = this.isMusicPlaying;

        if (!isGlobalyEnabled && isCurrentlyPlaying) {
             this.pauseMusic();
        } else if (isGlobalyEnabled && !isCurrentlyPlaying && !this.gameIsPaused) {
            this.playMusic();
        }

    }

    updateMusicVolume() {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = globalOptions.getMusicVolume(); 
        }
    }

    playMusic() {
        if (globalOptions.isMusicEnabled() && !this.gameIsPaused) {
            this.backgroundMusic?.play();
            this.isMusicPlaying = true;
        }
    }

    pauseMusic() {
        this.backgroundMusic?.pause();
        this.isMusicPlaying = false;
    }

    unlockAudioContext() {
        if (this.isUnlocked) return;
        this.isUnlocked = true;
        this.playMusic();
    }

    applySfxVolume(audioElement) {
        if (audioElement) {
            audioElement.volume = globalOptions.getSfxVolume();
        }
    }

    playCollectSound() {
        if (this.collectSound) {
            this.applySfxVolume(this.collectSound);
            this.collectSound.currentTime = 0;
            this.collectSound.play();
        }
    }

    playCorrectSound() {
        if (this.correctSound) {
            this.applySfxVolume(this.correctSound);
            this.correctSound.currentTime = 0;
            this.correctSound.play();
        }
    }

    playWrongSound() {
        if (this.wrongSound) {
            this.applySfxVolume(this.playWrongSound);
            this.wrongSound.currentTime = 0;
            this.wrongSound.play();
        }
    }

    playCelebration() {
        if (this.celebrationSound) {
            this.applySfxVolume(this.playCelebration);
            this.celebrationSound.currentTime = 0;
            this.celebrationSound.play();
        }
    }

    setPaused(isPaused) {
        this.gameIsPaused = isPaused;
        if (isPaused) {
            if (this.isMusicPlaying) {
                this.backgroundMusic?.pause();
            }
        } 
        else {
            if (globalOptions.isMusicEnabled() && this.isMusicPlaying) {
                this.backgroundMusic?.play();
            }
        }
    }
}