window.onload = function () {
    const progressInfo = document.getElementById("progress-info");
    const continueButton = document.getElementById("continue-button");
    const savedIndex = localStorage.getItem("gameProgress");
    if (savedIndex !== null) {
        progressInfo.textContent = `已保存的进度：第 ${
            parseInt(savedIndex, 10) + 1
        } 条对话`;
        continueButton.disabled = false;
    } else {
        progressInfo.textContent = "没有找到已保存的进度。";
        continueButton.disabled = true;
    }
    continueButton.onclick = function () {
        window.location.href = "../game/index.html";
    };
};
