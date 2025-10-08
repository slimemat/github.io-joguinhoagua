// --- Global Variables ---
let world;

// --- NEW: Terrain Variables ---
const TERRAIN_RESOLUTION = 12; // Controls the size of each dirt block. Higher number = smaller blocks.
const TERRAIN_WIDTH = Math.floor(1000 / TERRAIN_RESOLUTION); // Canvas width / resolution
const TERRAIN_HEIGHT = Math.floor(600 / TERRAIN_RESOLUTION); // Canvas height / resolution
let terrain = []; // 2D array: 0 for air, 1 for dirt

function mainApp(args) {

    function onload() {
        const gravity = new box2d.b2Vec2(0, 10);
        world = new box2d.b2World(gravity);
        
        const particleSystemDef = new box2d.b2ParticleSystemDef();
        world.CreateParticleSystem(particleSystemDef);

        Renderer = new Renderer(world);

        // --- SETUP ---
        initializeTerrain();
        rebuildTerrainBodies(); // Initial creation of terrain physics bodies
        createWater();
        setupDigging(); // Attach mouse listeners
        
        requestAnimationFrame(gameLoop);
    }

    // NEW: Creates the initial grid of dirt
    function initializeTerrain() {
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            terrain[y] = [];
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                // Fill the bottom 2/3 of the screen with dirt
                if (y > TERRAIN_HEIGHT / 3) {
                    terrain[y][x] = 1; // 1 = dirt
                } else {
                    terrain[y][x] = 0; // 0 = air
                }
            }
        }
    }

    // NEW: The core function to generate physics bodies from the grid
    function rebuildTerrainBodies() {
        // 1. Destroy all existing terrain bodies
        for (let body = world.GetBodyList(); body; body = body.GetNext()) {
            const userData = body.GetUserData();
            if (userData && userData.type === 'terrain') {
                world.DestroyBody(body);
            }
        }

        // 2. Generate new bodies by merging cells into larger rectangles
        const visited = new Array(TERRAIN_HEIGHT).fill(0).map(() => new Array(TERRAIN_WIDTH).fill(false));
        
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                if (terrain[y][x] === 1 && !visited[y][x]) {
                    // Found the start of a potential rectangle
                    let width = 0;
                    while (x + width < TERRAIN_WIDTH && terrain[y][x + width] === 1 && !visited[y][x + width]) {
                        width++;
                    }

                    let height = 1;
                    outer:
                    while (y + height < TERRAIN_HEIGHT) {
                        for (let i = 0; i < width; i++) {
                            if (terrain[y + height][x + i] !== 1 || visited[y + height][x + i]) {
                                break outer; // Found a hole or an already processed cell, rectangle ends here
                            }
                        }
                        height++;
                    }

                    // Mark all cells in this new rectangle as visited
                    for (let h = 0; h < height; h++) {
                        for (let w = 0; w < width; w++) {
                            visited[y + h][x + w] = true;
                        }
                    }
                    
                    // Create the physics body for this merged rectangle
                    const bodyX = (x + width / 2) * (10 / TERRAIN_WIDTH);
                    const bodyY = (y + height / 2) * (6 / TERRAIN_HEIGHT);
                    const bodyWidth = width * (10 / TERRAIN_WIDTH);
                    const bodyHeight = height * (6 / TERRAIN_HEIGHT);
                    createTerrainBody(bodyX, bodyY, bodyWidth, bodyHeight);
                }
            }
        }
    }

    // NEW: A specific function to create a terrain body with the right user data
    function createTerrainBody(x, y, width, height) {
        const bodyDef = new box2d.b2BodyDef();
        bodyDef.position.Set(x, y);
        const body = world.CreateBody(bodyDef);
        const shape = new box2d.b2PolygonShape();
        shape.SetAsBox(width / 2, height / 2);
        const fixtureDef = body.CreateFixture(shape, 0.0);
        // This userData is crucial for identifying terrain bodies later
        fixtureDef.SetUserData({ type: "terrain" });
        body.SetUserData({ type: "terrain" }); // Also set it on the body
    }
    
    // NEW: Sets up all the mouse listeners for digging
    function setupDigging() {
        let isDigging = false;
        const canvas = document.getElementById('gameCanvas');

        const dig = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const gridX = Math.floor(mouseX / TERRAIN_RESOLUTION);
            const gridY = Math.floor(mouseY / TERRAIN_RESOLUTION);

            const digRadius = 2; // How many grid cells to dig out

            for (let y = -digRadius; y <= digRadius; y++) {
                for (let x = -digRadius; x <= digRadius; x++) {
                    if (Math.sqrt(x*x + y*y) <= digRadius) {
                        const currentY = gridY + y;
                        const currentX = gridX + x;
                        if (currentY >= 0 && currentY < TERRAIN_HEIGHT && currentX >= 0 && currentX < TERRAIN_WIDTH) {
                            if (terrain[currentY][currentX] === 1) {
                                terrain[currentY][currentX] = 0; // Change dirt to air
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
            if (isDigging) {
                isDigging = false;
                rebuildTerrainBodies(); // THIS IS THE KEY: Rebuild physics after digging
            }
        });
    }

    // Creates the initial blob of water
    function createWater() {
        const circle = new box2d.b2CircleShape(1.5);
        const pgd = new box2d.b2ParticleGroupDef();
        pgd.position.Set(5, 2); // Position water in the top center
        pgd.flags = box2d.b2ParticleFlag.b2_waterParticle;
        pgd.shape = circle;
        world.GetParticleSystemList().SetRadius(0.1);
        world.GetParticleSystemList().CreateParticleGroup(pgd);
    }

    let lastFrame = new Date().getTime();
    const gameLoop = function() {
        requestAnimationFrame(gameLoop);
        world.Step(1 / 60, 10, 10);
        Renderer.render();
    };
    
    onload();
}