const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

const TERRAIN_RESOLUTION = 8;
const TERRAIN_WIDTH = canvas.width / TERRAIN_RESOLUTION;
const TERRAIN_HEIGHT = canvas.height / TERRAIN_RESOLUTION;

// Estados do jogo
let currentLevel = 1;
let gameState = 'playing'; // 'playing', 'won', 'lost'
let gameMessage = '';

// Arrays do jogo
let terrain = []; // 0: ar, 1: terra, 2: rocha
let water = [];   // Quantidade de água (0-1)
let newWater = []; // Buffer para a próxima iteração da água
let heatPoints = [];
let coldPoints = [];
let waterSource = { x: 0, y: 0 };
let waterDestination = { x: 0, y: 0, width: 1, height: 1 }; // Adicionado width e height

// Configurações dos níveis
const levels = {
    1: {
        name: "Nível 1 - Tutorial",
        source: { x: 10, y: 5 },
        destination: { x: 80, y: 60, width: 5, height: 5 }, // Ponto de vitória maior e melhor posicionado
        heatPoints: [
            { x: 30, y: 35, width: 4, height: 4 }, // Obstáculo maior
            { x: 60, y: 40, width: 4, height: 4 }  // Obstáculo maior
        ],
        coldPoints: [
            { x: 45, y: 20, width: 4, height: 4 }   // Obstáculo maior
        ],
        solidRocks: [
            { x: 20, y: 30, width: 5, height: 10 },
            { x: 70, y: 40, width: 8, height: 5 }
        ]
    },
    2: {
        name: "Nível 2 - Intermediário",
        source: { x: 5, y: 10 },
        destination: { x: 85, y: 55, width: 6, height: 6 },
        heatPoints: [
            { x: 25, y: 30, width: 5, height: 5 },
            { x: 50, y: 20, width: 5, height: 5 },
            { x: 75, y: 45, width: 5, height: 5 }
        ],
        coldPoints: [
            { x: 35, y: 40, width: 5, height: 5 },
            { x: 65, y: 30, width: 5, height: 5 }
        ],
        solidRocks: [
            { x: 15, y: 25, width: 10, height: 8 },
            { x: 40, y: 50, width: 15, height: 6 },
            { x: 80, y: 20, width: 6, height: 12 }
        ]
    },
    3: {
        name: "Nível 3 - Avançado",
        source: { x: 8, y: 8 },
        destination: { x: 80, y: 60, width: 7, height: 7 },
        heatPoints: [
            { x: 20, y: 20, width: 6, height: 6 },
            { x: 40, y: 30, width: 6, height: 6 },
            { x: 60, y: 40, width: 6, height: 6 },
            { x: 80, y: 25, width: 6, height: 6 }
        ],
        coldPoints: [
            { x: 30, y: 45, width: 6, height: 6 },
            { x: 50, y: 20, width: 6, height: 6 },
            { x: 70, y: 55, width: 6, height: 6 }
        ],
        solidRocks: [
            { x: 12, y: 30, width: 8, height: 15 },
            { x: 35, y: 50, width: 12, height: 8 },
            { x: 55, y: 25, width: 10, height: 10 },
            { x: 75, y: 45, width: 8, height: 12 }
        ]
    }
};

function initializeLevel(levelNum) {
    const level = levels[levelNum];
    currentLevel = levelNum;
    gameState = 'playing';
    gameMessage = level.name;
    
    // Inicializa terreno e água
    for (let y = 0; y < TERRAIN_HEIGHT; y++) {
        terrain[y] = [];
        water[y] = [];
        newWater[y] = [];
        for (let x = 0; x < TERRAIN_WIDTH; x++) {
            terrain[y][x] = (y > TERRAIN_HEIGHT / 2) ? 1 : 0; // Metade inferior é terra
            water[y][x] = 0;
            newWater[y][x] = 0;
        }
    }
    
    // Adiciona rochas sólidas
    level.solidRocks.forEach(rock => {
        for (let y = rock.y; y < rock.y + rock.height && y < TERRAIN_HEIGHT; y++) {
            for (let x = rock.x; x < rock.x + rock.width && x < TERRAIN_WIDTH; x++) {
                terrain[y][x] = 2; // 2 = rocha sólida (não escavável)
            }
        }
    });
    
    // Define pontos especiais
    waterSource = level.source;
    waterDestination = level.destination;
    heatPoints = level.heatPoints;
    coldPoints = level.coldPoints;
    
    // Limpa área da fonte e destino
    terrain[waterSource.y][waterSource.x] = 0;
    // O destino agora é uma área, então limpamos a área correspondente
    for (let y = waterDestination.y; y < waterDestination.y + waterDestination.height; y++) {
        for (let x = waterDestination.x; x < waterDestination.x + waterDestination.width; x++) {
            if (y < TERRAIN_HEIGHT && x < TERRAIN_WIDTH) {
                terrain[y][x] = 0;
            }
        }
    }
}

function drawTerrain() {
    for (let y = 0; y < TERRAIN_HEIGHT; y++) {
        for (let x = 0; x < TERRAIN_WIDTH; x++) {
            if (terrain[y][x] === 1) {
                ctx.fillStyle = '#8B4513'; // Terra escavável
                ctx.fillRect(x * TERRAIN_RESOLUTION, y * TERRAIN_RESOLUTION, TERRAIN_RESOLUTION, TERRAIN_RESOLUTION);
            } else if (terrain[y][x] === 2) {
                ctx.fillStyle = '#2F2F2F'; // Rocha sólida
                ctx.fillRect(x * TERRAIN_RESOLUTION, y * TERRAIN_RESOLUTION, TERRAIN_RESOLUTION, TERRAIN_RESOLUTION);
            }
        }
    }
}

function drawWater() {
    for (let y = 0; y < TERRAIN_HEIGHT; y++) {
        for (let x = 0; x < TERRAIN_WIDTH; x++) {
            if (water[y][x] > 0) {
                const alpha = Math.min(water[y][x] + 0.2, 1); // Adiciona um pouco de opacidade base
                ctx.fillStyle = `rgba(65, 105, 225, ${alpha})`;
                ctx.fillRect(x * TERRAIN_RESOLUTION, y * TERRAIN_RESOLUTION, TERRAIN_RESOLUTION, TERRAIN_RESOLUTION);
            }
        }
    }
}

function drawSpecialPoints() {
    // Fonte de água
    ctx.fillStyle = '#00BFFF';
    ctx.fillRect(waterSource.x * TERRAIN_RESOLUTION, waterSource.y * TERRAIN_RESOLUTION, TERRAIN_RESOLUTION, TERRAIN_RESOLUTION);
    
    // Destino (agora é uma área)
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(waterDestination.x * TERRAIN_RESOLUTION, waterDestination.y * TERRAIN_RESOLUTION, waterDestination.width * TERRAIN_RESOLUTION, waterDestination.height * TERRAIN_RESOLUTION);
    
    // Pontos de calor
    heatPoints.forEach(point => {
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(point.x * TERRAIN_RESOLUTION, point.y * TERRAIN_RESOLUTION, point.width * TERRAIN_RESOLUTION, point.height * TERRAIN_RESOLUTION);
    });
    
    // Pontos de frio
    coldPoints.forEach(point => {
        ctx.fillStyle = '#00CED1';
        ctx.fillRect(point.x * TERRAIN_RESOLUTION, point.y * TERRAIN_RESOLUTION, point.width * TERRAIN_RESOLUTION, point.height * TERRAIN_RESOLUTION);
    });
}

function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(gameMessage, 10, 30);
    
    if (gameState === 'won') {
        ctx.fillStyle = 'green';
        ctx.font = '24px Arial';
        ctx.fillText('VITÓRIA! Pressione R para próximo nível', canvas.width/2 - 200, canvas.height/2);
    } else if (gameState === 'lost') {
        ctx.fillStyle = 'red';
        ctx.font = '24px Arial';
        ctx.fillText('GAME OVER! Pressione R para reiniciar', canvas.width/2 - 180, canvas.height/2);
    }
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Pressione R para reiniciar', 10, canvas.height - 10);
}

// Mecânica de escavação
let isDigging = false;
canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'playing') {
        isDigging = true;
        dig(e);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDigging && gameState === 'playing') {
        dig(e);
    }
});

canvas.addEventListener('mouseup', () => {
    isDigging = false;
});

// Suporte para touch
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'playing') {
        isDigging = true;
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        dig(mouseEvent);
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDigging && gameState === 'playing') {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        dig(mouseEvent);
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDigging = false;
});

// Controle de teclado
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') {
        if (gameState === 'won' && currentLevel < Object.keys(levels).length) {
            initializeLevel(currentLevel + 1);
        } else {
            initializeLevel(currentLevel);
        }
    }
});

function dig(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const terrainX = Math.floor(mouseX / TERRAIN_RESOLUTION);
    const terrainY = Math.floor(mouseY / TERRAIN_RESOLUTION);

    const digRadius = 3;

    for (let y = -digRadius; y <= digRadius; y++) {
        for (let x = -digRadius; x <= digRadius; x++) {
            const currentX = terrainX + x;
            const currentY = terrainY + y;

            if (currentX >= 0 && currentX < TERRAIN_WIDTH && currentY >= 0 && currentY < TERRAIN_HEIGHT) {
                if (Math.sqrt(x * x + y * y) <= digRadius) {
                    if (terrain[currentY][currentX] === 1) {
                        terrain[currentY][currentX] = 0;
                    }
                }
            }
        }
    }
}

function checkWaterCollisions() {
    for (let y = 0; y < TERRAIN_HEIGHT; y++) {
        for (let x = 0; x < TERRAIN_WIDTH; x++) {
            if (water[y][x] > 0.1) {
                // Verifica colisão com pontos de calor
                for (const point of heatPoints) {
                    if (x >= point.x && x < point.x + point.width &&
                        y >= point.y && y < point.y + point.height) {
                        gameState = 'lost';
                        gameMessage = 'A água evaporou no calor!';
                        return;
                    }
                }
                
                // Verifica colisão com pontos de frio
                for (const point of coldPoints) {
                    if (x >= point.x && x < point.x + point.width &&
                        y >= point.y && y < point.y + point.height) {
                        gameState = 'lost';
                        gameMessage = 'A água congelou!';
                        return;
                    }
                }
                
                // Verifica se chegou ao destino
                if (x >= waterDestination.x && x < waterDestination.x + waterDestination.width &&
                    y >= waterDestination.y && y < waterDestination.y + waterDestination.height) {
                    if (water[y][x] > 0.5) { // Requer uma quantidade mínima de água para vencer
                        gameState = 'won';
                        if (currentLevel < Object.keys(levels).length) {
                            gameMessage = 'Nível completo! Pressione R para o próximo';
                        } else {
                            gameMessage = 'Parabéns! Você completou todos os níveis!';
                        }
                        return;
                    }
                }
            }
        }
    }
}

// Parâmetros de simulação de água
const MAX_WATER = 1.0;
const MIN_WATER_FLOW = 0.01;
const DRAIN_RATE = 1.5;
const SPREAD_RATE = 1.1;

function updateWaterPhysics() {
    if (gameState !== 'playing') return;
    
    // Copia o estado atual da água para o buffer
    for (let y = 0; y < TERRAIN_HEIGHT; y++) {
        for (let x = 0; x < TERRAIN_WIDTH; x++) {
            newWater[y][x] = water[y][x];
        }
    }

    // Processa de baixo para cima para simular gravidade corretamente
    for (let y = TERRAIN_HEIGHT - 1; y >= 0; y--) {
        for (let x = 0; x < TERRAIN_WIDTH; x++) {
            if (water[y][x] > MIN_WATER_FLOW) {
                let currentCellWater = water[y][x];

                // 1. Fluxo para baixo (gravidade)
                if (y + 1 < TERRAIN_HEIGHT && terrain[y + 1][x] === 0) {
                    let spaceBelow = MAX_WATER - newWater[y + 1][x];
                    let flowAmount = Math.min(currentCellWater * DRAIN_RATE, spaceBelow);
                    
                    if (flowAmount > MIN_WATER_FLOW) {
                        newWater[y + 1][x] += flowAmount;
                        newWater[y][x] -= flowAmount;
                        currentCellWater -= flowAmount;
                    }
                }

                // 2. Fluxo lateral (se não houver espaço para baixo ou se a célula estiver cheia)
                if (currentCellWater > MIN_WATER_FLOW) {
                    let flowLeft = 0;
                    let flowRight = 0;

                    // Tenta mover para a esquerda
                    if (x - 1 >= 0 && terrain[y][x - 1] === 0) {
                        let diff = currentCellWater - newWater[y][x - 1];
                        if (diff > MIN_WATER_FLOW) {
                            flowLeft = Math.min(diff * SPREAD_RATE, currentCellWater * 0.5);
                        }
                    }

                    // Tenta mover para a direita
                    if (x + 1 < TERRAIN_WIDTH && terrain[y][x + 1] === 0) {
                        let diff = currentCellWater - newWater[y][x + 1];
                        if (diff > MIN_WATER_FLOW) {
                            flowRight = Math.min(diff * SPREAD_RATE, currentCellWater * 0.5);
                        }
                    }

                    // Aplica os fluxos laterais
                    if (flowLeft > MIN_WATER_FLOW) {
                        newWater[y][x - 1] += flowLeft;
                        newWater[y][x] -= flowLeft;
                    }
                    if (flowRight > MIN_WATER_FLOW) {
                        newWater[y][x + 1] += flowRight;
                        newWater[y][x] -= flowRight;
                    }
                }
            }
        }
    }

    // Atualiza o estado da água e remove resíduos
    for (let y = 0; y < TERRAIN_HEIGHT; y++) {
        for (let x = 0; x < TERRAIN_WIDTH; x++) {
            water[y][x] = newWater[y][x];
            if (water[y][x] < MIN_WATER_FLOW) {
                water[y][x] = 0;
            }
        }
    }
    checkWaterCollisions();
}

let waterSourceTimer = 0;
function addWaterFromSource() {
    if (gameState !== 'playing') return;
    
    waterSourceTimer++;
    if (waterSourceTimer % 5 === 0) {
        const sourceX = waterSource.x;
        const sourceY = waterSource.y;
        if (terrain[sourceY][sourceX] === 0 && water[sourceY][sourceX] < MAX_WATER) {
            water[sourceY][sourceX] = Math.min(MAX_WATER, water[sourceY][sourceX] + 0.2);
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    addWaterFromSource();
    updateWaterPhysics();
    drawTerrain();
    drawSpecialPoints();
    drawWater();
    drawUI();

    requestAnimationFrame(gameLoop);
}

// Inicializa o primeiro nível
initializeLevel(1);
gameLoop();

