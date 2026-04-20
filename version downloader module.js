javascript:(async () => {

if (location.hostname !== "grabvr.quest") {
    alert("Use this in grabvr.quest");
    return;
}

/* =========================
   CONFIG
========================= */
const API =
"https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";

/* =========================
   USER ID
========================= */
const userId = prompt("Enter User ID:");
if (!userId) return;

/* =========================
   FETCH LEVELS
========================= */
async function fetchLevels(uid) {
    const res = await fetch(API + uid);
    const data = await res.json();
    return Array.isArray(data) ? data : data?.levels || [];
}

/* =========================
   HELPERS
========================= */
function getVersion(dataKey) {
    if (!dataKey) return "unknown";
    return dataKey.split(":").pop();
}

/* =========================
   GROUP BY LEVEL (identifier)
========================= */
function groupByLevel(levels) {

    const map = {};

    for (const lvl of levels) {

        const id = lvl.identifier; // unique level
        if (!map[id]) {
            map[id] = {
                title: lvl.title || "Unnamed",
                entries: []
            };
        }

        map[id].entries.push(lvl);
    }

    return map;
}

/* =========================
   DOWNLOAD
========================= */
async function downloadLevel(lvl) {

    const [uid, lid] = lvl.identifier.split(":");
    const version = getVersion(lvl.data_key);

    const blob = await fetch(
        `https://api.slin.dev/grab/v1/download/${uid}/${lid}/${version}`
    ).then(r => r.blob());

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${lvl.title || lid}_v${version}.level`;
    a.click();
    a.remove();
}

/* =========================
   UI PANEL
========================= */
const panel = document.createElement("div");
panel.style = `
position:fixed;
right:20px;
top:80px;
width:360px;
max-height:500px;
overflow:auto;
background:#111;
color:#fff;
font-family:monospace;
z-index:999999999;
padding:10px;
border-radius:8px;
box-shadow:0 0 10px black;
`;

panel.innerHTML = `<b>📁 Level Version Browser</b><br><br>`;
document.body.appendChild(panel);

/* =========================
   MAIN
========================= */
const levels = await fetchLevels(userId);

if (!levels.length) {
    panel.innerHTML += "❌ No levels found";
    return;
}

const grouped = groupByLevel(levels);

/* =========================
   RENDER LEVELS
========================= */
Object.entries(grouped).forEach(([id, data]) => {

    const container = document.createElement("div");
    container.style = `
        background:#222;
        margin:6px 0;
        border-radius:6px;
        overflow:hidden;
    `;

    /* ===== LEVEL BUTTON ===== */
    const btn = document.createElement("div");
    btn.style = `
        padding:8px;
        cursor:pointer;
        font-weight:bold;
    `;
    btn.innerText = data.title + " ▼";

    /* ===== DROPDOWN ===== */
    const dropdown = document.createElement("div");
    dropdown.style = `
        display:none;
        padding:6px;
        background:#1a1a1a;
    `;

    let open = false;

    btn.onclick = () => {
        open = !open;
        dropdown.style.display = open ? "block" : "none";
    };

    /* ===== VERSION LIST ===== */
    data.entries.forEach(lvl => {

        const v = getVersion(lvl.data_key);

        const row = document.createElement("div");
        row.style = `
            padding:6px;
            margin:4px 0;
            background:#333;
            border-radius:4px;
            cursor:pointer;
            font-size:12px;
        `;

        row.innerText = "Version " + v;

        row.onclick = () => downloadLevel(lvl);

        dropdown.appendChild(row);
    });

    container.appendChild(btn);
    container.appendChild(dropdown);
    panel.appendChild(container);
});

})();
