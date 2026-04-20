(() => {

/* =========================
   💀 RESET
========================= */
document.getElementById("launcher")?.remove();

/* =========================
   🎨 STYLE
========================= */
if (!document.getElementById("ls_style")) {
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
    }`;
    document.head.appendChild(s);
}

/* =========================
   📦 CONFIG
========================= */
const CONFIG_API = "https://api.github.com/repos/zacharyol/adswqeqaws-/contents/config.json";

function getConfig() {
    return new Promise(resolve => {
        const x = new XMLHttpRequest();
        x.open("GET", CONFIG_API);
        x.onload = () => {
            try {
                const d = JSON.parse(x.responseText);
                resolve(JSON.parse(atob(d.content)));
            } catch { resolve({}); }
        };
        x.onerror = () => resolve({});
        x.send();
    });
}

/* =========================
   💾 STORAGE
========================= */
function getLocal() {
    try { return JSON.parse(localStorage.getItem("mods")) || []; }
    catch { return []; }
}
function saveLocal(m) {
    localStorage.setItem("mods", JSON.stringify(m));
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
   ⚡ RUN MODULE
========================= */
async function runModule(m, ctx, log) {
    if (!m.enabled) return;

    try {
        log("▶ " + m.name);

        if (m.url) {
            const code = await fetch(m.url + "?t=" + Date.now()).then(r=>r.text());
            new Function("ctx", code)(ctx);
        }

        if (m.code) {
            new Function("ctx", m.code)(ctx);
        }

        log("✔ " + m.name);
    } catch(e) {
        log("❌ " + m.name + ": " + e.message);
    }
}

/* =========================
   🧱 UI
========================= */
function createUI(version){

    const el = document.createElement("div");
    el.id="launcher";

    el.innerHTML=`
    <div id="header">Launcher (${version||"?"})</div>
    <div id="box">
        <div id="mods"></div>

        <button id="runAll">Run Enabled</button>

        <textarea id="code"></textarea>
        <button id="add">Add Module</button>

        <div id="log" style="height:100px;overflow:auto;margin-top:6px;"></div>
    </div>`;

    document.body.appendChild(el);

    return {
        root: el,
        header: el.querySelector("#header"),
        mods: el.querySelector("#mods"),
        runAll: el.querySelector("#runAll"),
        add: el.querySelector("#add"),
        code: el.querySelector("#code"),
        log: el.querySelector("#log")
    };
}

/* =========================
   🎛 RENDER
========================= */
function render(UI, mods, ctx, log){

    UI.mods.innerHTML="";

    mods.forEach((m,i)=>{

        const d=document.createElement("div");
        d.className="module";

        d.innerHTML=`
        <b>${m.name}</b>
        <div>
            <button data="toggle">${m.enabled?"ON":"OFF"}</button>
            <button data="run">Run</button>
            <button data="rename">Rename</button>
            ${m.local?'<button data="delete">Delete</button>':''}
        </div>`;

        d.onclick=async e=>{
            const a=e.target.getAttribute("data");
            if(!a) return;

            if(a==="toggle") m.enabled=!m.enabled;
            if(a==="run") await runModule(m,ctx,log);
            if(a==="rename"){
                const n=prompt("Name:",m.name);
                if(n) m.name=n;
            }
            if(a==="delete"){
                mods.splice(i,1);
            }

            saveLocal(mods.filter(x=>x.local));
            render(UI,mods,ctx,log);
        };

        UI.mods.appendChild(d);
    });
}

/* =========================
   🖱 DRAG
========================= */
function drag(el,handle){
    let x=0,y=0;

    handle.onmousedown=e=>{
        x=e.clientX;y=e.clientY;

        document.onmousemove=e2=>{
            el.style.left=(el.offsetLeft+e2.clientX-x)+"px";
            el.style.top=(el.offsetTop+e2.clientY-y)+"px";
            x=e2.clientX;y=e2.clientY;
        };

        document.onmouseup=()=>document.onmousemove=null;
    };
}

/* =========================
   🚀 MAIN
========================= */
(async()=>{

    const config = await getConfig();

    const UI = createUI(config.version);
    const log = logger(UI.log);

    const ctx = { log, config, page: window };

    let mods = [
        ...(config.modules||[]).map(m=>({...m,enabled:true})),
        ...getLocal().map(m=>({...m,local:true}))
    ];

    render(UI,mods,ctx,log);

    UI.runAll.onclick=async()=>{
        for(const m of mods) await runModule(m,ctx,log);
    };

    UI.add.onclick=()=>{
        const code=UI.code.value.trim();
        if(!code) return;

        mods.push({
            name:"Local "+Date.now(),
            code,
            enabled:true,
            local:true
        });

        saveLocal(mods.filter(x=>x.local));
        render(UI,mods,ctx,log);
        UI.code.value="";
    };

    drag(UI.root,UI.header);

})();

})();
