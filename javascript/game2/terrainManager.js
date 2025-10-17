// terrainManager.js

export const TERRAIN_RESOLUTION = 12;
export const TERRAIN_WIDTH = Math.floor(1000 / TERRAIN_RESOLUTION);
export const TERRAIN_HEIGHT = Math.floor(600 / TERRAIN_RESOLUTION);

export default class TerrainManager {
    constructor(world, game) {
        this.world = world;
        this.game = game; // Reference to the main game class
        this.terrain = [];
        this.mouseGridX = -1;
        this.mouseGridY = -1;
    }

    /**
     * Returns the terrain grid, needed for the renderer.
     */
    getTerrainGrid() {
        return this.terrain;
    }

    getMousePosition() {
        return { x: this.mouseGridX, y: this.mouseGridY };
    }

    /**
     * Populates the internal terrain grid based on a layout from the level data.
     * @param {string[]} layout - An array of strings representing the terrain shape.
     */
    initialize(layout) {
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
    rebuildBodies() {
        this.game.isRebuilding = true;
        
        // Find and store terrain bodies to destroy
        const bodiesToDestroy = [];
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            if (body.GetUserData() && body.GetUserData().type === 'terrain') {
                bodiesToDestroy.push(body);
            }
        }
        bodiesToDestroy.forEach(body => this.world.DestroyBody(body));

        // Rebuild new bodies based on the current terrain grid (Greedy Meshing)
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
                    this._createBody(bodyX, bodyY, bodyWidth, bodyHeight);
                }
            }
        }
        this.game.isRebuilding = false;
        this.game.needsRebuild = false;
    }

    /**
     * Private helper to create a single static terrain body.
     */
    _createBody(x, y, width, height) {
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
    setupInput() {
        let isDigging = false;
        const canvas = document.getElementById('gameCanvas');

        const dig = (gridX, gridY) => {
        const digRadius = 2; 
        for (let y = -digRadius; y <= digRadius; y++) {
            for (let x = -digRadius; x <= digRadius; x++) {
                //circular
                if (Math.sqrt(x*x + y*y) <= digRadius) {
                    const currentY = gridY + y;
                    const currentX = gridX + x;
                    if (currentY >= 0 && currentY < TERRAIN_HEIGHT && currentX >= 0 && currentX < TERRAIN_WIDTH) {
                        if (this.terrain[currentY][currentX] === 1) {
                            this.terrain[currentY][currentX] = 0;
                            this.game.needsRebuild = true;
                        }
                    }
                }
            }
        }
    };

        const getMouseGridPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            return {
                gridX: Math.floor(mouseX / TERRAIN_RESOLUTION),
                gridY: Math.floor(mouseY / TERRAIN_RESOLUTION)
            };
        };

        canvas.addEventListener('mousedown', (e) => { 
            isDigging = true; 
            const { gridX, gridY } = getMouseGridPos(e);
            dig(gridX, gridY); 
            if (!this.game.firstClick) {
                this.game.audioManager.unlock();
                this.game.firstClick = true;
            }
        });

        // --- Track mouse position on move ---
        canvas.addEventListener('mousemove', (e) => { 
            const { gridX, gridY } = getMouseGridPos(e);
            this.mouseGridX = gridX;
            this.mouseGridY = gridY;
            if (isDigging) { 
                dig(gridX, gridY); 
            } 
        });

        // --- Reset mouse position when it leaves the canvas ---
        canvas.addEventListener('mouseleave', () => {
            this.mouseGridX = -1;
            this.mouseGridY = -1;
        });

        window.addEventListener('mouseup', () => { 
            isDigging = false; 
        });
    }
}