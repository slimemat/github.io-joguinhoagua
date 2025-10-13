/**
 * Manages all drawing operations on the canvas.
 * @param {box2d.b2World} world - The Box2D world instance.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
 * @constructor
 */
function Renderer(world, ctx) {
    var canvas = document.getElementById("gameCanvas");
    var ctx = canvas.getContext("2d");
    const SCALE = canvas.width / 10;

    const wetnessGrid = [];
    for (let y = 0; y < TERRAIN_HEIGHT; y++) {
        wetnessGrid[y] = new Array(TERRAIN_WIDTH).fill(0.0);
    }

    /**
     * Clears the canvas and draws all game elements for the current frame.
     * @returns {void}
     */
    this.render = function() {
        ctx.fillStyle = '#87CEEB'; // Sky color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.drawTerrainGrid();

        for (let body = world.GetBodyList(); body; body = body.GetNext()) {
            for (let f = body.GetFixtureList(); f; f = f.GetNext()) {
                this.draw(f);
            }
        }
        
        this.drawParticleSystem();
    }
    
    /**
     * Renders the terrain based on the 2D terrain grid array.
     * @returns {void}
     */
    this.drawTerrainGrid = function() {
        ctx.fillStyle = '#8B4513'; // Dirt brown color
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                if (terrain[y][x] === 1) {
                    ctx.fillRect(
                        x * TERRAIN_RESOLUTION, 
                        y * TERRAIN_RESOLUTION, 
                        TERRAIN_RESOLUTION, 
                        TERRAIN_RESOLUTION
                    );
                }
            }
        }
    }

    /**
     * Draws a single fixture, currently only handles walls.
     * @param {box2d.b2Fixture} fixture - The fixture to be drawn.
     * @returns {void}
     */
    this.draw = function(fixture) {
        const userData = fixture.GetUserData();
        if (!userData) return;

        if (userData.type === "wall") {
            ctx.fillStyle = '#424242'; 
            this.drawPolygon(fixture);
        } else if (userData.type === "pipe") { 
            ctx.fillStyle = '#00C853';
            this.drawPolygon(fixture);
        }
        else if (userData.type === "win_sensor") { 
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Transparent Red
            this.drawPolygon(fixture);
        }
    };
    
    /**
     * A helper function to draw a polygon shape from a fixture.
     * @param {box2d.b2Fixture} fixture - The fixture containing the polygon shape.
     * @returns {void}
     */
    this.drawPolygon = function(fixture) {
        const body = fixture.GetBody();
        const shape = fixture.GetShape();
        const pos = body.GetPosition();

        // Use the public properties for this version of Box2D
        const vertices = shape.m_vertices;
        const vertexCount = shape.m_count;

        ctx.beginPath();
        ctx.moveTo((vertices[0].x + pos.x) * SCALE, (vertices[0].y + pos.y) * SCALE);
        for (let i = 1; i < vertexCount; i++) { // Loop to the correct count
            const vertex = vertices[i];
            ctx.lineTo((vertex.x + pos.x) * SCALE, (vertex.y + pos.y) * SCALE);
        }
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Renders the water particles using a persistent 'wetness' grid. This creates
     * a fading trail effect and adds a visual surface layer to the water.
     * @returns {void}
     */
    this.drawParticleSystem = function() {
        const system = world.GetParticleSystemList();
        const particles = system.GetPositionBuffer();
        const particleCount = system.m_count;
        const velocities = system.GetVelocityBuffer();

        // You can tweak this value. Lower is slower fade, higher is faster.
        const FADE_SPEED = 0.10;

        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                if (wetnessGrid[y][x] > 0) {
                    wetnessGrid[y][x] = Math.max(0, wetnessGrid[y][x] - FADE_SPEED);
                }
            }
        }

        for (let i = 0; i < particleCount; i++) {
            const pos = particles[i];
            const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
            const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);
            if (gridY >= 0 && gridY < TERRAIN_HEIGHT && gridX >= 0 && gridX < TERRAIN_WIDTH) {
                wetnessGrid[gridY][gridX] = 1.0;
            }
        }

        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                const wetness = wetnessGrid[y][x];
                if (wetness > 0) {
                    ctx.fillStyle = `rgba(0, 100, 255, ${wetness * 0.5})`;
                    ctx.fillRect(
                        x * TERRAIN_RESOLUTION,
                        y * TERRAIN_RESOLUTION,
                        TERRAIN_RESOLUTION,
                        TERRAIN_RESOLUTION
                    );

                    const isSurface = (y === 0 || wetnessGrid[y - 1][x] < 0.1);
                    if (isSurface) {
                        ctx.fillStyle = `rgba(100, 180, 255, ${wetness * 0.7})`;
                        ctx.fillRect(
                            x * TERRAIN_RESOLUTION,
                            y * TERRAIN_RESOLUTION,
                            TERRAIN_RESOLUTION,
                            // You can change the '3' to make the surface thicker or thinner
                            TERRAIN_RESOLUTION / 1 
                        );
                    }
                }
            }
        }
        
        const velocityScale = 0.05;
        const minVelocityThreshold = 0.70;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        for (let i = 0; i < particleCount; i++) {
            const pos = particles[i];
            const vel = velocities[i];
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

            // --- New Logic Starts Here ---

            // 1. Convert particle's world position to grid coordinates
            const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
            const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);

            // 2. Check if the particle is near any terrain
            let isNearTerrain = false;
            const checkRadius = 1; // Checks a 3x3 area (1 cell in each direction)
            
            for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                    const checkX = gridX + dx;
                    const checkY = gridY + dy;

                    // Ensure we're checking within the grid bounds
                    if (checkY >= 0 && checkY < TERRAIN_HEIGHT && checkX >= 0 && checkX < TERRAIN_WIDTH) {
                        if (terrain[checkY][checkX] === 1) {
                            isNearTerrain = true;
                            break; // Found terrain, no need to check further
                        }
                    }
                }
                if (isNearTerrain) break;
            }

            // 3. Only draw if speed is high AND the particle is not near terrain
            if (speed > minVelocityThreshold && !isNearTerrain) {
                const startX = pos.x * SCALE;
                const startY = pos.y * SCALE;
                const endX = (pos.x + vel.x * velocityScale) * SCALE;
                const endY = (pos.y + vel.y * velocityScale) * SCALE;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    };
}