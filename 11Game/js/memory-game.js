document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('memory-board');
    const statusElement = document.getElementById('memory-status');
    const resetButton = document.getElementById('memory-reset-button');

    const cardEmojis = [
        '📦', '🎉', '🎈', '🎁', '🎃', '🎄', '🎊', '✨',
        '🍎', '🍕', '🚗', '🐶', '🌟', '⚽', '🎸', '🦄', '🍔', '🚀'
    ];

    let cards = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let moves = 0;
    let matchedPairs = 0;

    function startGame() {
        moves = 0;
        matchedPairs = 0;
        hasFlippedCard = false;
        lockBoard = false;
        updateStatus();

        let fullDeck = [...cardEmojis, ...cardEmojis];

        // Shuffle cards (Fisher-Yates Shuffle)
        for (let i = fullDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }

        boardElement.innerHTML = '';
        cards = [];

        fullDeck.forEach(emoji => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('memory-card');
            cardElement.dataset.emoji = emoji;

            cardElement.innerHTML = `
                <div class="memory-card-front">?</div>
                <div class="memory-card-back">${emoji}</div>
            `;

            cardElement.addEventListener('click', flipCard);
            boardElement.appendChild(cardElement);
            cards.push(cardElement);
        });
    }

    window.resetMemoryGame = startGame;

    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return; // Cannot click the same card twice

        this.classList.add('flipped');

        if (!hasFlippedCard) {
            // first card click
            hasFlippedCard = true;
            firstCard = this;
            return;
        }

        // second card click
        secondCard = this;
        lockBoard = true;

        checkForMatch();
    }

    function checkForMatch() {
        moves++;
        updateStatus();
        let isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

        isMatch ? disableCards() : unflipCards();
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);

        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        matchedPairs++;
        if (matchedPairs === cardEmojis.length) {
            setTimeout(() => {
                statusElement.textContent = `You won in ${moves} moves!`;
            }, 500);
        }

        resetBoard();
    }

    function unflipCards() {
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    function updateStatus() {
        statusElement.textContent = `Moves: ${moves}`;
    }

    resetButton.addEventListener('click', startGame);
});