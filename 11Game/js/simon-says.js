document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('simon-status');
    const startButton = document.getElementById('simon-start-button');
    const simonButtons = document.querySelectorAll('.simon-button');

    const buttons = [
        document.querySelector('.simon-button.green'),
        document.querySelector('.simon-button.red'),
        document.querySelector('.simon-button.yellow'),
        document.querySelector('.simon-button.blue')
    ];

    let sequence = [];
    let playerSequence = [];
    let level = 0;
    let isPlayerTurn = false;

    function startGame() {
        level = 0;
        sequence = [];
        playerSequence = [];
        isPlayerTurn = false;
        startButton.disabled = false;
        statusElement.textContent = "Press Start to Play";
    }
    // ใช้ชื่อ resetSimonGame เพราะใน HTML เรามีแค่ data-game="simon"
    window.resetSimonGame = startGame; 
    
    function nextRound() {
        isPlayerTurn = false;
        playerSequence = [];
        level++;
        statusElement.textContent = `Level: ${level}`;
        
        // เพิ่มสีใหม่ในลำดับ
        const nextColorIndex = Math.floor(Math.random() * 4);
        sequence.push(nextColorIndex);
        
        // หน่วงเวลาเล็กน้อยก่อนเริ่มเล่นลำดับ
        setTimeout(() => playSequence(), 1000);
    }

    function playSequence() {
        let i = 0;
        const intervalId = setInterval(() => {
            if (i >= sequence.length) {
                clearInterval(intervalId);
                isPlayerTurn = true;
                statusElement.textContent = `Level: ${level} - Your Turn!`;
                return;
            }
            lightUpButton(sequence[i]);
            i++;
        }, 800); // ความเร็วในการแสดงลำดับ
    }

    function lightUpButton(index) {
        buttons[index].classList.add('lit');
        setTimeout(() => {
            buttons[index].classList.remove('lit');
        }, 400); // ระยะเวลาที่ปุ่มสว่าง
    }

    function handlePlayerClick(event) {
        if (!isPlayerTurn) return;

        const clickedColorIndex = parseInt(event.currentTarget.dataset.color);
        lightUpButton(clickedColorIndex);
        playerSequence.push(clickedColorIndex);

        // ตรวจสอบการกด
        const lastPlayerIndex = playerSequence.length - 1;
        if (playerSequence[lastPlayerIndex] !== sequence[lastPlayerIndex]) {
            endGame();
            return;
        }

        // ถ้าผู้เล่นกดครบตามลำดับของรอบนี้แล้ว
        if (playerSequence.length === sequence.length) {
            statusElement.textContent = 'Correct! Get ready...';
            isPlayerTurn = false;
            setTimeout(() => nextRound(), 1500);
        }
    }
    
    function endGame() {
        isPlayerTurn = false;
        statusElement.textContent = `Game Over! You reached Level ${level}. Press Start to try again.`;
        startButton.disabled = false;
    }

    startButton.addEventListener('click', () => {
        startButton.disabled = true;
        statusElement.textContent = "Get Ready...";
        startGame(); // รีเซ็ตค่าเผื่อเล่นซ้ำ
        setTimeout(() => nextRound(), 1000);
    });

    simonButtons.forEach(button => {
        button.addEventListener('click', handlePlayerClick);
    });
});