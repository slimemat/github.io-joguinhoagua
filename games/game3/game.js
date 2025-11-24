const perguntasData = [
  { "id": 1, "pergunta": "O que acontece com a água da chuva depois que ela cai no chão?",
    "resposta": "Ela infiltra no solo ou escorre.", "imagem": "infiltracao.png"},
  { "id": 2, "pergunta": "Como as plantas participam do ciclo da água?",
    "resposta": "Elas liberam vapor de água pela transpiração.", "imagem": "planta.png" },
  { "id": 3, "pergunta": "Qual é o principal mineral que resta quando a água do mar evapora completamente?",
    "resposta": "O sal (NaCl)", "imagem": "sal.png" },
  { "id": 4, "pergunta": "O que acontece com o vapor de água quando a temperatura diminui?",
    "resposta": "O vapor esfria e forma as nuvens.", "imagem": "Nuvem_2.png" },
  { "id": 5, "pergunta": "Por que o ciclo da água nunca acaba?",
    "resposta": "Porque a água está sempre em movimento.", "imagem": "Nuvens_e_mar.png" },
  { "id": 6, "pergunta": "O que é o ciclo da água?",
    "resposta": "É o caminho contínuo da água na natureza.", "imagem": "Ciclo_da_agua.png"},
  { "id": 7, "pergunta": "Quem dá energia para o ciclo da água acontecer?",
    "resposta": "O Sol.", "imagem": "Sol.png" },
  { "id": 8, "pergunta": "O que é evaporação?",
    "resposta": "É quando a água líquida vira vapor.", "imagem": "Evaporacao.png" },
  { "id": 9, "pergunta": "O que é condensação?",
    "resposta": "É quando o vapor de água vira líquido.", "imagem": "Nuvem_1.png" },
  { "id": 10, "pergunta": "O que é precipitação?",
    "resposta": "É a água caindo das nuvens, como chuva.", "imagem": "Chuva.png" }
];

// REFERÊNCIAS DE ELEMENTOS (DOM)
const grid = document.querySelector(".grid");
const restartBtn = document.getElementById("restartBtn");
const sidebarPerguntas = document.getElementById("sidebar-perguntas");
const sidebarRespostas = document.getElementById("sidebar-respostas");

// ESTATÍSTICAS ATUAIS
const timerElement = document.getElementById("timer");
const flipCounterElement = document.getElementById("flip-counter");

// MELHORES ESTATÍSTICAS
const bestTimeElement = document.getElementById("best-time");
const bestFlipsElement = document.getElementById("best-flips");

// MODAL DE VITÓRIA
const winModal = document.getElementById("win-modal");
const modalTimeElement = document.getElementById("modal-time");
const modalFlipsElement = document.getElementById("modal-flips");
const modalBestRecordElement = document.getElementById("modal-best-record");
const modalRestartBtn = document.getElementById("modal-restart-btn");
const modalMapBtn = document.getElementById("modal-map-btn");

// MODAIS DE CONFIRMAÇÃO
const confirmMapModal = document.getElementById("confirm-map-modal");
const confirmRestartModal = document.getElementById("confirm-restart-modal");
const mapConfirmBtn = document.getElementById("map-confirm-btn");
const mapCancelBtn = document.getElementById("map-cancel-btn");
const restartConfirmBtn = document.getElementById("restart-confirm-btn");
const restartCancelBtn = document.getElementById("restart-cancel-btn");

// BOTÕES ORIGINAIS
const mapBtn = document.getElementById("mapBtn");
const restartOriginalBtn = document.getElementById("restartBtn"); 

// CONTROLE DE VOLUME
const volumeSlider = document.getElementById("volumeSlider");
const volumeIconContainer = document.getElementById("volumeIconContainer");

// REFERÊNCIAS DE ÁUDIO
const bgMusic = document.getElementById("bg-music");
const xpSound = document.getElementById("xp-sound");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const celebrationSound = document.getElementById("celebration-sound");
// Array para controlar todos os sons
const allSounds = [bgMusic, xpSound, correctSound, wrongSound, celebrationSound];


let firstCard = null;
let secondCard = null;
let isChecking = false;

// VARIÁVEIS DE JOGO
let flipCount = 0;
let seconds = 0;
let timerInterval = null;
let isTimerRunning = false;
let isMusicStarted = false;

// VARIÁVEIS DE VOLUME
let currentVolume = 0.5;
let isMuted = false;

// Cartas reveladas (para sidebar)
let revealedItems = { perguntas: new Set(), respostas: new Set() };

/* UTILITY */
function createElement(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

// CRIA OS SLOTS NA SIDEBAR
function createSidebarSlots() {
  sidebarPerguntas.innerHTML = "";
  sidebarRespostas.innerHTML = "";

  perguntasData.forEach(item => {
    const slotP = createElement('div', 'sidebar-slot');
    slotP.id = `pergunta-slot-${item.id}`;
    slotP.innerHTML = `<div class="slot-content"></div>`;
    sidebarPerguntas.appendChild(slotP);

    const slotR = createElement('div', 'sidebar-slot');
    slotR.id = `resposta-slot-${item.id}`;
    slotR.innerHTML = `<div class="slot-content"></div>`;
    sidebarRespostas.appendChild(slotR);
  });
}

// MOSTRA O TEXTO NA SIDEBAR QUANDO A CARTA É REVELADA
function showInSidebar(tipo, id, texto) {
  const slot = document.getElementById(`${tipo}-slot-${id}`);
  if (!slot) return;

  const content = slot.querySelector('.slot-content');
  content.innerText = texto;
  slot.classList.add('active');
}

// LIGA/DESLIGA O EFEITO DE BRILHO (GLOW)
function toggleGlow(card, shouldGlow) {
  if (!card) return;

  const id = card.dataset.id;
  const tipo = card.dataset.tipo;
  const slot = document.getElementById(`${tipo}-slot-${id}`);

  if (shouldGlow) {
    // Liga o brilho
    card.classList.remove("glow-fade");
    if (slot) slot.classList.remove("glow-fade");

    card.classList.add("glowing");
    if (slot) slot.classList.add("glowing");
  } 
  else {
    // Desliga o brilho
    card.classList.remove("glowing");
    if (slot) slot.classList.remove("glowing");

    // Adiciona efeito de fade
    card.classList.add("glow-fade");
    if (slot) slot.classList.add("glow-fade");

    // Limpa a classe de fade
    setTimeout(() => {
      card.classList.remove("glow-fade");
      if (slot) slot.classList.remove("glow-fade");
    }, 600);
  }
}


// CRIA UMA CARTA (PERGUNTA OU RESPOSTA)
function createCard(item, tipo) {
  const card = createElement("div", `card ${tipo}`);
  const inner = createElement("div", "card__inner");

  const front = createElement("div", "face front");
  if (tipo === "pergunta") {
    front.innerHTML = `<p>${item.pergunta}</p>`;
  } else {
    const imgHtml = item.imagem
      ? `<img src="../../assets/${item.imagem}" alt="${item.resposta}" />`
      : "";
    front.innerHTML = `<p>${item.resposta}</p>${imgHtml}`;
  }

  const back = createElement("div", "face back");
  back.innerHTML = `<p>?</p>`;

  inner.appendChild(front);
  inner.appendChild(back);
  card.appendChild(inner);

  card.dataset.id = item.id;
  card.dataset.tipo = tipo;
  card.isFlipped = false;
  card.isMatched = false;

  card.addEventListener("click", () => handleFlip(card));

  return card;
}

// LIDA COM O CLIQUE (VIROU A CARTA)
function handleFlip(card) {
  if (isChecking || card.isFlipped || card.isMatched) return;

  // INICIA A MÚSICA NO PRIMEIRO CLIQUE
  if (!isMusicStarted && bgMusic && !isMuted) {
    bgMusic.play().catch(() => { /* Tratar erro de autoplay se necessário */ }); 
    isMusicStarted = true;
  }

  // INICIA O TIMER NO PRIMEIRO CLIQUE
  if (!isTimerRunning) {
    startTimer();
    isTimerRunning = true;
  }

  flipCount++;
  flipCounterElement.textContent = flipCount;

  card.classList.add("reveal-card");
  card.isFlipped = true;

  const id = card.dataset.id;
  const tipo = card.dataset.tipo;

  // MOSTRA NA SIDEBAR E TOCA SOM DE XP
  if (tipo === 'pergunta') {
    if (!revealedItems.perguntas.has(id)) {
      revealedItems.perguntas.add(id);
      const texto = card.querySelector('.face.front p').innerText;
      showInSidebar('pergunta', id, texto);
      playSound(xpSound);
    } else {
      toggleGlow(card, true);
    }
  } else if (tipo === 'resposta') {
    if (!revealedItems.respostas.has(id)) {
      revealedItems.respostas.add(id);
      const texto = card.querySelector('.face.front p').innerText;
      showInSidebar('resposta', id, texto);
      playSound(xpSound);
    } else {
      toggleGlow(card, true);
    }
  }

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  isChecking = true;

  setTimeout(checkMatch, 400);
}

// VERIFICA SE AS CARTAS SÃO UM PAR
function checkMatch() {
  const match =
    firstCard.dataset.id === secondCard.dataset.id &&
    firstCard.dataset.tipo !== secondCard.dataset.tipo;

  if (match) {
    // ACERTOU
    playSound(correctSound);
    firstCard.isMatched = true;
    secondCard.isMatched = true;
    firstCard.classList.add("disabled-card");
    secondCard.classList.add("disabled-card");

    toggleGlow(firstCard, false);
    toggleGlow(secondCard, false);

    resetTurn();
    checkEndGame();
  } else {
    // ERROUUUUU
    playSound(wrongSound);
    setTimeout(() => {
  // Vira as cartas de volta
  firstCard.classList.remove("reveal-card");
  secondCard.classList.remove("reveal-card");
}, 600);

setTimeout(() => {
  // Remove o brilho depois de virar
  toggleGlow(firstCard, false);
  toggleGlow(secondCard, false);

  firstCard.isFlipped = false;
  secondCard.isFlipped = false;
  resetTurn();
}, 900);
  }
}

// FINALIZA O TURNO (LIMPA AS CARTAS SELECIONADAS)
function resetTurn() {
  if (firstCard) toggleGlow(firstCard, false);
  if (secondCard) toggleGlow(secondCard, false);

  [firstCard, secondCard] = [null, null];
  isChecking = false;
}

// VERIFICA O FIM DO JOGO
function checkEndGame() {
  const total = perguntasData.length * 2;
  const resolved = document.querySelectorAll(".card.disabled-card").length;

  if (resolved === total) {
    stopTimer();
    saveBestScores(seconds, flipCount);

    // Para música de fundo e toca celebração
    if(bgMusic) bgMusic.pause();
    playSound(celebrationSound);

    setTimeout(() => {
      showWinModal();
    }, 500);
  }
}

// INICIA O JOGO (CARREGA E EMBARALHA AS CARTAS)
function loadGame() {
  grid.innerHTML = "";
  revealedItems = { perguntas: new Set(), respostas: new Set() };
  createSidebarSlots();

  resetStats();
  loadBestScores();
  loadVolumePreference();

  // Esconde os modais
  winModal.classList.remove("visible");
  confirmMapModal.classList.remove("visible");
  confirmRestartModal.classList.remove("visible");

  // Reseta e tenta tocar música de fundo
  if (celebrationSound) {
    celebrationSound.pause();
    celebrationSound.currentTime = 0;
  }
  
  if (bgMusic) {
    bgMusic.currentTime = 0;
    if (!isMuted) {
      bgMusic.play().catch(() => { isMusicStarted = false; });
      isMusicStarted = true;
    } else {
      bgMusic.pause();
      isMusicStarted = false;
    }
  }

  const cards = [];

  perguntasData.forEach((p) => {
    cards.push(createCard(p, "pergunta"));
    cards.push(createCard(p, "resposta"));
  });

  cards.sort(() => Math.random() - 0.5).forEach((c) => grid.appendChild(c));
}

// FUNÇÕES DE STATS

// RESETA OS CONTADORES
function resetStats() {
  flipCount = 0;
  seconds = 0;
  isTimerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  timerElement.textContent = "00:00";
  flipCounterElement.textContent = "0";
}

// INICIA O TIMER
function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    seconds++;
    timerElement.textContent = formatTime(seconds);
  }, 1000);
}

// PARA O TIMER
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// FORMATA O TEMPO (MM:SS)
function formatTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === Infinity) return "--";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}`;
}

// FUNÇÕES DE ÁUDIO E VOLUME

// APLICA O VOLUME ATUAL A TODOS OS SONS
function setSoundVolumes() {
  const volumeToSet = isMuted ? 0 : currentVolume;

  allSounds.forEach(sound => {
    if (sound) {
      sound.volume = volumeToSet;
    }
  });

  updateVolumeIcon();
}

// TOCA UM SOM
function playSound(audio) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play();
}

// CARREGA A PREFERÊNCIA DE VOLUME (sessionStorage)
function loadVolumePreference() {
  const savedVolume = parseFloat(sessionStorage.getItem('gameVolume'));
  currentVolume = isNaN(savedVolume) ? 0.5 : savedVolume;

  isMuted = sessionStorage.getItem('isMuted') === 'true';
  
  if (volumeSlider) {
      volumeSlider.value = currentVolume;
  }
  setSoundVolumes();
}

// LIDA COM A MUDANÇA NO SLIDER
function handleVolumeChange(event) {
  currentVolume = parseFloat(event.target.value);
  sessionStorage.setItem('gameVolume', currentVolume);

  if (currentVolume === 0) {
    isMuted = true;
    sessionStorage.setItem('isMuted', 'true');
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
    }
  } else {
    isMuted = false;
    sessionStorage.setItem('isMuted', 'false');
    if (bgMusic && bgMusic.paused) {
        bgMusic.play().catch(() => {});
        isMusicStarted = true;
    }
  }

  setSoundVolumes();
}

// ATUALIZA O ÍCONE DE VOLUME
function updateVolumeIcon() {
  volumeIconContainer.innerHTML = '';
  
  let iconHtml = '';
  
  if (isMuted || currentVolume === 0) {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="1" x2="1" y2="23"></line>
                </svg>`;
  } else if (currentVolume > 0.5) {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>`;
  } else {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>`;
  }

  volumeIconContainer.innerHTML = iconHtml;
}


// FUNÇÕES DE RECORDE (sessionStorage)

// CARREGA E EXIBE OS MELHORES PLACARES
function loadBestScores() {
  const bestTime = parseInt(sessionStorage.getItem('bestGameTime')) || null;
  const bestFlips = parseInt(sessionStorage.getItem('bestGameFlips')) || null;

  bestTimeElement.textContent = formatTime(bestTime);
  bestFlipsElement.textContent = bestFlips || "--";
}

// SALVA OS NOVOS MELHORES PLACARES
function saveBestScores(currentTime, currentFlips) {
  const bestTime = parseInt(sessionStorage.getItem('bestGameTime')) || Infinity;
  const bestFlips = parseInt(sessionStorage.getItem('bestGameFlips')) || Infinity;

  if (currentTime < bestTime) {
    sessionStorage.setItem('bestGameTime', currentTime);
  }

  if (currentFlips < bestFlips) {
    sessionStorage.setItem('bestGameFlips', currentFlips);
  }
}

// FUNÇÕES DOS MODAIS

// MOSTRA O MODAL DE VITÓRIA
function showWinModal() {
  const bestTime = parseInt(sessionStorage.getItem('bestGameTime')) || null;
  const bestFlips = parseInt(sessionStorage.getItem('bestGameFlips')) || null;

  modalTimeElement.textContent = formatTime(seconds);
  modalFlipsElement.textContent = flipCount;

  if (bestTime && bestFlips) {
    modalBestRecordElement.textContent = `${formatTime(bestTime)} com ${bestFlips} revelações`;
  } else {
    modalBestRecordElement.textContent = "Ainda não há recordes";
  }

  winModal.classList.add("visible");
}

// ABRE O MODAL DE CONFIRMAÇÃO (MAPA)
function openConfirmMapModal() {
  confirmMapModal.classList.add("visible");
}

// ABRE O MODAL DE CONFIRMAÇÃO (REINICIAR)
function openConfirmRestartModal() {
  confirmRestartModal.classList.add("visible");
}

// FECHA TODOS OS MODAIS DE CONFIRMAÇÃO
function closeConfirmModals() {
    confirmMapModal.classList.remove("visible");
    confirmRestartModal.classList.remove("visible");
}

// AÇÃO: IR PARA O MAPA
function goToMap() {
    stopTimer();
    if(bgMusic) bgMusic.pause();
    window.location.href = "../../map/index.html";
}

// AÇÃO: REINICIAR O JOGO
function restartGame() {
    resetTurn();
    loadGame();
}


// LISTENERS DE EVENTOS

// Botão de reiniciar -> Abre o modal
restartOriginalBtn.addEventListener("click", openConfirmRestartModal);

// Botão de mapa -> Abre o modal
mapBtn.addEventListener("click", openConfirmMapModal);

// Slider de Volume
volumeSlider.addEventListener("input", handleVolumeChange);

// Clique no ÍCONE para mutar/desmutar
volumeIconContainer.addEventListener("click", () => {
    if (isMuted) {
        // Desmuta
        isMuted = false;
        sessionStorage.setItem('isMuted', 'false');
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch(() => {});
            isMusicStarted = true;
        }
    } else {
        // Muta
        isMuted = true;
        sessionStorage.setItem('isMuted', 'true');
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
        }
    }
    setSoundVolumes();
    volumeSlider.value = isMuted ? 0 : currentVolume;
});

// Modal de Reiniciar: Confirmar
restartConfirmBtn.addEventListener("click", () => {
    closeConfirmModals();
    restartGame();
});

// Modal de Reiniciar: Cancelar
restartCancelBtn.addEventListener("click", closeConfirmModals);

// Modal de Mapa: Confirmar
mapConfirmBtn.addEventListener("click", () => {
    closeConfirmModals();
    goToMap();
});

// Modal de Mapa: Cancelar
mapCancelBtn.addEventListener("click", closeConfirmModals);


// Modal de Vitória
modalRestartBtn.addEventListener("click", () => {
  loadGame();
});

modalMapBtn.addEventListener("click", () => {
  goToMap();
});

/* DEBUG BUTTON
debugWinBtn.addEventListener("click", () => {
  if (!isTimerRunning) {
    startTimer();
  }

  document.querySelectorAll('.card:not(.disabled-card)').forEach(card => {
    card.classList.add("reveal-card", "disabled-card");
    card.isMatched = true;
  });

  checkEndGame();
});
*/

// INICIA O JOGO
loadGame();