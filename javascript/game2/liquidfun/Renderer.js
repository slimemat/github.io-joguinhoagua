function Renderer(world, ctx) {
    var canvas = document.getElementById("gameCanvas");
    var ctx = canvas.getContext("2d");
    const SCALE = canvas.width / 10;

    const wetnessGrid = [];
    for (let y = 0; y < TERRAIN_HEIGHT; y++) {
        wetnessGrid[y] = new Array(TERRAIN_WIDTH).fill(0.0);
    }

    // --- No changes to the top part of the file ---

    this.render = function() {
        ctx.fillStyle = '#87CEEB'; // Sky color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // First, draw the new terrain grid
        this.drawTerrainGrid();

        // Then, draw all other physics bodies (like walls)
        for (let body = world.GetBodyList(); body; body = body.GetNext()) {
            for (let f = body.GetFixtureList(); f; f = f.GetNext()) {
                this.draw(f);
            }
        }
        
        // Finally, draw the water on top
        this.drawParticleSystem();
    }
    
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

    this.draw = function(fixture) {
        const userData = fixture.GetUserData();
        if (!userData) return;

        if (userData.type === "wall") {
            ctx.fillStyle = '#424242'; // Dark grey
            this.drawPolygon(fixture);
        }
    }
    
    this.drawPolygon = function(fixture) {
        const body = fixture.GetBody();
        const shape = fixture.GetShape();
        const pos = body.GetPosition();
        const vertices = shape.m_vertices;
        ctx.beginPath();
        ctx.moveTo((vertices[0].x + pos.x) * SCALE, (vertices[0].y + pos.y) * SCALE);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo((vertices[i].x + pos.x) * SCALE, (vertices[i].y + pos.y) * SCALE);
        }
        ctx.closePath();
        ctx.fill();
    }

    // ==========================================================
    // NEW AND IMPROVED WATER RENDERING FUNCTION
    // ==========================================================
    this.drawParticleSystem = function() {
        const system = world.GetParticleSystemList();
        const particles = system.GetPositionBuffer();
        const velocities = system.GetVelocityBuffer();

        const FADE_SPEED = 0.10; // How fast water fades. Lower is slower. Try 0.02 to 0.1

        // Step A: Decay (Evaporation)
        // Every frame, slightly reduce the wetness of every cell that isn't totally dry.
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                if (wetnessGrid[y][x] > 0) {
                    wetnessGrid[y][x] = Math.max(0, wetnessGrid[y][x] - FADE_SPEED);
                }
            }
        }

        // Step B: Add New Water
        // For every active physics particle, set its grid cell to be fully wet (1.0).
        for (let i = 0; i < system.GetParticleCount(); i++) {
            const pos = particles[i];
            const gridX = Math.floor((pos.x * SCALE) / TERRAIN_RESOLUTION);
            const gridY = Math.floor((pos.y * SCALE) / TERRAIN_RESOLUTION);

            if (gridY >= 0 && gridY < TERRAIN_HEIGHT && gridX >= 0 && gridX < TERRAIN_WIDTH) {
                // FIXED: The error was here. It should be gridY, not y.
                wetnessGrid[gridY][gridX] = 1.0;
            }
        }

        // Step C: Render the Grid
        // Draw each cell, using its wetness value to control its transparency.
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                const wetness = wetnessGrid[y][x];
                if (wetness > 0) {
                    // The base color's alpha is now tied directly to the wetness
                    ctx.fillStyle = `rgba(0, 100, 255, ${wetness * 0.9})`;
                    ctx.fillRect(
                        x * TERRAIN_RESOLUTION,
                        y * TERRAIN_RESOLUTION,
                        TERRAIN_RESOLUTION,
                        TERRAIN_RESOLUTION
                    );
                }
            }
        }
        
        // --- Draw Flow Indicators on Top ---
        const velocityScale = 0.05;
        const minVelocityThreshold = 0.40;

        ctx.strokeStyle = 'rgba(0, 153, 255, 1)';
        ctx.lineWidth = 4;
        ctx.beginPath(); // Begin a single path for all lines for better performance

        for (let i = 0; i < system.GetParticleCount(); i++) {
            const pos = particles[i];
            const vel = velocities[i];
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

            if (speed > minVelocityThreshold) {
                const startX = pos.x * SCALE;
                const startY = pos.y * SCALE;
                const endX = (pos.x + vel.x * velocityScale) * SCALE;
                const endY = (pos.y + vel.y * velocityScale) * SCALE;
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
            }
        }
        ctx.stroke(); // Draw all the lines at once
    }
}