// javascript/config.js
// Centraliza todas as constantes e dados de configuração do jogo.

// Define os estados do jogador com suas propriedades
export const PLAYER_STATES = [
    { name: "liquido", src: "../assets/player1.gif", gravity: 2, canFly: false, canFall: false },
    { name: "vapor", src: "../assets/player2.gif", gravity: -2, canFly: true, canFall: false },
    { name: "nuvem", src: "../assets/player3.gif", gravity: -0.5, canFly: false, canFall: false },
    { name: "chuva", src: "../assets/player4.gif", gravity: 8, canFly: false, canFall: true },
];

// Define as imagens dos itens correspondentes a cada estado do jogador
export const ITEM_IMAGES = [
    "../assets/xp1.gif", // Item para coletar no estado "liquido"
    "../assets/xp3.gif", // Item para coletar no estado "vapor"
    "../assets/xp3.gif", // Item para coletar no estado "nuvem"
    "../assets/xp1.gif", // Item para coletar no estado "chuva"
];
