document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('lightsout-board');
    const statusElement = document.getElementById('lightsout-status');
    const resetButton = document.getElementById('lightsout-reset-button');

    const SIZE = 5;
    let board = [];
    let moves = 0;
    let gameOver = false;

    function startGame() {
        moves = 0;
        gameOver = false;
        
        // สร้างปริศนาที่แก้ได้แน่นอน
        board = Array(SIZE).fill(0).map(() => Array(SIZE).fill(false)); // Start with all off
        
        const puzzleComplexity = 10; // จำนวนครั้งที่จะสุ่มกดเพื่อสร้างปริศนา
        for (let i = 0; i < puzzleComplexity; i++) {
            const r = Math.floor(Math.random() * SIZE);
            const c = Math.floor(Math.random() * SIZE);
            toggleLights(r, c);
        }
        
        // ถ้าบังเอิญได้กระดานที่ปิดหมดแล้ว ให้เริ่มใหม่
        if (board.flat().every(light => !light)) {
            startGame();
            return;
        }

        renderBoard();
        updateStatus();
    }
    // ใช้ชื่อ resetLightsoutGame เพราะ data-game="lightsout"
    window.resetLightsoutGame = startGame;

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('lightsout-cell');
                cell.classList.add(board[r][c] ? 'lit' : 'off');
                cell.dataset.r = r;
                cell.dataset.c = c;

                cell.addEventListener('click', handleCellClick);
                boardElement.appendChild(cell);
            }
        }
    }

    function handleCellClick(event) {
        if (gameOver) return;

        const r = parseInt(event.currentTarget.dataset.r);
        const c = parseInt(event.currentTarget.dataset.c);

        moves++;
        toggleLights(r, c);
        renderBoard();
        updateStatus();
        
        checkWinCondition();
    }

    function toggleLights(r, c) {
        // Toggle the clicked cell itself
        toggleCell(r, c);
        // Toggle neighbors
        toggleCell(r - 1, c); // Top
        toggleCell(r + 1, c); // Bottom
        toggleCell(r, c - 1); // Left
        toggleCell(r, c + 1); // Right
    }

    function toggleCell(r, c) {
        // Check boundaries
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
            board[r][c] = !board[r][c];
        }
    }
    
    function updateStatus() {
        if (gameOver) return;
        statusElement.textContent = `Turn all the lights off! Moves: ${moves}`;
    }
    
    function checkWinCondition() {
        const allOff = board.flat().every(light => !light);
        if (allOff) {
            gameOver = true;
            statusElement.textContent = `Congratulations! You solved it in ${moves} moves!`;
            // Optional: Visually confirm win
            boardElement.style.borderColor = '#28a745';
        }
    }

    resetButton.addEventListener('click', () => {
        boardElement.style.borderColor = '#444'; // Reset border color
        startGame();
    });
});