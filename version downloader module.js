javascript:(() => {

const API = "https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";

/* =========================
   FETCH LEVELS
========================= */
async function getLevels(userId) {
    const res = await fetch(API + userId);
    const data = await res.json();
    return data.levels || [];
}

/* =========================
   PARSE LEVEL GROUPS
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
function createUI(data) {

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

    panel.innerHTML = `<b>📦 Version Downloader</b><br><br>`;

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
        drop.style.marginTop = "5px";

        btn.onclick = () => {
            drop.style.display = drop.style.display === "none" ? "block" : "none";
        };

        /* =========================
           GENERATE ALL VERSIONS (DOWN TO 1)
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

        /* =========================
           DOWNLOAD ALL
        ========================= */
        const all = document.createElement("button");
        all.innerText = "Download ALL Versions";
        all.style.width = "100%";

        all.onclick = async () => {
            for (let v = item.maxVersion; v >= 1; v--) {
                await download(item.uid, item.lid, v, item.title);
                await new Promise(r => setTimeout(r, 200));
            }
        };

        box.appendChild(btn);
        box.appendChild(drop);
        box.appendChild(all);

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

    if (!levels.length) {
        alert("No levels found");
        return;
    }

    const grouped = group(levels);

    createUI(grouped);

})();

})();
