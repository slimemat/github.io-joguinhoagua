// javascript/game.js
// A classe principal que gerencia o estado e o loop do jogo.

import Player from './player.js';
import InputHandler from './InputHandler.js';
import Item from './item.js';
import Audio from '../common/AudioManager.js';
import { updateScore, hideStartScreen, showGameContainer } from '../common/ui.js';

export default class Game {
    /**
     * Cria uma nova instância do jogo.
     * @param {HTMLCanvasElement} canvas - O canvas onde o jogo será renderizado.
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 0;
        this.height = 0;

        this.audio = new Audio();

        //from the other class input.js
        this.input = new InputHandler(() => this.resetHintTimer());
        
        this.player = null;
        this.item = null;

        this.score = 0;
        this.hasMoved = false;
        this.arrowKeysImage = document.getElementById('arrowKeysImage');

        this.hintTimeout = null;
        this.hintDelay = 10000; // 10 segundos

        this.gameLoop = this.gameLoop.bind(this);

        // Listener para redimensionamento da janela
        window.addEventListener('resize', this.resize.bind(this));
    }

    /**
     * Inicia o jogo, exibindo a tela principal e criando objetos do jogo.
     */
    start() {
        hideStartScreen();
        showGameContainer();

        this.resize(); // Calcula dimensões iniciais

        if (!this.player) this.player = new Player(this);
        if (!this.item) this.item = new Item(this);

        this.audio.playMusic();

        this.resetHintTimer(); // inicia o temporizador do hint

        this.gameLoop();
    }

    /**
     * Atualiza as dimensões do jogo e mantém o jogador dentro da tela.
     */
    resize() {
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;

        if (this.player) this.player.clampPosition();
    }

    /**
     * Loop principal do jogo.
     */
    gameLoop() {
        if (!this.player) return;

        this.update();
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Atualiza o estado do jogo a cada frame.
     */
    update() {
        if (this.input.keys[' ']) {
            this.player.changeState();
            this.input.keys[' '] = false;
        }

        this.player.update(this.input.keys);
        this.checkCollision();
        this.checkFirstMove();
    }

    /**
     * Verifica colisão entre o jogador e o item e atualiza a pontuação.
     */
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

    /**
     * Verifica se o jogador fez o primeiro movimento e esconde a imagem de dicas.
     */
    checkFirstMove() {
        const movementKeys = ["ArrowLeft", "ArrowRight", "a", "d"];
        if (!this.hasMoved && movementKeys.some(k => this.input.keys[k])) {
            if (this.arrowKeysImage) {
                this.arrowKeysImage.style.display = 'none'; // apenas esconde
            }
            this.hasMoved = true;
        }
    }

    /**
     * Mostra a dica dos arrow keys.
     */
    showArrowKeysHint() {
        if (this.arrowKeysImage) {
            this.arrowKeysImage.style.display = 'block';
            this.hasMoved = false;
        }
    }

    /**
     * Reseta o temporizador da dica, exibindo-a se o jogador demorar.
     */
    resetHintTimer() {
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => this.showArrowKeysHint(), this.hintDelay);
    }
}
