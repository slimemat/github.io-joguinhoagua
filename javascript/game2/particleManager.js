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
     * Ponto de entrada principal, chamado a cada frame pelo gameLoop.
     * Orquestra todos os comportamentos das partículas.
     * @returns {{contaminationHappened: boolean, liquidStates: {water: boolean, toxic: boolean}}}
     */
    update() {
        const contaminationHappened = this._handleAllContacts();
        this._destroyOffScreenParticles();
        this._updateTreatmentStations();
        const liquidStates = this._checkLiquidSpeeds();

        return { contaminationHappened, liquidStates };
    }

    // --- MÉTODOS PRIVADOS DE LÓGICA ---

    /**
     * Agrupa e executa todas as verificações de contato.
     * @private
     */
    _handleAllContacts() {
        const contaminationHappened = this._handleParticleContamination();
        this._handleParticleBodyContacts();
        return contaminationHappened;
    }

    /**
     * Verifica o contato das partículas com os corpos do mundo.
     * @private
     */
    _handleParticleBodyContacts() {
        const particleSystem = this.world.GetParticleSystemList();
        const particleContacts = particleSystem.GetBodyContacts();
        for (const contact of particleContacts) {
            const particleIndex = contact.index;
            const fixture = contact.fixture;

            if (fixture) {
                const fixtureData = fixture.GetUserData();
                const particleData = particleSystem.GetUserDataBuffer();

                // Lógica para absorver água na estação de tratamento.
                if (fixtureData && fixtureData.type === 'treatment_station_body' && particleData[particleIndex] === ParticleType.TOXIC) {
                    const station = fixtureData.station;
                    // Só absorve se a estação não estiver cheia ou processando a liberação.
                    if (!station.isProcessing && station.processingQueue < station.capacity) {
                        particleSystem.DestroyParticle(particleIndex);
                        station.processingQueue++;
                    }
                }
            }
        }
    }

    /**
     * Gerencia os timers das estações e o ciclo de encher e esvaziar.
     * @private
     */
    _updateTreatmentStations() {
        const levelData = window.levels[this.game.currentLevelIndex];
        if (!levelData || !levelData.treatmentStations) return;

        for (const station of levelData.treatmentStations) {
            // Se a estação encheu e não está processando, inicia o timer.
            if (station.processingQueue >= station.capacity && !station.isProcessing) {
                station.isProcessing = true;
                station.releaseTimer = 30; // cada 60 frames é um segundo de espera.
            }

            // Se está processando, diminui o timer.
            if (station.isProcessing) {
                station.releaseTimer--;

                // Quando o timer acaba, libera a água limpa e reseta a estação.
                if (station.releaseTimer <= 0) {
                    this._releaseCleanWater(station);
                    station.processingQueue = 0;
                    station.isProcessing = false;
                }
            }
        }
    }

    /**
     * Libera uma quantidade de água limpa e remove as partículas que aparecem dentro da terra.
     * @param {object} station - Os dados da estação de tratamento.
     * @private
     */
    _releaseCleanWater(station) {
        const particleSystem = this.world.GetParticleSystemList();
        const outletX = station.x;
        const outletY = station.y + station.height / 2 + 0.1; // Sai por baixo

        const particleGroupDef = new box2d.b2ParticleGroupDef();
        particleGroupDef.position.Set(outletX, outletY);
        
        const shape = new box2d.b2PolygonShape();
        shape.SetAsBox(station.width / 2, (station.capacity / 100) * 0.5); 
        particleGroupDef.shape = shape;

        particleGroupDef.flags = box2d.b2ParticleFlag.b2_waterParticle | box2d.b2ParticleFlag.b2_contactListenerParticle;
        particleGroupDef.color.Copy(ParticleColors.WATER);
        particleGroupDef.userData = ParticleType.WATER;
        
        // --- LÓGICA DE VERIFICAÇÃO ADICIONADA ---
        const terrainGrid = this.terrainManager.getTerrainGrid();
        const SCALE = 100;

        const countBefore = particleSystem.GetParticleCount();
        particleSystem.CreateParticleGroup(particleGroupDef);
        const countAfter = particleSystem.GetParticleCount();

        // Itera sobre as novas partículas criadas e as remove se estiverem na terra.
        const particles = particleSystem.GetPositionBuffer();
        for (let i = countAfter - 1; i >= countBefore; i--) {
            const pos = particles[i];
            const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
            const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);

            if (gridY >= 0 && gridY < TERRAIN_HEIGHT && gridX >= 0 && gridX < TERRAIN_WIDTH) {
                if (terrainGrid[gridY][gridX] === 1) {
                    particleSystem.DestroyParticle(i);
                }
            }
        }
    }

    /**
     * Verifica o contato entre partículas (água vs. tóxica) e espalha a contaminação.
     * @private
     */
    _handleParticleContamination() {
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
     * Verifica e destrói partículas que saíram da tela, atualizando a contagem de coleta.
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
                    this.game.collectedParticleCount++;
                }
                particleSystem.DestroyParticle(i);
            }
        }
    }

    /**
     * Verifica a velocidade dos líquidos para os efeitos sonoros.
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
            if ((particleType === ParticleType.WATER && states.water) || (particleType === ParticleType.TOXIC && states.toxic)) {
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

