document.addEventListener('DOMContentLoaded', () => {
    const scoreElement = document.getElementById('rps-score');
    const statusElement = document.getElementById('rps-status');
    const playerChoiceElement = document.getElementById('rps-player-choice');
    const computerChoiceElement = document.getElementById('rps-computer-choice');
    const choiceButtons = document.querySelectorAll('.rps-choice-btn');
    const resetButton = document.getElementById('rps-reset-button');

    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { 'rock': '✊', 'paper': '✋', 'scissors': '✌️' };
    const rules = {
        'rock': 'scissors',
        'paper': 'rock',
        'scissors': 'paper'
    };

    let score = { player: 0, computer: 0 };
    let playerHistory = [];

    function startGame() {
        score = { player: 0, computer: 0 };
        playerHistory = [];
        updateScore();
        statusElement.textContent = "Choose your weapon!";
        statusElement.style.color = 'black';
        playerChoiceElement.textContent = '?';
        computerChoiceElement.textContent = '?';
    }
    // ใช้ชื่อ resetRpsGame เพราะใน HTML data-game="rps"
    window.resetRpsGame = startGame;

    function playRound(playerChoice) {
        playerHistory.push(playerChoice);
        const computerChoice = getComputerChoice();

        playerChoiceElement.textContent = emojis[playerChoice];
        computerChoiceElement.textContent = emojis[computerChoice];

        if (playerChoice === computerChoice) {
            // Draw
            statusElement.textContent = "It's a Draw!";
            statusElement.style.color = 'grey';
        } else if (rules[playerChoice] === computerChoice) {
            // Player wins
            score.player++;
            statusElement.textContent = "You Win!";
            statusElement.style.color = 'green';
        } else {
            // Computer wins
            score.computer++;
            statusElement.textContent = "You Lose!";
            statusElement.style.color = 'red';
        }
        updateScore();
    }

    function getComputerChoice() {
        // ในช่วง 4 ตาแรก ให้สุ่มไปก่อน
        if (playerHistory.length < 4) {
            return choices[Math.floor(Math.random() * choices.length)];
        }

        // ตรวจสอบการเล่นของผู้เล่นก่อนหน้านี้
        const lastMove = playerHistory[playerHistory.length - 2];
        const nextMoveCounts = { rock: 0, paper: 0, scissors: 0 };

        for (let i = 0; i < playerHistory.length - 1; i++) {
            if (playerHistory[i] === lastMove) {
                const nextMove = playerHistory[i + 1];
                nextMoveCounts[nextMove]++;
            }
        }

        // หาว่าผู้เล่นมีแนวโน้มจะออกอะไรมากที่สุด
        let predictedPlayerMove = null;
        let maxCount = 0;
        for (const move in nextMoveCounts) {
            if (nextMoveCounts[move] > maxCount) {
                maxCount = nextMoveCounts[move];
                predictedPlayerMove = move;
            }
        }

        // ถ้ามีรูปแบบที่ชัดเจน ให้เลือกตัวที่ชนะทางนั้น
        if (predictedPlayerMove && maxCount > 0) {
            // หาตัวที่ชนะ predictedPlayerMove
            const winningMove = Object.keys(rules).find(key => rules[key] === predictedPlayerMove);
            return winningMove;
        } else {
            // ถ้าไม่มีรูปแบบชัดเจน ให้สุ่ม
            return choices[Math.floor(Math.random() * choices.length)];
        }
    }

    function updateScore() {
        scoreElement.textContent = `Player: ${score.player} - Computer: ${score.computer}`;
    }

    choiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            playRound(button.dataset.choice);
        });
    });

    resetButton.addEventListener('click', startGame);
});