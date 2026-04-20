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
   GET USER
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
   EXTRACT VERSION
========================= */
function getVersion(key) {
    if (!key) return null;
    return key.split(":").pop();
}

/* =========================
   GROUP BY VERSION
========================= */
function groupByVersion(levels) {

    const groups = {};

    for (const lvl of levels) {
        const v = getVersion(lvl.data_key);
        if (!v) continue;

        if (!groups[v]) groups[v] = [];
        groups[v].push(lvl);
    }

    return groups;
}

/* =========================
   DOWNLOAD LEVEL
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
   UI
========================= */
const panel = document.createElement("div");
panel.style = `
position:fixed;
right:20px;
top:80px;
width:340px;
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

panel.innerHTML = `<b>📦 Version Group Downloader</b><br><br>`;
document.body.appendChild(panel);

/* =========================
   MAIN
========================= */
const levels = await fetchLevels(userId);
const grouped = groupByVersion(levels);

/* =========================
   FILTER: ONLY versions with >1 level
========================= */
const validVersions = Object.entries(grouped)
    .filter(([version, list]) => list.length > 1);

/* =========================
   NO VALID GROUPS
========================= */
if (!validVersions.length) {
    panel.innerHTML += "❌ No version groups (need 2+ levels per version)";
    return;
}

/* =========================
   RENDER GROUPS
========================= */
validVersions.forEach(([version, list]) => {

    const group = document.createElement("div");
    group.style = `
        background:#222;
        margin:8px 0;
        padding:6px;
        border-radius:6px;
    `;

    group.innerHTML = `
        <b>Version ${version}</b><br>
        <small>${list.length} levels</small><br>
        <button>⬇ Download Version</button>
    `;

    group.querySelector("button").onclick = async () => {

        panel.innerHTML += `<br>Downloading version ${version}...<br>`;

        for (const lvl of list) {
            await downloadLevel(lvl);
            await new Promise(r => setTimeout(r, 300));
        }

        panel.innerHTML += `Done version ${version}<br>`;
    };

    panel.appendChild(group);
});

/* =========================
   BULK ALL VERSIONS
========================= */
const btn = document.createElement("button");
btn.innerText = "⬇ Download ALL Versions";
btn.style = "width:100%;margin-top:10px;padding:6px;";
panel.appendChild(btn);

btn.onclick = async () => {

    for (const [, list] of validVersions) {
        for (const lvl of list) {
            await downloadLevel(lvl);
        }
    }

    panel.innerHTML += "<br>✅ All versions downloaded";
};

})();
