javascript:(() => {

const CONFIG_URL = "https://raw.githubusercontent.com/zacharyol/adswqeqaws-/main/config.json";

async function getConfig() {
    try {
        const res = await fetch(CONFIG_URL + "?t=" + Date.now());
        return await res.json();
    } catch {
        return { showWarning: false, enableDownload: true };
    }
}

function showWarning(message) {
    const box = document.createElement("div");
    box.textContent = message;

    Object.assign(box.style, {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#ff4444",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "8px",
        zIndex: "999999999",
        fontSize: "16px",
        fontWeight: "bold",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)"
    });

    document.documentElement.appendChild(box);

    setTimeout(() => box.remove(), 5000);
}
showWarning("TEST MESSAGE");
(async () => {

const config = await getConfig();

if (config.showWarning) {
    showWarning(config.warningMessage || "⚠️ Warning!");
}

if (location.hostname !== "grabvr.quest") {
    alert("Use this in the level viewer (grabvr.quest)");
    return;
}

const levelParam = new URLSearchParams(location.search).get("level");
if (!levelParam) {
    alert("No level ID found in URL.");
    return;
}

const [userid, levelid] = levelParam.split(":");

function extractDownloadNumber(data, userid, levelid) {
    const dataKey = data.data_key;
    if (!dataKey) return null;

    const expectedPrefix = `level_data:${userid}:${levelid}:`;
    if (!dataKey.startsWith(expectedPrefix)) return null;

    return dataKey.substring(expectedPrefix.length) || null;
}

async function downloadLevelFile(userid, levelid, number) {
    const response = await fetch(`https://api.slin.dev/grab/v1/download/${userid}/${levelid}/${number}`);
    if (!response.ok) throw new Error("Failed to download level file");
    return await response.blob();
}

fetch(`https://api.slin.dev/grab/v1/details/${userid}/${levelid}`)
.then(res => res.json())
.then(async data => {

    const downloadNumber = extractDownloadNumber(data, userid, levelid);
    if (!downloadNumber) return alert("Failed to get download number.");

    if (config.enableDownload) {
        const blob = await downloadLevelFile(userid, levelid, downloadNumber);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${levelid}.level`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } else {
        alert("Download disabled by config.");
    }

})
.catch(err => alert("Error: " + err));

})();

})();
