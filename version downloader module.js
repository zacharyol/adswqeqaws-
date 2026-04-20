javascript:(async () => {

const API = "https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";

/* =========================
   FETCH
========================= */
async function getLevels(userId) {
    const res = await fetch(API + userId);
    return await res.json(); // <-- ARRAY (NOT .levels)
}

/* =========================
   GROUP LEVELS
========================= */
function group(levels) {

    const map = {};

    for (const lvl of levels) {

        if (!lvl.data_key) continue;

        const parts = lvl.data_key.split(":");

        const uid = parts[1];
        const lid = parts[2];
        const version = Number(parts[3]);

        const key = uid + ":" + lid;

        if (!map[key]) {
            map[key] = {
                title: lvl.title || lid,
                uid,
                lid,
                maxVersion: version
            };
        } else {
            if (version > map[key].maxVersion) {
                map[key].maxVersion = version;
            }
        }
    }

    return map;
}

/* =========================
   DOWNLOAD
========================= */
async function download(uid, lid, v, title) {

    const res = await fetch(
        `https://api.slin.dev/grab/v1/download/${uid}/${lid}/${v}`
    );

    const blob = await res.blob();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title}_v${v}.level`;
    a.click();
}

/* =========================
   UI
========================= */
function ui(data) {

    const panel = document.createElement("div");

    Object.assign(panel.style, {
        position: "fixed",
        right: "20px",
        top: "80px",
        width: "360px",
        maxHeight: "520px",
        overflowY: "auto",
        background: "#111",
        color: "#fff",
        fontFamily: "monospace",
        padding: "10px",
        zIndex: 999999999,
        borderRadius: "10px"
    });

    panel.innerHTML = "<b>📦 Version Downloader</b><br><br>";

    Object.values(data).forEach(item => {

        const box = document.createElement("div");
        box.style.marginBottom = "10px";
        box.style.background = "#222";
        box.style.padding = "6px";
        box.style.borderRadius = "6px";

        const btn = document.createElement("button");
        btn.innerText = item.title + " ▼";
        btn.style.width = "100%";

        const drop = document.createElement("div");
        drop.style.display = "none";

        btn.onclick = () => {
            drop.style.display = drop.style.display === "none" ? "block" : "none";
        };

        /* =========================
           VERSIONS DOWN TO 1
        ========================= */
        for (let v = item.maxVersion; v >= 1; v--) {

            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.margin = "4px 0";

            row.innerHTML = `<span>Version ${v}</span>`;

            const dl = document.createElement("button");
            dl.innerText = "DL";

            dl.onclick = () =>
                download(item.uid, item.lid, v, item.title);

            row.appendChild(dl);
            drop.appendChild(row);
        }

        box.appendChild(btn);
        box.appendChild(drop);

        panel.appendChild(box);
    });

    document.body.appendChild(panel);
}

/* =========================
   MAIN
========================= */
(async () => {

    const userId = prompt("User ID:");
    if (!userId) return;

    const levels = await getLevels(userId);

    console.log("RAW LEVELS:", levels);

    if (!Array.isArray(levels) || levels.length === 0) {
        alert("No levels found (check API)");
        return;
    }

    const grouped = group(levels);

    ui(grouped);

})();
})();
