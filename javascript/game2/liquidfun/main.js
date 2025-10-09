// --- Global Variables ---
let world;
let frameCount = 0;

// --- Terrain Variables ---
const TERRAIN_RESOLUTION = 12;
const TERRAIN_WIDTH = Math.floor(1000 / TERRAIN_RESOLUTION);
const TERRAIN_HEIGHT = Math.floor(600 / TERRAIN_RESOLUTION);
let terrain = [];

// NEW: Flags to handle real-time digging smoothly
let needsRebuild = false;
let isRebuilding = false;

function mainApp(args) {

    function onload() {
        // ... (this part is unchanged)
        const gravity = new box2d.b2Vec2(0, 10);
        world = new box2d.b2World(gravity);
        const particleSystemDef = new box2d.b2ParticleSystemDef();
        world.CreateParticleSystem(particleSystemDef);
        Renderer = new Renderer(world);

        // --- SETUP ---
        createContainerWalls();
        initializeTerrain();
        rebuildTerrainBodies();
        createWater();
        setupDigging();
        
        requestAnimationFrame(gameLoop);
    }

    function createContainerWalls() {
        // ... (this function is unchanged)
        createWallBody(0, 3, 0.2, 6);
        createWallBody(10, 3, 0.2, 6);
    }

    function createWallBody(x, y, width, height) {
        // ... (this function is unchanged)
        const bodyDef = new box2d.b2BodyDef();
        bodyDef.position.Set(x, y);
        const body = world.CreateBody(bodyDef);
        const shape = new box2d.b2PolygonShape();
        shape.SetAsBox(width / 2, height / 2);
        const fixtureDef = body.CreateFixture(shape, 0.0);
        fixtureDef.SetUserData({ type: "wall" }); 
    }

    function initializeTerrain() {
        // ... (this function is unchanged)
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

    // CHANGED: This function is now safer and more stable
    function rebuildTerrainBodies() {
        isRebuilding = true; // Set flag to prevent multiple rebuilds at once

        // 1. Safely destroy old bodies
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

        // 2. Generate new bodies (this logic is unchanged)
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
        
        isRebuilding = false; // Clear the flag
        needsRebuild = false; // Clear the request
    }
    
    function createTerrainBody(x, y, width, height) {
        // ... (this function is unchanged)
        const bodyDef = new box2d.b2BodyDef();
        bodyDef.position.Set(x, y);
        const body = world.CreateBody(bodyDef);
        const shape = new box2d.b2PolygonShape();
        shape.SetAsBox(width / 2, height / 2);
        const fixtureDef = body.CreateFixture(shape, 0.0);
        fixtureDef.SetUserData({ type: "terrain" });
        body.SetUserData({ type: "terrain" });
    }
    
    // CHANGED: Digging logic now just raises a flag instead of rebuilding directly
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
                                needsRebuild = true; // Raise the flag that a rebuild is needed
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

    function createWater() {
        // ... (this function is unchanged)
        const circle = new box2d.b2CircleShape(2.0);
        const pgd = new box2d.b2ParticleGroupDef();
        pgd.position.Set(5, 1);
        pgd.flags = box2d.b2ParticleFlag.b2_waterParticle;
        pgd.shape = circle;
        world.GetParticleSystemList().SetRadius(0.05);
        world.GetParticleSystemList().CreateParticleGroup(pgd);
    }

    function handleEvaporation() {
        const particleSystem = world.GetParticleSystemList();
        const particles = particleSystem.GetPositionBuffer(); // We need particle positions
        const particleCount = particleSystem.m_count;
        if (particleCount === 0) {
            return;
        }

        // This still works the same way: a particle needs at least this many neighbors to survive.
        const NEIGHBOR_THRESHOLD = 0;

        // --- New Grid Logic ---

        // Step 1: Create a temporary spatial grid. Each cell will hold a list of particle indices.
        const particleGrid = Array.from({ length: TERRAIN_HEIGHT }, () => 
            Array.from({ length: TERRAIN_WIDTH }, () => [])
        );

        // Step 2: Place all particle indices onto the grid.
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

        // Step 3: Check the neighborhood of each particle using the grid.
        for (let i = 0; i < particleCount; i++) {
            const pos = particles[i];
            const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
            const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);
            
            let neighborCount = 0;

            // Check the 3x3 area of cells around the particle's current cell.
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const checkY = gridY + dy;
                    const checkX = gridX + dx;

                    if (checkY >= 0 && checkY < TERRAIN_HEIGHT && checkX >= 0 && checkX < TERRAIN_WIDTH) {
                        // Add the number of particles in the neighboring cell to our count.
                        neighborCount += particleGrid[checkY][checkX].length;
                    }
                }
            }
            
            // A particle will always find itself, so we subtract 1 from the count.
            // If the remaining count is less than our threshold, mark the particle for destruction.
            if ((neighborCount - 1) < NEIGHBOR_THRESHOLD) {
                particlesToDestroy.push(i);
            }
        }

        // Step 4: Destroy the marked particles (in reverse order).
        for (let i = particlesToDestroy.length - 1; i >= 0; i--) {
            const particleIndex = particlesToDestroy[i];
            particleSystem.DestroyParticle(particleIndex);
        }
    }

    // CHANGED: The game loop now handles the rebuilding
    const gameLoop = function() {
        frameCount++;
        // If a rebuild is needed and we aren't already busy rebuilding
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