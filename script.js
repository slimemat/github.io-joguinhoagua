let isMusicPlaying = true;

function toggleMusic() {
    const music = document.getElementById("background-music");
    if (isMusicPlaying) {
        music.pause();
        document.getElementById("toggle-music").innerText = "Reproduzir Música";
    } else {
        music.play();
        document.getElementById("toggle-music").innerText = "Pausar Música";
    }
    isMusicPlaying = !isMusicPlaying;
}

function startGame() {
    document.getElementById("start-screen").style.display = "none";
    const gameContainer = document.getElementById("game-container");
    gameContainer.style.display = "block";

    const music = document.getElementById("background-music");
    music.volume = 0.3;
    music.play();
}

// Jogo
const canvas = document.getElementById("gameCanvas");
const player = document.createElement("img");
player.src = "assets/player1.gif";
player.style.position = "absolute";
player.style.width = "120px";
player.style.height = "120px";
canvas.appendChild(player);

let playerX = 10;
let playerY = canvas.clientHeight - 130;

const states = [
    { name: "liquido", src: "assets/player1.gif" },
    { name: "vapor", src: "assets/player2.gif" },
    { name: "nuvem", src: "assets/player3.gif" },
    { name: "chuva", src: "assets/player4.gif" },
];

// Lista de imagens dos itens correspondentes aos estados do player
const itemImages = [
    "assets/xp1.gif", // Item para estado "liquido"
    "assets/xp3.gif", // Item para estado "vapor"
    "assets/xp3.gif", // Item para estado "nuvem"
    "assets/xp1.gif", // Item para estado "chuva"
];

let currentStateIndex = 0;
const keys = {};
let hasMoved = false;

function movePlayer() {
    if (currentStateIndex === 0) {
        playerY += 10;
        if (keys["ArrowLeft"] || keys["a"]) {
            playerX -= 8;
            player.style.transform = "scaleX(1)";
        }
        if (keys["ArrowRight"] || keys["d"]) {
            playerX += 8;
            player.style.transform = "scaleX(-1)";
        }
    }

    if (currentStateIndex === 1) {
        playerY -= 2;
        if (keys["ArrowUp"] || keys["w"]) playerY -= 8;
    }

    if (currentStateIndex === 2) {
        playerY -= 2;
        if (keys["ArrowLeft"] || keys["a"]) {
            playerX -= 8;
            player.style.transform = "scaleX(1)";
        }
        if (keys["ArrowRight"] || keys["d"]) {
            playerX += 8;
            player.style.transform = "scaleX(-1)";
        }
    }

    if (currentStateIndex === 3) {
        playerY += 8;
        if (keys["ArrowDown"] || keys["s"]) playerY += 8;
    }

    if (playerX < 0) playerX = 0;
    if (playerX > canvas.clientWidth - player.clientWidth) {
        playerX = canvas.clientWidth - player.clientWidth;
    }
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.clientHeight - player.clientHeight) {
        playerY = canvas.clientHeight - player.clientHeight;
    }

    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;

    checkCollisionWithItem();
}

function getRandomPosition() {
    const x = Math.floor(Math.random() * (canvas.clientWidth - 50));
    const y = Math.floor(Math.random() * (canvas.clientHeight - 50));
    return { x, y };
}

let collectedCount = 0; // Adiciona uma variável para contar coletáveis

function checkCollisionWithItem() {
    const item = document.getElementById("item");
    const itemRect = item.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    if (
        playerRect.left < itemRect.right &&
        playerRect.right > itemRect.left &&
        playerRect.top < itemRect.bottom &&
        playerRect.bottom > itemRect.top
    ) {
        const collectSound = document.getElementById("collect-sound");
        collectSound.currentTime = 0;
        collectSound.play();
        
        // Gera nova posição e imagem para o item
        const newPosition = getRandomPosition();
        item.style.left = `${newPosition.x}px`;
        item.style.top = `${newPosition.y}px`;

        // Atualiza a imagem do item de acordo com o estado atual do player
        item.src = itemImages[currentStateIndex];

        // Avança automaticamente para o próximo estado se for player1 ou player3
        if (currentStateIndex === 0 || currentStateIndex === 2) {
            changeState(); // Muda para o próximo estado automaticamente
        }

        // Atualiza o contador de coletáveis
        collectedCount++;
        document.getElementById("score").innerText = collectedCount; // Atualiza o texto do contador
    }
}



function changeState() {
    currentStateIndex = (currentStateIndex + 1) % states.length;
    player.src = states[currentStateIndex].src;

    if (currentStateIndex === 0) {
        playerY += 12;
    } else if (currentStateIndex === 1) {
        playerY -= 12;
    } else if (currentStateIndex === 2) {
        playerY -= 2;
    } else if (currentStateIndex === 3) {
        playerY += 6;
    }
}

window.addEventListener("keydown", function(event) {
    const key = event.key;
    if (key === " ") changeState();
    if (["ArrowLeft", "ArrowRight", "a", "d"].includes(key) && !hasMoved) {
        arrowKeysImage.remove();
        hasMoved = true;
    }
    keys[key] = true;
});

window.addEventListener("keyup", function(event) {
    const key = event.key;
    keys[key] = false;
});

setInterval(movePlayer, 1000 / 60); // Atualiza a cada 60 fps
