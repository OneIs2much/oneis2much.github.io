let gameData = [];
let currentIndex = 0;
let typing = false;
let typingTimeout = null;
let fullText = "";
let shownText = "";
let charIndex = 0;

function loadGameData() {
    fetch("../assets/data/gameData.json")
        .then((response) => response.json())
        .then((data) => {
            gameData = data;
            // 检查本地存储是否有进度
            const savedIndex = localStorage.getItem("gameProgress");
            if (savedIndex !== null) {
                currentIndex = parseInt(savedIndex, 10);
            } else {
                currentIndex = 0;
            }
            updateGameScreen();
        })
        .catch((error) => {
            document.getElementById("game-content").textContent =
                "加载游戏数据失败！";
        });
}

function typeText(text, callback) {
    typing = true;
    fullText = text;
    shownText = "";
    charIndex = 0;
    const contentElement = document.getElementById("game-content");
    function typeChar() {
        if (charIndex < fullText.length) {
            shownText += fullText[charIndex];
            contentElement.textContent = shownText;
            charIndex++;
            typingTimeout = setTimeout(typeChar, 24); // 打字速度
        } else {
            typing = false;
            typingTimeout = null;
            if (callback) callback();
        }
    }
    typeChar();
}

function updateGameScreen() {
    const contentElement = document.getElementById("game-content");
    const speakerElement = document.getElementById("game-speaker");
    const nextButton = document.getElementById("next-button");
    if (currentIndex < gameData.length) {
        const currentData = gameData[currentIndex];
        speakerElement.textContent = currentData.speaker;
        typeText(currentData.content);
        nextButton.style.display = "inline-block";
    } else {
        speakerElement.textContent = "系统";
        contentElement.textContent = "游戏结束！";
        nextButton.style.display = "none";
    }
}

document.getElementById("next-button").addEventListener("click", () => {
    if (typing) {
        // 直接显示全部
        if (typingTimeout) clearTimeout(typingTimeout);
        document.getElementById("game-content").textContent = fullText;
        typing = false;
        typingTimeout = null;
    } else {
        currentIndex++;
        updateGameScreen();
    }
});

document.getElementById("game-content").addEventListener("click", () => {
    if (typing) {
        if (typingTimeout) clearTimeout(typingTimeout);
        document.getElementById("game-content").textContent = fullText;
        typing = false;
        typingTimeout = null;
    }
});

document.getElementById("save-button").addEventListener("click", () => {
    localStorage.setItem("gameProgress", currentIndex);
    alert("进度已保存！");
});

window.onload = loadGameData;
