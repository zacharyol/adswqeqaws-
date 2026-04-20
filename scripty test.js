javascript:(() => {

const CONFIG_API = "https://api.github.com/repos/zacharyol/adswqeqaws-/contents/config.json";

/* =========================
   💀 RESET
========================= */
function reset() {
    document.getElementById("launcher")?.remove();
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
        position:fixed;
        top:100px;
        left:100px;
        width:420px;
        background:#0b0b0b;
        color:#fff;
        font-family:monospace;
        z-index:999999999;
        border-radius:10px;
        box-shadow:0 0 20px black;
    }

    #header {
        padding:10px;
        background:#111;
        cursor:move;
        border-bottom:1px solid #222;
    }

    #box { padding:10px; }

    .module {
        background:#1a1a1a;
        margin-top:6px;
        padding:6px;
        border-radius:6px;
    }

    button {
        margin-left:4px;
        background:#222;
        color:white;
        border:none;
        padding:4px;
        cursor:pointer;
    }

    textarea {
        width:100%;
        height:60px;
        background:#000;
        color:#0f0;
        margin-top:6px;
    }
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
            } catch { resolve({}); }
        };
        xhr.onerror = () => resolve({});
        xhr.send();
    });
}

/* =========================
   💾 LOCAL STORAGE
========================= */
function getLocalModules() {
    try {
        return JSON.parse(localStorage.getItem("launcher_modules")) || [];
    } catch { return []; }
}

function saveLocalModules(mods) {
    localStorage.setItem("launcher_modules", JSON.stringify(mods));
}

/* =========================
   ⚡ RUN MODULE
========================= */
async function runModule(mod, ctx, log) {
    if (!mod.enabled) return;

    try {
        log("▶ " + mod.name);

        if (mod.url) {
            const code = await fetch(mod.url + "?t=" + Date.now()).then(r => r.text());
            new Function("ctx", code)(ctx);
        }

        if (mod.code) {
            new Function("ctx", mod.code)(ctx);
        }

        log("✔ " + mod.name);

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
    <div id="header">Launcher (${config.version || "?"})</div>
    <div id="box">
        <div id="modules"></div>

        <button id="runAll">Run Enabled</button>

        <textarea id="codeInput" placeholder="// module code"></textarea>
        <button id="add">Add Module</button>

        <div id="log" style="height:100px;overflow:auto;margin-top:6px;"></div>
    </div>
    `;

    document.body.appendChild(el);

    return {
        root: el,
        modules: el.querySelector("#modules"),
        runAll: el.querySelector("#runAll"),
        add: el.querySelector("#add"),
        code: el.querySelector("#codeInput"),
        log: el.querySelector("#log"),
        header: el.querySelector("#header")
    };
}

/* =========================
   📟 LOG
========================= */
function logger(el) {
    return t => {
        const d = document.createElement("div");
        d.innerText = "» " + t;
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
    };
}

/* =========================
   🎛 MODULE LIST
========================= */
function renderModules(UI, mods, ctx, log) {

    UI.modules.innerHTML = "";

    mods.forEach((m, i) => {

        const div = document.createElement("div");
        div.className = "module";

        div.innerHTML = `
        <b>${m.name}</b>
        <div>
            <button data-act="toggle">${m.enabled ? "ON" : "OFF"}</button>
            <button data-act="run">Run</button>
            <button data-act="rename">Rename</button>
            ${m.local ? '<button data-act="delete">Delete</button>' : ''}
        </div>
        `;

        div.onclick = async (e) => {
            const act = e.target.dataset.act;
            if (!act) return;

            if (act === "toggle") {
                m.enabled = !m.enabled;
            }

            if (act === "run") {
                await runModule(m, ctx, log);
            }

            if (act === "rename") {
                const name = prompt("New name:", m.name);
                if (name) m.name = name;
            }

            if (act === "delete") {
                mods.splice(i, 1);
            }

            saveLocalModules(mods.filter(x => x.local));
            renderModules(UI, mods, ctx, log);
        };

        UI.modules.appendChild(div);
    });
}

/* =========================
   🖱 DRAG
========================= */
function drag(el, handle) {
    let x=0,y=0;

    handle.onmousedown = e => {
        x=e.clientX;
        y=e.clientY;

        document.onmousemove = e2 => {
            el.style.left = (el.offsetLeft + e2.clientX - x) + "px";
            el.style.top = (el.offsetTop + e2.clientY - y) + "px";
            x=e2.clientX;
            y=e2.clientY;
        };

        document.onmouseup = () => {
            document.onmousemove = null;
        };
    };
}

/* =========================
   🚀 MAIN
========================= */
(async () => {

    reset();
    styles();

    const config = await getConfig();

    const UI = ui(config);
    const log = logger(UI.log);

    const ctx = { log, config, page: window };

    let mods = [
        ...(config.modules || []).map(m => ({...m, enabled:true, local:false})),
        ...getLocalModules().map(m => ({...m, local:true}))
    ];

    renderModules(UI, mods, ctx, log);

    UI.runAll.onclick = async () => {
        for (const m of mods) {
            await runModule(m, ctx, log);
        }
    };

    UI.add.onclick = () => {
        const code = UI.code.value.trim();
        if (!code) return;

        const newMod = {
            name: "Local " + Date.now(),
            code,
            enabled: true,
            local: true
        };

        mods.push(newMod);
        saveLocalModules(mods.filter(x => x.local));
        renderModules(UI, mods, ctx, log);
        UI.code.value = "";
    };

    drag(UI.root, UI.header);

})();
