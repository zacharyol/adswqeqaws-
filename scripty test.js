javascript:(() => {

const CONFIG_API = "https://api.github.com/repos/zacharyol/adswqeqaws-/contents/config.json";

/* =========================
   💀 RESET
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
    #launcher { position:fixed; inset:0; background:#0b0b0b; color:#fff; font-family:monospace; display:flex; justify-content:center; align-items:center; z-index:999999999; }
    #box { width:420px; padding:14px; background:#111; border-radius:10px; }
    #barOuter { height:8px; background:#222; border-radius:6px; overflow:hidden; margin-top:10px; }
    #barInner { height:100%; width:0%; background:white; transition:width .2s; }
    #log { height:120px; overflow-y:auto; font-size:12px; margin-top:10px; }
    #warn { position:fixed; inset:0; display:flex; justify-content:center; align-items:center; font-size:22px; animation:flash .3s infinite alternate; z-index:9999999999;}
    @keyframes flash {0%{background:black;color:red;}100%{background:red;color:black;}}
    button { margin-top:6px; width:100%; background:#222; color:white; border:none; padding:6px; cursor:pointer;}
    textarea { width:100%; height:80px; background:#000; color:#0f0; margin-top:6px;}
    `;
    document.head.appendChild(s);
}

/* =========================
   📦 CONFIG
========================= */
function getConfig() {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", CONFIG_API);
        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                resolve(JSON.parse(atob(data.content)));
            } catch {
                resolve({});
            }
        };
        xhr.onerror = () => resolve({});
        xhr.send();
    });
}

/* =========================
   ⚠ WARNING
========================= */
function warning(msg) {
    return new Promise(res => {
        const w = document.createElement("div");
        w.id = "warn";
        w.innerText = "⚠ " + msg;
        document.body.appendChild(w);
        setTimeout(()=>{w.remove();res();},3000);
    });
}

/* =========================
   💾 LOCAL MODULES
========================= */
function getLocalModules() {
    try {
        return JSON.parse(localStorage.getItem("launcher_modules")) || [];
    } catch {
        return [];
    }
}

function saveLocalModule(code) {
    const mods = getLocalModules();
    mods.push({ name: "Local " + (mods.length+1), code });
    localStorage.setItem("launcher_modules", JSON.stringify(mods));
}

/* =========================
   ⚡ RUN MODULE
========================= */
async function runModule(mod, ctx, log) {

    try {
        log("▶ Running: " + mod.name);

        if (mod.url) {
            const code = await fetch(mod.url + "?t=" + Date.now()).then(r=>r.text());
            new Function("ctx", code)(ctx);
        }

        if (mod.code) {
            new Function("ctx", mod.code)(ctx);
        }

        log("✔ Done: " + mod.name);

    } catch (e) {
        log("❌ " + mod.name + ": " + e.message);
    }
}

/* =========================
   🧱 UI
========================= */
function ui(config) {

    const el = document.createElement("div");
    el.id = "launcher";

    el.innerHTML = `
        <div id="box">
            <div>Launcher (${config.version || "?"})</div>

            <div id="status">Loading...</div>

            <div id="barOuter"><div id="barInner"></div></div>

            <div id="log"></div>

            <button id="runMods">Run Modules</button>
            <button id="addMod">Add Local Module</button>

            <textarea id="codeInput" placeholder="// paste JS module here"></textarea>
        </div>
    `;

    document.body.appendChild(el);

    return {
        status: el.querySelector("#status"),
        bar: el.querySelector("#barInner"),
        log: el.querySelector("#log"),
        runBtn: el.querySelector("#runMods"),
        addBtn: el.querySelector("#addMod"),
        codeInput: el.querySelector("#codeInput")
    };
}

/* =========================
   📟 LOG
========================= */
function logger(el){
    return t=>{
        const d=document.createElement("div");
        d.innerText="» "+t;
        el.appendChild(d);
        el.scrollTop=el.scrollHeight;
    };
}

/* =========================
   🚀 MAIN
========================= */
(async () => {

    reset();
    styles();

    const config = await getConfig();

    if (config.showWarning) {
        await warning(config.warningMessage);
    }

    const UI = ui(config);
    const log = logger(UI.log);

    const ctx = {
        log,
        config,
        page: window
    };

    UI.runBtn.onclick = async () => {

        const allMods = [
            ...(config.modules || []),
            ...getLocalModules()
        ];

        log("Running " + allMods.length + " modules...");

        for (const m of allMods) {
            await runModule(m, ctx, log);
        }

        log("All modules finished");
    };

    UI.addBtn.onclick = () => {
        const code = UI.codeInput.value.trim();
        if (!code) return;
        saveLocalModule(code);
        log("Saved local module");
        UI.codeInput.value = "";
    };

})();
