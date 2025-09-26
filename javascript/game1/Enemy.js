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
}
