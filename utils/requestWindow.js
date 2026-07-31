function getEasternTime() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "America/New_York"
        })
    );
}

function isRequestWindowOpen() {
    const now = getEasternTime();

    // Opens from the 1st through the 7th of every month
    const day = now.getDate();

    return day >= 1 && day <= 7;
}

function getWindowStatus() {
    const open = isRequestWindowOpen();

    return {
        open,
        message: open
            ? "🟢 Mobtains request window is currently OPEN."
            : "🔴 Mobtains request window is currently CLOSED."
    };
}

module.exports = {
    isRequestWindowOpen,
    getWindowStatus
};