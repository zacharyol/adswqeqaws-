javascript:(() => {

const CONFIG_URLS = [
  "https://raw.githubusercontent.com/zacharyol/adswqeqaws-/main/config.json",
  "https://cdn.jsdelivr.net/gh/zacharyol/adswqeqaws-/config.json"
];

/* =========================
   💀 GLOBAL RESET
========================= */
function reset() {
    document.getElementById("launcherOverlay")?.remove();
    document.getElementById("warnScreen")?.remove();
    document.querySelectorAll("script[data-launcher]").forEach(s => s.remove());
}

/* =========================
   🎨 STYLES
========================= */
function styles() {
    if (document.getElementById("launcherStyle")) return;

    const s = document.createElement("style");
    s.id = "launcherStyle";
    s.innerHTML = `
    #launcherOverlay {
        position: fixed;
        inset: 0;
        background: #0a0a0a;
        color: white;
        font-family: monospace;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999999;
    }

    #box {
        width: 420px;
        padding: 16px;
        background: #111;
        border-radius: 10px;
    }

    #barOuter {
        height: 8px;
        background: #222;
        margin-top: 10px;
        border-radius: 6px;
        overflow: hidden;
    }

    #barInner {
        height: 100%;
        width: 0%;
        background: white;
        transition: width 0.2s;
    }

    #log {
        height: 140px;
        overflow-y: auto;
        font-size: 12px;
        margin-top: 10px;
    }

    /* ⚠ WARNING */
    #warnScreen {
        position: fixed;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: monospace;
        font-size: 22px;
        z-index: 9999999999;
        animation: flash 0.4s infinite alternate;
    }

    @keyframes flash {
        0% { background: black; color: red; }
        100% { background: red; color: black; }
    }
    `;
    document.head.appendChild(s);
}

/* =========================
   📦 CONFIG (HARD FRESH)
========================= */
async function getConfig() {

    const bust = Date.now() + "_" + Math.random();

    for (const url of CONFIG_URLS) {
        try {
            const res = await fetch(url + "?b=" + bust, {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache"
                }
            });

            const text = await res.text();
            const json = JSON.parse(text);

            if (json?.version) return structuredClone(json);

        } catch {}
    }

    return {
        version: "v0.0.0",
        showWarning: false,
        warningMessage: "",
        scriptUrl: ""
    };
}

/* =========================
   ⚡ SCRIPT LOAD
========================= */
function loadScript(url) {
    return new Promise(resolve => {
        if (!url) return resolve();

        const s = document.createElement("script");
        s.dataset.launcher = "1";
        s.src = url + "?v=" + Date.now();
        s.onload = resolve;
        document.head.appendChild(s);
    });
}

/* =========================
   ⚠ WARNING (BLOCKING)
========================= */
function showWarning(msg) {
    return new Promise(resolve => {

        const w = document.createElement("div");
        w.id = "warnScreen";
        w.innerText = "⚠ " + msg;

        document.body.appendChild(w);

        setTimeout(() => {
            w.remove();
            resolve();
        }, 3500);
    });
}

/* =========================
   🧱 UI
========================= */
function ui() {

    const box = document.createElement("div");
    box.id = "launcherOverlay";

    box.innerHTML = `
        <div id="box">
            <div>Launcher</div>
            <div id="status">Starting...</div>

            <div id="barOuter">
                <div id="barInner"></div>
            </div>

            <div id="log"></div>
        </div>
    `;

    document.body.appendChild(box);

    return {
        status: box.querySelector("#status"),
        bar: box.querySelector("#barInner"),
        log: box.querySelector("#log")
    };
}

/* =========================
   📟 LOG
========================= */
function logger(el) {
    return (txt) => {
        const d = document.createElement("div");
        d.innerText = "» " + txt;
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
    };
}

/* =========================
   🚀 MAIN STATE MACHINE
========================= */
(async () => {

    reset();
    styles();

    const config = await getConfig();

    // 🔥 WARNING MUST BLOCK EVERYTHING
    if (config.showWarning) {
        await showWarning(config.warningMessage);
    }

    const UI = ui();
    const log = logger(UI.log);

    function bar(p) {
        UI.bar.style.width = p + "%";
    }

    /* =========================
       BOOT FLOW
    ========================= */

    UI.status.innerText = "Connecting...";
    log("Connecting...");
    bar(10);

    await new Promise(r => setTimeout(r, 400));

    log("Fetching config...");
    bar(30);

    await new Promise(r => setTimeout(r, 400));

    log("Validating version: " + config.version);
    bar(50);

    await loadScript(config.scriptUrl);

    log("Modules injected");
    bar(70);

    const level = new URLSearchParams(location.search).get("level");

    if (!level) {
        log("No level found");
        return;
    }

    const [uid, lid] = level.split(":");

    log("Target: " + uid + ":" + lid);
    bar(85);

    try {

        const res = await fetch(
            `https://api.slin.dev/grab/v1/details/${uid}/${lid}`
        );

        const data = await res.json();

        const num = data.data_key?.split(":").pop();

        log("Downloading...");
        bar(95);

        const blob = await fetch(
            `https://api.slin.dev/grab/v1/download/${uid}/${lid}/${num}`
        ).then(r => r.blob());

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = lid + ".level";
        document.body.appendChild(a);
        a.click();
        a.remove();

        bar(100);
        log("Complete");

    } catch (e) {
        log("ERROR: " + e);
    }

})();

})();
