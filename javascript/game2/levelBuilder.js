// levelBuilder.js

import { TERRAIN_WIDTH, TERRAIN_HEIGHT, TERRAIN_RESOLUTION } from './terrainManager.js';

// Constants for particle creation now live here
export const ParticleType = {
    WATER: 1,
    TOXIC: 2
};

export const ParticleColors = {
    WATER: new box2d.b2ParticleColor(0, 100, 255, 255),
    TOXIC: new box2d.b2ParticleColor(128, 0, 128, 255)
};

export default class LevelBuilder {
    constructor(world, game) {
        this.world = world;
        this.game = game;
    }

    /**
     * Ponto de entrada principal para construir todos os elementos do nível.
     * @param {object} levelData - Os dados completos do nível.
     * @param {Array<Array<number>>} terrainGrid - A grade do terreno já inicializada.
     */
    build(levelData, terrainGrid) {
        this.createWorldBoundaries();
        this.createPipe(levelData.pipePosition);
        this.createWater(levelData.waterShapes, terrainGrid);
        // ATUALIZADO: Agora também passamos a grade do terreno para os obstáculos.
        this.createObstacles(levelData.obstacles, terrainGrid);
        this.createTreatmentStations(levelData.treatmentStations);
    }

    /**
     * Cria as Estações de Tratamento, com um corpo único e duas fixtures.
     * @param {Array<object>} stationsData - Os dados das estações a serem criadas.
     */
    createTreatmentStations(stationsData) {
        if (!stationsData) return;

        for (const station of stationsData) {
            const { x, y, width, height } = station;

            const bodyDef = new box2d.b2BodyDef();
            bodyDef.position.Set(x, y);
            const body = this.world.CreateBody(bodyDef);

            const bodyShape = new box2d.b2PolygonShape();
            bodyShape.SetAsBox(width / 2, height / 2);
            const bodyFixture = body.CreateFixture(bodyShape, 0.0);
            bodyFixture.SetUserData({ type: "treatment_station_body", station: station });

            const intakeShape = new box2d.b2PolygonShape();
            intakeShape.SetAsBox(width / 2, height / 2);
            
            const intakeFixture = body.CreateFixture(intakeShape, 0.0);
            intakeFixture.SetSensor(true);
            intakeFixture.SetUserData({ type: "treatment_station_intake", station: station });
            
            station.processingQueue = 0;
            station.capacity = station.capacity || 100;
            station.isProcessing = false;
            station.releaseTimer = 0;
        }
    }

    /**
     * Cria as fronteiras estáticas do mundo do jogo.
     */
    createWorldBoundaries() {
        const createWall = (x, y, width, height) => {
            const bodyDef = new box2d.b2BodyDef();
            bodyDef.position.Set(x, y);
            const body = this.world.CreateBody(bodyDef);
            const shape = new box2d.b2PolygonShape();
            shape.SetAsBox(width / 2, height / 2);
            const fixture = body.CreateFixture(shape, 0.0);
            fixture.SetUserData({ type: "wall" });
        };

        createWall(5, 0, 10, 0.2);
        createWall(0, 3, 0.2, 6);
        createWall(10, 3, 0.2, 6);
        createWall(3.7, 6, 7.4, 0.2);
        createWall(9.3, 6, 1.4, 0.2);
    }

    /**
     * Cria grupos de partículas de água com base nos dados do nível.
     * @param {Array<object>} shapesDataArray - Um array de objetos definindo os corpos d'água.
     * @param {Array<Array<number>>} terrainGrid - A grade do terreno para verificar sobreposições.
     */
    createWater(shapesDataArray, terrainGrid) {
        if (!shapesDataArray) return;
        const particleSystem = this.world.GetParticleSystemList();
        particleSystem.SetRadius(0.05);
        const SCALE = 100;

        for (const shapeData of shapesDataArray) {
            const pgd = new box2d.b2ParticleGroupDef();
            pgd.position.Set(shapeData.x, shapeData.y);
            pgd.flags = box2d.b2ParticleFlag.b2_waterParticle | box2d.b2ParticleFlag.b2_contactListenerParticle;
            pgd.color.Copy(ParticleColors.WATER);
            pgd.userData = ParticleType.WATER;

            if (shapeData.type === 'box') {
                const shape = new box2d.b2PolygonShape();
                shape.SetAsBox(shapeData.halfWidth, shapeData.halfHeight);
                pgd.shape = shape;
            }

            const countBefore = particleSystem.GetParticleCount();
            particleSystem.CreateParticleGroup(pgd);
            const countAfter = particleSystem.GetParticleCount();

            if (!shapeData.canGoThroughDirt) {
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
        }
        
        this.game.initialParticleCount = particleSystem.GetParticleCount();
    }

    /**
     * Cria obstáculos e líquidos tóxicos com base nos dados do nível.
     * @param {Array<object>} obstaclesData - Um array de objetos definindo os obstáculos.
     * @param {Array<Array<number>>} terrainGrid - A grade do terreno para verificar sobreposições.
     */
    createObstacles(obstaclesData, terrainGrid) {
        if (!obstaclesData) return;
        const particleSystem = this.world.GetParticleSystemList();
        const SCALE = 100; // Necessário para os cálculos de posição

        for (const obstacle of obstaclesData) {
            if (obstacle.type === 'block') {
                const bodyDef = new box2d.b2BodyDef();
                bodyDef.position.Set(obstacle.x, obstacle.y);
                const body = this.world.CreateBody(bodyDef);
                const shape = new box2d.b2PolygonShape();
                shape.SetAsBox(obstacle.halfWidth, obstacle.halfHeight);
                const fixture = body.CreateFixture(shape, 0.0);
                fixture.SetUserData({ type: "block" });
            } else if (obstacle.type === 'toxic_liquid') {
                const shapeData = obstacle.shape;
                const pgd = new box2d.b2ParticleGroupDef();
                pgd.position.Set(shapeData.x, shapeData.y);
                pgd.flags = box2d.b2ParticleFlag.b2_waterParticle | box2d.b2ParticleFlag.b2_contactListenerParticle;
                pgd.color.Copy(ParticleColors.TOXIC);
                pgd.userData = ParticleType.TOXIC;
                if (shapeData.type === 'box') {
                    const shape = new box2d.b2PolygonShape();
                    shape.SetAsBox(shapeData.halfWidth, shapeData.halfHeight);
                    pgd.shape = shape;
                }

                const countBefore = particleSystem.GetParticleCount();
                particleSystem.CreateParticleGroup(pgd);
                const countAfter = particleSystem.GetParticleCount();

                // --- NOVA LÓGICA APLICADA AQUI ---
                // Verifica a flag do próprio obstáculo, não da 'shapeData'.
                if (!obstacle.canGoThroughDirt) {
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
            }
        }
    }

    /**
     * Cria a estrutura do cano de saída.
     * @param {object} position - Um objeto com as coordenadas x e y para o cano.
     */
    createPipe(position) {
        if (!position) return;
        const pipeY = position.y;
        const pipeX = position.x;
        const pipeThickness = 0.2;
        const pipeHeight = 1.5;
        const createWall = (x, y) => {
            const bodyDef = new box2d.b2BodyDef();
            bodyDef.position.Set(x, y);
            const body = this.world.CreateBody(bodyDef);
            const shape = new box2d.b2PolygonShape();
            shape.SetAsBox(pipeThickness / 2, pipeHeight / 2);
            const fixture = body.CreateFixture(shape, 0.0);
            fixture.SetUserData({ type: "pipe" });
        };
        createWall(pipeX, pipeY);
        createWall(pipeX + 1.0, pipeY);
    }
}

