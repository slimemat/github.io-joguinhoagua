function Renderer(world, ctx) {
    // CHANGED: Look for 'gameCanvas' to match your HTML
    var canvas = document.getElementById("gameCanvas");
    var ctx = canvas.getContext("2d");
    
    // This sets the physics world to be 10 "meters" wide.
    // Since your canvas is 1000px wide, the scale will be 100 pixels per meter.
    const SCALE = canvas.width / 10;

    this.render = function() {
        // CHANGED: Clear canvas to a sky color
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (body = world.GetBodyList(); body; body = body.GetNext()) {
            for (f = body.GetFixtureList(); f; f = f.GetNext()) {
                this.draw(f);
            }
        }
        this.drawParticleSystem();
    }

    this.draw = function(fixture) {
        const userData = fixture.GetUserData();
        if (!userData) return;

        // CHANGED: Draw 'terrain' bodies the same way as 'square' bodies
        if (userData.type === "terrain") {
            ctx.fillStyle = '#8B4513'; // Dirt brown color
            this.drawPolygon(fixture);
        }
    }

    // Helper function to draw polygons (dirt, walls, etc.)
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
        ctx.fill(); // Use fill instead of stroke for solid ground
    }

    this.drawCircle = function(radius, pos, color, index = " ") {
        const newRadius = radius * SCALE;
        const x = pos.x * SCALE;
        const y = pos.y * SCALE;
        ctx.moveTo(x + newRadius, y);
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, newRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = "grey";
        ctx.stroke();
        ctx.font = '12px serif';
        ctx.strokeText(index, x, y);
        ctx.closePath();
    }


    this.drawParticleSystem = function() {
        var system = world.GetParticleSystemList()
        const particles = system.GetPositionBuffer()
        ctx.fillStyle = 'rgba(0, 100, 255, 0.8)'; // Water color
        const radius = system.GetRadius() * SCALE;
        for (var i=0; i<system.GetParticleCount(); i++){
            const pos = particles[i];
            ctx.beginPath();
            ctx.arc(pos.x * SCALE, pos.y * SCALE, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}