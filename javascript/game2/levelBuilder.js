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
     * Main method to construct all parts of a level from data.
     */
    build(levelData, terrainGrid) {
        this.createWorldBoundaries();
        this.createPipe(levelData.pipePosition);
        this.createWater(levelData.waterShapes, terrainGrid);
        this.createObstacles(levelData.obstacles);
    }

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
     * Creates water particle groups based on the level data.
     * @param {object[]} shapesDataArray - An array of objects defining water bodies.
     */
    createWater(shapesDataArray, terrainGrid) {
        if (!shapesDataArray) return;
        const particleSystem = this.world.GetParticleSystemList();
        particleSystem.SetRadius(0.05);
        const SCALE = 100;

        for (const shapeData of shapesDataArray) {
            // ... (the particle creation part is the same)
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
     * Creates obstacle bodies and liquids based on the level data.
     * @param {object[]} obstaclesData - An array of objects defining obstacles.
     */
    createObstacles(obstaclesData) {
        if (!obstaclesData) return;
        const particleSystem = this.world.GetParticleSystemList();
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
                particleSystem.CreateParticleGroup(pgd);
            }
        }
    }

    /**
     * Creates the pipe structure based on the level data.
     * @param {object} position - An object with x and y coordinates for the pipe.
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