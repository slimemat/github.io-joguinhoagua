/**
 * This script uses the D3.js library to find all level nodes on the map
 * and draw a smooth, dashed line connecting their centers.
 * It also adds click event listeners to navigate to each game level.
 */

// Draws the path connecting the levels
function drawPath() {
    const levels = document.querySelectorAll('.level');
    
    const points = Array.from(levels)
        .map(level => {
            const idNum = parseInt(level.id.replace('game', ''), 10);
            return {
                id: idNum,
                x: level.offsetLeft + level.offsetWidth / 2,
                y: level.offsetTop + level.offsetHeight / 2
            };
        })
        .sort((a, b) => a.id - b.id)
        .map(p => [p.x, p.y]);

    const lineGenerator = d3.line().curve(d3.curveCatmullRom);
    const pathData = lineGenerator(points);

    const svg = d3.select('.map-path-svg');
    svg.selectAll('path').remove();

    svg.append('path')
        .attr('d', pathData)
        .attr('stroke', 'white')
        .attr('stroke-width', 8)
        .attr('stroke-dasharray', '20, 15')
        .attr('stroke-linecap', 'round')
        .attr('fill', 'none');
}

/**
 * Finds all level elements and adds a click event listener to them
 * for redirecting to the correct game page.
 */
function setupLevelClicks() {
    const levels = document.querySelectorAll('.level');

    levels.forEach(level => {
        level.addEventListener('click', () => {
            // Get the number from the element's ID (e.g., 'game1' -> '1')
            const gameNumber = level.id.replace('game', '');
            
            // Redirect the browser to the corresponding game folder
            window.location.href = `../games/game${gameNumber}/`;
        });
    });
}


// --- Event Listeners ---

// When the page first loads, draw the path and set up the click events
window.addEventListener('load', () => {
    drawPath();
    setupLevelClicks(); // Call the new function here
});

// Redraw the path whenever the window is resized to keep it responsive
window.addEventListener('resize', drawPath);