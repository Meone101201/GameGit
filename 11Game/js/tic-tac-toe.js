document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const gameContainer = document.getElementById('tic-tac-toe-game');
    const boardElement = document.getElementById('tic-tac-toe-board');
    const statusElement = document.getElementById('tic-tac-toe-status');
    const resetButton = document.getElementById('tic-tac-toe-reset-button');

    // --- Constants and Game State ---
    const PLAYER = 'X';
    const AI = 'O';
    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    let boardState;
    let currentPlayer;
    let isGameOver;
    let aiDifficulty = 'easy';

    const createDifficultySelector = () => {
        if (document.getElementById('ttt-difficulty')) return;

        const selectorContainer = document.createElement('div');
        selectorContainer.innerHTML = `
            <div style="margin: 10px 0; text-align: center;">
                <label for="ttt-difficulty">AI Difficulty: </label>
                <select id="ttt-difficulty" style="padding: 5px; margin: 0 10px;">
                    <option value="easy" selected>Easy</option>
                    <option value="hard">Hard</option>
                </select>
            </div>
        `;

        // แทรกหลัง statusElement เพื่อความเหมือน connect-four
        statusElement.insertAdjacentElement('afterend', selectorContainer);

        // กำหนด event เมื่อ dropdown เปลี่ยน
        selectorContainer.querySelector('#ttt-difficulty').addEventListener('change', (e) => {
            aiDifficulty = e.target.value;
            resetTicTacToeGame(); // รีเซ็ตเกมเมื่อเปลี่ยนความยาก
        });
    };

    // --- Game Logic Functions ---

    const checkWinner = (currentBoard) => {
        for (const combo of winCombos) {
            const [a, b, c] = combo;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a];
            }
        }
        if (currentBoard.every(cell => cell !== '')) {
            return 'draw';
        }
        return null;
    };

    const handleGameOver = (winner) => {
        isGameOver = true;
        boardElement.classList.add('game-over');

        if (winner === 'draw') {
            statusElement.textContent = "It's a Draw!";
            statusElement.style.color = 'var(--text-color)';
        } else {
            const winnerText = winner === PLAYER ? 'Player' : 'Ai';
            statusElement.textContent = `${winnerText} Wins!`;
            // MODIFICATION: Set winner color to red for player, yellow for computer
            statusElement.style.color = winner === PLAYER ? 'var(--player1-color)' : 'var(--player2-color)';
        }
    };

    const makeMove = (index, player) => {
        if (boardState[index] !== '' || isGameOver) {
            return false;
        }

        boardState[index] = player;
        const cell = boardElement.children[index];
        cell.textContent = player;
        cell.classList.add(player === PLAYER ? 'player1' : 'player2');

        const winner = checkWinner(boardState);
        if (winner) {
            handleGameOver(winner);
        } else {
            currentPlayer = (currentPlayer === PLAYER) ? AI : PLAYER;
            updateStatus();
            if (currentPlayer === AI && !isGameOver) {
                setTimeout(aiMove, 500);
            }
        }
        return true;
    };

    const handleCellClick = (e) => {
        if (isGameOver || currentPlayer !== PLAYER) return;
        const index = parseInt(e.target.dataset.index);
        makeMove(index, PLAYER);
    };

    const updateStatus = () => {
        if (!isGameOver) {
            const turnText = currentPlayer === PLAYER ? "Player's Turn" : "Computer's Turn";
            statusElement.textContent = turnText;
            // MODIFICATION: Set turn color to red for player, yellow for computer
            statusElement.style.color = currentPlayer === PLAYER ? 'var(--player1-color)' : 'var(--player2-color)';
        }
    };

    // --- AI Logic (Minimax Algorithm) ---

    const scores = {
        [AI]: 10,
        [PLAYER]: -10,
        'draw': 0
    };

    const minimax = (newBoard, depth, isMaximizing) => {
        const result = checkWinner(newBoard);
        if (result !== null) {
            // ให้คะแนนตาม depth เพื่อให้ AI เลือกชนะเร็วที่สุด หรือแพ้ช้าที่สุด
            if (result === AI) return 10 - depth;
            if (result === PLAYER) return depth - 10;
            return 0; // draw
        }

        // Easy mode: จำกัด depth และเพิ่มความสุ่ม
        if (aiDifficulty === 'easy' && depth >= 2) {
            return 0;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (newBoard[i] === '') {
                    newBoard[i] = AI;
                    let score = minimax(newBoard, depth + 1, false);
                    newBoard[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (newBoard[i] === '') {
                    newBoard[i] = PLAYER;
                    let score = minimax(newBoard, depth + 1, true);
                    newBoard[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    };

    const findBestMove = () => {
        let bestScore = -Infinity;
        let bestMoves = [];

        for (let i = 0; i < 9; i++) {
            if (boardState[i] === '') {
                boardState[i] = AI;
                let score = minimax(boardState, 0, false);
                boardState[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [i];
                } else if (score === bestScore) {
                    bestMoves.push(i);
                }
            }
        }
        
        // เลือกจาก best moves (ถ้ามีหลายตัวที่คะแนนเท่ากัน สุ่มเลือก)
        if (bestMoves.length > 0) {
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        return -1;
    };

    const aiMove = () => {
        if (isGameOver) return;
        const bestMoveIndex = findBestMove();
        if (bestMoveIndex !== -1) {
            makeMove(bestMoveIndex, AI);
        }
    };

    // --- Initialization ---

    const createBoard = () => {
        boardElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('tic-tac-toe-cell');
            cell.dataset.index = i;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    };

    window.resetTicTacToeGame = () => {
        isGameOver = false;
        currentPlayer = PLAYER;
        boardState = ['', '', '', '', '', '', '', '', ''];
        boardElement.classList.remove('game-over');

        Array.from(boardElement.children).forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('player1', 'player2');
        });

        updateStatus();
    };

    // --- Initial Setup Calls ---
    createBoard();
    createDifficultySelector(); // Moved after createBoard to ensure statusElement exists
    resetButton.addEventListener('click', resetTicTacToeGame);
    resetTicTacToeGame();
});