document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('mancala-status');
    const resetButton = document.getElementById('mancala-reset-button');

    // Board elements
    const player1PitsContainer = document.getElementById('mancala-pits-1');
    const player2PitsContainer = document.getElementById('mancala-pits-2');
    const player1Store = document.getElementById('mancala-store-1');
    const player2Store = document.getElementById('mancala-store-2');

    const P1_STORE_INDEX = 6;
    const P2_STORE_INDEX = 13;
    const INITIAL_SEEDS = 4;

    let board = [];
    let gameOver = false;
    let isPlayerTurn = true;
    let difficultyLevel = 'easy';

    // เพิ่ม difficulty selector
    const difficultySelector = document.createElement('div');
    difficultySelector.innerHTML = `
        <div style="margin: 10px 0; text-align: center;">
            <label for="mancala-difficulty">AI Difficulty: </label>
            <select id="mancala-difficulty" style="padding: 5px; margin: 0 10px;">
                <option value="easy" selected>Easy</option>
                <option value="hard">Hard</option>
            </select>
        </div>
    `;
    statusElement.parentNode.insertBefore(difficultySelector, statusElement.nextSibling);

    document.getElementById('mancala-difficulty').addEventListener('change', (e) => {
        difficultyLevel = e.target.value;
        startGame();
    });

    function startGame() {
        // Pits 0-5 for Player, 6 is Player store
        // Pits 7-12 for AI, 13 is AI store
        board = Array(14).fill(INITIAL_SEEDS);
        board[P1_STORE_INDEX] = 0;
        board[P2_STORE_INDEX] = 0;

        gameOver = false;
        isPlayerTurn = true;

        renderBoard();
        updateStatus();
    }
    window.resetMancalaGame = startGame;

    function renderBoard() {
        player1PitsContainer.innerHTML = '';
        player2PitsContainer.innerHTML = '';

        // ลบ ai-selected ออกจากทุก pit ก่อน
        document.querySelectorAll('.mancala-pit').forEach(pit => pit.classList.remove('ai-selected'));

        // Player pits (0-5)
        for (let i = 0; i < 6; i++) {
            const pit = createPit(i);
            player1PitsContainer.appendChild(pit);
        }

        // AI pits (7-12, but displayed right-to-left)
        for (let i = 12; i >= 7; i--) {
            const pit = createPit(i);
            player2PitsContainer.appendChild(pit);
        }

        player1Store.textContent = board[P1_STORE_INDEX];
        player2Store.textContent = board[P2_STORE_INDEX];

        highlightActivePits();
    }

    function createPit(index) {
        const pit = document.createElement('div');
        pit.classList.add('mancala-pit');
        pit.dataset.index = index;
        pit.textContent = board[index];
        pit.addEventListener('click', handlePitClick);
        return pit;
    }

    function highlightActivePits() {
        document.querySelectorAll('.mancala-pit').forEach(pit => {
            const index = parseInt(pit.dataset.index);
            pit.classList.remove('player1-pit', 'player2-pit', 'inactive-pit');

            // ฝั่ง AI (7-12) เป็น inactive-pit เสมอ
            if (index >= 7 && index < 13) {
                pit.classList.add('inactive-pit');
            } else if (isPlayerTurn && index >= 0 && index < 6 && board[index] > 0) {
                // ฝั่งผู้เล่น hover ได้เฉพาะตอนถึงตาผู้เล่น และมี seeds
                pit.classList.add('player1-pit');
            } else {
                pit.classList.add('inactive-pit');
            }
        });
    }

    // Highlight ช่องที่ AI เลือก
    function highlightAIMove(pitIndices) {
        pitIndices.forEach(idx => {
            const pit = document.querySelector(`.mancala-pit[data-index='${idx}']`);
            if (pit) pit.classList.add('ai-selected');
        });
    }

    function handlePitClick(event) {
        if (gameOver || !isPlayerTurn) return;
        const index = parseInt(event.currentTarget.dataset.index);

        // Check if it's player's pit and has seeds
        if (index < 0 || index >= 6 || board[index] === 0) return;

        const result = makeMove(board, index, true);
        board = result.newBoard;

        renderBoard();

        if (checkGameOver()) return;

        if (result.extraTurn) {
            updateStatus('You get another turn!');
        } else {
            isPlayerTurn = false;
            updateStatus('AI is thinking...');
            highlightActivePits();
            setTimeout(makeAIMove, 800);
        }
    }

    function makeAIMove() {
        if (gameOver || isPlayerTurn) return;

        let aiMoves = [];
        let currentBoard = [...board];
        let hasExtraTurn = true;

        // วนลูปเล่นต่อเนื่องจนกว่าจะไม่ได้ extra turn
        while (hasExtraTurn && !gameOver) {
            const move = difficultyLevel === 'hard' ? getBestMove(currentBoard) : getEasyMove(currentBoard);
            if (move === -1) break;

            aiMoves.push(move);
            const result = makeMove(currentBoard, move, false);
            currentBoard = result.newBoard;
            hasExtraTurn = result.extraTurn;

            // ตรวจสอบว่าเกมจบหรือไม่
            if (isGameOver(currentBoard)) {
                board = currentBoard;
                renderBoard();
                highlightAIMove(aiMoves);
                checkGameOver();
                return;
            }
        }

        // อัพเดต board หลังจาก AI เล่นเสร็จ
        board = currentBoard;
        renderBoard();
        highlightAIMove(aiMoves);

        if (checkGameOver()) return;

        if (hasExtraTurn) {
            // AI ยังได้เล่นต่อ (shouldn't happen in normal flow)
            updateStatus('AI gets another turn!');
            setTimeout(makeAIMove, 800);
        } else {
            // เปลี่ยนเป็นตาผู้เล่น
            isPlayerTurn = true;
            updateStatus();
            highlightActivePits();
        }
    }

    // ========== CORE GAME LOGIC ==========

    function makeMove(currentBoard, pitIndex, isPlayer) {
        const newBoard = [...currentBoard];
        const playerStoreIndex = isPlayer ? P1_STORE_INDEX : P2_STORE_INDEX;
        const opponentStoreIndex = isPlayer ? P2_STORE_INDEX : P1_STORE_INDEX;

        let seedsToSow = newBoard[pitIndex];
        newBoard[pitIndex] = 0;

        let currentIndex = pitIndex;
        while (seedsToSow > 0) {
            currentIndex = (currentIndex + 1) % 14;
            // Skip opponent's store
            if (currentIndex === opponentStoreIndex) continue;

            newBoard[currentIndex]++;
            seedsToSow--;
        }

        const lastPitIndex = currentIndex;
        let extraTurn = false;

        // Rule 1: Go again if last seed lands in own store
        if (lastPitIndex === playerStoreIndex) {
            extraTurn = true;
        } else {
            // Rule 2: Capture if last seed lands in an empty pit on own side
            const isOwnSide = isPlayer ?
                (lastPitIndex >= 0 && lastPitIndex < 6) :
                (lastPitIndex >= 7 && lastPitIndex < 13);

            // ต้องเป็น pit ที่ว่าง (มี 1 เม็ดที่เพิ่งใส่) และอยู่ฝั่งตัวเอง และฝั่งตรงข้ามมี seeds
            if (newBoard[lastPitIndex] === 1 && isOwnSide) {
                const oppositeIndex = 12 - lastPitIndex;
                if (newBoard[oppositeIndex] > 0) {
                    // Capture!
                    const capturedSeeds = newBoard[oppositeIndex] + newBoard[lastPitIndex];
                    newBoard[oppositeIndex] = 0;
                    newBoard[lastPitIndex] = 0;
                    newBoard[playerStoreIndex] += capturedSeeds;
                }
            }
        }

        return { newBoard, extraTurn };
    }

    // ========== AI ALGORITHMS ==========

    function getEasyMove(currentBoard = board) {
        const validMoves = getValidMoves(currentBoard, false);
        if (validMoves.length === 0) return -1;

        // 70% เลือกแบบ greedy, 30% แบบสุ่ม
        if (Math.random() < 0.7) {
            let bestMove = validMoves[0];
            let bestScore = evaluateMove(currentBoard, bestMove, false);

            for (const move of validMoves) {
                const score = evaluateMove(currentBoard, move, false);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
            return bestMove;
        } else {
            return validMoves[Math.floor(Math.random() * validMoves.length)];
        }
    }

    function evaluateMove(currentBoard, move, isPlayer) {
        const result = makeMove(currentBoard, move, isPlayer);
        const playerStore = isPlayer ? P1_STORE_INDEX : P2_STORE_INDEX;
        const opponentStore = isPlayer ? P2_STORE_INDEX : P1_STORE_INDEX;

        return result.newBoard[playerStore] - result.newBoard[opponentStore];
    }

    function getBestMove(currentBoard = board) {
        const validMoves = getValidMoves(currentBoard, false);
        if (validMoves.length === 0) return -1;

        let bestMove = validMoves[0];
        let bestScore = -Infinity;
        const depth = 6;

        for (const move of validMoves) {
            const result = makeMove(currentBoard, move, false);
            let score;

            if (result.extraTurn) {
                score = minimax(result.newBoard, depth - 1, -Infinity, Infinity, true, false);
            } else {
                score = minimax(result.newBoard, depth - 1, -Infinity, Infinity, false, true);
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    function minimax(currentBoard, depth, alpha, beta, maximizing, isPlayer) {
        if (depth === 0 || isGameOver(currentBoard)) {
            return evaluateBoard(currentBoard);
        }

        const validMoves = getValidMoves(currentBoard, isPlayer);
        if (validMoves.length === 0) {
            // ถ้าไม่มี valid moves แต่เกมยังไม่จบ ให้ pass turn
            return evaluateBoard(currentBoard);
        }

        if (maximizing) {
            let maxScore = -Infinity;
            for (const move of validMoves) {
                const result = makeMove(currentBoard, move, isPlayer);
                let score;

                if (result.extraTurn) {
                    score = minimax(result.newBoard, depth - 1, alpha, beta, true, isPlayer);
                } else {
                    score = minimax(result.newBoard, depth - 1, alpha, beta, false, !isPlayer);
                }

                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of validMoves) {
                const result = makeMove(currentBoard, move, isPlayer);
                let score;

                if (result.extraTurn) {
                    score = minimax(result.newBoard, depth - 1, alpha, beta, false, isPlayer);
                } else {
                    score = minimax(result.newBoard, depth - 1, alpha, beta, true, !isPlayer);
                }

                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minScore;
        }
    }

    function evaluateBoard(currentBoard) {
        const aiStore = currentBoard[P2_STORE_INDEX];
        const playerStore = currentBoard[P1_STORE_INDEX];

        // ถ้าเกมจบแล้ว ให้คะแนนตามผลลัพธ์
        if (isGameOver(currentBoard)) {
            // นับ seeds ที่เหลือ
            const playerRemaining = currentBoard.slice(0, 6).reduce((a, b) => a + b, 0);
            const aiRemaining = currentBoard.slice(7, 13).reduce((a, b) => a + b, 0);

            const finalPlayerScore = playerStore + playerRemaining;
            const finalAiScore = aiStore + aiRemaining;

            if (finalAiScore > finalPlayerScore) return 1000;
            if (finalPlayerScore > finalAiScore) return -1000;
            return 0;
        }

        // เพิ่มคะแนนสำหรับ seeds ในฝั่งของตัวเอง
        const aiSideSeeds = currentBoard.slice(7, 13).reduce((a, b) => a + b, 0);
        const playerSideSeeds = currentBoard.slice(0, 6).reduce((a, b) => a + b, 0);

        return (aiStore - playerStore) + (aiSideSeeds - playerSideSeeds) * 0.1;
    }

    function getValidMoves(currentBoard, isPlayer) {
        const moves = [];
        const startIndex = isPlayer ? 0 : 7;
        const endIndex = isPlayer ? 6 : 13;

        for (let i = startIndex; i < endIndex; i++) {
            if (currentBoard[i] > 0) {
                moves.push(i);
            }
        }
        return moves;
    }

    function isGameOver(currentBoard) {
        const playerPitsEmpty = currentBoard.slice(0, 6).every(seeds => seeds === 0);
        const aiPitsEmpty = currentBoard.slice(7, 13).every(seeds => seeds === 0);
        return playerPitsEmpty || aiPitsEmpty;
    }

    // ========== GAME STATE MANAGEMENT ==========

    function checkGameOver() {
        if (isGameOver(board)) {
            gameOver = true;

            // Collect remaining seeds
            const playerRemaining = board.slice(0, 6).reduce((a, b) => a + b, 0);
            const aiRemaining = board.slice(7, 13).reduce((a, b) => a + b, 0);

            board[P1_STORE_INDEX] += playerRemaining;
            board[P2_STORE_INDEX] += aiRemaining;

            // Clear the pits
            for (let i = 0; i < 6; i++) board[i] = 0;
            for (let i = 7; i < 13; i++) board[i] = 0;

            renderBoard();

            const playerScore = board[P1_STORE_INDEX];
            const aiScore = board[P2_STORE_INDEX];

            let winnerMsg = "It's a Draw!";
            let color = '#333';

            if (playerScore > aiScore) {
                winnerMsg = "You Win!";
                color = '#ff4136';
            } else if (aiScore > playerScore) {
                winnerMsg = "AI Wins!";
                color = '#ffd700';
            }

            statusElement.textContent = `Game Over! ${winnerMsg} (You: ${playerScore}, AI: ${aiScore})`;
            statusElement.style.color = color;
            return true;
        }
        return false;
    }

    function updateStatus(message) {
        if (!message) {
            message = isPlayerTurn ? "Your Turn" : "AI's Turn";
        }

        statusElement.textContent = message;

        if (message.includes('You') || message.includes('Player')) {
            statusElement.style.color = '#ff4136';
        } else if (message.includes('AI')) {
            statusElement.style.color = '#ffd700';
        } else {
            statusElement.style.color = '#333';
        }
    }

    resetButton.addEventListener('click', startGame);
    startGame();
});