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
import { updateProgress, initMilestones } from '../common/ui.js';
import RewardsManager from './RewardsManager.js'; 
import Enemy from './Enemy.js';
import StatusEffect from './StatusEffect.js';
import PauseManager from './PauseManager.js';


export default class Game {

    //static INFO_INTERVAL = 10;      // Pontos para mostrar info
    //static QUESTION_OFFSET = 5;    // Pontos após info para mostrar questão

    

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
        this.status = null;

        this.score = 0;
        this.hasMoved = false;
        this.arrowKeysImage = document.getElementById('arrowKeysImage');

        this.hintTimeout = null;
        this.hintDelay = 10000; // 10 segundos

        this.gameLoop = this.gameLoop.bind(this);

        this.questions = [];
        this.currentQuestionIndex = 0;
        this.lastMilestone = 0;

        // ========== onde as infos e perguntas aparecem ==========
        this.milestones = [10, 15, 20, 25, 30, 35, 60, 70, 80, 90, 100];

        this.firstQuestions = this.questions.slice(0,4); // primeiras 4 sempre na ordem
        this.remainingQuestions = this.questions.slice(4); // restantes para sorteio
        this.pendingQuestions = []; // perguntas que a criança errou

        this.enemies = [];
        this.enemySpawnScore = 40;
        this.enemySpawnInterval = 5000; // em ms
        this.lastEnemySpawn = 0;

        this.invincible = false;
        this.invincibilityDuration = 5000; // 5s
        this.lastHitTime = 0;

        this.pauseManager = new PauseManager(this);
        
        // Listener para redimensionamento da janela
        window.addEventListener('resize', this.resize.bind(this));

        // Listener para teclas de atalho
        window.addEventListener('keydown', this.handlePanelKeys.bind(this));
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
        if (!this.status) this.status = new StatusEffect(this.player);

        this.audio.playMusic();

        this.resetHintTimer(); // inicia o temporizador do hint

        // Load questions.json and rewards.json (only once)
        await Promise.all([
            this.loadQuestions(),
            this.rewardsManager.loadRewards()
        ]);

        initMilestones(this.milestones, 100, this.questions); // max score 100

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

            this.questions.forEach(q => {
                q.infoShown = false;           
                q.answeredCorrectly = false;
            });

            this.firstQuestions = this.questions.slice(0, 4);
            this.remainingQuestions = this.questions.slice(4);

            this.firstQuestions.forEach(q => q.infoShown = false);
            this.remainingQuestions.forEach(q => q.infoShown = false);

        }
    }

    /**
     * Gets the next question in the sequence.
     */
    getNextQuestion() {
        // Perguntas erradas têm prioridade
        if (this.pendingQuestions.length > 0) {
            return this.pendingQuestions.shift();
        }

        // Primeiras 4 perguntas na ordem
        if (this.firstQuestions.length > 0) {
            return this.firstQuestions.shift();
        }

        // Perguntas restantes na ordem definida (sem aleatoriedade)
        if (this.remainingQuestions.length > 0) {
            return this.remainingQuestions.shift();
        }

        return null;
    }


    showNextQuestionWithInfo() {
        const q = this.getNextQuestion();
        if (!q) return;

        if (!q.infoShown) {
            q.infoShown = true;
            this.triggerInfoSequence(q, () => {
                this.triggerQuestionSequence(q);
            });
        } else {
            this.triggerQuestionSequence(q);
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
        this.handleInput();
        this.updateEntities();
        this.checkCollisions();
        this.checkFirstMove();
        this.spawnEnemy();
    }


    handleInput() {
        if (this.input.keys[' ']) {
            this.player.changeState();
            this.input.keys[' '] = false;
        }
    }

    updateEntities() {
        this.player.update(this.input.keys);

        if (this.enemies) {
            this.enemies.forEach(enemy => enemy.update());
        }
    }

    /**
     * Verifica todas as colisões (player com item, player com inimigos).
     */
    checkCollisions() {
        this.checkItemCollision();
        this.checkEnemyCollisions();
    }

    /**
     * Verifica colisão entre o jogador e o item e atualiza a pontuação.
     */
    checkItemCollision() {
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
            updateProgress(this.score)


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
     * Verifica se houve colisão com inimigos.
     */
    checkEnemyCollisions() {
    if (!this.enemies || this.invincible) return; // se invencível, ignora

        const playerRect = this.player.element.getBoundingClientRect();

        this.enemies.forEach(enemy => {
            const enemyRect = enemy.element.getBoundingClientRect();

            if (
                playerRect.left < enemyRect.right &&
                playerRect.right > enemyRect.left &&
                playerRect.top < enemyRect.bottom &&
                playerRect.bottom > enemyRect.top
            ) {
                this.onEnemyCollision(enemy);
            }
        });
    }


    /**
     * O que acontece quando o player encosta em um inimigo.
     */
    onEnemyCollision(enemy) {
        const now = Date.now();

        if (now - this.lastHitTime < this.invincibilityDuration) {
            return; // ainda invencível
        }

        this.lastHitTime = now;

        // aplica invencibilidade (piscar)
        this.status.apply(
            'invincible',
            this.invincibilityDuration,
            p => p.applyInvincibleEffect(),
            p => p.removeInvincibleEffect()
        );

        // aplica toxicidade (verde e lento, tem que durar mais tempo que invencibilidade)
        this.status.apply(
            'toxic',
            10000, // 10s
            p => p.applyToxicEffect(),
            p => p.removeToxicEffect()
        );

        // remover inimigo
        enemy.element.remove();
        this.enemies = this.enemies.filter(e => e !== enemy);
    }


    spawnEnemy() {
        if (this.score < 40) return;

        const now = Date.now();
        if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
            const enemy = new Enemy(this);
            this.enemies.push(enemy);
            this.lastEnemySpawn = now;
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
        if (!this.milestones.includes(this.score)) return;

        this.showNextQuestionWithInfo();
    }



    /**
     * Pauses the game and shows the informational panel.
     * @param {object} q - The current question/info data object.
     */
    triggerInfoSequence(q, callback) {
        this.paused = true;
        showInfoPanel(q.info, () => {
            this.paused = false;
            this.resetHintTimer();
            if (callback) callback(); // dispara a pergunta após fechar info
        }, q.image, q.imageClass);
    }


    /**
     * (Formerly _showAnswerFeedback) Orchestrates the entire feedback sequence.
     * @param {boolean} isCorrect - Whether the user's answer was correct.
     * @param {object} q - The full question object.
     */
    showAnswerFeedback(isCorrect, q) {
        this._playFeedbackSound(isCorrect);

        if (isCorrect) {
            q.answeredCorrectly = true; 
        } else {
            this.onWrongAnswer(q);      
        }

        const feedbackData = isCorrect ? q.feedback.correct : q.feedback.incorrect;

        const panelOptions = {
            isCorrect,
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
     *  This is where the actual effect of a chosen reward is handled.
     */
    applyReward(rewardId) {
        console.log(`Applying reward: ${rewardId}`);
        
        switch (rewardId) {
        case 'SPEED_UP_1':
            this.player.increaseSpeed(30); // Aumenta a velocidade em %
            break;

        default:
            console.warn(`Recompensa desconhecida: ${rewardId}`);
    }

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
            const isCorrect = this.evaluateAnswer(q, userAnswer);
            this.showAnswerFeedback(isCorrect, q);
        }, q.image, q.imageClass, q.question.options);
    }





    /**
     * Avalia a resposta do usuário para a pergunta atual.
     * @param {string} userAnswer - A resposta fornecida pelo usuário.
     * @returns {boolean} Retorna true se a resposta estiver correta, false caso contrário.
     */
    evaluateAnswer(question, userAnswer) {
        if (!question) return false;

        if (!question.question.options) { // Verdadeiro/Falso
            return userAnswer.toLowerCase() === question.question.answer.toLowerCase();
        } else { // Múltipla escolha
            return userAnswer === question.question.answer;
        }
    }



    /**
     * Handles keyboard input specifically for active UI panels.
     * This only runs when the game is paused.
     * @param {KeyboardEvent} event The keyboard event.
     */
    handlePanelKeys(event) {
        if (!this.paused) return; // Only work when the game is paused

        // Helper to find and click an element if it exists
        const click = (selector) => {
            const element = document.querySelector(selector);
            if (element) {
                event.preventDefault();
                element.click();
            }
        };

        switch (event.key) {
            case 'f':
            case 'F':
                click('#close-info'); // For the Info Panel
                click('#continue-btn'); // For the Feedback Panel (incorrect answer)
                break;
            case '1':
                click('#option1-btn'); // For Multiple Choice (Option 1)
                click('#false-btn');   // For True/False (False)
                break;
            case '2':
                click('#option2-btn'); // For Multiple Choice (Option 2)
                click('#true-btn');    // For True/False (True)
                break;
        }
    }



    /**
     * Handles a wrong answer scenario.
     */
    onWrongAnswer(question) {
        if (!question.answeredCorrectly) {
            question.infoShown = false; // vai mostrar info novamente
            this.pendingQuestions.push(question); // adiciona à fila

            //tira 5 pontos
            this.score = Math.max(0, this.score - 5);
            updateScore(this.score);
            updateProgress(this.score);
        }
    }



    
}
