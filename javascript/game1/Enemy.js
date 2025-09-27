// javascript/enemy.js
export default class Enemy {
    constructor(game) {
        this.game = game;
        this.size = 70; 
        this.speed = 1 + Math.random();

        // Cria o elemento visual
        this.element = document.createElement('img');
        this.element.src = '../../assets/enemy.gif'; 
        this.element.classList.add('enemy');
        this.element.style.position = 'absolute';
        this.element.style.width = this.size + 'px';
        this.element.style.height = this.size + 'px';

        game.canvas.parentElement.appendChild(this.element);

        // Define posição inicial e direção
        this.spawnFromEdge();
    }

    spawnFromEdge() {
        const edge = Math.floor(Math.random() * 4); // 0=left,1=right,2=top,3=bottom
        const w = this.game.width;
        const h = this.game.height;

        switch (edge) {
            case 0: // left
                this.x = -this.size;
                this.y = Math.random() * h;
                this.vx = this.speed;
                this.vy = 0;
                break;
            case 1: // right
                this.x = w + this.size;
                this.y = Math.random() * h;
                this.vx = -this.speed;
                this.vy = 0;
                break;
            case 2: // top
                this.x = Math.random() * w;
                this.y = -this.size;
                this.vx = 0;
                this.vy = this.speed;
                break;
            case 3: // bottom
                this.x = Math.random() * w;
                this.y = h + this.size;
                this.vx = 0;
                this.vy = -this.speed;
                break;
        }
        this.updatePosition();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.updatePosition();
    }

    updatePosition() {
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }

    isOffScreen() {
        return (
            this.x < -this.size * 2 ||
            this.x > this.game.width + this.size * 2 ||
            this.y < -this.size * 2 ||
            this.y > this.game.height + this.size * 2
        );
    }

    destroy() {
        this.element.remove();
    }

    /**
     * Aplica um "boost" no inimigo para a fase final do jogo.
     * Aumenta aleatoriamente a velocidade e o tamanho do inimigo, mantendo a direção atual.
     * Esse método é chamado normalmente quando a pontuação do jogador atinge o fim de fase.
     *
     * @param {number} [chance=0.5] - Probabilidade (0 a 1) de aplicar o boost neste inimigo.
     *                                Por exemplo, 0.5 significa 50% de chance.
     * @param {number} [maxSpeed=3] - Valor máximo de velocidade que o inimigo pode atingir com o boost.
     *                                A velocidade mínima é 1.
     * @param {number} [maxSize=100] - Tamanho máximo em pixels que o inimigo pode atingir com o boost.
     *                                 O tamanho padrão sem boost é 70px.
     *
     * @example
     * // Aplica boost com 70% de chance, velocidade máxima 5 e tamanho máximo 120px
     * enemy.endGameBoost(0.7, 5, 120);
     */
    endGameBoost(chance = 0.5, maxSpeed = 3, maxSize = 100) {
        if (Math.random() < chance) {
            this.speed = 1 + Math.random() * (maxSpeed - 1); // nova speed
            this.size = 70 + Math.random() * (maxSize - 70); // novo size
            this.element.style.width = this.size + 'px';
            this.element.style.height = this.size + 'px';

            // recalcula vx/vy mantendo direção
            const norm = Math.sqrt(this.vx**2 + this.vy**2) || 1;
            this.vx = (this.vx / norm) * this.speed;
            this.vy = (this.vy / norm) * this.speed;
        }
    }
}
