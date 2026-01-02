document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('nim-game');
    const statusElement = document.getElementById('nim-status');
    const pilesContainer = document.getElementById('nim-piles-container');
    const takeAmountInput = document.getElementById('nim-take-input');
    const takeButton = document.getElementById('nim-take-button');
    const resetButton = document.getElementById('nim-reset-button');

    let piles = [];
    let selectedPileIndex = -1;
    let gameOver = false;
    let isPlayerTurn = true;
    let difficultyLevel = 'easy';  // เปลี่ยนจาก 'hard' เป็น 'easy'

if (!gameContainer.querySelector('.difficulty-selector')) {
    const difficultySelector = document.createElement('div');
    difficultySelector.innerHTML = `
        <div style="margin: 10px 0; text-align: center;">
            <label for="nim-difficulty">AI Difficulty: </label>
            <select id="nim-difficulty" style="padding: 5px; margin: 0 10px;">
                <option value="easy" selected>Easy</option>  <!-- เลือก easy เป็นค่าเริ่มต้น -->
                <option value="hard">Hard</option>
            </select>
        </div>
    `;

    statusElement.insertAdjacentElement('afterend', difficultySelector);

    difficultySelector.querySelector('#nim-difficulty').addEventListener('change', (e) => {
        difficultyLevel = e.target.value;
        startGame();  // เริ่มเกมใหม่เมื่อเปลี่ยน difficulty
    });
}


    function startGame() {
        piles = [3, 5, 7];
        selectedPileIndex = -1;
        gameOver = false;
        isPlayerTurn = true;
        takeAmountInput.value = 1;
        renderPiles();
        updateStatus();
    }
    window.resetNimGame = startGame;

    function renderPiles() {
        pilesContainer.innerHTML = '';
        piles.forEach((itemCount, index) => {
            const pileElement = document.createElement('div');
            pileElement.classList.add('nim-pile');
            pileElement.dataset.pileIndex = index;
            if (index === selectedPileIndex && isPlayerTurn) {
                pileElement.classList.add('selected');
            }
            if (itemCount === 0) {
                pileElement.classList.add('empty');
            }
            for (let i = 0; i < itemCount; i++) {
                const itemElement = document.createElement('div');
                itemElement.classList.add('nim-item');
                pileElement.appendChild(itemElement);
            }
            pileElement.addEventListener('click', handlePileClick);
            pilesContainer.appendChild(pileElement);
        });
    }

    function handlePileClick(event) {
        if (gameOver || !isPlayerTurn) return;
        const clickedIndex = parseInt(event.currentTarget.dataset.pileIndex);
        if (piles[clickedIndex] > 0) {
            selectedPileIndex = clickedIndex;
            renderPiles();
            updateStatus();
        }
    }

    function handleTakeTurn() {
        if (gameOver || selectedPileIndex === -1 || !isPlayerTurn) {
             alert("Please select a pile first.");
             return;
        }
        const amountToTake = parseInt(takeAmountInput.value);
        if (isNaN(amountToTake) || amountToTake <= 0 || amountToTake > piles[selectedPileIndex]) {
            alert("Invalid number of items to take.");
            return;
        }
        makeMove(selectedPileIndex, amountToTake, 'Player');
        if (!gameOver) {
            setTimeout(makeAIMove, 800);
        }
    }

    function makeMove(pileIndex, amount, player) {
        piles[pileIndex] -= amount;

        const totalItemsLeft = piles.reduce((sum, current) => sum + current, 0);
        if (totalItemsLeft === 0) {
            gameOver = true;
            const winner = player === 'Player' ? 'AI' : 'Player';
            statusElement.textContent = `${player} took the last item and LOST! ${winner} Wins!`;
            
            // --- CHANGE 2: เปลี่ยนสีผู้ชนะตามเงื่อนไขใหม่ ---
            // AI ชนะ -> สีเหลือง, ผู้เล่นชนะ -> สีแดง
            statusElement.style.color = winner === 'AI' ? '#ffd700' : '#ff4136';

        } else {
            isPlayerTurn = !isPlayerTurn;
            selectedPileIndex = -1;
            updateStatus();
        }
        renderPiles();
    }

    function makeAIMove() {
        if (gameOver) return;
        // --- CHANGE 3: เรียกใช้ AI ที่สมบูรณ์แบบที่สุด ---
        const move = difficultyLevel === 'hard' ? getPerfectMisereMove() : getRandomMove();
        if (move) {
            makeMove(move.pileIndex, move.amount, 'AI');
        }
    }
    
    // AI ระดับง่าย (สุ่ม)
    function getRandomMove() {
        const availablePiles = piles.map((count, index) => ({ index, count }))
            .filter(pile => pile.count > 0);
        if (availablePiles.length === 0) return null;
        const randomPile = availablePiles[Math.floor(Math.random() * availablePiles.length)];
        const amount = Math.floor(Math.random() * randomPile.count) + 1;
        return { pileIndex: randomPile.index, amount: amount };
    }

    // ฟังก์ชันคำนวณ Nim-Sum
    function calculateNimSum(currentPiles) {
        return currentPiles.reduce((xor, pile) => xor ^ pile, 0);
    }
    
    // --- AI ที่สมบูรณ์แบบสำหรับ Misère Play (เวอร์ชัน Final) ---
    function getPerfectMisereMove() {
        const totalStones = piles.reduce((a, b) => a + b, 0);
        const pilesGreaterThanOne = piles.filter(p => p > 1).length;

        if (pilesGreaterThanOne > 0) {
            const amountToTake = totalStones - 1;
            for (let i = 0; i < piles.length; i++) {
                if (piles[i] >= amountToTake) {
                     return { pileIndex: i, amount: amountToTake };
                }
            }
        }

        const nimSum = calculateNimSum(piles);
        if (pilesGreaterThanOne === 0) {
            return { pileIndex: piles.findIndex(p => p === 1), amount: 1 };
        } else {
            if (nimSum === 0) {
                return { pileIndex: piles.indexOf(Math.max(...piles)), amount: 1 };
            }
            for (let i = 0; i < piles.length; i++) {
                const targetSize = piles[i] ^ nimSum;
                if (targetSize < piles[i]) {
                    const testPiles = [...piles];
                    testPiles[i] = targetSize;
                    if (testPiles.filter(p => p > 1).length === 0) {
                        if (calculateNimSum(testPiles) === 0) {
                            continue;
                        }
                    }
                    return { pileIndex: i, amount: piles[i] - targetSize };
                }
            }
            return { pileIndex: piles.indexOf(Math.max(...piles)), amount: 1 };
        }
    }

    function updateStatus() {
        if (gameOver) return;
        let statusText = isPlayerTurn ? "Your Turn. " : "AI is thinking...";
        if (isPlayerTurn) {
            if (selectedPileIndex !== -1) {
                statusText += `Selected pile with ${piles[selectedPileIndex]} items.`;
            } else {
                statusText += "Select a pile.";
            }
        }
        statusElement.textContent = statusText;
        // สีตอนเล่นยังคงเหมือนเดิม: Your Turn สีแดง, AI's Turn สีเหลือง
        statusElement.style.color = isPlayerTurn ? '#ff4136' : '#ffd700';
    }

    takeButton.addEventListener('click', handleTakeTurn);
    resetButton.addEventListener('click', startGame);

    document.getElementById('nim-increase').addEventListener('click', () => {
        const input = document.getElementById('nim-take-input');
        input.value = parseInt(input.value) + 1;
    });

    document.getElementById('nim-decrease').addEventListener('click', () => {
        const input = document.getElementById('nim-take-input');
        if (parseInt(input.value) > 1) {
            input.value = parseInt(input.value) - 1;
        }
    });
    
    startGame();
});