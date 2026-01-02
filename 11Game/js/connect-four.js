document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('connect-four-board');
    const statusElement = document.getElementById('connect-four-status');
    const resetButton = document.getElementById('connect-four-reset-button');

    const ROWS = 6;
    const COLS = 7;
    let board = [];
    let currentPlayer = 1;
    let gameOver = false;
    let isAIMode = true;
    let difficultyLevel = 'easy'; // 'easy' or 'hard'

    // Add difficulty selector
    const difficultySelector = document.createElement('div');
    difficultySelector.innerHTML = `
        <div style="margin: 10px 0; text-align: center;">
            <label for="difficulty">AI Difficulty: </label>
            <select id="difficulty" style="padding: 5px; margin: 0 10px;">
                <option value="easy">Easy</option>
                <option value="hard">Hard</option>
            </select>
        </div>
    `;
    boardElement.parentNode.insertBefore(difficultySelector, boardElement);

    document.getElementById('difficulty').addEventListener('change', (e) => {
        difficultyLevel = e.target.value;
    });

    function createBoard() {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        boardElement.innerHTML = '';
        gameOver = false;
        currentPlayer = 1;
        statusElement.textContent = "Player's Turn";
        statusElement.style.color = '#ff4136';

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const slot = document.createElement('div');
                slot.classList.add('connect-four-slot');
                slot.dataset.row = r;
                slot.dataset.col = c;
                slot.addEventListener('click', handleSlotClick);
                boardElement.appendChild(slot);
            }
        }
    }

    function handleSlotClick(event) {
        if (gameOver || currentPlayer !== 1) return;

        const col = parseInt(event.target.dataset.col);
        if (makeMove(col)) {
            if (!gameOver && isAIMode) {
                setTimeout(makeAIMove, 500);
            }
        }
    }

    function makeMove(col) {
        let rowToPlace = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) {
                rowToPlace = r;
                break;
            }
        }

        if (rowToPlace === -1) return false;

        board[rowToPlace][col] = currentPlayer;
        const slotToUpdate = boardElement.querySelector(`[data-row='${rowToPlace}'][data-col='${col}']`);
        slotToUpdate.classList.add(`player${currentPlayer}`);

        if (checkWin(rowToPlace, col)) {
            gameOver = true;
            statusElement.textContent = currentPlayer === 1 ? "Player Wins!" : "AI Wins!";
            statusElement.style.color = currentPlayer === 1 ? '#ff4136' : '#ffd700';
            return true;
        }

        if (board[0].every(slot => slot !== 0)) {
            gameOver = true;
            statusElement.textContent = "It's a Draw!";
            statusElement.style.color = '#333';
            return true;
        }

        currentPlayer = currentPlayer === 1 ? 2 : 1;
        statusElement.textContent = currentPlayer === 1 ? "Player's Turn" : "AI's Turn";
        statusElement.style.color = currentPlayer === 1 ? '#ff4136' : '#ffd700';
        return true;
    }

    function makeAIMove() {
        if (gameOver || currentPlayer !== 2) return;

        let col;
        if (difficultyLevel === 'easy') {
            col = makeEasyAIMove();
        } else {
            col = makeHardAIMove();
        }

        makeMove(col);
    }

    function makeEasyAIMove() {
        // Random move with some basic strategy
        const validMoves = [];
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) {
                validMoves.push(c);
            }
        }
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    function makeHardAIMove() {
        // Check for winning move
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) {
                let rowToPlace = -1;
                for (let r = ROWS - 1; r >= 0; r--) {
                    if (board[r][c] === 0) {
                        rowToPlace = r;
                        break;
                    }
                }
                if (rowToPlace !== -1) {
                    board[rowToPlace][c] = 2;
                    if (checkWin(rowToPlace, c)) {
                        board[rowToPlace][c] = 0;
                        return c;
                    }
                    board[rowToPlace][c] = 0;
                }
            }
        }

        // Block player's winning move
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) {
                let rowToPlace = -1;
                for (let r = ROWS - 1; r >= 0; r--) {
                    if (board[r][c] === 0) {
                        rowToPlace = r;
                        break;
                    }
                }
                if (rowToPlace !== -1) {
                    board[rowToPlace][c] = 1;
                    if (checkWin(rowToPlace, c)) {
                        board[rowToPlace][c] = 0;
                        return c;
                    }
                    board[rowToPlace][c] = 0;
                }
            }
        }

        // Try to create opportunities
        const scores = Array(COLS).fill(0);
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === 0) {
                let rowToPlace = -1;
                for (let r = ROWS - 1; r >= 0; r--) {
                    if (board[r][c] === 0) {
                        rowToPlace = r;
                        break;
                    }
                }
                if (rowToPlace !== -1) {
                    scores[c] = evaluateMove(rowToPlace, c);
                }
            }
        }

        const maxScore = Math.max(...scores);
        const bestMoves = scores.map((score, index) => score === maxScore ? index : -1).filter(index => index !== -1);
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function evaluateMove(row, col) {
        let score = 0;
        const directions = [
            { r: 0, c: 1 }, // Horizontal
            { r: 1, c: 0 }, // Vertical
            { r: 1, c: 1 }, // Diagonal /
            { r: 1, c: -1 } // Diagonal \
        ];

        for (const dir of directions) {
            let aiCount = 0;
            let playerCount = 0;
            let emptyCount = 0;

            // Check in both directions
            for (let i = -3; i <= 3; i++) {
                const newR = row + dir.r * i;
                const newC = col + dir.c * i;
                if (newR >= 0 && newR < ROWS && newC >= 0 && newC < COLS) {
                    if (board[newR][newC] === 2) aiCount++;
                    else if (board[newR][newC] === 1) playerCount++;
                    else emptyCount++;
                }
            }

            // Score based on potential
            if (aiCount === 3 && emptyCount >= 1) score += 100;
            if (aiCount === 2 && emptyCount >= 2) score += 50;
            if (playerCount === 3 && emptyCount >= 1) score += 80;
            if (playerCount === 2 && emptyCount >= 2) score += 40;
        }

        // Prefer center columns
        score += (3 - Math.abs(col - 3)) * 10;

        return score;
    }

    function checkWin(r, c) {
        const player = board[r][c];

        const directions = [
            { r: 0, c: 1 }, // Horizontal
            { r: 1, c: 0 }, // Vertical
            { r: 1, c: 1 }, // Diagonal /
            { r: 1, c: -1 } // Diagonal \
        ];

        for (const dir of directions) {
            let count = 1;
            // Check in one direction
            for (let i = 1; i < 4; i++) {
                const newR = r + dir.r * i;
                const newC = c + dir.c * i;
                if (newR >= 0 && newR < ROWS && newC >= 0 && newC < COLS && board[newR][newC] === player) {
                    count++;
                } else {
                    break;
                }
            }
            // Check in the opposite direction
            for (let i = 1; i < 4; i++) {
                const newR = r - dir.r * i;
                const newC = c - dir.c * i;
                if (newR >= 0 && newR < ROWS && newC >= 0 && newC < COLS && board[newR][newC] === player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= 4) return true;
        }
        return false;
    }

    resetButton.addEventListener('click', createBoard);

    // Start the game
    createBoard();
});