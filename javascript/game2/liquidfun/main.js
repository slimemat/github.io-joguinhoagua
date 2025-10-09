// --- Global Variables ---
let world;
let frameCount = 0;

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
    function onload() {
        const gravity = new box2d.b2Vec2(0, 10);
        world = new box2d.b2World(gravity);
        const particleSystemDef = new box2d.b2ParticleSystemDef();
        world.CreateParticleSystem(particleSystemDef);
        Renderer = new Renderer(world);

        createContainerWalls();
        initializeTerrain();
        rebuildTerrainBodies();
        createWater();
        setupDigging();
        
        requestAnimationFrame(gameLoop);
    }

    /**
     * Creates the static container walls for the physics world.
     * @returns {void}
     */
    function createContainerWalls() {
        createWallBody(0, 3, 0.2, 6);
        createWallBody(10, 3, 0.2, 6);
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
    function initializeTerrain() {
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            terrain[y] = [];
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                if (y > TERRAIN_HEIGHT / 3) {
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
        canvas.addEventListener('mouseup', () => {
            isDigging = false;
        });
    }

    /**
     * Creates the initial particle group that represents water.
     * @returns {void}
     */
    function createWater() {
        const circle = new box2d.b2CircleShape(2.60);
        const pgd = new box2d.b2ParticleGroupDef();
        pgd.position.Set(5, 1);
        pgd.flags = box2d.b2ParticleFlag.b2_waterParticle;
        pgd.shape = circle;
        world.GetParticleSystemList().SetRadius(0.05);
        world.GetParticleSystemList().CreateParticleGroup(pgd);
    }

    /**
     * Manages the evaporation of isolated water particles based on spatial proximity.
     * @returns {void}
     */
    function handleEvaporation() {
        const particleSystem = world.GetParticleSystemList();
        const particles = particleSystem.GetPositionBuffer();
        const particleCount = particleSystem.m_count;
        if (particleCount === 0) {
            return;
        }

        // A particle needs at least this many neighbors in adjacent cells to survive.
        const NEIGHBOR_THRESHOLD = 0;

        const particleGrid = Array.from({ length: TERRAIN_HEIGHT }, () => 
            Array.from({ length: TERRAIN_WIDTH }, () => [])
        );

        const SCALE = 100; // This must match the SCALE in Renderer.js (canvas.width / 10)
        for (let i = 0; i < particleCount; i++) {
            const pos = particles[i];
            const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
            const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);
            if (gridY >= 0 && gridY < TERRAIN_HEIGHT && gridX >= 0 && gridX < TERRAIN_WIDTH) {
                particleGrid[gridY][gridX].push(i);
            }
        }

        const particlesToDestroy = [];
        for (let i = 0; i < particleCount; i++) {
            const pos = particles[i];
            const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
            const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);
            
            let neighborCount = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const checkY = gridY + dy;
                    const checkX = gridX + dx;
                    if (checkY >= 0 && checkY < TERRAIN_HEIGHT && checkX >= 0 && checkX < TERRAIN_WIDTH) {
                        neighborCount += particleGrid[checkY][checkX].length;
                    }
                }
            }
            
            if ((neighborCount - 1) < NEIGHBOR_THRESHOLD) {
                particlesToDestroy.push(i);
            }
        }

        for (let i = particlesToDestroy.length - 1; i >= 0; i--) {
            const particleIndex = particlesToDestroy[i];
            particleSystem.DestroyParticle(particleIndex);
        }
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

        if (frameCount > 120) {
            handleEvaporation();
        }

        Renderer.render();
        requestAnimationFrame(gameLoop);
    };
    
    onload();
}