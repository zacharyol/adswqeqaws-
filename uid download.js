javascript:(() => {

if (location.hostname !== "grabvr.quest") {
    alert("Use this in the level viewer (grabvr.quest)");
    return;
}

/* =========================
   CONFIG
========================= */
const API = "https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";

/* =========================
   HELPERS
========================= */
const log = (msg) => console.log("[Level Downloader]", msg);

const wait = (ms) => new Promise(r => setTimeout(r, ms));

/* =========================
   GET USER ID
========================= */
const userId = prompt("Enter User ID:");
if (!userId) {
    alert("No User ID provided");
    return;
}

/* =========================
   FETCH LEVELS (FIXED)
========================= */
async function fetchLevels(uid) {
    try {
        const res = await fetch(API + uid);
        const data = await res.json();

        // ✅ FIX: supports BOTH formats
        const levels = Array.isArray(data)
            ? data
            : (data?.levels || []);

        return levels;

    } catch (e) {
        console.error(e);
        return [];
    }
}

/* =========================
   DOWNLOAD LEVEL
========================= */
async function downloadLevel(lvl) {
    try {
        const idParts = (lvl.identifier || "").split(":");
        const user = idParts[0];
        const levelId = idParts[1];

        if (!lvl.data_key) {
            console.log("Missing data_key:", lvl.title);
            return;
        }

        const number = lvl.data_key.split(":").pop();

        const blob = await fetch(
            `https://api.slin.dev/grab/v1/download/${user}/${levelId}/${number}`
        ).then(r => r.blob());

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (lvl.title || "level") + ".level";
        document.body.appendChild(a);
        a.click();
        a.remove();

        console.log("Downloaded:", lvl.title);

    } catch (e) {
        console.error("Download failed:", e);
    }
}

/* =========================
   UI PANEL
========================= */
const panel = document.createElement("div");
panel.style = `
position:fixed;
right:20px;
top:80px;
width:340px;
max-height:450px;
overflow:auto;
background:#111;
color:#fff;
font-family:monospace;
z-index:999999999;
padding:10px;
border-radius:8px;
box-shadow:0 0 12px black;
`;

panel.innerHTML = `<b>📁 Level Downloader</b><br><br>`;
document.body.appendChild(panel);

/* =========================
   MAIN
========================= */
(async () => {

    panel.innerHTML += "Loading levels...<br>";

    const levels = await fetchLevels(userId);

    if (!levels.length) {
        panel.innerHTML += "❌ No levels found<br>";
        return;
    }

    panel.innerHTML += `✅ Found ${levels.length} levels<br><br>`;

    /* =========================
       RENDER LIST
    ========================= */
    levels.forEach((lvl, i) => {

        const row = document.createElement("div");
        row.style = `
            margin:5px 0;
            padding:6px;
            background:#222;
            border-radius:6px;
            display:flex;
            justify-content:space-between;
            align-items:center;
        `;

        row.innerHTML = `
            <span style="font-size:12px;">
                ${lvl.title || "Unnamed"}
            </span>
            <button>Download</button>
        `;

        row.querySelector("button").onclick = () => {
            downloadLevel(lvl);
        };

        panel.appendChild(row);
    });

    /* =========================
       BULK DOWNLOAD
    ========================= */
    const btnAll = document.createElement("button");
    btnAll.innerText = "⬇ Download ALL";
    btnAll.style = `
        width:100%;
        margin-top:10px;
        padding:8px;
        background:#333;
        color:white;
        border:none;
        border-radius:6px;
        cursor:pointer;
    `;

    panel.appendChild(btnAll);

    btnAll.onclick = async () => {

        panel.innerHTML += "<br>Starting bulk download...<br>";

        for (const lvl of levels) {
            await downloadLevel(lvl);
            await wait(300);
        }

        panel.innerHTML += "✅ Done<br>";
    };

})();

})();
