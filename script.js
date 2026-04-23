const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const counters = document.querySelectorAll("[data-count]");

const animateCounter = (element) => {
  const target = Number(element.dataset.count);
  const duration = 1200;
  const startTime = performance.now();
  element.textContent = "0";

  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

const boardStage = document.getElementById("board-stage");

if (boardStage && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  boardStage.addEventListener("mousemove", (event) => {
    const card = boardStage.querySelector(".board-card");

    if (!card) {
      return;
    }

    const rect = boardStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
  });

  boardStage.addEventListener("mouseleave", () => {
    const card = boardStage.querySelector(".board-card");

    if (card) {
      card.style.transform = "rotateX(0deg) rotateY(0deg)";
    }
  });
}

const FILES = "abcdefgh";
const PIECE_TYPES = ["q", "r", "b", "n"];
const WHITE_OUTLINE = {
  k: "\u2654",
  q: "\u2655",
  r: "\u2656",
  b: "\u2657",
  n: "\u2658",
  p: "\u2659",
};
const BLACK_SOLID = {
  k: "\u265A",
  q: "\u265B",
  r: "\u265C",
  b: "\u265D",
  n: "\u265E",
  p: "\u265F",
};
const PIECE_SETS = {
  classic: {
    w: WHITE_OUTLINE,
    b: BLACK_SOLID,
  },
  outline: {
    w: WHITE_OUTLINE,
    b: WHITE_OUTLINE,
  },
  solid: {
    w: BLACK_SOLID,
    b: BLACK_SOLID,
  },
};
const BOARD_THEMES = {
  classic: {
    light: "#f0d9b5",
    dark: "#b58863",
    frame: "#3a2a20",
    glow: "rgba(43, 27, 14, 0.25)",
    highlight: "rgba(183, 121, 47, 0.36)",
  },
  midnight: {
    light: "#c8d7e6",
    dark: "#4d6074",
    frame: "#17222f",
    glow: "rgba(15, 24, 36, 0.28)",
    highlight: "rgba(113, 177, 255, 0.3)",
  },
  emerald: {
    light: "#dbe8d5",
    dark: "#5f7d58",
    frame: "#223125",
    glow: "rgba(20, 32, 22, 0.28)",
    highlight: "rgba(86, 158, 103, 0.3)",
  },
  sunset: {
    light: "#f2d3bf",
    dark: "#b7634b",
    frame: "#40211c",
    glow: "rgba(55, 26, 21, 0.28)",
    highlight: "rgba(224, 132, 83, 0.32)",
  },
};

const viewButtons = document.querySelectorAll("[data-view-target]");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const openViewLinks = document.querySelectorAll("[data-open-view]");
const themeSelect = document.getElementById("theme-select");
const pieceSelect = document.getElementById("piece-select");
const variationSelect = document.getElementById("variation-select");
const flipBoardButton = document.getElementById("flip-board-button");
const newGameButton = document.getElementById("new-game-button");
const undoButton = document.getElementById("undo-button");
const gameBoard = document.getElementById("game-board");
const gameBoardFrame = document.getElementById("game-board-frame");
const turnIndicator = document.getElementById("turn-indicator");
const gameStatusText = document.getElementById("game-status-text");
const gameResultText = document.getElementById("game-result-text");
const moveList = document.getElementById("move-list");
const capturedByWhite = document.getElementById("captured-by-white");
const capturedByBlack = document.getElementById("captured-by-black");
const promotionModal = document.getElementById("promotion-modal");
const promotionChoices = document.querySelectorAll(".promotion-choice");

const app = {
  activeView: "overview",
  orientation: "w",
  theme: "classic",
  pieceSet: "classic",
  variation: "framed",
  pendingPromotion: null,
  undoStack: [],
  game: createInitialGameState(),
};

function createPiece(color, type) {
  return { color, type };
}

function createInitialBoard() {
  return [
    [
      createPiece("b", "r"),
      createPiece("b", "n"),
      createPiece("b", "b"),
      createPiece("b", "q"),
      createPiece("b", "k"),
      createPiece("b", "b"),
      createPiece("b", "n"),
      createPiece("b", "r"),
    ],
    Array(8).fill(null).map(() => createPiece("b", "p")),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null).map(() => createPiece("w", "p")),
    [
      createPiece("w", "r"),
      createPiece("w", "n"),
      createPiece("w", "b"),
      createPiece("w", "q"),
      createPiece("w", "k"),
      createPiece("w", "b"),
      createPiece("w", "n"),
      createPiece("w", "r"),
    ],
  ];
}

function createInitialGameState() {
  const game = {
    board: createInitialBoard(),
    turn: "w",
    castling: {
      w: { k: true, q: true },
      b: { k: true, q: true },
    },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
    selected: null,
    legalMoves: [],
    moveHistory: [],
    positionCounts: {},
    captured: { w: [], b: [] },
    lastMove: null,
    result: null,
    statusText: "White to move.",
  };

  game.positionCounts[serializePosition(game)] = 1;
  return game;
}

function cloneBoard(board) {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function cloneGameState(game) {
  return {
    board: cloneBoard(game.board),
    turn: game.turn,
    castling: {
      w: { ...game.castling.w },
      b: { ...game.castling.b },
    },
    enPassant: game.enPassant ? { ...game.enPassant } : null,
    halfmove: game.halfmove,
    fullmove: game.fullmove,
    selected: null,
    legalMoves: [],
    moveHistory: game.moveHistory.map((entry) => ({ ...entry })),
    positionCounts: { ...game.positionCounts },
    captured: {
      w: game.captured.w.map((piece) => ({ ...piece })),
      b: game.captured.b.map((piece) => ({ ...piece })),
    },
    lastMove: game.lastMove
      ? {
          from: { ...game.lastMove.from },
          to: { ...game.lastMove.to },
        }
      : null,
    result: game.result,
    statusText: game.statusText,
  };
}

function insideBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function opposite(color) {
  return color === "w" ? "b" : "w";
}

function toAlgebraic(row, col) {
  return `${FILES[col]}${8 - row}`;
}

function findKing(board, color) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (piece && piece.color === color && piece.type === "k") {
        return { row, col };
      }
    }
  }

  return null;
}

function isSquareAttacked(board, row, col, byColor) {
  const pawnRow = byColor === "w" ? row + 1 : row - 1;
  for (const deltaCol of [-1, 1]) {
    const attackCol = col + deltaCol;
    if (insideBoard(pawnRow, attackCol)) {
      const piece = board[pawnRow][attackCol];
      if (piece && piece.color === byColor && piece.type === "p") {
        return true;
      }
    }
  }

  const knightOffsets = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  for (const [deltaRow, deltaCol] of knightOffsets) {
    const nextRow = row + deltaRow;
    const nextCol = col + deltaCol;
    if (!insideBoard(nextRow, nextCol)) {
      continue;
    }
    const piece = board[nextRow][nextCol];
    if (piece && piece.color === byColor && piece.type === "n") {
      return true;
    }
  }

  const bishopDirections = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [deltaRow, deltaCol] of bishopDirections) {
    let nextRow = row + deltaRow;
    let nextCol = col + deltaCol;
    while (insideBoard(nextRow, nextCol)) {
      const piece = board[nextRow][nextCol];
      if (piece) {
        if (piece.color === byColor && (piece.type === "b" || piece.type === "q")) {
          return true;
        }
        break;
      }
      nextRow += deltaRow;
      nextCol += deltaCol;
    }
  }

  const rookDirections = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [deltaRow, deltaCol] of rookDirections) {
    let nextRow = row + deltaRow;
    let nextCol = col + deltaCol;
    while (insideBoard(nextRow, nextCol)) {
      const piece = board[nextRow][nextCol];
      if (piece) {
        if (piece.color === byColor && (piece.type === "r" || piece.type === "q")) {
          return true;
        }
        break;
      }
      nextRow += deltaRow;
      nextCol += deltaCol;
    }
  }

  for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
    for (let deltaCol = -1; deltaCol <= 1; deltaCol += 1) {
      if (deltaRow === 0 && deltaCol === 0) {
        continue;
      }
      const nextRow = row + deltaRow;
      const nextCol = col + deltaCol;
      if (!insideBoard(nextRow, nextCol)) {
        continue;
      }
      const piece = board[nextRow][nextCol];
      if (piece && piece.color === byColor && piece.type === "k") {
        return true;
      }
    }
  }

  return false;
}

function isKingInCheck(game, color) {
  const king = findKing(game.board, color);
  if (!king) {
    return false;
  }
  return isSquareAttacked(game.board, king.row, king.col, opposite(color));
}

function generatePseudoMoves(game, row, col) {
  const piece = game.board[row][col];
  if (!piece) {
    return [];
  }

  const moves = [];
  const pushMove = (move) => moves.push(move);

  if (piece.type === "p") {
    const direction = piece.color === "w" ? -1 : 1;
    const startRow = piece.color === "w" ? 6 : 1;
    const promotionRow = piece.color === "w" ? 0 : 7;
    const nextRow = row + direction;

    if (insideBoard(nextRow, col) && !game.board[nextRow][col]) {
      pushMove({
        from: { row, col },
        to: { row: nextRow, col },
        piece: { ...piece },
        needsPromotion: nextRow === promotionRow,
      });

      const jumpRow = row + direction * 2;
      if (row === startRow && !game.board[jumpRow][col]) {
        pushMove({
          from: { row, col },
          to: { row: jumpRow, col },
          piece: { ...piece },
          doubleStep: true,
        });
      }
    }

    for (const deltaCol of [-1, 1]) {
      const targetCol = col + deltaCol;
      if (!insideBoard(nextRow, targetCol)) {
        continue;
      }
      const targetPiece = game.board[nextRow][targetCol];
      if (targetPiece && targetPiece.color !== piece.color) {
        pushMove({
          from: { row, col },
          to: { row: nextRow, col: targetCol },
          piece: { ...piece },
          capture: true,
          capturedPiece: { ...targetPiece },
          needsPromotion: nextRow === promotionRow,
        });
      }

      if (
        game.enPassant &&
        game.enPassant.row === nextRow &&
        game.enPassant.col === targetCol
      ) {
        pushMove({
          from: { row, col },
          to: { row: nextRow, col: targetCol },
          piece: { ...piece },
          capture: true,
          enPassant: true,
          capturedSquare: { row, col: targetCol },
        });
      }
    }

    return moves;
  }

  if (piece.type === "n") {
    const offsets = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];
    offsets.forEach(([deltaRow, deltaCol]) => {
      const nextRow = row + deltaRow;
      const nextCol = col + deltaCol;
      if (!insideBoard(nextRow, nextCol)) {
        return;
      }
      const targetPiece = game.board[nextRow][nextCol];
      if (!targetPiece || targetPiece.color !== piece.color) {
        pushMove({
          from: { row, col },
          to: { row: nextRow, col: nextCol },
          piece: { ...piece },
          capture: Boolean(targetPiece),
          capturedPiece: targetPiece ? { ...targetPiece } : null,
        });
      }
    });
    return moves;
  }

  if (piece.type === "b" || piece.type === "r" || piece.type === "q") {
    const directions = [];
    if (piece.type === "b" || piece.type === "q") {
      directions.push(
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      );
    }
    if (piece.type === "r" || piece.type === "q") {
      directions.push(
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      );
    }

    directions.forEach(([deltaRow, deltaCol]) => {
      let nextRow = row + deltaRow;
      let nextCol = col + deltaCol;
      while (insideBoard(nextRow, nextCol)) {
        const targetPiece = game.board[nextRow][nextCol];
        if (!targetPiece) {
          pushMove({
            from: { row, col },
            to: { row: nextRow, col: nextCol },
            piece: { ...piece },
          });
        } else {
          if (targetPiece.color !== piece.color) {
            pushMove({
              from: { row, col },
              to: { row: nextRow, col: nextCol },
              piece: { ...piece },
              capture: true,
              capturedPiece: { ...targetPiece },
            });
          }
          break;
        }
        nextRow += deltaRow;
        nextCol += deltaCol;
      }
    });
    return moves;
  }

  if (piece.type === "k") {
    for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol += 1) {
        if (deltaRow === 0 && deltaCol === 0) {
          continue;
        }
        const nextRow = row + deltaRow;
        const nextCol = col + deltaCol;
        if (!insideBoard(nextRow, nextCol)) {
          continue;
        }
        const targetPiece = game.board[nextRow][nextCol];
        if (!targetPiece || targetPiece.color !== piece.color) {
          pushMove({
            from: { row, col },
            to: { row: nextRow, col: nextCol },
            piece: { ...piece },
            capture: Boolean(targetPiece),
            capturedPiece: targetPiece ? { ...targetPiece } : null,
          });
        }
      }
    }

    const rights = game.castling[piece.color];
    const homeRow = piece.color === "w" ? 7 : 0;

    if (
      row === homeRow &&
      col === 4 &&
      !isKingInCheck(game, piece.color)
    ) {
      if (
        rights.k &&
        game.board[homeRow][5] === null &&
        game.board[homeRow][6] === null &&
        game.board[homeRow][7] &&
        game.board[homeRow][7].type === "r" &&
        game.board[homeRow][7].color === piece.color &&
        !isSquareAttacked(game.board, homeRow, 5, opposite(piece.color)) &&
        !isSquareAttacked(game.board, homeRow, 6, opposite(piece.color))
      ) {
        pushMove({
          from: { row, col },
          to: { row: homeRow, col: 6 },
          piece: { ...piece },
          castle: "k",
        });
      }

      if (
        rights.q &&
        game.board[homeRow][3] === null &&
        game.board[homeRow][2] === null &&
        game.board[homeRow][1] === null &&
        game.board[homeRow][0] &&
        game.board[homeRow][0].type === "r" &&
        game.board[homeRow][0].color === piece.color &&
        !isSquareAttacked(game.board, homeRow, 3, opposite(piece.color)) &&
        !isSquareAttacked(game.board, homeRow, 2, opposite(piece.color))
      ) {
        pushMove({
          from: { row, col },
          to: { row: homeRow, col: 2 },
          piece: { ...piece },
          castle: "q",
        });
      }
    }
  }

  return moves;
}

function applyMove(game, move, options = {}) {
  const movingPiece = { ...game.board[move.from.row][move.from.col] };
  let capturedPiece = null;

  if (move.enPassant && move.capturedSquare) {
    capturedPiece = game.board[move.capturedSquare.row][move.capturedSquare.col];
    game.board[move.capturedSquare.row][move.capturedSquare.col] = null;
  } else if (game.board[move.to.row][move.to.col]) {
    capturedPiece = game.board[move.to.row][move.to.col];
  }

  game.board[move.from.row][move.from.col] = null;
  game.board[move.to.row][move.to.col] = movingPiece;

  if (move.castle === "k") {
    game.board[move.to.row][5] = game.board[move.to.row][7];
    game.board[move.to.row][7] = null;
  } else if (move.castle === "q") {
    game.board[move.to.row][3] = game.board[move.to.row][0];
    game.board[move.to.row][0] = null;
  }

  if (movingPiece.type === "p" && (move.needsPromotion || move.promotion)) {
    game.board[move.to.row][move.to.col] = createPiece(movingPiece.color, move.promotion || "q");
  }

  if (movingPiece.type === "k") {
    game.castling[movingPiece.color].k = false;
    game.castling[movingPiece.color].q = false;
  }

  if (movingPiece.type === "r") {
    if (move.from.row === 7 && move.from.col === 0) {
      game.castling.w.q = false;
    } else if (move.from.row === 7 && move.from.col === 7) {
      game.castling.w.k = false;
    } else if (move.from.row === 0 && move.from.col === 0) {
      game.castling.b.q = false;
    } else if (move.from.row === 0 && move.from.col === 7) {
      game.castling.b.k = false;
    }
  }

  if (capturedPiece && capturedPiece.type === "r") {
    if (move.to.row === 7 && move.to.col === 0) {
      game.castling.w.q = false;
    } else if (move.to.row === 7 && move.to.col === 7) {
      game.castling.w.k = false;
    } else if (move.to.row === 0 && move.to.col === 0) {
      game.castling.b.q = false;
    } else if (move.to.row === 0 && move.to.col === 7) {
      game.castling.b.k = false;
    }
  }

  game.enPassant = null;
  if (movingPiece.type === "p" && move.doubleStep) {
    game.enPassant = {
      row: (move.from.row + move.to.row) / 2,
      col: move.from.col,
    };
  }

  if (movingPiece.type === "p" || capturedPiece) {
    game.halfmove = 0;
  } else {
    game.halfmove += 1;
  }

  if (capturedPiece && !options.simulate) {
    game.captured[movingPiece.color].push({ ...capturedPiece });
  }

  if (movingPiece.color === "b") {
    game.fullmove += 1;
  }

  game.turn = opposite(movingPiece.color);
  game.lastMove = {
    from: { ...move.from },
    to: { ...move.to },
  };

  return {
    movedPiece: movingPiece,
    capturedPiece,
  };
}

function isMoveLegal(game, move) {
  const simulation = cloneGameState(game);
  applyMove(simulation, move, { simulate: true });
  return !isKingInCheck(simulation, move.piece.color);
}

function getLegalMovesForSquare(game, row, col) {
  const piece = game.board[row][col];
  if (!piece || piece.color !== game.turn || game.result) {
    return [];
  }

  return generatePseudoMoves(game, row, col).filter((move) => isMoveLegal(game, move));
}

function generateAllLegalMoves(game, color) {
  const legalMoves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = game.board[row][col];
      if (piece && piece.color === color) {
        legalMoves.push(...getLegalMovesForSquare({ ...game, turn: color }, row, col));
      }
    }
  }
  return legalMoves;
}

function serializePosition(game) {
  const rows = game.board.map((row) =>
    row
      .map((piece) => {
        if (!piece) {
          return ".";
        }
        const symbol = piece.color === "w" ? piece.type.toUpperCase() : piece.type;
        return symbol;
      })
      .join("")
  );

  const castling = ["w", "b"]
    .map((color) => {
      let rights = "";
      if (game.castling[color].k) {
        rights += color === "w" ? "K" : "k";
      }
      if (game.castling[color].q) {
        rights += color === "w" ? "Q" : "q";
      }
      return rights;
    })
    .join("");

  const enPassant = game.enPassant ? toAlgebraic(game.enPassant.row, game.enPassant.col) : "-";
  return `${rows.join("/")} ${game.turn} ${castling || "-"} ${enPassant}`;
}

function hasInsufficientMaterial(board) {
  const pieces = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (piece) {
        pieces.push({ ...piece, row, col });
      }
    }
  }

  const nonKings = pieces.filter((piece) => piece.type !== "k");
  if (nonKings.length === 0) {
    return true;
  }

  if (nonKings.length === 1) {
    return ["b", "n"].includes(nonKings[0].type);
  }

  if (nonKings.length === 2) {
    const bishops = nonKings.filter((piece) => piece.type === "b");
    if (bishops.length === 2) {
      const colors = bishops.map((bishop) => (bishop.row + bishop.col) % 2);
      return colors[0] === colors[1];
    }
  }

  return false;
}

function updateResultState(game, movedColor) {
  const activeColor = game.turn;
  const activeName = activeColor === "w" ? "White" : "Black";
  const legalMoves = generateAllLegalMoves(game, activeColor);
  const inCheck = isKingInCheck(game, activeColor);
  const positionKey = serializePosition(game);
  const repetitionCount = game.positionCounts[positionKey] || 0;

  if (legalMoves.length === 0) {
    if (inCheck) {
      const winner = movedColor === "w" ? "White" : "Black";
      game.result = `${winner} wins by checkmate.`;
      game.statusText = `${activeName} is in checkmate.`;
      return;
    }
    game.result = "Draw by stalemate.";
    game.statusText = `${activeName} has no legal moves.`;
    return;
  }

  if (game.halfmove >= 100) {
    game.result = "Draw by the fifty-move rule.";
    game.statusText = "No pawn move or capture in the last fifty moves.";
    return;
  }

  if (repetitionCount >= 3) {
    game.result = "Draw by threefold repetition.";
    game.statusText = "This position has appeared three times.";
    return;
  }

  if (hasInsufficientMaterial(game.board)) {
    game.result = "Draw by insufficient material.";
    game.statusText = "Neither side has enough material to force mate.";
    return;
  }

  game.result = null;
  game.statusText = inCheck ? `${activeName} to move and in check.` : `${activeName} to move.`;
}

function formatMoveNotation(beforeGame, move, movedPiece, capturedPiece, afterGame) {
  if (move.castle === "k") {
    return afterGame.result && afterGame.result.includes("checkmate") ? "O-O#" : "O-O";
  }
  if (move.castle === "q") {
    return afterGame.result && afterGame.result.includes("checkmate") ? "O-O-O#" : "O-O-O";
  }

  const piecePrefix = movedPiece.type === "p" ? "" : movedPiece.type.toUpperCase();
  const captureMark = capturedPiece ? "x" : "-";
  const from = movedPiece.type === "p" && capturedPiece ? FILES[move.from.col] : toAlgebraic(move.from.row, move.from.col);
  const to = toAlgebraic(move.to.row, move.to.col);
  let notation = `${piecePrefix}${from}${captureMark}${to}`;

  if (move.promotion) {
    notation += `=${move.promotion.toUpperCase()}`;
  }

  if (afterGame.result && afterGame.result.includes("checkmate")) {
    notation += "#";
  } else if (isKingInCheck(afterGame, afterGame.turn)) {
    notation += "+";
  }

  return notation;
}

function performMove(move) {
  if (app.game.result) {
    return;
  }

  const snapshot = cloneGameState(app.game);
  app.undoStack.push(snapshot);

  const beforeMove = cloneGameState(app.game);
  const { movedPiece, capturedPiece } = applyMove(app.game, move);
  app.game.selected = null;
  app.game.legalMoves = [];

  const positionKey = serializePosition(app.game);
  app.game.positionCounts[positionKey] = (app.game.positionCounts[positionKey] || 0) + 1;
  updateResultState(app.game, movedPiece.color);

  const notation = formatMoveNotation(beforeMove, move, movedPiece, capturedPiece, app.game);
  app.game.moveHistory.push({
    ply: app.game.moveHistory.length + 1,
    color: movedPiece.color,
    notation,
  });

  renderGame();
}

function handleSquareClick(row, col) {
  if (app.pendingPromotion || app.game.result) {
    return;
  }

  const piece = app.game.board[row][col];
  const selected = app.game.selected;

  if (selected) {
    const matchingMove = app.game.legalMoves.find(
      (move) => move.to.row === row && move.to.col === col
    );

    if (matchingMove) {
      if (matchingMove.needsPromotion) {
        app.pendingPromotion = matchingMove;
        openPromotionModal();
        return;
      }
      performMove(matchingMove);
      return;
    }
  }

  if (piece && piece.color === app.game.turn) {
    app.game.selected = { row, col };
    app.game.legalMoves = getLegalMovesForSquare(app.game, row, col);
  } else {
    app.game.selected = null;
    app.game.legalMoves = [];
  }

  renderGame();
}

function renderBoard() {
  const rows = app.orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = app.orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const selected = app.game.selected;
  const legalTargets = app.game.legalMoves.map((move) => ({
    row: move.to.row,
    col: move.to.col,
    capture: move.capture || move.enPassant,
  }));
  const king = findKing(app.game.board, app.game.turn);
  const checked = king && isKingInCheck(app.game, app.game.turn) ? `${king.row}-${king.col}` : null;

  gameBoard.className = `game-board piece-set-${app.pieceSet}`;
  gameBoard.innerHTML = "";

  rows.forEach((row, displayRowIndex) => {
    cols.forEach((col, displayColIndex) => {
      const squareButton = document.createElement("button");
      squareButton.type = "button";
      squareButton.className = `board-square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
      squareButton.dataset.row = String(row);
      squareButton.dataset.col = String(col);
      squareButton.setAttribute("aria-label", `Square ${toAlgebraic(row, col)}`);

      const piece = app.game.board[row][col];
      const legalTarget = legalTargets.find((target) => target.row === row && target.col === col);
      const isSelected = selected && selected.row === row && selected.col === col;
      const isLastMove =
        app.game.lastMove &&
        ((app.game.lastMove.from.row === row && app.game.lastMove.from.col === col) ||
          (app.game.lastMove.to.row === row && app.game.lastMove.to.col === col));

      if (isSelected) {
        squareButton.classList.add("is-selected");
      }
      if (legalTarget) {
        squareButton.classList.add("is-legal");
        if (legalTarget.capture) {
          squareButton.classList.add("is-capture");
        }
      }
      if (isLastMove) {
        squareButton.classList.add("is-last-move");
      }
      if (checked === `${row}-${col}`) {
        squareButton.classList.add("is-check");
      }

      if (piece) {
        const pieceElement = document.createElement("span");
        const pieceClass = piece.color === "w" ? "white-piece" : "black-piece";
        pieceElement.className = `game-piece ${pieceClass}`;
        pieceElement.textContent = PIECE_SETS[app.pieceSet][piece.color][piece.type];
        squareButton.appendChild(pieceElement);
      }

      if (displayRowIndex === 7) {
        const fileLabel = document.createElement("span");
        fileLabel.className = "coord-file";
        fileLabel.textContent = FILES[col];
        squareButton.appendChild(fileLabel);
      }

      if (displayColIndex === 0) {
        const rankLabel = document.createElement("span");
        rankLabel.className = "coord-rank";
        rankLabel.textContent = String(8 - row);
        squareButton.appendChild(rankLabel);
      }

      gameBoard.appendChild(squareButton);
    });
  });
}

function renderMoveHistory() {
  moveList.innerHTML = "";
  for (let index = 0; index < app.game.moveHistory.length; index += 2) {
    const whiteMove = app.game.moveHistory[index];
    const blackMove = app.game.moveHistory[index + 1];
    const item = document.createElement("li");
    const moveNumber = Math.floor(index / 2) + 1;
    item.textContent = blackMove
      ? `${moveNumber}. ${whiteMove.notation} ${blackMove.notation}`
      : `${moveNumber}. ${whiteMove.notation}`;
    moveList.appendChild(item);
  }
}

function renderCapturedPieces() {
  capturedByWhite.innerHTML = "";
  capturedByBlack.innerHTML = "";

  app.game.captured.w.forEach((piece) => {
    const span = document.createElement("span");
    span.className = "capture-piece";
    span.textContent = PIECE_SETS[app.pieceSet][piece.color][piece.type];
    capturedByWhite.appendChild(span);
  });

  app.game.captured.b.forEach((piece) => {
    const span = document.createElement("span");
    span.className = "capture-piece";
    span.textContent = PIECE_SETS[app.pieceSet][piece.color][piece.type];
    capturedByBlack.appendChild(span);
  });
}

function renderStatus() {
  turnIndicator.textContent = app.game.turn === "w" ? "White to move" : "Black to move";
  gameStatusText.textContent = app.game.statusText;
  gameResultText.textContent = app.game.result || "No result yet.";
  undoButton.disabled = app.undoStack.length === 0;
}

function applyTheme() {
  const theme = BOARD_THEMES[app.theme];
  document.documentElement.style.setProperty("--board-light", theme.light);
  document.documentElement.style.setProperty("--board-dark", theme.dark);
  document.documentElement.style.setProperty("--board-frame", theme.frame);
  document.documentElement.style.setProperty("--board-frame-glow", theme.glow);
  document.documentElement.style.setProperty("--highlight", theme.highlight);
  gameBoardFrame.className = `game-board-frame variation-${app.variation}`;
}

function renderPromotionChoices() {
  if (!app.pendingPromotion) {
    return;
  }

  const color = app.pendingPromotion.piece.color;
  promotionChoices.forEach((button) => {
    const promotionType = button.dataset.promotion;
    button.textContent = PIECE_SETS[app.pieceSet][color][promotionType];
  });
}

function openPromotionModal() {
  renderPromotionChoices();
  promotionModal.hidden = false;
}

function closePromotionModal() {
  promotionModal.hidden = true;
}

function renderGame() {
  applyTheme();
  renderBoard();
  renderMoveHistory();
  renderCapturedPieces();
  renderStatus();
  renderPromotionChoices();
}

function setActiveView(view) {
  app.activeView = view;
  viewButtons.forEach((button) => {
    const active = button.dataset.viewTarget === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  viewPanels.forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== view;
  });

  const targetId = view === "play" ? "play" : "hero";
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.viewTarget);
  });
});

openViewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const view = link.dataset.openView;
    if (!view) {
      return;
    }
    setActiveView(view);
    if (view === "play") {
      event.preventDefault();
    }
  });
});

gameBoard.addEventListener("click", (event) => {
  const square = event.target.closest(".board-square");
  if (!square) {
    return;
  }
  handleSquareClick(Number(square.dataset.row), Number(square.dataset.col));
});

promotionChoices.forEach((button) => {
  button.addEventListener("click", () => {
    if (!app.pendingPromotion) {
      return;
    }
    const move = {
      ...app.pendingPromotion,
      promotion: button.dataset.promotion,
    };
    app.pendingPromotion = null;
    closePromotionModal();
    performMove(move);
  });
});

themeSelect.addEventListener("change", () => {
  app.theme = themeSelect.value;
  renderGame();
});

pieceSelect.addEventListener("change", () => {
  app.pieceSet = pieceSelect.value;
  renderGame();
});

variationSelect.addEventListener("change", () => {
  app.variation = variationSelect.value;
  renderGame();
});

flipBoardButton.addEventListener("click", () => {
  app.orientation = app.orientation === "w" ? "b" : "w";
  renderBoard();
});

newGameButton.addEventListener("click", () => {
  app.pendingPromotion = null;
  app.undoStack = [];
  closePromotionModal();
  app.game = createInitialGameState();
  renderGame();
});

undoButton.addEventListener("click", () => {
  const snapshot = app.undoStack.pop();
  if (!snapshot) {
    return;
  }
  app.pendingPromotion = null;
  closePromotionModal();
  app.game = snapshot;
  renderGame();
});

if (window.location.hash === "#play") {
  setActiveView("play");
}

renderGame();
