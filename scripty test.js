javascript:(() => {

const CONFIG_API = "https://api.github.com/repos/zacharyol/adswqeqaws-/contents/config.json";

/* =========================
   💀 RESET SYSTEM
========================= */
function reset() {
    document.getElementById("launcher")?.remove();
    document.getElementById("warn")?.remove();
    document.querySelectorAll("script[data-launcher]").forEach(s => s.remove());
}

/* =========================
   🎨 STYLES
========================= */
function styles() {
    if (document.getElementById("ls_style")) return;

    const s = document.createElement("style");
    s.id = "ls_style";
    s.innerHTML = `
    #launcher {
        position: fixed;
        inset: 0;
        background: #0b0b0b;
        color: white;
        font-family: monospace;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999999;
    }

    #box {
        width: 420px;
        padding: 14px;
        background: #111;
        border-radius: 10px;
    }

    #barOuter {
        height: 8px;
        background: #222;
        border-radius: 6px;
        overflow: hidden;
        margin-top: 10px;
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
    #warn {
        position: fixed;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: monospace;
        font-size: 22px;
        color: white;
        background: black;
        animation: flash 0.35s infinite alternate;
        z-index: 9999999999;
    }

    @keyframes flash {
        0% { background: black; color: red; }
        100% { background: red; color: black; }
    }

    /* LOGO */
    #logo {
        width: 34px;
        height: 34px;
        border-radius: 6px;
        object-fit: cover;
    }
    `;
    document.head.appendChild(s);
}

/* =========================
   📦 CONFIG (NO CORS ISSUES)
========================= */
function getConfig() {
    return new Promise((resolve) => {

        const xhr = new XMLHttpRequest();
        xhr.open("GET", CONFIG_API);

        xhr.onload = function () {
            try {
                const data = JSON.parse(xhr.responseText);
                const json = JSON.parse(atob(data.content));
                resolve(json);
            } catch (e) {
                resolve({
                    version: "PARSE_ERROR",
                    showWarning: false,
                    warningMessage: "",
                    scriptUrl: "",
                    logoUrl: ""
                });
            }
        };

        xhr.onerror = function () {
            resolve({
                version: "NETWORK_ERROR",
                showWarning: false,
                warningMessage: "",
                scriptUrl: "",
                logoUrl: ""
            });
        };

        xhr.send();
    });
}

/* =========================
   ⚡ SCRIPT LOADER
========================= */
function loadScript(url) {
    return new Promise((resolve) => {
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
function warning(msg) {
    return new Promise((resolve) => {

        const w = document.createElement("div");
        w.id = "warn";
        w.innerText = "⚠ " + msg;

        document.body.appendChild(w);

        setTimeout(() => {
            w.remove();
            resolve();
        }, 3000);
    });
}

/* =========================
   🧱 UI (LOGO FIXED)
========================= */
function ui(config) {

    const el = document.createElement("div");
    el.id = "launcher";

    el.innerHTML = `
        <div id="box">

            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <img id="logo" src="${config.logoUrl || ""}" style="display:none;">
                <div>Launcher</div>
            </div>

            <div id="status">Starting...</div>

            <div id="barOuter">
                <div id="barInner"></div>
            </div>

            <div id="log"></div>
        </div>
    `;

    document.body.appendChild(el);

    const logo = el.querySelector("#logo");

    if (config.logoUrl) {
        logo.onload = () => logo.style.display = "block";
        logo.onerror = () => logo.style.display = "none";
        logo.src = config.logoUrl + "?t=" + Date.now();
    }

    return {
        status: el.querySelector("#status"),
        bar: el.querySelector("#barInner"),
        log: el.querySelector("#log")
    };
}

/* =========================
   📟 LOG
========================= */
function logger(el) {
    return (t) => {
        const d = document.createElement("div");
        d.innerText = "» " + t;
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
    };
}

/* =========================
   🚀 MAIN
========================= */
(async () => {

    reset();
    styles();

    const config = await getConfig();

    /* ⚠ WARNING */
    if (config.showWarning) {
        await warning(config.warningMessage);
    }

    const UI = ui(config);
    const log = logger(UI.log);

    const bar = (p) => UI.bar.style.width = p + "%";

    UI.status.innerText = "Connecting...";
    log("Connecting...");
    bar(10);

    await new Promise(r => setTimeout(r, 200));

    log("Fetching config...");
    bar(30);

    await new Promise(r => setTimeout(r, 200));

    log("Version: " + config.version);
    bar(50);

    await loadScript(config.scriptUrl);

    log("Modules loaded");
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
