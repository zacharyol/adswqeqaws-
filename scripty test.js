javascript:(() => {

const CONFIG_URL = "https://raw.githubusercontent.com/zacharyol/adswqeqaws-/main/config.json?nocache=" + Date.now();

function showWarning(message) {
    const box = document.createElement("div");
    box.textContent = message;

    Object.assign(box.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#ff4444",
        color: "#fff",
        padding: "14px 22px",
        borderRadius: "10px",
        zIndex: 2147483647,
        fontSize: "16px",
        fontWeight: "bold",
        boxShadow: "0 0 20px rgba(0,0,0,0.5)"
    });

    (document.body || document.documentElement).appendChild(box);

    setTimeout(() => box.remove(), 5000);
}

async function getConfig() {
    try {
        const res = await fetch(CONFIG_URL + "?t=" + Date.now());
        const text = await res.text();
        return JSON.parse(text);
    } catch (e) {
        console.log("Config load failed:", e);
        return {
            showWarning: false,
            enableDownload: true,
            warningMessage: ""
        };
    }
}

(async () => {

    const config = await getConfig();
    console.log("CONFIG LOADED:", config);

    if (config.showWarning === true) {
        const msg = config.warningMessage;
        if (typeof msg === "string" && msg.trim().length > 0) {
            showWarning(msg);
        } else {
            showWarning("⚠️ Warning enabled but no message set");
        }
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
        const key = data.data_key;
        if (!key) return null;

        const prefix = `level_data:${userid}:${levelid}:`;
        if (!key.startsWith(prefix)) return null;

        return key.slice(prefix.length);
    }

    async function downloadLevelFile(userid, levelid, number) {
        const res = await fetch(
            `https://api.slin.dev/grab/v1/download/${userid}/${levelid}/${number}`
        );

        if (!res.ok) throw new Error("Download failed");
        return await res.blob();
    }

    fetch(`https://api.slin.dev/grab/v1/details/${userid}/${levelid}`)
        .then(res => res.json())
        .then(async data => {

            const downloadNumber = extractDownloadNumber(data, userid, levelid);
            if (!downloadNumber) return alert("Failed to get download number.");

            if (config.enableDownload === true) {
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
