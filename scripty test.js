javascript:(() => {

const CONFIG_URLS = [
  "https://raw.githubusercontent.com/zacharyol/adswqeqaws-/main/config.json",
  "https://cdn.jsdelivr.net/gh/zacharyol/adswqeqaws-/config.json"
];

/* =========================
   💀 HARD RESET (IMPORTANT)
   DESTROYS ALL OLD STATE
========================= */
function hardReset() {

    // remove old launcher UI
    document.getElementById("launcherOverlay")?.remove();

    // remove old injected scripts
    document.querySelectorAll("script[data-grab-launcher]").forEach(s => s.remove());

    // clear old styles
    document.getElementById("grabLauncherStyles")?.remove();

    // force garbage break references
    window.__GRAB_CONFIG__ = null;
    window.__LAUNCHER_UI__ = null;

}

/* =========================
   🎨 STYLES
========================= */
function injectStyles() {
    const style = document.createElement("style");
    style.id = "grabLauncherStyles";
    style.innerHTML = `
    #launcherOverlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        font-family: Arial;
        color: white;
    }

    #launcherBox {
        width: 360px;
        padding: 22px;
        border-radius: 14px;
        background: #111;
        text-align: center;
        box-shadow: 0 0 25px rgba(0,0,0,0.8);
    }

    #launcherLogo {
        width: 64px;
        height: 64px;
        margin-bottom: 10px;
    }

    #launcherTitle {
        font-size: 18px;
        font-weight: bold;
    }

    #launcherVersion {
        font-size: 12px;
        opacity: 0.7;
        margin-bottom: 14px;
    }

    #launcherStatus {
        font-size: 13px;
        margin: 10px 0;
        min-height: 18px;
    }

    #barOuter {
        width: 100%;
        height: 10px;
        background: #222;
        border-radius: 6px;
        overflow: hidden;
    }

    #barInner {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg,#fff,#888);
        transition: width 0.25s ease;
    }
    `;
    document.head.appendChild(style);
}

/* =========================
   🧱 UI
========================= */
function createUI(config) {

    const overlay = document.createElement("div");
    overlay.id = "launcherOverlay";

    overlay.innerHTML = `
        <div id="launcherBox">
            <img id="launcherLogo" src="${config.logoUrl || ""}">
            <div id="launcherTitle">Grab Launcher</div>
            <div id="launcherVersion">${config.version || "v0.0.0"}</div>

            <div id="launcherStatus">Starting...</div>

            <div id="barOuter">
                <div id="barInner"></div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    return {
        overlay,
        status: overlay.querySelector("#launcherStatus"),
        bar: overlay.querySelector("#barInner")
    };
}

/* =========================
   📊 STEP CONTROL
========================= */
function step(ui, text, percent) {
    ui.status.innerText = text;
    ui.bar.style.width = percent + "%";
}

/* =========================
   📦 CONFIG (FORCE FRESH)
========================= */
async function getConfig() {

    const bust = Date.now() + "_" + Math.random();

    for (const url of CONFIG_URLS) {
        try {
            const res = await fetch(url + "?bust=" + bust, {
                cache: "no-store"
            });

            const text = await res.text();
            const json = JSON.parse(text);

            if (json?.version) {
                window.__GRAB_CONFIG__ = json;
                return structuredClone(json);
            }

        } catch (e) {}
    }

    return {
        version: "v0.0.0",
        scriptUrl: "",
        logoUrl: ""
    };
}

/* =========================
   ⚡ SCRIPT LOADER (NO CACHE)
========================= */
function loadScript(url) {
    return new Promise((resolve, reject) => {

        if (!url) return resolve();

        const s = document.createElement("script");
        s.dataset.grabLauncher = "true";
        s.src = url + "?v=" + Date.now() + "&r=" + Math.random();

        s.onload = resolve;
        s.onerror = reject;

        document.head.appendChild(s);
    });
}

/* =========================
   🚀 MAIN BOOT
========================= */
(async () => {

    // 💀 ALWAYS HARD RESET FIRST
    hardReset();

    injectStyles();

    const config = await getConfig();
    const ui = createUI(config);

    window.__LAUNCHER_UI__ = ui;

    /* =========================
       BOOT STEPS
    ========================= */

    step(ui, "Connecting...", 10);
    await new Promise(r => setTimeout(r, 400));

    step(ui, "Fetching config...", 30);
    await new Promise(r => setTimeout(r, 400));

    step(ui, "Validating version...", 55);
    await new Promise(r => setTimeout(r, 400));

    step(ui, "Injecting modules...", 75);

    await loadScript(config.scriptUrl);

    /* =========================
       SITE CHECK
    ========================= */
    if (location.hostname !== "grabvr.quest") {
        step(ui, "Invalid site", 100);
        ui.status.innerText = "Use this on grabvr.quest";
        return;
    }

    const levelParam = new URLSearchParams(location.search).get("level");
    if (!levelParam) {
        step(ui, "Error", 100);
        ui.status.innerText = "No level found";
        return;
    }

    const [userid, levelid] = levelParam.split(":");

    function extract(data) {
        const key = data.data_key;
        if (!key) return null;

        const prefix = `level_data:${userid}:${levelid}:`;
        if (!key.startsWith(prefix)) return null;

        return key.slice(prefix.length);
    }

    async function download(userid, levelid, num) {
        const res = await fetch(
            `https://api.slin.dev/grab/v1/download/${userid}/${levelid}/${num}`
        );
        if (!res.ok) throw new Error("Download failed");
        return await res.blob();
    }

    try {

        step(ui, "Loading level...", 85);

        const res = await fetch(
            `https://api.slin.dev/grab/v1/details/${userid}/${levelid}`
        );

        const data = await res.json();

        const num = extract(data);
        if (!num) throw new Error("Missing download id");

        step(ui, "Downloading...", 95);

        const blob = await download(userid, levelid, num);

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${levelid}.level`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        step(ui, "Complete", 100);

        setTimeout(() => ui.overlay.remove(), 1000);

    } catch (err) {
        step(ui, "Error", 100);
        ui.status.innerText = err;
    }

})();

})();
