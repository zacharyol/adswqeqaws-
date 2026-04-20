(() => {

const CONFIG_API = "https://api.github.com/repos/zacharyol/adswqeqaws-/contents/config.json";

/* RESET */
function reset() {
    document.getElementById("launcher")?.remove();
    document.getElementById("warn")?.remove();
    document.querySelectorAll("script[data-launcher]").forEach(s => s.remove());
}

/* STYLES */
function styles() {
    if (document.getElementById("ls_style")) return;

    const s = document.createElement("style");
    s.id = "ls_style";
    el.innerHTML = `
<div id="box">
    <div>Launcher (${config.version || "?"})</div>

    <div id="status">Ready</div>

    <div id="barOuter"><div id="barInner"></div></div>

    <div id="log"></div>

    <div id="modules" style="margin-top:10px;"></div>

    <button id="runMods">Run Modules</button>
    <button id="addMod">Add Local Module</button>

    <textarea id="codeInput" placeholder="// paste JS module here"></textarea>
</div>
`;
    document.head.appendChild(s);
}

/* CONFIG */
function getConfig() {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", CONFIG_API);

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                const json = JSON.parse(atob(data.content));
                resolve(json);
            } catch {
                resolve({});
            }
        };

        xhr.onerror = () => resolve({});
        xhr.send();
    });
}

/* WARNING */
function warning(msg) {
    return new Promise(resolve => {
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

/* LOCAL MODULES */
function getLocalModules() {
    try {
        return JSON.parse(localStorage.getItem("launcher_modules")) || [];
    } catch {
        return [];
    }
}

function saveLocalModule(code) {
    const mods = getLocalModules();
    mods.push({ name: "Local " + (mods.length + 1), code });
    localStorage.setItem("launcher_modules", JSON.stringify(mods));
}

/* RUN MODULE */
async function runModule(mod, ctx, log) {
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

/* UI */
function ui(config) {
    const el = document.createElement("div");
    el.id = "launcher";

    el.innerHTML = `
        <div id="box">
            <div>Launcher (${config.version || "?"})</div>
            <div id="status">Ready</div>
            <div id="barOuter"><div id="barInner"></div></div>
            <div id="log"></div>
            <button id="runMods">Run Modules</button>
            <button id="addMod">Add Local Module</button>
            <textarea id="codeInput" placeholder="// paste JS module here"></textarea>
        </div>
    `;

    document.body.appendChild(el);

    return {
        log: el.querySelector("#log"),
        runBtn: el.querySelector("#runMods"),
        addBtn: el.querySelector("#addMod"),
        codeInput: el.querySelector("#codeInput")
    };
}

/* LOGGER */
function logger(el) {
    return t => {
        const d = document.createElement("div");
        d.innerText = "» " + t;
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
    };
}

/* MAIN */
(async () => {

    reset();
    styles();

    const config = await getConfig();

    if (config.showWarning) {
        await warning(config.warningMessage);
    }

    const UI = ui(config);
    const log = logger(UI.log);

    const ctx = { log, config, page: window };

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

})();
