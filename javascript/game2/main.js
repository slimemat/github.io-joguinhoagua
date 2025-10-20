import AudioManager from './AudioManager.js';
import TerrainManager, { TERRAIN_WIDTH, TERRAIN_HEIGHT, TERRAIN_RESOLUTION } from './terrainManager.js';
import LevelBuilder, { ParticleType, ParticleColors } from './levelBuilder.js';
import ParticleManager from './particleManager.js';
import UIManager from './uiManager.js'; 

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
        
        // ADDED: Flag to prevent the win panel from showing multiple times
        this.levelWon = false;
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

        // This logic remains the same. It triggers when a win panel button is clicked.
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
        
        this.terrainManager.setupInput(); 
        this.loadLevel(this.currentLevelIndex);
        
        requestAnimationFrame(() => this.gameLoop());
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

        this.renderer.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
}

// --- Start the Game ---
const game = new Game();
game.init();