document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const paletteElement = document.getElementById('sudoku-palette');
    const statusElement = document.getElementById('sudoku-status');
    const checkButton = document.getElementById('sudoku-check-button');
    const resetButton = document.getElementById('sudoku-reset-button');

    // --- เพิ่มใหม่ ---: Element สำหรับแสดงข้อมูลเกม
    const timerDisplay = document.getElementById('timer-display');
    const checkCountDisplay = document.getElementById('check-count-display');

    let solution, puzzle, boardState;
    let selectedNumber = null;
    let selectedCell = null;

    // --- เพิ่มใหม่ ---: ตัวแปรสำหรับนับและจับเวลา
    let checkCount = 0;
    let timerInterval = null;
    let startTime = 0;

    // --- ส่วนของโค้ดสำหรับสร้าง Sudoku (เหมือนเดิม ไม่มีการเปลี่ยนแปลง) ---
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    function isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
            const boxCol = 3 * Math.floor(col / 3) + i % 3;
            if (board[row][i] === num || board[i][col] === num || board[boxRow][boxCol] === num) {
                return false;
            }
        }
        return true;
    }
    function solveGrid(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (const num of numbers) {
                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (solveGrid(board)) {
                                return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    function countSolutions(board) {
        let count = 0;
        function solve() {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        for (let num = 1; num <= 9 && count < 2; num++) {
                            if (isValid(board, row, col, num)) {
                                board[row][col] = num;
                                solve();
                                board[row][col] = 0;
                            }
                        }
                        return;
                    }
                }
            }
            count++;
        }
        solve();
        return count;
    }
    function generateSudoku(difficulty = 0.5) {
        const board = Array(9).fill(0).map(() => Array(9).fill(0));
        solveGrid(board);
        const solutionGrid = board.map(row => [...row]);
        const puzzleGrid = board.map(row => [...row]);
        const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
        let attempts = Math.floor(81 * difficulty);
        let removed = 0;
        for (const cellIndex of cells) {
            if (removed > attempts) break;
            const row = Math.floor(cellIndex / 9);
            const col = cellIndex % 9;
            const temp = puzzleGrid[row][col];
            puzzleGrid[row][col] = 0;
            removed++;
            const boardCopy = puzzleGrid.map(r => [...r]);
            if (countSolutions(boardCopy) !== 1) {
                puzzleGrid[row][col] = temp;
                removed--;
            }
        }
        const solution1D = solutionGrid.flat();
        const puzzle1D = puzzleGrid.flat();
        return [solution1D, puzzle1D];
    }
    // --- สิ้นสุดส่วนของโค้ดสำหรับสร้าง Sudoku ---

    // --- แก้ไข ---: ฟังก์ชัน startGame
    function startGame() {
        // 1. หยุด Timer เก่า (ถ้ามี) และรีเซ็ตค่าต่างๆ
        if (timerInterval) clearInterval(timerInterval);
        checkCount = 0;
        checkCountDisplay.textContent = '0';
        timerDisplay.textContent = '00:00';

        // 2. สร้างโจทย์ใหม่
        const [newSolution, newPuzzle] = generateSudoku(0.65);

        // 3. อัปเดตสถานะเกม
        solution = newSolution;
        puzzle = newPuzzle;
        boardState = [...puzzle];
        selectedNumber = null;
        selectedCell = null;
        statusElement.textContent = "Select a number and fill the board.";
        statusElement.style.color = 'black';

        // 4. วาดกระดานใหม่
        renderBoard();
        renderPalette();

        // 5. เริ่มจับเวลาใหม่
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // --- เพิ่มใหม่ ---: ฟังก์ชันสำหรับอัปเดตเวลาที่แสดงผล
    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        // padStart(2, '0') คือการเติม 0 ข้างหน้าถ้ามีแค่เลขหลักเดียว เช่น 5 -> 05
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    window.resetSudokuGame = startGame;

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('sudoku-cell');
            cell.dataset.index = i;
            const row = Math.floor(i / 9);
            const col = i % 9;
            if ((col + 1) % 3 === 0 && col < 8) {
                cell.style.borderRight = "3px solid #333";
            }
            if ((row + 1) % 3 === 0 && row < 8) {
                cell.style.borderBottom = "3px solid #333";
            }
            if (boardState[i] !== 0) {
                cell.textContent = boardState[i];
                if (puzzle[i] !== 0) {
                    cell.classList.add('given');
                } else {
                    cell.classList.add('user-filled');
                }
            }
            if (puzzle[i] === 0) {
                cell.addEventListener('click', handleCellClick);
            }
            boardElement.appendChild(cell);
        }
    }

    function renderPalette() {
        paletteElement.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const numElement = document.createElement('div');
            numElement.classList.add('sudoku-palette-number');
            numElement.textContent = i;
            numElement.dataset.number = i;
            numElement.addEventListener('click', handlePaletteClick);
            paletteElement.appendChild(numElement);
        }
        const eraserElement = document.createElement('div');
        eraserElement.classList.add('sudoku-palette-number');
        eraserElement.innerHTML = '🢀';
        eraserElement.title = "Erase";
        eraserElement.dataset.number = 0;
        eraserElement.addEventListener('click', handlePaletteClick);
        paletteElement.appendChild(eraserElement);
    }

    function handlePaletteClick(event) {
        selectedNumber = parseInt(event.currentTarget.dataset.number);
        document.querySelectorAll('.sudoku-palette-number').forEach(p => p.classList.remove('selected'));
        event.currentTarget.classList.add('selected');
    }

    function handleCellClick(event) {
        const cell = event.currentTarget;
        const index = parseInt(cell.dataset.index);
        if (selectedNumber !== null) {
            if (boardState[index] === selectedNumber) {
                boardState[index] = 0;
            } else {
                boardState[index] = selectedNumber;
            }
            updateCell(index);
        }
        if (selectedCell) selectedCell.classList.remove('selected');
        document.querySelectorAll('.sudoku-cell').forEach(c => c.classList.remove('selected'));
        selectedCell = cell;
        cell.classList.add('selected');
    }

    function updateCell(index) {
        const cell = boardElement.querySelector(`[data-index='${index}']`);
        if (boardState[index] === 0) {
            cell.textContent = '';
            cell.classList.remove('user-filled');
        } else {
            cell.textContent = boardState[index];
            cell.classList.add('user-filled');
        }
        cell.classList.remove('error');
    }

    // --- แก้ไข ---: ฟังก์ชัน checkSolution
    function checkSolution() {
        // 1. เพิ่มจำนวนการเช็คและอัปเดตการแสดงผล
        checkCount++;
        checkCountDisplay.textContent = checkCount;

        let errors = 0;
        let filledCount = 0;

        for (let i = 0; i < 81; i++) {
            const cellElement = boardElement.querySelector(`[data-index='${i}']`);
            cellElement.classList.remove('error');
            if (boardState[i] !== 0) {
                filledCount++;
                if (boardState[i] !== solution[i]) {
                    errors++;
                    if (!cellElement.classList.contains('given')) {
                        cellElement.classList.add('error');
                    }
                }
            }
        }

        if (errors > 0) {
            statusElement.textContent = `Found ${errors} error(s). Keep trying!`;
            statusElement.style.color = 'red';
        } else if (filledCount < 81) {
            statusElement.textContent = "Board not full, but no errors so far!";
            statusElement.style.color = '#007bff';
        } else {
            // 2. เมื่อชนะ: หยุดเวลา และแสดงผลสรุป
            clearInterval(timerInterval); // หยุดการนับเวลา
            const finalTime = timerDisplay.textContent;

            // ใช้ innerHTML เพื่อให้สามารถขึ้นบรรทัดใหม่ด้วย <br> ได้
            statusElement.innerHTML = `Congratulations! You solved it!<br>Time: ${finalTime} | Checks: ${checkCount}`;
            statusElement.style.color = 'green';
            
            // Disable board after solving
            document.querySelectorAll('.sudoku-cell').forEach(c => c.removeEventListener('click', handleCellClick));
        }
    }

    checkButton.addEventListener('click', checkSolution);
    resetButton.addEventListener('click', startGame);

    // startGame(); // ถูกเรียกจากที่อื่น
});
