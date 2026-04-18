javascript:(() => {

const CONFIG_URLS = [
  "https://raw.githubusercontent.com/zacharyol/adswqeqaws-/main/config.json",
  "https://cdn.jsdelivr.net/gh/zacharyol/adswqeqaws-/config.json"
];

/* =========================
   💀 HARD RESET (ALWAYS CLEAN)
========================= */
function hardReset() {
    document.getElementById("launcherOverlay")?.remove();
    document.getElementById("grabLauncherStyles")?.remove();
    document.querySelectorAll("script[data-grab]").forEach(s => s.remove());
}

/* =========================
   🎨 STYLES (WARNING FLASH INCLUDED)
========================= */
function injectStyles() {
    const style = document.createElement("style");
    style.id = "grabLauncherStyles";
    style.innerHTML = `
    #launcherOverlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.96);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        font-family: monospace;
        color: white;
    }

    #launcherBox {
        width: 430px;
        padding: 16px;
        border-radius: 12px;
        background: #0c0c0c;
        box-shadow: 0 0 30px rgba(0,0,0,0.8);
    }

    #title { font-size: 16px; font-weight: bold; }
    #version { font-size: 11px; opacity: 0.6; margin-bottom: 10px; }

    #progressOuter {
        width: 100%;
        height: 8px;
        background: #222;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 10px;
    }

    #progressInner {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg,#fff,#777);
        transition: width 0.15s;
    }

    #console {
        height: 140px;
        overflow-y: auto;
        font-size: 12px;
        background: #050505;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid #222;
    }

    .line {
        opacity: 0;
        animation: fadeIn 0.2s forwards;
    }

    @keyframes fadeIn {
        to { opacity: 1; }
    }

    /* ⚠ WARNING FLASH */
    #warningScreen {
        position: fixed;
        inset: 0;
        display: none;
        justify-content: center;
        align-items: center;
        font-family: monospace;
        font-size: 20px;
        z-index: 999999999;
        color: white;
        background: black;
        animation: flash 0.4s infinite alternate;
    }

    @keyframes flash {
        0% { background: black; color: red; }
        100% { background: red; color: black; }
    }
    `;
    document.head.appendChild(style);
}

/* =========================
   ⚠ WARNING SCREEN
========================= */
function showWarning(message) {

    const warn = document.createElement("div");
    warn.id = "warningScreen";
    warn.innerText = "⚠ " + message;

    document.body.appendChild(warn);
    warn.style.display = "flex";

    return warn;
}

/* =========================
   🧱 UI
========================= */
function createUI(config) {

    const overlay = document.createElement("div");
    overlay.id = "launcherOverlay";

    overlay.innerHTML = `
        <div id="launcherBox">
            <div id="title">Grab Launcher</div>
            <div id="version">${config.version}</div>

            <div id="progressOuter">
                <div id="progressInner"></div>
            </div>

            <div id="console"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    return {
        bar: overlay.querySelector("#progressInner"),
        console: overlay.querySelector("#console")
    };
}

/* =========================
   📟 LOGGER
========================= */
function logger(el) {

    const log = (txt) => {
        const div = document.createElement("div");
        div.className = "line";
        div.innerText = "» " + txt;
        el.appendChild(div);
        el.scrollTop = el.scrollHeight;
    };

    return { log };
}

/* =========================
   📦 CONFIG (NO CACHE EVER)
========================= */
async function getConfig() {

    const bust = Date.now() + Math.random();

    for (const url of CONFIG_URLS) {
        try {
            const res = await fetch(url + "?bust=" + bust, {
                cache: "no-store"
            });

            const json = await res.json();
            if (json?.version) return json;

        } catch {}
    }

    return {
        version: "v0.0.0",
        scriptUrl: "",
        showWarning: false,
        warningMessage: ""
    };
}

/* =========================
   ⚡ SCRIPT LOADER
========================= */
function loadScript(url) {
    return new Promise((resolve) => {
        if (!url) return resolve();

        const s = document.createElement("script");
        s.dataset.grab = "1";
        s.src = url + "?v=" + Date.now();
        s.onload = resolve;
        document.head.appendChild(s);
    });
}

/* =========================
   🎲 RANDOM BOOT SPEED ENGINE
========================= */
function randomDelay() {
    const speeds = [
        120, 180, 250, 320, 400, 550
    ];
    return speeds[Math.floor(Math.random() * speeds.length)];
}

/* =========================
   🚀 MAIN
========================= */
(async () => {

    hardReset();
    injectStyles();

    const config = await getConfig();
    const ui = createUI(config);
    const log = logger(ui.console);

    const setBar = (p) => ui.bar.style.width = p + "%";

    /* =========================
       ⚠ WARNING SYSTEM
    ========================= */
    if (config.showWarning) {

        const warn = showWarning(config.warningMessage);

        await new Promise(r => setTimeout(r, 2500));

        warn.remove();
    }

    /* =========================
       🔥 BOOT SEQUENCE (RANDOM SPEED)
    ========================= */

    log.log("Connecting...");
    setBar(10);
    await new Promise(r => setTimeout(r, randomDelay()));

    log.log("Fetching config...");
    setBar(25);
    await new Promise(r => setTimeout(r, randomDelay()));

    log.log("Validating version...");
    setBar(45);
    await new Promise(r => setTimeout(r, randomDelay()));

    log.log("Injecting modules...");
    setBar(65);

    await loadScript(config.scriptUrl);

    await new Promise(r => setTimeout(r, randomDelay()));

    if (location.hostname !== "grabvr.quest") {
        log.log("Invalid host");
        return;
    }

    const level = new URLSearchParams(location.search).get("level");
    if (!level) {
        log.log("No level found");
        return;
    }

    const [userid, levelid] = level.split(":");

    log.log("Target locked: " + userid + ":" + levelid);

    setBar(85);
    await new Promise(r => setTimeout(r, randomDelay()));

    try {

        const res = await fetch(
            `https://api.slin.dev/grab/v1/details/${userid}/${levelid}`
        );

        const data = await res.json();
        log.log("Level data received");

        const num = data.data_key?.split(":").pop();

        log.log("Downloading...");

        const blob = await fetch(
            `https://api.slin.dev/grab/v1/download/${userid}/${levelid}/${num}`
        ).then(r => r.blob());

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${levelid}.level`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setBar(100);
        log.log("Complete");

    } catch (e) {
        log.log("ERROR: " + e);
    }

})();

})();
