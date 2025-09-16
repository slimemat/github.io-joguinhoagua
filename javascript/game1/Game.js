// javascript/game.js
// A classe principal que gerencia o estado e o loop do jogo.

import Player from './player.js';
import InputHandler from './InputHandler.js';
import Item from './item.js';
import Audio from '../common/AudioManager.js';
import { updateScore, hideStartScreen, showGameContainer } from '../common/ui.js';
import { showQuestionPanel } from '../../javascript/common/questionPanel.js';
import { showInfoPanel } from '../../javascript/common/infoPanel.js';
import { showFeedbackPanel } from '../../javascript/common/feedbackPanel.js';
import RewardsManager from './RewardsManager.js'; 


export default class Game {

    static INFO_INTERVAL = 10;      // Pontos para mostrar info
    static QUESTION_OFFSET = 5;    // Pontos após info para mostrar questão

    /**
     * Cria uma nova instância do jogo.
     * @param {HTMLCanvasElement} canvas - O canvas onde o jogo será renderizado.
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 0;
        this.height = 0;

        this.paused = false;

        this.audio = new Audio();
        this.rewardsManager = new RewardsManager();

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

        this.questions = [];
        this.currentQuestionIndex = 0;
        this.lastMilestone = 0;
        

        // Listener para redimensionamento da janela
        window.addEventListener('resize', this.resize.bind(this));
    }

    /**
     * Inicia o jogo, exibindo a tela principal e criando objetos do jogo.
     */
    async start() {
        hideStartScreen();
        showGameContainer();

        this.resize(); // Calcula dimensões iniciais

        if (!this.player) this.player = new Player(this);
        if (!this.item) this.item = new Item(this);

        this.audio.playMusic();

        this.resetHintTimer(); // inicia o temporizador do hint

        // Load questions.json and rewards.json (only once)
        await Promise.all([
            this.loadQuestions(),
            this.rewardsManager.loadRewards()
        ]);

        this.gameLoop();
    }

    /**
     * Loads questions.json.
     */
    async loadQuestions() {
        if (this.questions.length === 0) {
            const res = await fetch('./questions.json');
            const data = await res.json();
            this.questions = data["pt-br"];
        }
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

        if (!this.paused) {
            this.update();
        }
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


            //after score is updated, check if we should show a info/question
            if (this.questions && this.questions.length > 0) {
                this.checkMilestones();
            }

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
        if (this.paused) return;
        if (this.arrowKeysImage) {
            this.arrowKeysImage.style.display = 'block';
            this.hasMoved = false;
        }
    }

    /**
     * Reseta o temporizador da dica, exibindo-a se o jogador demorar (dica de movimentação).
     */
    resetHintTimer() {
        clearTimeout(this.hintTimeout);
        if (this.paused) return
        this.hintTimeout = setTimeout(() => this.showArrowKeysHint(), this.hintDelay);
    }


    /**
     * Checks if the current score has reached a milestone for an info or question panel.
     */
    checkMilestones() {
        const q = this.questions[this.currentQuestionIndex];
        if (!q) return;

        const infoScore = Game.INFO_INTERVAL + this.currentQuestionIndex * Game.INFO_INTERVAL;
        const questionScore = infoScore + Game.QUESTION_OFFSET;

        if (this.score === infoScore) {
            this.triggerInfoSequence(q);
        }
        if (this.score === questionScore) {
            this.triggerQuestionSequence(q);
        }
    }

    /**
     * Pauses the game and shows the informational panel.
     * @param {object} q - The current question/info data object.
     */
    triggerInfoSequence(q) {
        this.paused = true;
        showInfoPanel(q.info, () => {
            // After closing info panel
            this.paused = false;
            this.resetHintTimer();
        }, q.image, q.imageClass);
    }

    /**
     * (Formerly _showAnswerFeedback) Orchestrates the entire feedback sequence.
     * @param {boolean} isCorrect - Whether the user's answer was correct.
     * @param {object} q - The full question object.
     */
    showAnswerFeedback(isCorrect, q) {
        this._playFeedbackSound(isCorrect);

        const feedbackData = isCorrect ? q.feedback.correct : q.feedback.incorrect;
        
        const panelOptions = {
            isCorrect: isCorrect,
            title: feedbackData.title,
            text: feedbackData.text,
            image: q.image,
            choicePrompt: isCorrect ? feedbackData.choice_prompt : null,
            onClose: () => this._handleGameContinuation()
        };

        if (isCorrect && feedbackData.offers_reward) {
            const rewards = this.rewardsManager.getRandomRewards(3);
            panelOptions.actionButtons = this._createRewardButtons(rewards);
        }

        showFeedbackPanel(panelOptions);
    }

    /**
     * Plays the correct or wrong sound effect.
     */
    _playFeedbackSound(isCorrect) {
        if (isCorrect) {
            this.audio.playCorrectSound();
        } else {
            this.audio.playWrongSound();
        }
    }

    /**
     * Creates the button objects for the feedback panel.
     * This keeps the reward *logic* (what happens on click) inside Game.js.
     */
    _createRewardButtons(rewards) {
        return rewards.map(reward => ({
            title: reward.title,
            subtitle: reward.subtitle,
            callback: () => this.applyReward(reward.id)
        }));
    }

        /**
     * (NEW HELPER) This is where the actual effect of a chosen reward is handled.
     */
    applyReward(rewardId) {
        console.log(`Applying reward: ${rewardId}`);
        // TODO: make the logic here to apply game effect such as bigger clouds, faster movement...
        //
        //
        //
    }

    /**
     * Resumes the game state after a panel is closed.
     */
    _handleGameContinuation() {
        this.currentQuestionIndex++;
        this.paused = false;
        this.resetHintTimer();
    }

    /**
     * (UPDATED) The trigger method now calls the main orchestrator method.
     */
    triggerQuestionSequence(q) {
        this.paused = true;
        showQuestionPanel(q.question.text, (userAnswer) => {
            const isCorrect = this.evaluateAnswer(userAnswer);
            this.showAnswerFeedback(isCorrect, q);
        }, q.image, q.imageClass, q.question.options);
    }



    /**
     * Avalia a resposta do usuário para a pergunta atual.
     * @param {string} userAnswer - A resposta fornecida pelo usuário.
     * @returns {boolean} Retorna true se a resposta estiver correta, false caso contrário.
     */
    evaluateAnswer(userAnswer) {
        const q = this.questions[this.currentQuestionIndex];
        if (!q) return false;

        // Se for verdadeiro/falso
        if (!q.question.options) {
            return userAnswer.toLowerCase() === q.question.answer.toLowerCase(); //true ou false
        }
        // Se for múltipla escolha
        else {
            return userAnswer === q.question.answer; // true ou false
        }
    }

    
}
