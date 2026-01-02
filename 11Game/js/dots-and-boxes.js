document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('dots-and-boxes-board');
    const statusElement = document.getElementById('dots-and-boxes-status');
    const resetButton = document.getElementById('dots-and-boxes-reset-button');

    // ตั้งค่าขนาดกระดาน (3x3 กล่อง คือ 4x4 จุด)
    const GRID_SIZE = 4;
    const BOX_SIZE = 80; // ขนาดกล่องใน px
    const DOT_SIZE = 16;
    const LINE_THICKNESS = 8;
    const LINE_LENGTH = BOX_SIZE;

    let currentPlayer = 1;
    let scores = { 1: 0, 2: 0 };
    let lines = {}; // key: "h-r-c" or "v-r-c", value: player
    let boxes = {}; // key: "b-r-c", value: player
    let gameOver = false;
    let totalBoxes = (GRID_SIZE - 1) * (GRID_SIZE - 1);
    // --- CHANGE 1: Default difficulty is now 'easy' ---
    let difficultyLevel = 'easy';

    // Add difficulty selector
    const difficultySelector = document.createElement('div');
    difficultySelector.innerHTML = `
        <div style="margin: 10px 0; text-align: center;">
            <label for="difficulty">AI Difficulty: </label>
            <select id="difficulty" style="padding: 5px; margin: 0 10px;">
                <option value="easy" selected>Easy</option>
                <option value="hard">Hard</option>
            </select>
        </div>
    `;
    boardElement.parentNode.insertBefore(difficultySelector, boardElement);

    document.getElementById('difficulty').addEventListener('change', (e) => {
        difficultyLevel = e.target.value;
    });

    function createBoard() {
        boardElement.innerHTML = '';
        lines = {};
        boxes = {};
        scores = { 1: 0, 2: 0 };
        currentPlayer = 1;
        gameOver = false;
        updateStatus();

        const boardContainerSize = GRID_SIZE * BOX_SIZE;
        const boardDimension = (GRID_SIZE - 1) * BOX_SIZE;
        const offset = (boardContainerSize - boardDimension) / 2;

        for (let r = 0; r < GRID_SIZE - 1; r++) {
            for (let c = 0; c < GRID_SIZE - 1; c++) {
                const box = document.createElement('div');
                box.classList.add('box');
                box.id = `b-${r}-${c}`;
                box.style.left = `${offset + c * BOX_SIZE + BOX_SIZE / 2}px`;
                box.style.top = `${offset + r * BOX_SIZE + BOX_SIZE / 2}px`;
                box.style.width = `${BOX_SIZE - LINE_THICKNESS}px`;
                box.style.height = `${BOX_SIZE - LINE_THICKNESS}px`;
                boardElement.appendChild(box);
            }
        }

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE - 1; c++) {
                const line = document.createElement('div');
                line.classList.add('line', 'horizontal-line');
                line.dataset.type = 'h';
                line.dataset.r = r;
                line.dataset.c = c;
                line.id = `h-${r}-${c}`;
                line.style.left = `${offset + c * BOX_SIZE + BOX_SIZE / 2}px`;
                line.style.top = `${offset + r * BOX_SIZE}px`;
                line.style.width = `${LINE_LENGTH}px`;
                line.style.height = `${LINE_THICKNESS}px`;
                line.addEventListener('click', handleLineClick);
                boardElement.appendChild(line);
            }
        }

        for (let r = 0; r < GRID_SIZE - 1; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const line = document.createElement('div');
                line.classList.add('line', 'vertical-line');
                line.dataset.type = 'v';
                line.dataset.r = r;
                line.dataset.c = c;
                line.id = `v-${r}-${c}`;
                line.style.left = `${offset + c * BOX_SIZE}px`;
                line.style.top = `${offset + r * BOX_SIZE + BOX_SIZE / 2}px`;
                line.style.width = `${LINE_THICKNESS}px`;
                line.style.height = `${LINE_LENGTH}px`;
                line.addEventListener('click', handleLineClick);
                boardElement.appendChild(line);
            }
        }

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dot.style.left = `${offset + c * BOX_SIZE}px`;
                dot.style.top = `${offset + r * BOX_SIZE}px`;
                boardElement.appendChild(dot);
            }
        }
    }

    function handleLineClick(event) {
        if (gameOver || currentPlayer !== 1) return;
        const line = event.target;
        if (lines[line.id]) return;
        makeMove(line);
    }

    function makeMove(line) {
        if (!line || lines[line.id]) return;

        lines[line.id] = currentPlayer;
        line.classList.add(`taken-by-player${currentPlayer}`);

        let boxCompleted = checkForBoxCompletion(line);

        if (boxCompleted) {
            updateScores();
            if (scores[1] + scores[2] === totalBoxes) {
                endGame();
                return;
            }
            updateStatus(true);
            if (currentPlayer === 2) {
                setTimeout(makeAIMove, 500);
            }
        } else {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updateStatus();
            if (currentPlayer === 2) {
                setTimeout(makeAIMove, 500);
            }
        }
    }

    function makeAIMove() {
        if (gameOver || currentPlayer !== 2) return;

        const line = difficultyLevel === 'hard' ? makeHardAIMove() : makeEasyAIMove();

        if (line) {
            makeMove(line);
        }
    }

    // --- CHANGE 2: Upgraded Easy AI logic ---
    function makeEasyAIMove() {
        // 1. ตรวจสอบว่ามีโอกาสทำคะแนนหรือไม่ (เหมือน Hard AI)
        for (let r = 0; r < GRID_SIZE - 1; r++) {
            for (let c = 0; c < GRID_SIZE - 1; c++) {
                if (!boxes[`b-${r}-${c}`] && countTakenSides(r, c) === 3) {
                    // เจอโอกาสทำคะแนนแล้ว!
                    const winningLineId = getBoxSides(r, c).find(id => !lines[id]);
                    if (winningLineId) {
                        // แต่จะฉวยโอกาสนี้แค่ 50% เท่านั้น
                        if (Math.random() < 0.5) { // 50% ที่จะเล่นอย่างฉลาด
                            return document.getElementById(winningLineId);
                        }
                        // ถ้าไม่เข้าเงื่อนไข (อีก 50%) AI จะ "แกล้งโง่" แล้วไปเดินแบบสุ่มข้างล่างแทน
                    }
                }
            }
        }

        // 2. ถ้าไม่มีโอกาสทำคะแนน หรือ "แกล้งโง่" ให้เดินแบบสุ่ม
        const availableLines = [];
        document.querySelectorAll('.line').forEach(line => {
            if (!lines[line.id]) {
                availableLines.push(line);
            }
        });

        if (availableLines.length > 0) {
            return availableLines[Math.floor(Math.random() * availableLines.length)];
        }
        return null;
    }


    function getBoxSides(r, c) {
        return [`h-${r}-${c}`, `h-${r+1}-${c}`, `v-${r}-${c}`, `v-${r}-${c+1}`];
    }

    function countTakenSides(r, c) {
        if (r < 0 || r >= GRID_SIZE - 1 || c < 0 || c >= GRID_SIZE - 1) return 0;
        return getBoxSides(r, c).filter(id => lines[id]).length;
    }

    function isSafeMove(line) {
        const { type, r: rStr, c: cStr } = line.dataset;
        const r = parseInt(rStr);
        const c = parseInt(cStr);

        const createsTrap = (boxR, boxC) => {
            return countTakenSides(boxR, boxC) === 2;
        };

        if (type === 'h') {
            if (createsTrap(r - 1, c) || createsTrap(r, c)) {
                return false;
            }
        } else {
            if (createsTrap(r, c - 1) || createsTrap(r, c)) {
                return false;
            }
        }
        return true;
    }

    function makeHardAIMove() {
        // 1. หาตาที่ทำให้ชนะ (ปิดกล่องได้)
        for (let r = 0; r < GRID_SIZE - 1; r++) {
            for (let c = 0; c < GRID_SIZE - 1; c++) {
                if (!boxes[`b-${r}-${c}`] && countTakenSides(r, c) === 3) {
                    const winningLineId = getBoxSides(r, c).find(id => !lines[id]);
                    if (winningLineId) {
                        return document.getElementById(winningLineId);
                    }
                }
            }
        }

        // 2. ถ้าไม่มีตาที่ชนะ ให้หาตาที่ปลอดภัย
        const availableLines = [];
        document.querySelectorAll('.line').forEach(line => {
            if (!lines[line.id]) {
                availableLines.push(line);
            }
        });

        const safeMoves = availableLines.filter(line => isSafeMove(line));

        if (safeMoves.length > 0) {
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }

        // 3. ถ้าไม่มีตาที่ปลอดภัย ให้ยอมเสียสละ
        if (availableLines.length > 0) {
            return availableLines[Math.floor(Math.random() * availableLines.length)];
        }

        return null;
    }

    function checkForBoxCompletion(line) {
        const { type, r: rStr, c: cStr } = line.dataset;
        const r = parseInt(rStr);
        const c = parseInt(cStr);
        let completed = false;

        const checkAndClaim = (boxR, boxC) => {
            if (boxR >= 0 && boxR < GRID_SIZE - 1 && boxC >= 0 && boxC < GRID_SIZE - 1) {
                if (!boxes[`b-${boxR}-${boxC}`] && countTakenSides(boxR, boxC) === 4) {
                    claimBox(boxR, boxC);
                    completed = true;
                }
            }
        };

        if (type === 'h') {
            checkAndClaim(r - 1, c);
            checkAndClaim(r, c);
        } else {
            checkAndClaim(r, c - 1);
            checkAndClaim(r, c);
        }
        return completed;
    }

    function claimBox(r, c) {
        const boxId = `b-${r}-${c}`;
        if (boxes[boxId]) return;

        boxes[boxId] = currentPlayer;
        scores[currentPlayer]++;
        document.getElementById(boxId).classList.add(`box-player${currentPlayer}`);
    }

    function updateScores() {
        updateStatus();
    }

    function updateStatus(keepTurn = false) {
        if (gameOver) {
            let winnerText;
            if (scores[1] > scores[2]) {
                winnerText = "Player Wins!";
            } else if (scores[2] > scores[1]) {
                winnerText = "AI Wins!";
            } else {
                winnerText = "It's a Draw!";
            }
            statusElement.textContent = `Game Over! ${winnerText} (Player: ${scores[1]} - AI: ${scores[2]})`;
            statusElement.style.color = '#333';
            return;
        }

        let text = `Player: ${scores[1]} - AI: ${scores[2]} | `;
        if (keepTurn) {
            text += currentPlayer === 1 ? `Player gets another turn!` : `AI gets another turn!`;
        } else {
            text += currentPlayer === 1 ? `Player's Turn` : `AI's Turn`;
        }
        statusElement.textContent = text;
        statusElement.style.color = currentPlayer === 1 ? '#ff4136' : '#ffd700';
    }

    function endGame() {
        gameOver = true;
        updateStatus();
    }

    resetButton.addEventListener('click', createBoard);
    createBoard();
});