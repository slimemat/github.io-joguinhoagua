// --- Global Variables ---
let world;
let frameCount = 0;
let waterInGoal = 0; 
const WATER_TO_WIN = 500;
let initialParticleCount = 0;
let collectedParticleCount = 0;
let currentLevelIndex = 0;

// --- Terrain Variables ---
const TERRAIN_RESOLUTION = 12;
const TERRAIN_WIDTH = Math.floor(1000 / TERRAIN_RESOLUTION);
const TERRAIN_HEIGHT = Math.floor(600 / TERRAIN_RESOLUTION);
let terrain = [];

let needsRebuild = false;
let isRebuilding = false;

/**
 * Main entry point for the application. Initializes and runs the simulation.
 * @param {any} args - Unused arguments.
 */
function mainApp(args) {

    /**
     * Sets up the Box2D world, renderer, and initial game state.
     * This function is called once the application starts.
     * @returns {void}
     */
    async function onload() {

        const response = await fetch('levels.json');
        const levelData = await response.json();
        window.levels = levelData;

        const gravity = new box2d.b2Vec2(0, 10);
        world = new box2d.b2World(gravity);
        const particleSystemDef = new box2d.b2ParticleSystemDef();
        world.CreateParticleSystem(particleSystemDef);
        Renderer = new Renderer(world);

        document.getElementById('next-level-btn').addEventListener('click', () => {
            currentLevelIndex++;
            if (currentLevelIndex >= window.levels.length) {
                alert("You beat the game! Congratulations!");
                currentLevelIndex = 0; // Restart
            }
            loadLevel(currentLevelIndex);
        });
        
        // Set up user interactions
        setupDigging(); 
        loadLevel(currentLevelIndex);
        // Start the game
        requestAnimationFrame(gameLoop);
    }

    /**
     * Creates the top, side, and a split bottom wall, with a sensor in the bottom gap.
     */
    function createWorldBoundaries() {
        // Helper function to create a static wall segment
        const createWall = (x, y, width, height) => {
            const bodyDef = new box2d.b2BodyDef();
            bodyDef.position.Set(x, y);
            const body = world.CreateBody(bodyDef);
            const shape = new box2d.b2PolygonShape();
            shape.SetAsBox(width / 2, height / 2);
            const fixture = body.CreateFixture(shape, 0.0);
            fixture.SetUserData({ type: "wall" });
        };

        // --- Create Walls ---
        // World dimensions (width=10, height=6 in Box2D units)
        createWall(5, 0, 10, 0.2); // Top wall
        createWall(0, 3, 0.2, 6); // Left wall
        createWall(10, 3, 0.2, 6); // Right wall

        // Create a split bottom wall with a gap for the pipe (at x=8)
        createWall(3.7, 6, 7.4, 0.2); // Bottom-left segment
        createWall(9.3, 6, 1.4, 0.2); // Bottom-right segment
    }

    /**
     * Creates a simple static square for debugging purposes.
     */
    function createTestSquare() {
        const bodyDef = new box2d.b2BodyDef();
        bodyDef.position.Set(5, 4); // Positioned in the middle of the screen

        const body = world.CreateBody(bodyDef);
        const shape = new box2d.b2PolygonShape();
        
        // Creates a 1x1 square (0.5 half-width, 0.5 half-height)
        shape.SetAsBox(0.5, 0.5);
        
        const fixture = body.CreateFixture(shape, 0.0);
        // Let's reuse the "wall" style so we can see it
        fixture.SetUserData({ type: "wall" });
    }

    /**
     * A helper function to create a single static wall body.
     * @param {number} x - The center x-coordinate in world units.
     * @param {number} y - The center y-coordinate in world units.
     * @param {number} width - The width of the wall in world units.
     * @param {number} height - The height of the wall in world units.
     * @returns {void}
     */
    function createWallBody(x, y, width, height) {
        const bodyDef = new box2d.b2BodyDef();
        bodyDef.position.Set(x, y);
        const body = world.CreateBody(bodyDef);
        const shape = new box2d.b2PolygonShape();
        shape.SetAsBox(width / 2, height / 2);
        const fixtureDef = body.CreateFixture(shape, 0.0);
        fixtureDef.SetUserData({ type: "wall" }); 
    }

    /**
     * Populates the initial terrain grid with solid (1) and empty (0) cells.
     * @returns {void}
     */
    function initializeTerrain(layout) {
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            terrain[y] = [];
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                const layoutY = Math.floor(y / (TERRAIN_HEIGHT / layout.length));
                const layoutX = Math.floor(x / (TERRAIN_WIDTH / layout[0].length));
                
                if (layout[layoutY] && layout[layoutY][layoutX] === 'x') {
                    terrain[y][x] = 1;
                } else {
                    terrain[y][x] = 0;
                }
            }
        }
    }

    /**
     * Scans the terrain grid, destroys old physics bodies, and generates new,
     * optimized static physics bodies for collision.
     * @returns {void}
     */
    function rebuildTerrainBodies() {
        isRebuilding = true;
        const bodiesToDestroy = [];
        for (let body = world.GetBodyList(); body; body = body.GetNext()) {
            const userData = body.GetUserData();
            if (userData && userData.type === 'terrain') {
                bodiesToDestroy.push(body);
            }
        }
        for (const body of bodiesToDestroy) {
            world.DestroyBody(body);
        }

        const visited = new Array(TERRAIN_HEIGHT).fill(0).map(() => new Array(TERRAIN_WIDTH).fill(false));
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                if (terrain[y][x] === 1 && !visited[y][x]) {
                    let width = 0;
                    while (x + width < TERRAIN_WIDTH && terrain[y][x + width] === 1 && !visited[y][x + width]) {
                        width++;
                    }
                    let height = 1;
                    outer:
                    while (y + height < TERRAIN_HEIGHT) {
                        for (let i = 0; i < width; i++) {
                            if (terrain[y + height][x + i] !== 1 || visited[y + height][x + i]) {
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
                    createTerrainBody(bodyX, bodyY, bodyWidth, bodyHeight);
                }
            }
        }
        
        isRebuilding = false;
        needsRebuild = false;
    }
    
    /**
     * A helper function to create a single static terrain body.
     * @param {number} x - The center x-coordinate in world units.
     * @param {number} y - The center y-coordinate in world units.
     * @param {number} width - The width of the terrain block in world units.
     * @param {number} height - The height of the terrain block in world units.
     * @returns {void}
     */
    function createTerrainBody(x, y, width, height) {
        const bodyDef = new box2d.b2BodyDef();
        bodyDef.position.Set(x, y);
        const body = world.CreateBody(bodyDef);
        const shape = new box2d.b2PolygonShape();
        shape.SetAsBox(width / 2, height / 2);
        const fixtureDef = body.CreateFixture(shape, 0.0);
        fixtureDef.SetUserData({ type: "terrain" });
        body.SetUserData({ type: "terrain" });
    }
    
    /**
     * Sets up the mouse event listeners on the canvas for digging interactions.
     * @returns {void}
     */
    function setupDigging() {
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
                            if (terrain[currentY][currentX] === 1) {
                                terrain[currentY][currentX] = 0;
                                needsRebuild = true;
                            }
                        }
                    }
                }
            }
        };

        canvas.addEventListener('mousedown', (e) => {
            isDigging = true;
            dig(e);
        });
        canvas.addEventListener('mousemove', (e) => {
            if (isDigging) {
                dig(e);
            }
        });
        window.addEventListener('mouseup', () => {
            isDigging = false;
        });
    }

    /**
     * Creates the initial particle group that represents water.
     * @returns {void}
     */
    function createWater(shapesDataArray) {
        const particleSystem = world.GetParticleSystemList();
        particleSystem.SetRadius(0.05);
        const SCALE = 100; // canvas.width / 10

        // Loop through each water shape defined in the JSON
        for (const shapeData of shapesDataArray) {
            const pgd = new box2d.b2ParticleGroupDef();
            pgd.position.Set(shapeData.x, shapeData.y);
            pgd.flags = box2d.b2ParticleFlag.b2_waterParticle;

            if (shapeData.type === 'box') {
                const shape = new box2d.b2PolygonShape();
                shape.SetAsBox(shapeData.halfWidth, shapeData.halfHeight);
                pgd.shape = shape;
            }

            const countBefore = particleSystem.GetParticleCount();
            particleSystem.CreateParticleGroup(pgd);
            const countAfter = particleSystem.GetParticleCount();

            // This is the temporary, pre-carving count
            console.log("Particles created (before carving):", countAfter - countBefore);

            // Check if carving is needed for this specific water body
            if (!shapeData.canGoThroughDirt) {
                const particles = particleSystem.GetPositionBuffer();
                
                // Carve only the particles that were just created
                for (let i = countAfter - 1; i >= countBefore; i--) {
                    const pos = particles[i];
                    const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
                    const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);

                    if (gridY >= 0 && gridY < TERRAIN_HEIGHT && gridX >= 0 && gridX < TERRAIN_WIDTH) {
                        if (terrain[gridY][gridX] === 1) {
                            particleSystem.DestroyParticle(i);
                        }
                    }
                }
            }
        }
        
        // This is the final, correct count AFTER all creation and carving is done.
        initialParticleCount = particleSystem.GetParticleCount();
        console.log(`Level ${currentLevelIndex + 1}: Actual starting particles: ${initialParticleCount}`);
    }

    /**
     * Checks for and destroys any particles that have fallen below the world boundary.
     */
    function destroyOffScreenParticles() {
        const particleSystem = world.GetParticleSystemList();
        const particles = particleSystem.GetPositionBuffer();
        const particleCount = particleSystem.GetParticleCount();

        // Loop backwards when destroying items from a list
        for (let i = particleCount - 1; i >= 0; i--) {
            const particleY = particles[i].y;

            // If particle is below the screen (world height is 6)
            if (particleY > 6.2) {
                particleSystem.DestroyParticle(i);
                collectedParticleCount++;
            }
        }
    }

    function loadLevel(levelIndex) {
        // Clear everything from the old level
        for (let body = world.GetBodyList(); body; body = body.GetNext()) {
            world.DestroyBody(body);
        }
        const particleSystem = world.GetParticleSystemList();
        const particleCount = particleSystem.GetParticleCount();
        if (particleCount > 0) {
            for (let i = particleCount - 1; i >= 0; i--) {
                particleSystem.DestroyParticle(i);
            }
        }

        // Hide the win message
        document.getElementById('win-message').style.display = 'none';
        
        // Reset counters
        waterInGoal = 0;
        frameCount = 0;
        initialParticleCount = 0;
        collectedParticleCount = 0;

        // Load data for the new level
        const levelData = window.levels[levelIndex];
        
        // Create the new level
        createWorldBoundaries();
        initializeTerrain(levelData.terrain);
        rebuildTerrainBodies();
        createPipe(levelData.pipePosition);
        createWater(levelData.waterShapes);
    }


    /**
     * Creates the two vertical walls of the pipe.
     */
    function createPipe(position) {
        const pipeY = position.y;
        const pipeX = position.x;
        const pipeThickness = 0.2;
        const pipeHeight = 1.5;

        // Left wall of the pipe
        const leftWallDef = new box2d.b2BodyDef();
        leftWallDef.position.Set(pipeX, pipeY);
        const leftWallBody = world.CreateBody(leftWallDef);
        const leftShape = new box2d.b2PolygonShape();
        leftShape.SetAsBox(pipeThickness / 2, pipeHeight / 2);
        const leftFixture = leftWallBody.CreateFixture(leftShape, 0.0);
        leftFixture.SetUserData({ type: "pipe" });

        // Right wall of the pipe
        const rightWallDef = new box2d.b2BodyDef();
        rightWallDef.position.Set(pipeX + 1.0, pipeY);
        const rightWallBody = world.CreateBody(rightWallDef);
        const rightShape = new box2d.b2PolygonShape();
        rightShape.SetAsBox(pipeThickness / 2, pipeHeight / 2);
        const rightFixture = rightWallBody.CreateFixture(rightShape, 0.0);
        rightFixture.SetUserData({ type: "pipe" });
    }


    /**
     * The core game loop, called via requestAnimationFrame, which updates the physics
     * and triggers rendering.
     * @returns {void}
     */
    const gameLoop = function() {
        frameCount++;
        if (needsRebuild && !isRebuilding) {
            rebuildTerrainBodies();
        }

        world.Step(1 / 60, 10, 10);
        
        destroyOffScreenParticles();

        const goalAmount = Math.floor(initialParticleCount * window.levels[currentLevelIndex].waterAmount);

        // Update UI with the correct count
        const waterCountEl = document.getElementById('water-count');
        if (waterCountEl) {
            waterCountEl.textContent = `${collectedParticleCount} / ${goalAmount}`;
        }

        // Check for win with the correct count
        if (collectedParticleCount >= goalAmount && initialParticleCount > 0) {
            const winMessageEl = document.getElementById('win-message');
            if (winMessageEl) {
                winMessageEl.style.display = 'block';
            }
        }

        Renderer.render();
        requestAnimationFrame(gameLoop);
    };
    
    onload();
}