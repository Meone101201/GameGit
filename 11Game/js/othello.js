document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('othello-board');
    const statusElement = document.getElementById('othello-status');
    const resetButton = document.getElementById('othello-reset-button');

    const SIZE = 8;
    const P1 = 1; // Black
    const P2 = 2; // White

    let board = [];
    let currentPlayer;
    let validMoves = [];
    let difficultyLevel = 'easy';

    // All 8 directions for checking lines
    const directions = [
        { r: -1, c: 0 }, { r: -1, c: 1 }, { r: 0, c: 1 }, { r: 1, c: 1 },
        { r: 1, c: 0 }, { r: 1, c: -1 }, { r: 0, c: -1 }, { r: -1, c: -1 }
    ];

    // เพิ่ม AI Difficulty Selector (ตรวจสอบว่ามีอยู่แล้วหรือไม่)
    if (!document.getElementById('othello-difficulty')) {
        const difficultySelector = document.createElement('div');
        difficultySelector.innerHTML = `
            <div style="margin: 10px 0; text-align: center;">
                <label for="othello-difficulty">AI Difficulty: </label>
                <select id="othello-difficulty" style="padding: 5px; margin: 0 10px;">
                    <option value="easy" selected>Easy</option>
                    <option value="hard">Hard</option>
                </select>
            </div>
        `;
        statusElement.parentNode.insertBefore(difficultySelector, statusElement.nextSibling);
        document.getElementById('othello-difficulty').addEventListener('change', (e) => {
            difficultyLevel = e.target.value;
            startGame();
        });
    }

    function startGame() {
        board = Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));
        // Initial setup
        board[3][3] = P2; // White
        board[3][4] = P1; // Black
        board[4][3] = P1; // Black
        board[4][4] = P2; // White

        currentPlayer = P1; // Black (Player 1) always starts
        turnCycle();
    }
    window.resetOthelloGame = startGame;

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('othello-cell');
                cell.dataset.r = r;
                cell.dataset.c = c;

                const discValue = board[r][c];
                if (discValue !== 0) {
                    const discContainer = document.createElement('div');
                    discContainer.classList.add('othello-disc-container');
                    const disc = document.createElement('div');
                    disc.classList.add('othello-disc', `player${discValue}`);
                    disc.innerHTML = `<div class="othello-disc-front"></div><div class="othello-disc-back"></div>`;
                    discContainer.appendChild(disc);
                    cell.appendChild(discContainer);
                } else {
                    // Show hint if this is a valid move
                    if (validMoves.some(move => move.r === r && move.c === c)) {
                        const hint = document.createElement('div');
                        hint.classList.add('valid-move-hint');
                        cell.appendChild(hint);
                        // ให้คลิกได้เฉพาะตา Player เท่านั้น
                        if (currentPlayer === P1) {
                            cell.addEventListener('click', handleCellClick);
                        }
                    }
                }
                boardElement.appendChild(cell);
            }
        }
        updateStatus();
    }

    function turnCycle() {
        validMoves = findValidMoves(currentPlayer);
        if (validMoves.length === 0) {
            // No moves for current player, pass the turn
            currentPlayer = (currentPlayer === P1) ? P2 : P1;
            validMoves = findValidMoves(currentPlayer);
            if (validMoves.length === 0) {
                // Game over, neither player can move
                endGame();
                return;
            }
        }
        renderBoard();
        // ถ้าเป็นตา AI ให้ AI เดินอัตโนมัติ
        if (currentPlayer === P2) {
            setTimeout(makeAIMove, 600);
        }
    }

    function findValidMoves(player) {
        const moves = [];
        const opponent = (player === P1) ? P2 : P1;
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] !== 0) continue; // Must be an empty cell

                for (const dir of directions) {
                    let r_scan = r + dir.r;
                    let c_scan = c + dir.c;
                    let hasOpponentInBetween = false;

                    while (r_scan >= 0 && r_scan < SIZE && c_scan >= 0 && c_scan < SIZE) {
                        if (board[r_scan][c_scan] === opponent) {
                            hasOpponentInBetween = true;
                        } else if (board[r_scan][c_scan] === player) {
                            if (hasOpponentInBetween) {
                                moves.push({ r, c });
                            }
                            break;
                        } else { // Empty cell
                            break;
                        }
                        r_scan += dir.r;
                        c_scan += dir.c;
                    }
                }
            }
        }
        // Remove duplicates just in case
        return [...new Map(moves.map(item => [`${item.r}-${item.c}`, item])).values()];
    }

    function handleCellClick(event) {
        const r = parseInt(event.currentTarget.dataset.r);
        const c = parseInt(event.currentTarget.dataset.c);

        board[r][c] = currentPlayer;
        flipDiscs(r, c);

        currentPlayer = (currentPlayer === P1) ? P2 : P1;
        turnCycle();
    }

    function flipDiscs(r, c) {
        const opponent = (currentPlayer === P1) ? P2 : P1;
        for (const dir of directions) {
            let r_scan = r + dir.r;
            let c_scan = c + dir.c;
            const lineToFlip = [];

            while (r_scan >= 0 && r_scan < SIZE && c_scan >= 0 && c_scan < SIZE) {
                if (board[r_scan][c_scan] === opponent) {
                    lineToFlip.push({ r: r_scan, c: c_scan });
                } else if (board[r_scan][c_scan] === currentPlayer) {
                    for (const pos of lineToFlip) {
                        board[pos.r][pos.c] = currentPlayer;
                    }
                    break;
                } else {
                    break;
                }
                r_scan += dir.r;
                c_scan += dir.c;
            }
        }
    }

    function updateStatus() {
        const scores = board.flat().reduce((acc, val) => {
            if (val === P1) acc.p1++; // Count Black pieces
            if (val === P2) acc.p2++; // Count White pieces
            return acc;
        }, { p1: 0, p2: 0 });

        // ปรับสี: ผู้เล่น (White) = แดง, AI (Black) = เหลือง
        const turnColor = currentPlayer === P1 ? '#ff4136' : '#ffd700';
        const turnText = currentPlayer === P1 ? 'White (Player)' : 'Black (AI)';

        statusElement.innerHTML = `
            <span style="color: #ff4136; font-weight: bold;">White (Player): ${scores.p1}</span> - 
            <span style="color: #ffd700; font-weight: bold;">Black (AI): ${scores.p2}</span>
            <br>
            <span style="color: ${turnColor};">Turn: ${turnText}</span>
        `;
    }

    function endGame() {
        const scores = board.flat().reduce((acc, val) => {
            if (val === P1) acc.p1++;
            if (val === P2) acc.p2++;
            return acc;
        }, { p1: 0, p2: 0 });

        let winnerMsg = "It's a Draw!";
        let winnerColor = 'grey';
        if (scores.p1 < scores.p2) {
            winnerMsg = "Game Over AI Win!";
            winnerColor = '#ffd700'; // Black (AI) เหลือง
        }
        if (scores.p2 < scores.p1) {
            winnerMsg = "Player Wins!";
            winnerColor = '#ff4136'; // White (Player) แดง
        }

        statusElement.innerHTML = `
            <span style="color: #ff4136; font-weight: bold;">White (Player): ${scores.p1}</span> - 
            <span style="color: #ffd700; font-weight: bold;">Black (AI): ${scores.p2}</span>
            <br>
            <strong style="color: ${winnerColor};">${winnerMsg}</strong>
        `;
    }

    // ฟังก์ชันประเมินคะแนนกระดาน
    function evaluateBoard(board, player) {
        const opponent = (player === P1) ? P2 : P1;
        let score = 0;

        // ตารางน้ำหนักตำแหน่ง (มุมมีค่ามาก, ข้างมุมมีค่าติดลบ)
        const positionWeights = [
            [100, -10, 11, 6, 6, 11, -10, 100],
            [-10, -20, 1, 2, 2, 1, -20, -10],
            [11, 1, 5, 4, 4, 5, 1, 11],
            [6, 2, 4, 2, 2, 4, 2, 6],
            [6, 2, 4, 2, 2, 4, 2, 6],
            [11, 1, 5, 4, 4, 5, 1, 11],
            [-10, -20, 1, 2, 2, 1, -20, -10],
            [100, -10, 11, 6, 6, 11, -10, 100]
        ];

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] === player) {
                    score += positionWeights[r][c];
                } else if (board[r][c] === opponent) {
                    score -= positionWeights[r][c];
                }
            }
        }

        // โบนัสสำหรับจำนวนตำแหน่งที่เดินได้
        const playerMoves = findValidMoves(player).length;
        const opponentMoves = findValidMoves(opponent).length;
        score += (playerMoves - opponentMoves) * 5;

        return score;
    }

    // Minimax algorithm
    function minimax(board, depth, isMaximizing, alpha, beta, player) {
        if (depth === 0) {
            return evaluateBoard(board, player);
        }

        const currentPlayer = isMaximizing ? player : (player === P1 ? P2 : P1);
        const moves = findValidMoves(currentPlayer);

        if (moves.length === 0) {
            const nextPlayer = (currentPlayer === P1) ? P2 : P1;
            const nextMoves = findValidMoves(nextPlayer);
            if (nextMoves.length === 0) {
                // เกมจบแล้ว
                return evaluateBoard(board, player);
            }
            // ส่งตาต่อ
            return minimax(board, depth - 1, !isMaximizing, alpha, beta, player);
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const newBoard = JSON.parse(JSON.stringify(board));
                newBoard[move.r][move.c] = currentPlayer;
                simulateFlipDiscs(newBoard, move.r, move.c, currentPlayer);

                const eval_score = minimax(newBoard, depth - 1, false, alpha, beta, player);
                maxEval = Math.max(maxEval, eval_score);
                alpha = Math.max(alpha, eval_score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const newBoard = JSON.parse(JSON.stringify(board));
                newBoard[move.r][move.c] = currentPlayer;
                simulateFlipDiscs(newBoard, move.r, move.c, currentPlayer);

                const eval_score = minimax(newBoard, depth - 1, true, alpha, beta, player);
                minEval = Math.min(minEval, eval_score);
                beta = Math.min(beta, eval_score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return minEval;
        }
    }

    // จำลองการพลิกหิน (ไม่กระทบกระดานจริง)
    function simulateFlipDiscs(board, r, c, player) {
        const opponent = (player === P1) ? P2 : P1;
        for (const dir of directions) {
            let r_scan = r + dir.r;
            let c_scan = c + dir.c;
            const lineToFlip = [];

            while (r_scan >= 0 && r_scan < SIZE && c_scan >= 0 && c_scan < SIZE) {
                if (board[r_scan][c_scan] === opponent) {
                    lineToFlip.push({ r: r_scan, c: c_scan });
                } else if (board[r_scan][c_scan] === player) {
                    for (const pos of lineToFlip) {
                        board[pos.r][pos.c] = player;
                    }
                    break;
                } else {
                    break;
                }
                r_scan += dir.r;
                c_scan += dir.c;
            }
        }
    }

    function makeAIMove() {
        if (validMoves.length === 0) return;
        let move;

        if (difficultyLevel === 'hard') {
            // Hard AI: ใช้ Minimax algorithm
            let bestMove = null;
            let bestScore = -Infinity;

            for (const possibleMove of validMoves) {
                const newBoard = JSON.parse(JSON.stringify(board));
                newBoard[possibleMove.r][possibleMove.c] = currentPlayer;
                simulateFlipDiscs(newBoard, possibleMove.r, possibleMove.c, currentPlayer);

                // คิดล่วงหน้า 4 ตา
                const score = minimax(newBoard, 4, false, -Infinity, Infinity, currentPlayer);

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = possibleMove;
                }
            }
            move = bestMove || validMoves[0];
        } else {
            // Easy AI: เดินแบบสุ่ม
            move = validMoves[Math.floor(Math.random() * validMoves.length)];
        }

        if (move) {
            board[move.r][move.c] = currentPlayer;
            flipDiscs(move.r, move.c);
            currentPlayer = (currentPlayer === P1) ? P2 : P1;
            turnCycle();
        }
    }
    resetButton.addEventListener('click', startGame);
});