const BLOCK_SIZE = 30;

// Piece class: Handles piece logic and drawing
class Piece {
  static definitions = {
    I: { shapes: [[[1, 1, 1, 1]], [[1], [1], [1], [1]]], color: "#00f0f0" },
    O: { shapes: [[[1, 1], [1, 1]]], color: "#f0f000" },
    T: { shapes: [[[0, 1, 0], [1, 1, 1]], [[1, 0], [1, 1], [1, 0]], [[1, 1, 1], [0, 1, 0]], [[0, 1], [1, 1], [0, 1]]], color: "#a000f0" },
    S: { shapes: [[[0, 1, 1], [1, 1, 0]], [[1, 0], [1, 1], [0, 1]]], color: "#00f000" },
    Z: { shapes: [[[1, 1, 0], [0, 1, 1]], [[0, 1], [1, 1], [1, 0]]], color: "#f00000" },
    J: { shapes: [[[1, 0, 0], [1, 1, 1]], [[1, 1], [1, 0], [1, 0]], [[1, 1, 1], [0, 0, 1]], [[0, 1], [0, 1], [1, 1]]], color: "#0000f0" },
    L: { shapes: [[[0, 0, 1], [1, 1, 1]], [[1, 0], [1, 0], [1, 1]], [[1, 1, 1], [1, 0, 0]], [[1, 1], [0, 1], [0, 1]]], color: "#f0a000" }
  };

  static isValidPosition(shape, x, y, boardWidth, boardHeight, board) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;
          if (
            newX < 0 ||
            newX >= boardWidth ||
            newY >= boardHeight ||
            (newY >= 0 && board[newY][newX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  constructor(type, x, y, rotation = 0) {
    const def = Piece.definitions[type];
    this.type = type;
    this.shapes = def.shapes;
    this.color = def.color;
    this.rotation = rotation;
    this.shape = this.shapes[rotation];
    this.x = x;
    this.y = y;
  }

  move(dx, dy, board, boardWidth, boardHeight) {
    const newX = this.x + dx;
    const newY = this.y + dy;
    if (Piece.isValidPosition(this.shape, newX, newY, boardWidth, boardHeight, board)) {
      this.x = newX;
      this.y = newY;
      return true;
    }
    return false;
  }

  rotate(boardWidth, boardHeight, board) {
    const nextRotation = (this.rotation + 1) % this.shapes.length;
    const rotatedShape = this.shapes[nextRotation];
    if (Piece.isValidPosition(rotatedShape, this.x, this.y, boardWidth, boardHeight, board)) {
      this.rotation = nextRotation;
      this.shape = rotatedShape;
    }
  }

  clone() {
    return new Piece(this.type, this.x, this.y, this.rotation);
  }

  resetPosition(boardWidth) {
    this.x = Math.floor(boardWidth / 2) - 1;
    this.y = 0;
    this.rotation = 0;
    this.shape = this.shapes[0];
  }

  draw(canvas, blockSize = BLOCK_SIZE, centered = false, strokeColor) {
    const ctx = canvas.getContext("2d");
    let offsetX = 0, offsetY = 0;
    if (centered) {
      offsetX = (canvas.width - this.shape[0].length * blockSize) / 2;
      offsetY = (canvas.height - this.shape.length * blockSize) / 2;
    } else {
      offsetX = this.x * blockSize;
      offsetY = this.y * blockSize;
    }
    ctx.fillStyle = this.color;
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col]) {
          const x = offsetX + col * blockSize;
          const y = offsetY + row * blockSize;
          ctx.fillRect(x, y, blockSize, blockSize);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, blockSize, blockSize);
        }
      }
    }
  }
}

// TetrisGame class: Handles game logic
class TetrisGame {
  static BOARD_WIDTH = 10;
  static BOARD_HEIGHT = 20;
  static INITIAL_DROP_INTERVAL = 1000;
  static CLEAR_DELAY_MS = 1000;

  constructor(boardWidth = TetrisGame.BOARD_WIDTH, boardHeight = TetrisGame.BOARD_HEIGHT) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = TetrisGame.INITIAL_DROP_INTERVAL;
    this.gameRunning = false;
    this.gamePaused = false;
    this.gameOver = false;
    this.dropTime = Date.now();
    this.isClearing = false;
  }

  #initBoard() {
    this.board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
  }

  #generatePiece() {
    const pieceTypes = Object.keys(Piece.definitions);
    const pieceType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    const piece = new Piece(pieceType, Math.floor(this.boardWidth / 2) - 1, 0, 0);
    return piece;
  }

  #calculateScore(linesCleared) {
    const baseScore = [0, 40, 100, 300, 1200];
    return baseScore[linesCleared] * this.level;
  }

  #handleGameOver() {
    this.gameRunning = false;
    this.gameOver = true;
  }

  #clearLines() {
    let linesCleared = 0;
    const full = [];
    for (let row = this.boardHeight - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        full.push(row);
      }
    }
    if (full.length > 0) {
      // After ~1s, apply removal + scoring, then continue
      setTimeout(() => {
        // Remove rows bottom-up while accounting for index shifts
        const rows = [...clearingRows].sort((a,b) => a - b);
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] - i;
          this.board.splice(row, 1);
          this.board.unshift(Array(this.boardWidth).fill(0));
        }
        this.lines += linesCleared;
        this.score += this.#calculateScore(linesCleared);
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropInterval = Math.max(50, TetrisGame.INITIAL_DROP_INTERVAL - (this.level - 1) * 50);
      }, TetrisGame.CLEAR_DELAY_MS);


    }
  }

/*//working without any 
  #clearLines() {
    let linesCleared = 0;
    for (let row = this.boardHeight - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        this.board.splice(row, 1);
        this.board.unshift(Array(this.boardWidth).fill(0));
        linesCleared++;
        row++; // Check the same row again
      }
    }
    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += this.#calculateScore(linesCleared);
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(50, TetrisGame.INITIAL_DROP_INTERVAL - (this.level - 1) * 50);
    }
  }


  #clearLines() {
    // If we're already glowing rows, do nothing here (timer will finish)
    if (this.isClearing) return;

    // Detect full rows (same test as your current loop)
    const full = [];
    for (let row = this.boardHeight - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        full.push(row);
      }
    }

    // No full rows
    if (full.length > 0) {
      // Start highlight phase
      this.isClearing = true;
      let clearingRows = full;

      // After ~1s, apply removal + scoring, then continue
      setTimeout(() => {
        // Remove rows bottom-up while accounting for index shifts
        let linesCleared = 0;
        const rows = [...clearingRows].sort((a,b) => a - b);
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] - i;
          this.board.splice(row, 1);
          this.board.unshift(Array(this.boardWidth).fill(0));
          linesCleared++;
        }

        // Your existing scoring/level logic:
        if (linesCleared > 0) {
          this.lines += linesCleared;
          this.score += this.#calculateScore(linesCleared);
          this.level = Math.floor(this.lines / 10) + 1;
          this.dropInterval = Math.max(50, TetrisGame.INITIAL_DROP_INTERVAL - (this.level - 1) * 50);
        }

        // Reset highlight state
        this.isClearing = false;
        clearingRows = [];
      }, TetrisGame.CLEAR_DELAY_MS);
    }
  }
*/
  startGame() {
    this.#initBoard();
    this.currentPiece = this.#generatePiece();
    this.nextPiece = this.#generatePiece();
    this.holdPiece = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = TetrisGame.INITIAL_DROP_INTERVAL;
    this.gameRunning = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.dropTime = Date.now();
  }

  moveCurrentPiece(dx, dy) {
    if (this.isClearing) return false;    // block gravity/moves during glow
    if (this.currentPiece) {
      return this.currentPiece.move(dx, dy, this.board, this.boardWidth, this.boardHeight);
    }
    return false;
  }

  rotateCurrentPiece() {
    if (this.isClearing) return;         // block rotation during glow
    if (this.currentPiece) {
      this.currentPiece.rotate(this.boardWidth, this.boardHeight, this.board);
    }
  }

  placePiece() {
    if (!this.currentPiece) return;
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const x = this.currentPiece.x + col;
          const y = this.currentPiece.y + row;
          if (y >= 0) {
            this.board[y][x] = this.currentPiece.type;
          }
        }
      }
    }
    this.#clearLines();
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.#generatePiece();
    this.canHold = true;
    // Game over check
    if (!Piece.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y, this.boardWidth, this.boardHeight, this.board)) {
      this.#handleGameOver();
    }
  }

  hardDrop() {
    if (this.currentPiece)  {
      while (this.currentPiece.move(0, 1, this.board, this.boardWidth, this.boardHeight)) {
        // Keep dropping until it can't move down
      }
    }
    this.placePiece();
  }

  holdCurrentPiece() {
    if (!this.canHold || !this.currentPiece) return;
    let swapPiece;
    if (!this.holdPiece) {
      swapPiece = this.nextPiece;
      this.holdPiece = this.currentPiece.clone();
      this.nextPiece = this.#generatePiece();
    } else {
      swapPiece = this.holdPiece.clone();
      this.holdPiece = this.currentPiece.clone();
    }
    this.holdPiece.resetPosition(this.boardWidth);
    this.currentPiece = swapPiece;
    this.currentPiece.resetPosition(this.boardWidth);
    this.canHold = false;
  }

  pauseGame() {
    this.gamePaused = true;
  }

  resumeGame() {
    this.gamePaused = false;
  }
}

// TetrisRenderer class: Handles all drawing and overlays
class TetrisRenderer {
  static DEFAULT_TITLE = "TETRIS";
  static DEFAULT_MESSAGE = "Press SPACE to start";
  static CLEAR_COLOR = "#000";
  static STROKE_COLOR = "#fff";


  constructor(gameCanvas, nextCanvas, holdCanvas, blockSize = BLOCK_SIZE) {
    this.gameCanvas = gameCanvas;
    this.nextCanvas = nextCanvas;
    this.holdCanvas = holdCanvas;
    this.gameCtx = gameCanvas.getContext("2d");
    this.nextCtx = nextCanvas.getContext("2d");
    this.holdCtx = holdCanvas.getContext("2d");
    this.blockSize = blockSize;
  }

  #clearCtx(ctx) {
    ctx.fillStyle = TetrisRenderer.CLEAR_COLOR;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  #drawPiece(piece, canvas, blockSize, centered = false) {
    piece.draw(canvas, blockSize, centered, TetrisRenderer.STROKE_COLOR);
  }

  #drawNext(piece) {
    this.#clearCtx(this.nextCtx);
    if (piece) {
      this.#drawPiece(piece, this.nextCanvas, BLOCK_SIZE/2, true);
    }
  }

  #drawHold(piece) {
    this.#clearCtx(this.holdCtx);
    if (piece) {
      this.#drawPiece(piece, this.holdCanvas, BLOCK_SIZE/2, true);
    }
  }

  render(game) {
    this.#clearCtx(this.gameCtx);
    for (let row = 0; row < game.board.length; row++) {
      for (let col = 0; col < game.board[row].length; col++) {
        const cell = game.board[row][col];
        if (cell) {
          this.gameCtx.fillStyle = Piece.definitions[cell].color;
          this.gameCtx.fillRect(
            col * this.blockSize,
            row * this.blockSize,
            this.blockSize,
            this.blockSize
          );
          this.gameCtx.strokeStyle = TetrisRenderer.STROKE_COLOR;
          this.gameCtx.lineWidth = 1;
          this.gameCtx.strokeRect(
            col * this.blockSize,
            row * this.blockSize,
            this.blockSize,
            this.blockSize
          );
        }
      }
    }
    if (game.currentPiece) {
      this.#drawPiece(game.currentPiece, this.gameCanvas, this.blockSize, false);
    }
    this.#drawNext(game.nextPiece);
    this.#drawHold(game.holdPiece);
    // Update score, lines, level
    document.getElementById("score").textContent = game.score;
    document.getElementById("lines").textContent = game.lines;
    document.getElementById("level").textContent = game.level;
  }

  showOverlay(title = TetrisRenderer.DEFAULT_TITLE, message = TetrisRenderer.DEFAULT_MESSAGE) {
    const overlay = document.getElementById("game-overlay");
    const titleEl = document.getElementById("overlay-title");
    const messageEl = document.getElementById("overlay-message");
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.innerHTML = message;
    if (overlay) overlay.classList.remove("hidden");
  }

  hideOverlay() {
    const overlay = document.getElementById("game-overlay");
    if (overlay) overlay.classList.add("hidden");
  }

  renderHighScores(highScores) {
    const container = document.getElementById("high-scores");
    container.innerHTML = highScores.map((s, i) => `<p>${i + 1}. ${s.score}</p>`).join("");
  }
}

// Handles user input (keyboard events), manages game state (start, pause, resume, game over),
// and coordinates updates between the TetrisGame logic and the TetrisRenderer display.
class TetrisController {
  static GAME_OVER = "GAME OVER";
  static PAUSED = "PAUSED";
  static PAUSED_MSG = "Press P to resume";
  static HIGH_SCORES = 3;


  static getGameOverMsg(score) {
    return `Final Score: ${score}<br>Press SPACE to restart`;
  }

  constructor(game, renderer) {
    this.game = game;
    this.renderer = renderer;
    this.#bindEvents();
    this.lastDropTime = Date.now();
    this.loop = this.loop.bind(this);
    this.highScores = JSON.parse(localStorage.getItem("tetrisHighScores")) || [];
    this.#handleHighScores();
  }
  #bindEvents() {
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));
  }

  #handleHighScores() {
    if (this.highScores) {
      this.highScores.sort((a, b) => b.score - a.score);
      this.highScores = this.highScores.slice(0, TetrisController.HIGH_SCORES);
      localStorage.setItem("tetrisHighScores", JSON.stringify(this.highScores));
      this.renderer.renderHighScores(this.highScores);
    }
  }

  #updateRenderer() {
    this.renderer.render(this.game);
  }

  #handleGameOver() {
    let message = TetrisController.getGameOverMsg(this.game.score);
    this.highScores.push({ score: this.game.score, date: new Date().toLocaleDateString("fr-CA") });
    this.#handleHighScores();
    this.renderer.showOverlay(TetrisController.GAME_OVER, message);
    this.#updateRenderer();
  }

  loop() {
    // Check for game over
    if (this.game.gameOver) {
      this.#handleGameOver();
    } else if (this.game.gameRunning && !this.game.gamePaused) {
      const now = Date.now();
      if (now - this.lastDropTime > this.game.dropInterval) {
      if (!this.game.moveCurrentPiece(0, 1)) {
        this.game.placePiece();
      }
      this.lastDropTime = now;
      }
      this.#updateRenderer();
      window.requestAnimationFrame(this.loop);
    }
  }

  #startGame() {
    this.game.startGame();
    this.renderer.hideOverlay();
    this.lastDropTime = Date.now();
    this.loop();
    this.#updateRenderer();
  }

  #pauseGame() {
    this.game.pauseGame();
    this.renderer.showOverlay(TetrisController.PAUSED, TetrisController.PAUSED_MSG);
    this.#updateRenderer();
  }

  #resumeGame() {
    this.game.resumeGame();
    this.renderer.hideOverlay();
    this.lastDropTime = Date.now();
    this.loop();
    this.#updateRenderer();
  }

  handleKeyPress(e) {
    const g = this.game;
    // Game not running or paused
    if (!g.gameRunning || g.gamePaused) {
      if (e.code === "Space") {
        if (!g.gameRunning) {
          this.#startGame();
        } else if (g.gamePaused) {
          this.#resumeGame();
        }
      }
      if (e.code === "KeyP" && g.gameRunning) {
        this.#resumeGame();
      }
      return;
    }
    // Game running
    switch (e.code) {
      case "ArrowLeft":
        g.moveCurrentPiece(-1, 0);
        break;
      case "ArrowRight":
        g.moveCurrentPiece(1, 0);
        break;
      case "ArrowDown":
        if (!g.moveCurrentPiece(0, 1)) {
          g.placePiece();
        }
        break;
      case "ArrowUp":
        g.rotateCurrentPiece();
        break;
      case "Space":
        g.hardDrop();
        break;
      case "KeyC":
        g.holdCurrentPiece();
        break;
      case "KeyP":
        if (g.gamePaused) {
          this.#resumeGame();
        } else {
          this.#pauseGame();
        }
        break;
    }
    this.#updateRenderer();
  }
}

// --- Initialization ---
window.addEventListener("load", () => {
    const gameCanvas = document.getElementById("game-canvas");
    const nextCanvas = document.getElementById("next-canvas");
    const holdCanvas = document.getElementById("hold-canvas");
    const game = new TetrisGame();
    const renderer = new TetrisRenderer(gameCanvas, nextCanvas, holdCanvas);
    const controller = new TetrisController(game, renderer);

    renderer.showOverlay("TETRIS", "Press SPACE to start");
});
