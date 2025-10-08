function Renderer(world, ctx) {
    var canvas = document.getElementById("gameCanvas");
    var ctx = canvas.getContext("2d");
    const SCALE = canvas.width / 10;

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
    
    // NEW: This function draws the dirt as a pixel-perfect grid
    this.drawTerrainGrid = function() {
        ctx.fillStyle = '#8B4513'; // Dirt brown color
        for (let y = 0; y < TERRAIN_HEIGHT; y++) {
            for (let x = 0; x < TERRAIN_WIDTH; x++) {
                // If the grid cell contains dirt (value is 1), draw a rectangle
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

        // REMOVED: We no longer draw the 'terrain' physics bodies
        // if (userData.type === "terrain") { ... }

        // We only draw the walls now
        if (userData.type === "wall") {
            ctx.fillStyle = '#424242'; // Dark grey
            this.drawPolygon(fixture);
        }
    }
    
    this.drawPolygon = function(fixture) {
        // ... (this function is unchanged)
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

    this.drawParticleSystem = function() {
        var system = world.GetParticleSystemList();
        const particles = system.GetPositionBuffer();
        ctx.fillStyle = 'rgba(0, 100, 255, 0.8)'; // Water color
        
        // This is the physics radius, which we'll use to determine the square size
        const particlePhysicsRadius = system.GetRadius(); 
        // We want the square to be centered, so its size (width/height) will be 2 * radius
        const particleSquareSize = particlePhysicsRadius * 2 * SCALE; 

        for (var i = 0; i < system.GetParticleCount(); i++) {
            const pos = particles[i];
            
            // Calculate top-left corner for the square
            const drawX = (pos.x * SCALE) - (particleSquareSize / 2);
            const drawY = (pos.y * SCALE) - (particleSquareSize / 2);

            // CHANGED: Draw a rectangle instead of an arc
            ctx.fillRect(drawX, drawY, particleSquareSize, particleSquareSize);
        }
    }
}