const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const metaEl = document.getElementById("meta");
const restartBtn = document.getElementById("restart");

const PLAYER_PITS = [0, 1, 2, 3, 4, 5];
const AI_PITS = [7, 8, 9, 10, 11, 12];
const PLAYER_STORE = 6;
const AI_STORE = 13;

let state = null;
let currentPlayer = "player";
let gameOver = false;
let isAnimating = false;

const ANIM_STEP_MS = 500;
const AI_THINK_MS = 500;
const AI_EXTRA_WAIT_MS = 1000;

function initialState() {
  return Array(14).fill(4).map((val, idx) => {
    if (idx === PLAYER_STORE || idx === AI_STORE) return 0;
    return val;
  });
}

function isSideEmpty(side) {
  const pits = side === "player" ? PLAYER_PITS : AI_PITS;
  return pits.every((idx) => state[idx] === 0);
}

function collectRemainingSeeds() {
  const playerLeft = PLAYER_PITS.reduce((sum, idx) => sum + state[idx], 0);
  const aiLeft = AI_PITS.reduce((sum, idx) => sum + state[idx], 0);
  PLAYER_PITS.forEach((idx) => (state[idx] = 0));
  AI_PITS.forEach((idx) => (state[idx] = 0));
  state[PLAYER_STORE] += playerLeft;
  state[AI_STORE] += aiLeft;
}

function applyMove(moveIndex, player) {
  const isPlayer = player === "player";
  const ownStore = isPlayer ? PLAYER_STORE : AI_STORE;
  const oppStore = isPlayer ? AI_STORE : PLAYER_STORE;
  const ownPits = isPlayer ? PLAYER_PITS : AI_PITS;

  let seeds = state[moveIndex];
  state[moveIndex] = 0;
  let idx = moveIndex;
  while (seeds > 0) {
    idx = (idx + 1) % 14;
    if (idx === oppStore) continue;
    state[idx] += 1;
    seeds -= 1;
  }

  let extraTurn = idx === ownStore;
  let captured = 0;

  if (!extraTurn && ownPits.includes(idx) && state[idx] === 1) {
    const opposite = 12 - idx;
    if (state[opposite] > 0) {
      captured = state[opposite] + 1;
      state[ownStore] += captured;
      state[idx] = 0;
      state[opposite] = 0;
    }
  }

  return { extraTurn, captured };
}

function simulateMove(moveIndex, player, snapshot) {
  const saved = snapshot.slice();
  const current = snapshot.slice();
  const isPlayer = player === "player";
  const ownStore = isPlayer ? PLAYER_STORE : AI_STORE;
  const oppStore = isPlayer ? AI_STORE : PLAYER_STORE;
  const ownPits = isPlayer ? PLAYER_PITS : AI_PITS;

  let seeds = current[moveIndex];
  current[moveIndex] = 0;
  let idx = moveIndex;
  while (seeds > 0) {
    idx = (idx + 1) % 14;
    if (idx === oppStore) continue;
    current[idx] += 1;
    seeds -= 1;
  }

  let extraTurn = idx === ownStore;
  let captured = 0;
  if (!extraTurn && ownPits.includes(idx) && current[idx] === 1) {
    const opposite = 12 - idx;
    if (current[opposite] > 0) {
      captured = current[opposite] + 1;
      current[ownStore] += captured;
      current[idx] = 0;
      current[opposite] = 0;
    }
  }

  const playerSideEmpty = PLAYER_PITS.every((pit) => current[pit] === 0);
  const aiSideEmpty = AI_PITS.every((pit) => current[pit] === 0);
  if (playerSideEmpty || aiSideEmpty) {
    const playerLeft = PLAYER_PITS.reduce((sum, pit) => sum + current[pit], 0);
    const aiLeft = AI_PITS.reduce((sum, pit) => sum + current[pit], 0);
    PLAYER_PITS.forEach((pit) => (current[pit] = 0));
    AI_PITS.forEach((pit) => (current[pit] = 0));
    current[PLAYER_STORE] += playerLeft;
    current[AI_STORE] += aiLeft;
  }

  return {
    next: current,
    extraTurn,
    captured,
    storeGain: current[ownStore] - saved[ownStore],
    ended: playerSideEmpty || aiSideEmpty,
  };
}

function aiChooseMove() {
  const snapshot = state.slice();
  let bestScore = -Infinity;
  let bestMoves = [];

  AI_PITS.forEach((pit) => {
    if (snapshot[pit] === 0) return;
    const result = simulateMove(pit, "ai", snapshot);
    const mobility = result.next.filter((_, idx) => AI_PITS.includes(idx) && result.next[idx] > 0).length;
    const score =
      result.storeGain * 3 +
      (result.captured > 0 ? result.captured : 0) +
      (result.extraTurn ? 2.5 : 0) +
      (result.ended ? 1.5 : 0) +
      mobility * 0.2;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [pit];
    } else if (score === bestScore) {
      bestMoves.push(pit);
    }
  });

  const pick = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  return pick ?? AI_PITS.find((pit) => snapshot[pit] > 0);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setMeta(text) {
  metaEl.textContent = text;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getCellEl(index) {
  return boardEl.querySelector(`[data-index="${index}"]`);
}

function setCellCount(index, value) {
  const el = getCellEl(index);
  if (!el) return;
  const countEl = el.querySelector(".count");
  if (countEl) countEl.textContent = value;
}

function setPlayerPitDisabled(disabled) {
  boardEl.querySelectorAll(".pit.player").forEach((el) => {
    el.setAttribute("aria-disabled", disabled ? "true" : "false");
  });
}

async function flashCell(index, className, duration = ANIM_STEP_MS) {
  const el = getCellEl(index);
  if (!el) {
    await sleep(duration);
    return;
  }
  el.classList.add(className);
  await sleep(duration);
  el.classList.remove(className);
}

async function applyMoveAnimated(moveIndex, player) {
  const isPlayer = player === "player";
  const ownStore = isPlayer ? PLAYER_STORE : AI_STORE;
  const oppStore = isPlayer ? AI_STORE : PLAYER_STORE;
  const ownPits = isPlayer ? PLAYER_PITS : AI_PITS;

  let seeds = state[moveIndex];
  state[moveIndex] = 0;
  setCellCount(moveIndex, 0);
  await flashCell(moveIndex, "flash-empty");

  let idx = moveIndex;
  while (seeds > 0) {
    idx = (idx + 1) % 14;
    if (idx === oppStore) continue;
    state[idx] += 1;
    setCellCount(idx, state[idx]);
    await flashCell(idx, "flash-add");
    seeds -= 1;
  }

  let extraTurn = idx === ownStore;
  let captured = 0;

  if (!extraTurn && ownPits.includes(idx) && state[idx] === 1) {
    const opposite = 12 - idx;
    if (state[opposite] > 0) {
      captured = state[opposite] + 1;
      state[ownStore] += captured;
      state[idx] = 0;
      state[opposite] = 0;
      setCellCount(idx, 0);
      setCellCount(opposite, 0);
      await Promise.all([
        flashCell(idx, "flash-empty"),
        flashCell(opposite, "flash-empty"),
      ]);
      setCellCount(ownStore, state[ownStore]);
      await flashCell(ownStore, "flash-add");
    }
  }

  return { extraTurn, captured };
}

function renderBoard() {
  boardEl.innerHTML = "";

  const aiStore = document.createElement("div");
  aiStore.className = "store store-left";
  aiStore.dataset.index = AI_STORE;
  aiStore.innerHTML = `<div class="store-label">Touchatoutix</div><span class="count">${state[AI_STORE]}</span>`;

  const playerStore = document.createElement("div");
  playerStore.className = "store store-right";
  playerStore.dataset.index = PLAYER_STORE;
  playerStore.innerHTML = `<div class="store-label">Moi</div><span class="count">${state[PLAYER_STORE]}</span>`;

  const topRow = document.createElement("div");
  topRow.className = "row row-ai";
  AI_PITS.slice().reverse().forEach((pit, idx) => {
    const pitEl = document.createElement("button");
    pitEl.className = "pit ai";
    pitEl.type = "button";
    pitEl.style.animationDelay = `${idx * 0.06}s`;
    pitEl.setAttribute("aria-disabled", "true");
    pitEl.dataset.index = pit;
    pitEl.innerHTML = `<span class="count">${state[pit]}</span>`;
    topRow.appendChild(pitEl);
  });

  const bottomRow = document.createElement("div");
  bottomRow.className = "row row-player";
  PLAYER_PITS.forEach((pit, idx) => {
    const pitEl = document.createElement("button");
    pitEl.className = "pit player";
    pitEl.type = "button";
    pitEl.style.animationDelay = `${(idx + 6) * 0.06}s`;
    pitEl.innerHTML = `<span class="count">${state[pit]}</span>`;
    pitEl.dataset.index = pit;
    const disabled =
      gameOver || currentPlayer !== "player" || state[pit] === 0 || isAnimating;
    pitEl.setAttribute("aria-disabled", disabled ? "true" : "false");
    pitEl.addEventListener("click", onPlayerMove);
    bottomRow.appendChild(pitEl);
  });

  boardEl.appendChild(aiStore);
  boardEl.appendChild(topRow);
  boardEl.appendChild(playerStore);
  boardEl.appendChild(bottomRow);
}

function onPlayerMove(event) {
  const pitIndex = Number(event.currentTarget.dataset.index);
  if (currentPlayer !== "player" || gameOver || isAnimating || state[pitIndex] === 0) {
    return;
  }
  playPlayerMove(pitIndex);
}

function checkGameOver() {
  if (!isSideEmpty("player") && !isSideEmpty("ai")) return false;
  collectRemainingSeeds();
  gameOver = true;
  const playerScore = state[PLAYER_STORE];
  const aiScore = state[AI_STORE];
  if (playerScore > aiScore) {
    setStatus(`Partie terminée. Tu gagnes ${playerScore} à ${aiScore} !`);
  } else if (aiScore > playerScore) {
      setStatus(`Partie terminée. Touchatoutix gagne ${aiScore} à ${playerScore}.`);
  } else {
    setStatus(`Partie terminée. Égalité ${playerScore} – ${aiScore}.`);
  }
  setMeta("Clique sur Relancer pour rejouer.");
  renderBoard();
  return true;
}

async function playPlayerMove(pitIndex) {
  isAnimating = true;
  setPlayerPitDisabled(true);
  setStatus("Tu joues...");
  setMeta("Placement des graines en cours.");
  const { extraTurn } = await applyMoveAnimated(pitIndex, "player");
  isAnimating = false;
  currentPlayer = extraTurn ? "player" : "ai";
  renderBoard();
  if (checkGameOver()) return;
  if (currentPlayer === "player") {
    setStatus("Tour bonus ! À toi de rejouer.");
    setMeta("Vise une capture pour creuser l’écart.");
    setPlayerPitDisabled(false);
  } else {
    await playAiMove();
  }
}

async function playAiMove() {
  setPlayerPitDisabled(true);
    setStatus("Touchatoutix réfléchit...");
    setMeta("Touchatoutix: bonus capture, bonus tour gratuit, gain magasin.");
  await sleep(AI_THINK_MS);
  isAnimating = true;
  const move = aiChooseMove();
  const { extraTurn } = await applyMoveAnimated(move, "ai");
  isAnimating = false;
  currentPlayer = extraTurn ? "ai" : "player";
  renderBoard();
  if (checkGameOver()) return;
  if (currentPlayer === "ai") {
    setStatus("Touchatoutix rejoue...");
    setMeta("Touchatoutix a gagné un tour bonus.");
    await sleep(AI_EXTRA_WAIT_MS);
    await playAiMove();
  } else {
    setStatus("À toi de jouer.");
    setMeta("Astuce: vise les tours gratuits et les captures.");
    setPlayerPitDisabled(false);
  }
}

function resetGame() {
  state = initialState();
  currentPlayer = "player";
  gameOver = false;
  isAnimating = false;
  setStatus("À toi de jouer.");
  setMeta("Touchatoutix heuristique moyenne (rapide, pas nulle).");
  renderBoard();
}

restartBtn.addEventListener("click", resetGame);
resetGame();
