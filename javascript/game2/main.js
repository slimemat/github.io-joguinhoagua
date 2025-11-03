import AudioManager from './AudioManager.js';
import TerrainManager, { TERRAIN_WIDTH, TERRAIN_HEIGHT, TERRAIN_RESOLUTION } from './terrainManager.js';
import LevelBuilder, { ParticleType, ParticleColors } from './levelBuilder.js';
import ParticleManager from './particleManager.js';
import UIManager from './uiManager.js'; 
import { optionsModal } from '../../javascript/menu/OptionsModal.js';

// --- Global Constants ---

class Game {
    /**
     * Initializes the game's state properties.
     */
    constructor() {

        this.world = null;
        this.renderer = null;
        
        this.terrainManager = null;
        this.levelBuilder = null;
        this.particleManager = null;
        this.uiManager = new UIManager();

        this.firstClick = false;
        this.initialParticleCount = 0;
        this.collectedParticleCount = 0;
        this.currentLevelIndex = 0;
        this.needsRebuild = false;
        this.isRebuilding = false;
        this.audioManager = new AudioManager();
        this.sizzleCooldown = 0;
        
        this.levelWon = false;
        this.isPaused = false;
    }

    /**
     * Asynchronously sets up the game world, fetches level data, and starts the game loop.
     * @returns {Promise<void>}
     */
    async init() {
        const response = await fetch('levels.json');
        window.levels = await response.json();

        const gravity = new box2d.b2Vec2(0, 10);
        this.world = new box2d.b2World(gravity);
        this.world.CreateParticleSystem(new box2d.b2ParticleSystemDef());

        this.terrainManager = new TerrainManager(this.world, this);
        this.levelBuilder = new LevelBuilder(this.world, this);
        this.particleManager = new ParticleManager(this.world, this, this.terrainManager);
        
        this.renderer = new Renderer(
            this.world, 
            this.terrainManager,
            ParticleColors,
            TERRAIN_WIDTH,
            TERRAIN_HEIGHT,
            TERRAIN_RESOLUTION
        );

        const originalModalHide = optionsModal.hide.bind(optionsModal);
        optionsModal.hide = () => {
            originalModalHide();

            // Só despausa se o jogo estiver pausado E o modal de confirmação não estiver aberto
            if (this.isPaused && this.uiManager.confirmOverlay.classList.contains('hidden')) {
                this.silentUnpause();
            }
        };

        this.uiManager.setupNextLevelButton(() => {
            this.currentLevelIndex++;
            if (this.currentLevelIndex >= window.levels.length) {
                this.uiManager.hideWinMessage(); 
                this.uiManager.showFinalMessage(
                    () => {
                        this.currentLevelIndex = 0;
                        this.loadLevel(this.currentLevelIndex);
                    },
                    () => {
                        window.location.href = '../../map/index.html';
                    }
                );
            } else {
                this.loadLevel(this.currentLevelIndex);
            }
        });

        this.uiManager.setupControlButtons({
            onPause: () => this.togglePause(),
            onRestart: () => {
                if (!this.isPaused) this.loadLevel(this.currentLevelIndex);
            },
            onSelectLevel: () => {
                this.isPaused = false; // Unpause if it was paused
                this.uiManager.togglePauseOverlay(false);
                this.uiManager.showLevelSelect(window.levels, (index) => {
                    this.currentLevelIndex = index;
                    this.loadLevel(index);
                    this.uiManager.hideLevelSelect();
                });
            },
            onMenu: () => {
                if (!this.isPaused) {
                    this.silentPause();
                }

                this.uiManager.showConfirm(
                    "Tem certeza que quer retornar ao menu principal?",
                    () => { // onConfirm:
                        window.location.href = '../../index.html';
                    },
                    () => { // onCancel:
                        this.fullPause();
                    }
                );
            },
            onOptions: () => {
                if (!this.isPaused) {
                    this.silentPause();
                }
                optionsModal.show();
            }

        });

        // NEW: Keyboard listener for pausing
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'p') {
                this.togglePause();
            }
            else if (key === 'escape' && this.isPaused) {
                // Only unpauses if the game is already paused
                this.togglePause();
            }
        });
        
        this.terrainManager.setupInput(); 
        this.loadLevel(this.currentLevelIndex);
        
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Ativa o pause completo: para o jogo, para o som, mostra o overlay.
     */
    fullPause() {
        if (this.isPaused) return; 
        this.isPaused = true;
        this.uiManager.togglePauseOverlay(true);
        this.audioManager.stopAllSounds();
    }

    /**
     * Toggles the *full* paused state of the game.
     */
    togglePause() {
        if (this.isPaused) {
            this.fullUnpause();
        } else {
            this.fullPause();
        }
    }

    /**
     * Desativa o pause completo: continua o jogo, esconde o overlay.
     * (O gameLoop reiniciará os sons automaticamente)
     */
    fullUnpause() {
        if (!this.isPaused) return; 
        this.isPaused = false;
        this.uiManager.togglePauseOverlay(false);
    }

    /**
     * Pausa silenciosa: para o jogo, NÃO para o som, NÃO mostra overlay.
     * Usado ao abrir modais (Opções, Menu).
     */
    silentPause() {
        this.isPaused = true;
    }

    /**
     * Unpause silencioso: continua o jogo.
     * Usado ao fechar o modal de Opções.
     */
    silentUnpause() {
        this.isPaused = false;
    }

    /**
     * Clears the old level and sets up all objects for the new level.
     * @param {number} levelIndex - The index of the level to load.
     */
    loadLevel(levelIndex) {
        // ADDED: Resets the win flag for the new level
        this.levelWon = false; 

        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            this.world.DestroyBody(body);
        }
        const particleSystem = this.world.GetParticleSystemList();
        const particleCount = particleSystem.GetParticleCount();
        if (particleCount > 0) {
            for (let i = particleCount - 1; i >= 0; i--) {
                particleSystem.DestroyParticle(i);
            }
        }

        this.uiManager.hideWinMessage();
        
        this.initialParticleCount = 0;
        this.collectedParticleCount = 0;

        const levelData = window.levels[levelIndex];
        
        this.terrainManager.initialize(levelData.terrain);
        this.levelBuilder.build(levelData, this.terrainManager.getTerrainGrid());
        this.terrainManager.rebuildBodies();
    }

    /**
     * The core game loop, which updates physics and triggers rendering.
     */
    gameLoop() {
        if (!this.isPaused) {
            if (this.needsRebuild && !this.isRebuilding) {
                this.terrainManager.rebuildBodies();
            }
            this.world.Step(1 / 60, 10, 10);
            
            const particleStates = this.particleManager.update();
            
            if (particleStates.contaminationHappened) {
                this.audioManager.startSizzle();
                this.sizzleCooldown = 10;
            } else {
                this.sizzleCooldown--;
                if (this.sizzleCooldown <= 0) {
                    this.audioManager.stopSizzle();
                }
            }

            if (particleStates.liquidStates.water) {
                this.audioManager.startRushingWater();
            } else {
                this.audioManager.stopRushingWater();
            }

            if (particleStates.liquidStates.toxic) {
                this.audioManager.startToxicRush();
            } else {
                this.audioManager.stopToxicRush();
            }

            const goalAmount = Math.floor(this.initialParticleCount * window.levels[this.currentLevelIndex].waterAmount);
            this.uiManager.updateScore(this.collectedParticleCount, goalAmount);
            
            // MODIFIED: This is the new win logic
            if (!this.levelWon && this.collectedParticleCount >= goalAmount && this.initialParticleCount > 0) {
                this.levelWon = true; 
                
                const isLastLevel = this.currentLevelIndex === window.levels.length - 1;

                if (isLastLevel) {
                    this.uiManager.showFinalMessage(
                        () => {
                            this.currentLevelIndex = 0;
                            this.loadLevel(this.currentLevelIndex);
                        },
                        () => {
                            window.location.href = '../../map/index.html';
                        }
                    );
                } else {
                    this.uiManager.showWinMessage();
                }
            }
        }

        this.renderer.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
}

// --- Start the Game ---
const game = new Game();
game.init();