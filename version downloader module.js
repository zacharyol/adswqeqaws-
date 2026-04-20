javascript:(() => {

const LIST_API = "https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";
const DOWNLOAD_API = (u, l, v) =>
    `https://api.slin.dev/grab/v1/download/${u}/${l}/${v}`;

/* =========================
   FETCH BASE LEVEL LIST
========================= */
async function getLevels(userId) {
    const res = await fetch(LIST_API + userId);
    const data = await res.json();
    return data.levels || [];
}

/* =========================
   FIND MAX VERSION PER LEVEL
   (we detect by scanning downwards)
========================= */
async function scanVersions(level) {

    const parts = level.data_key.split(":");
    const uid = parts[1];
    const lid = parts[2];

    const versions = [];

    // start from known version if exists
    let v = Number(parts[3] || 10);

    while (v > 0) {
        try {
            const res = await fetch(DOWNLOAD_API(uid, lid, v));

            if (!res.ok) break;

            versions.push({
                version: v,
                uid,
                lid,
                title: level.title
            });

        } catch {
            break;
        }

        v--;
    }

    return versions;
}

/* =========================
   DOWNLOAD
========================= */
async function download(uid, lid, v, title) {

    const res = await fetch(DOWNLOAD_API(uid, lid, v));
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

    panel.innerHTML = `<b>📦 Version Scanner</b><br><br>`;

    data.forEach(item => {

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

        const allBtn = document.createElement("button");
        allBtn.innerText = "Download All Versions";
        allBtn.style.width = "100%";

        allBtn.onclick = async () => {
            for (const v of item.versions) {
                await download(v.uid, v.lid, v.version, item.title);
                await new Promise(r => setTimeout(r, 250));
            }
        };

        drop.appendChild(allBtn);

        item.versions.forEach(v => {

            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.margin = "4px 0";

            const label = document.createElement("span");
            label.innerText = "Version " + v.version;

            const dl = document.createElement("button");
            dl.innerText = "DL";

            dl.onclick = () =>
                download(v.uid, v.lid, v.version, item.title);

            row.appendChild(label);
            row.appendChild(dl);
            drop.appendChild(row);
        });

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

    const result = [];

    for (const lvl of levels) {
        const versions = await scanVersions(lvl);

        if (versions.length) {
            result.push({
                title: lvl.title,
                versions
            });
        }
    }

    createUI(result);

})();

})();


