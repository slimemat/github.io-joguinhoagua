import AudioManager from '../../common/AudioManager.js';

// --- Global Constants ---
const TERRAIN_RESOLUTION = 12;
const TERRAIN_WIDTH = Math.floor(1000 / TERRAIN_RESOLUTION);
const TERRAIN_HEIGHT = Math.floor(600 / TERRAIN_RESOLUTION);

const ParticleType = {
    WATER: 1,
    TOXIC: 2
};

const ParticleColors = {
    WATER: new box2d.b2ParticleColor(0, 100, 255, 255),
    TOXIC: new box2d.b2ParticleColor(128, 0, 128, 255) //purple
};

class Game {
    /**
     * Initializes the game's state properties.
     */
    constructor() {
        this.firstClick = false;
        this.world = null;
        this.renderer = null;
        this.frameCount = 0;
        this.initialParticleCount = 0;
        this.collectedParticleCount = 0;
        this.currentLevelIndex = 0;
        this.terrain = [];
        this.needsRebuild = false;
        this.isRebuilding = false;
        this.audioManager = new AudioManager();
        this.sizzleCooldown = 0;
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
        
        this.renderer = new Renderer(this.world, this.terrain, TERRAIN_WIDTH, TERRAIN_HEIGHT, TERRAIN_RESOLUTION);

        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.currentLevelIndex++;
            if (this.currentLevelIndex >= window.levels.length) {
                alert("You beat the game! Congratulations!");
                this.currentLevelIndex = 0;
            }
            this.loadLevel(this.currentLevelIndex);
        });
        
        this.setupDigging(); 
        this.loadLevel(this.currentLevelIndex);
        
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Clears the old level and sets up all objects for the new level.
     * @param {number} levelIndex - The index of the level to load.
     */
    loadLevel(levelIndex) {
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

        document.getElementById('win-message').style.display = 'none';
        
        this.frameCount = 0;
        this.initialParticleCount = 0;
        this.collectedParticleCount = 0;

        const levelData = window.levels[levelIndex];
        
        this.createWorldBoundaries();
        this.initializeTerrain(levelData.terrain);
        this.rebuildTerrainBodies();
        this.createPipe(levelData.pipePosition);
        this.createWater(levelData.waterShapes);
        this.createObstacles(levelData.obstacles);
    }

    /**
     * Checks the speed of all liquids and returns their state.
     * @returns {{water: boolean, toxic: boolean}} - An object indicating which liquids are rushing.
     */
    checkLiquidSpeeds() {
        const particleSystem = this.world.GetParticleSystemList();
        const velocities = particleSystem.GetVelocityBuffer();
        const positions = particleSystem.GetPositionBuffer();
        const userData = particleSystem.GetUserDataBuffer();
        const count = particleSystem.GetParticleCount();
        const speedThreshold = 1.20;
        const SCALE = 100;

        // 1. Start with both sounds off
        let states = { water: false, toxic: false };

        for (let i = 0; i < count; i++) {
            // Optimization: If we've already found both, we can stop checking.
            if (states.water && states.toxic) {
                break;
            }

            const particleType = userData[i];
            
            // 2. Skip this particle if its sound has already been triggered
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

                // 3. Check if the particle is near a wall
                let isNearTerrain = false;
                const checkRadius = 1;
                for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                        const checkX = gridX + dx;
                        const checkY = gridY + dy;
                        if (checkY >= 0 && checkY < TERRAIN_HEIGHT && checkX >= 0 && checkX < TERRAIN_WIDTH) {
                            if (this.terrain[checkY][checkX] === 1) {
                                isNearTerrain = true;
                                break;
                            }
                        }
                    }
                    if (isNearTerrain) break;
                }
                
                // 4. If it's fast and not near a wall, update the correct state
                if (!isNearTerrain) {
                    if (particleType === ParticleType.WATER) {
                        states.water = true;
                    } else if (particleType === ParticleType.TOXIC) {
                        states.toxic = true;
                    }
                }
            }
        }
        // 5. Return the final status of both liquids
        return states;
    }

    /**
     * The core game loop, which updates physics and triggers rendering.
     */
    gameLoop() {
        if (this.needsRebuild && !this.isRebuilding) {
            this.rebuildTerrainBodies();
        }

        this.world.Step(1 / 60, 10, 10);
        
        const contaminationHappened = this.handleContamination();
        
        if (contaminationHappened) {
            this.audioManager.startSizzle();
            this.sizzleCooldown = 10; // Set a 10-frame grace period
        } else {
            this.sizzleCooldown--; // Decrease the cooldown
            if (this.sizzleCooldown <= 0) {
                this.audioManager.stopSizzle();
            }
        }

        const liquidStates = this.checkLiquidSpeeds();

        // water running sound
        if (liquidStates.water) {
            this.audioManager.startRushingWater();
        } else {
            this.audioManager.stopRushingWater();
        }

        // toxic running sound
        if (liquidStates.toxic) {
            this.audioManager.startToxicRush();
        } else {
            this.audioManager.stopToxicRush();
        }
        
        this.destroyOffScreenParticles();

        const goalAmount = Math.floor(this.initialParticleCount * window.levels[this.currentLevelIndex].waterAmount);

        const waterCountEl = document.getElementById('water-count');
        if (waterCountEl) {
            waterCountEl.textContent = `${this.collectedParticleCount} / ${goalAmount}`;
        }

        if (this.collectedParticleCount >= goalAmount && this.initialParticleCount > 0) {
            const winMessageEl = document.getElementById('win-message');
            if (winMessageEl) {
                winMessageEl.style.display = 'block';
            }
        }

        this.renderer.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Creates the static boundaries of the game world.
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
     * Populates the internal terrain grid based on a layout from the level data.
     * @param {string[]} layout - An array of strings representing the terrain shape.
     */
    initializeTerrain(layout) {
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            this.terrain[y] = [];
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                const layoutY = Math.floor(y / (TERRAIN_HEIGHT / layout.length));
                const layoutX = Math.floor(x / (TERRAIN_WIDTH / layout[0].length));
                
                if (layout[layoutY] && layout[layoutY][layoutX] === 'x') {
                    this.terrain[y][x] = 1;
                } else {
                    this.terrain[y][x] = 0;
                }
            }
        }
    }

    /**
     * Scans the terrain grid and generates optimized static physics bodies.
     */
    rebuildTerrainBodies() {
        this.isRebuilding = true;
        const bodiesToDestroy = [];
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            if (body.GetUserData() && body.GetUserData().type === 'terrain') {
                bodiesToDestroy.push(body);
            }
        }
        bodiesToDestroy.forEach(body => this.world.DestroyBody(body));

        const visited = Array.from({ length: TERRAIN_HEIGHT }, () => Array(TERRAIN_WIDTH).fill(false));
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                if (this.terrain[y][x] === 1 && !visited[y][x]) {
                    let width = 0;
                    while (x + width < TERRAIN_WIDTH && this.terrain[y][x + width] === 1 && !visited[y][x + width]) {
                        width++;
                    }
                    let height = 1;
                    outer: while (y + height < TERRAIN_HEIGHT) {
                        for (let i = 0; i < width; i++) {
                            if (this.terrain[y + height][x + i] !== 1 || visited[y + height][x + i]) {
                                break outer;
                            }
                        }
                        height++;
                    }
                    for (let h = 0; h < height; h++) {
                        for (let w = 0; w < width; w++) {
                            visited[y + h][x + w] = true;
                        }
                    }
                    const bodyX = (x + width / 2) * (10 / TERRAIN_WIDTH);
                    const bodyY = (y + height / 2) * (6 / TERRAIN_HEIGHT);
                    const bodyWidth = width * (10 / TERRAIN_WIDTH);
                    const bodyHeight = height * (6 / TERRAIN_HEIGHT);
                    this.createTerrainBody(bodyX, bodyY, bodyWidth, bodyHeight);
                }
            }
        }
        this.isRebuilding = false;
        this.needsRebuild = false;
    }
    
    /**
     * Creates a single static terrain body.
     * @param {number} x - The center x-coordinate.
     * @param {number} y - The center y-coordinate.
     * @param {number} width - The width of the block.
     * @param {number} height - The height of the block.
     */
    createTerrainBody(x, y, width, height) {
        const bodyDef = new box2d.b2BodyDef();
        bodyDef.position.Set(x, y);
        const body = this.world.CreateBody(bodyDef);
        const shape = new box2d.b2PolygonShape();
        shape.SetAsBox(width / 2, height / 2);
        const fixture = body.CreateFixture(shape, 0.0);
        fixture.SetUserData({ type: "terrain" });
        body.SetUserData({ type: "terrain" });
    }
    
    /**
     * Sets up mouse event listeners for digging.
     */
    setupDigging() {
        let isDigging = false;
        const canvas = document.getElementById('gameCanvas');
        const dig = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const gridX = Math.floor(mouseX / TERRAIN_RESOLUTION);
            const gridY = Math.floor(mouseY / TERRAIN_RESOLUTION);
            const digRadius = 2;
            for (let y = -digRadius; y <= digRadius; y++) {
                for (let x = -digRadius; x <= digRadius; x++) {
                    if (Math.sqrt(x*x + y*y) <= digRadius) {
                        const currentY = gridY + y;
                        const currentX = gridX + x;
                        if (currentY >= 0 && currentY < TERRAIN_HEIGHT && currentX >= 0 && currentX < TERRAIN_WIDTH) {
                            if (this.terrain[currentY][currentX] === 1) {
                                this.terrain[currentY][currentX] = 0;
                                this.needsRebuild = true;
                            }
                        }
                    }
                }
            }
        };
        canvas.addEventListener('mousedown', (e) => { 
                isDigging = true; dig(e); if (!this.firstClick) {
                    this.audioManager.unlockAudioContext();
                    this.firstClick = true;
                }
            }
        );
        canvas.addEventListener('mousemove', (e) => { if (isDigging) { dig(e); } });
        window.addEventListener('mouseup', () => { isDigging = false; });
    }

    /**
     * Creates water particle groups based on the level data.
     * @param {object[]} shapesDataArray - An array of objects defining water bodies.
     */
    createWater(shapesDataArray) {
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
                        if (this.terrain[gridY][gridX] === 1) {
                            particleSystem.DestroyParticle(i);
                        }
                    }
                }
            }
        }
        this.initialParticleCount = particleSystem.GetParticleCount();
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
        const pipeY = position.y;
        const pipeX = position.x;
        const pipeThickness = 0.2;
        const pipeHeight = 1.5;
        const createWall = (x, y, isPipe) => {
            const bodyDef = new box2d.b2BodyDef();
            bodyDef.position.Set(x, y);
            const body = this.world.CreateBody(bodyDef);
            const shape = new box2d.b2PolygonShape();
            shape.SetAsBox(pipeThickness / 2, pipeHeight / 2);
            const fixture = body.CreateFixture(shape, 0.0);
            fixture.SetUserData({ type: "pipe" });
        };
        createWall(pipeX, pipeY, true);
        createWall(pipeX + 1.0, pipeY, true);
    }

    /**
     * Checks for and destroys particles that have fallen off-screen, counting them if they are water.
     */
    destroyOffScreenParticles() {
        const particleSystem = this.world.GetParticleSystemList();
        const userDataBuffer = particleSystem.GetUserDataBuffer();
        const particleCount = particleSystem.GetParticleCount();
        for (let i = particleCount - 1; i >= 0; i--) {
            const particleY = particleSystem.GetPositionBuffer()[i].y;
            if (particleY > 6.2) {
                if (userDataBuffer && userDataBuffer[i] === ParticleType.WATER) {
                    this.collectedParticleCount++;
                }
                particleSystem.DestroyParticle(i);
            }
        }
    }

    /**
     * Checks for contact between water and toxic particles and spreads contamination.
     * @returns {boolean} - True if any contamination occurred this frame.
     */
    handleContamination() {
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
}

// --- Start the Game ---
const game = new Game();
game.init();