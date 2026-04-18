javascript:(() => {

const CONFIG_URL = "https://raw.githubusercontent.com/zacharyol/adswqeqaws-/main/config.json";

/* =========================
   🎨 UI STYLES
========================= */
function injectStyles() {
    const style = document.createElement("style");
    style.innerHTML = `
    #launcherOverlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.92);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        font-family: Arial;
        color: white;
    }

    #launcherBox {
        width: 320px;
        padding: 20px;
        border-radius: 14px;
        background: #111;
        text-align: center;
        box-shadow: 0 0 25px rgba(0,0,0,0.6);
    }

    #launcherLogo {
        width: 60px;
        height: 60px;
        margin-bottom: 10px;
    }

    #launcherTitle {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 6px;
    }

    #launcherVersion {
        font-size: 12px;
        opacity: 0.7;
        margin-bottom: 15px;
    }

    .loader {
        width: 28px;
        height: 28px;
        border: 3px solid #333;
        border-top: 3px solid #fff;
        border-radius: 50%;
        margin: 0 auto;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    #launcherMessage {
        margin-top: 12px;
        font-size: 13px;
        opacity: 0.8;
    }
    `;
    document.head.appendChild(style);
}

/* =========================
   🧱 SPLASH SCREEN
========================= */
function showSplash(config) {
    const overlay = document.createElement("div");
    overlay.id = "launcherOverlay";

    overlay.innerHTML = `
        <div id="launcherBox">
            <img id="launcherLogo" src="${config.logoUrl || ""}">
            <div id="launcherTitle">Grab Launcher</div>
            <div id="launcherVersion">${config.version || "v1.0.0"}</div>
            <div class="loader"></div>
            <div id="launcherMessage">${config.message || "Loading..."}</div>
        </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
}

/* =========================
   📦 CONFIG LOADER
========================= */
async function getConfig() {
    try {
        const res = await fetch(CONFIG_URL + "?t=" + Date.now());
        return await res.json();
    } catch (e) {
        console.log("Config load failed:", e);
        return {
            version: "v0.0.0",
            showWarning: false,
            warningMessage: "",
            scriptUrl: "",
            logoUrl: ""
        };
    }
}

/* =========================
   ⚡ SAFE SCRIPT LOADER
========================= */
function loadExternalScript(url) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve();

        const s = document.createElement("script");
        s.src = url + "?t=" + Date.now();
        s.onload = () => resolve();
        s.onerror = () => reject("Script failed");
        document.head.appendChild(s);
    });
}

/* =========================
   🔄 HOT RELOAD SYSTEM
========================= */
async function hotReload(config) {
    if (config.scriptUrl) {
        try {
            await loadExternalScript(config.scriptUrl);
            console.log("🔥 Script hot-reloaded");
        } catch (e) {
            console.log("Hot reload error:", e);
        }
    }
}

/* =========================
   🚀 MAIN
========================= */
(async () => {

    injectStyles();

    // STEP 1: splash immediately (guaranteed)
    const config = await getConfig();
    const splash = showSplash(config);

    console.log("CONFIG:", config);

    // STEP 2: optional warning logic
    if (config.showWarning && config.warningMessage) {
        console.warn("⚠️ Warning:", config.warningMessage);
    }

    // STEP 3: wait a bit for “launcher feel”
    await new Promise(r => setTimeout(r, 1200));

    // STEP 4: hot load external script
    await hotReload(config);

    // STEP 5: site validation (your original logic)
    if (location.hostname !== "grabvr.quest") {
        splash.innerHTML = `
            <div id="launcherBox">
                <div id="launcherTitle">Wrong Site</div>
                <div id="launcherMessage">Use this on grabvr.quest</div>
            </div>
        `;
        return;
    }

    const levelParam = new URLSearchParams(location.search).get("level");
    if (!levelParam) {
        splash.innerHTML = `
            <div id="launcherBox">
                <div id="launcherTitle">No Level Found</div>
            </div>
        `;
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

    try {
        const res = await fetch(
            `https://api.slin.dev/grab/v1/details/${userid}/${levelid}`
        );
        const data = await res.json();

        const downloadNumber = extractDownloadNumber(data, userid, levelid);
        if (!downloadNumber) throw new Error("No download number");

        const blob = await downloadLevelFile(userid, levelid, downloadNumber);

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${levelid}.level`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        splash.innerHTML = `
            <div id="launcherBox">
                <div id="launcherTitle">Success</div>
                <div id="launcherMessage">Level downloaded</div>
            </div>
        `;

        setTimeout(() => splash.remove(), 1500);

    } catch (err) {
        splash.innerHTML = `
            <div id="launcherBox">
                <div id="launcherTitle">Error</div>
                <div id="launcherMessage">${err}</div>
            </div>
        `;
    }

})();

})();
