// javascript/game.js
// A classe principal que gerencia o estado e o loop do jogo.

import Player from './player.js';
import InputHandler from './input.js';
import Item from './item.js';
import AudioManager from './audio.js';
import { updateScore, hideStartScreen, showGameContainer } from './ui.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 0;
        this.height = 0;

        this.audio = new AudioManager();
        this.input = new InputHandler();
        
        this.player = null;
        this.item = null;

        this.score = 0;
        this.hasMoved = false;
        this.arrowKeysImage = document.getElementById('arrowKeysImage');
        
        this.gameLoop = this.gameLoop.bind(this);

        // Adiciona um listener para o evento de redimensionamento da janela.
        window.addEventListener('resize', this.resize.bind(this));
    }

    start() {
        hideStartScreen();
        showGameContainer();

        // CORREÇÃO: Chama o método resize para calcular as dimensões iniciais.
        this.resize(); 

        // Cria os objetos do jogo aqui, agora que temos as dimensões corretas.
        if (!this.player) {
            this.player = new Player(this);
        }
        if (!this.item) {
            this.item = new Item(this);
        }

        this.audio.playMusic();
        this.gameLoop();
    }
    
    // NOVO MÉTODO: Lida com o redimensionamento da tela.
    resize() {
        // Atualiza as dimensões do jogo com base no tamanho atual do canvas.
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;

        // Se o jogador já existe, garante que ele não fique fora da tela.
        if (this.player) {
            this.player.clampPosition();
        }
    }

    gameLoop() {
        if (!this.player) return;

        this.update();
        requestAnimationFrame(this.gameLoop);
    }
    
    update() {
        if (this.input.keys[' ']) {
            this.player.changeState();
            this.input.keys[' '] = false;
        }

        this.player.update(this.input.keys);
        this.checkCollision();
        this.checkFirstMove();
    }

    checkCollision() {
        if (!this.item || !this.item.element) return;
        
        const playerRect = this.player.element.getBoundingClientRect();
        const itemRect = this.item.element.getBoundingClientRect();

        if (
            playerRect.left < itemRect.right &&
            playerRect.right > itemRect.left &&
            playerRect.top < itemRect.bottom &&
            playerRect.bottom > itemRect.top
        ) {
            this.audio.playCollectSound();
            this.score++;
            updateScore(this.score);

            if ([0, 2].includes(this.player.currentStateIndex)) {
                this.player.changeState();
            }
            
            this.item.randomizePosition(this.player.currentStateIndex);
        }
    }

    checkFirstMove() {
        if (!this.hasMoved && (this.input.keys["ArrowLeft"] || this.input.keys["a"] || this.input.keys["ArrowRight"] || this.input.keys["d"])) {
             if (this.arrowKeysImage) {
                this.arrowKeysImage.remove();
             }
             this.hasMoved = true;
        }
    }
}

