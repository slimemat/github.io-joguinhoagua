// particleManager.js

import { TERRAIN_WIDTH, TERRAIN_HEIGHT, TERRAIN_RESOLUTION } from './terrainManager.js';
import { ParticleType, ParticleColors } from './levelBuilder.js';

export default class ParticleManager {
    constructor(world, game, terrainManager) {
        this.world = world;
        this.game = game;
        this.terrainManager = terrainManager;
    }

    /**
     * Main update method called every frame from the game loop.
     * Manages all particle behaviors and returns states needed for audio/UI.
     * @returns {{contaminationHappened: boolean, liquidStates: {water: boolean, toxic: boolean}}}
     */
    update() {
        const contaminationHappened = this._handleContamination();
        const liquidStates = this._checkLiquidSpeeds();
        this._destroyOffScreenParticles();

        return { contaminationHappened, liquidStates };
    }

    /**
     * Checks for contact between water and toxic particles and spreads contamination.
     * @private
     */
    _handleContamination() {
        let contaminationHappened = false;
        const particleSystem = this.world.GetParticleSystemList();
        const contacts = particleSystem.GetContacts();
        const contactCount = particleSystem.GetContactCount();
        const userDataBuffer = particleSystem.GetUserDataBuffer();
        const colorBuffer = particleSystem.GetColorBuffer();
        for (let i = 0; i < contactCount; i++) {
            const contact = contacts[i];
            const indexA = contact.GetIndexA();
            const indexB = contact.GetIndexB();
            if (userDataBuffer) {
                const typeA = userDataBuffer[indexA];
                const typeB = userDataBuffer[indexB];
                if (typeA === ParticleType.WATER && typeB === ParticleType.TOXIC) {
                    userDataBuffer[indexA] = ParticleType.TOXIC;
                    if (colorBuffer) colorBuffer[indexA].Copy(ParticleColors.TOXIC);
                    contaminationHappened = true;
                } else if (typeA === ParticleType.TOXIC && typeB === ParticleType.WATER) {
                    userDataBuffer[indexB] = ParticleType.TOXIC;
                    if (colorBuffer) colorBuffer[indexB].Copy(ParticleColors.TOXIC);
                    contaminationHappened = true;
                }
            }
        }
        return contaminationHappened;
    }

    /**
     * Checks for and destroys particles that have fallen off-screen.
     * @private
     */
    _destroyOffScreenParticles() {
        const particleSystem = this.world.GetParticleSystemList();
        const userDataBuffer = particleSystem.GetUserDataBuffer();
        const particleCount = particleSystem.GetParticleCount();
        for (let i = particleCount - 1; i >= 0; i--) {
            const particleY = particleSystem.GetPositionBuffer()[i].y;
            if (particleY > 6.2) {
                if (userDataBuffer && userDataBuffer[i] === ParticleType.WATER) {
                    // Update the count on the main game instance
                    this.game.collectedParticleCount++;
                }
                particleSystem.DestroyParticle(i);
            }
        }
    }

    /**
     * Checks the speed of all liquids to determine if they are "rushing".
     * @private
     */
    _checkLiquidSpeeds() {
        const particleSystem = this.world.GetParticleSystemList();
        const velocities = particleSystem.GetVelocityBuffer();
        const positions = particleSystem.GetPositionBuffer();
        const userData = particleSystem.GetUserDataBuffer();
        const count = particleSystem.GetParticleCount();
        const speedThreshold = 1.20;
        const SCALE = 100;

        let states = { water: false, toxic: false };

        for (let i = 0; i < count; i++) {
            if (states.water && states.toxic) break;

            const particleType = userData[i];
            
            if ((particleType === ParticleType.WATER && states.water) ||
                (particleType === ParticleType.TOXIC && states.toxic)) {
                continue;
            }

            const vel = velocities[i];
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

            if (speed > speedThreshold) {
                const pos = positions[i];
                const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
                const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);

                let isNearTerrain = false;
                const checkRadius = 1;
                for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                        const checkX = gridX + dx;
                        const checkY = gridY + dy;
                        if (checkY >= 0 && checkY < TERRAIN_HEIGHT && checkX >= 0 && checkX < TERRAIN_WIDTH) {
                            // Use the terrain manager to get the grid
                            if (this.terrainManager.getTerrainGrid()[checkY][checkX] === 1) {
                                isNearTerrain = true;
                                break;
                            }
                        }
                    }
                    if (isNearTerrain) break;
                }
                
                if (!isNearTerrain) {
                    if (particleType === ParticleType.WATER) {
                        states.water = true;
                    } else if (particleType === ParticleType.TOXIC) {
                        states.toxic = true;
                    }
                }
            }
        }
        return states;
    }
}
