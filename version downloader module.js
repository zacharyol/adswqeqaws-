javascript:(async () => {

const API = "https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";
const DOWNLOAD = (uid, lid, v) =>
    `https://api.slin.dev/grab/v1/download/${uid}/${lid}/${v}`;

/* =========================
   FETCH LEVEL LIST
========================= */
async function getLevels(userId) {
    const res = await fetch(API + userId);
    return await res.json();
}

/* =========================
   PARSE SUB LEVELS FROM FILE
========================= */
async function extractSubLevels(uid, lid, version) {
    try {
        const res = await fetch(DOWNLOAD(uid, lid, version));
        const blob = await res.blob();
        const text = await blob.text();

        const matches = [...text.matchAll(
            /"triggerTargetSubLevel"\s*:\s*\{\s*"levelIdentifier"\s*:\s*"([^"]+)"/g
        )];

        return matches.map(m => m[1]);

    } catch (e) {
        return [];
    }
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
                maxVersion: version,
                subLevels: new Set()
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
   DOWNLOAD BUTTON
========================= */
function download(uid, lid, v, title) {
    fetch(DOWNLOAD(uid, lid, v))
        .then(r => r.blob())
        .then(blob => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${title}_v${v}.level`;
            a.click();
        });
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
        width: "380px",
        maxHeight: "520px",
        overflowY: "auto",
        background: "#111",
        color: "#fff",
        fontFamily: "monospace",
        padding: "10px",
        zIndex: 999999999,
        borderRadius: "10px"
    });

    panel.innerHTML = "<b>🧩 version LEVEL DOWNLOADER</b><br><br>";

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
        drop.style.marginTop = "6px";

        btn.onclick = () => {
            drop.style.display = drop.style.display === "none" ? "block" : "none";
        };

        /* =========================
           SCAN ALL VERSIONS
        ========================= */
        (async () => {

            for (let v = item.maxVersion; v >= 1; v--) {

                const subs = await extractSubLevels(item.uid, item.lid, v);

                subs.forEach(s => item.subLevels.add(s));

                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.justifyContent = "space-between";
                row.style.margin = "4px 0";
                row.style.fontSize = "12px";

                row.innerHTML = `
                    <span>v${v} (${subs.length} sub)</span>
                `;

                const dl = document.createElement("button");
                dl.innerText = "DL";

                dl.onclick = () => download(item.uid, item.lid, v, item.title);

                row.appendChild(dl);
                drop.appendChild(row);
            }

            /* show collected sub levels */
            if (item.subLevels.size > 0) {
                const subBox = document.createElement("div");
                subBox.style.marginTop = "8px";
                subBox.style.fontSize = "11px";
                subBox.style.color = "#0f0";

                subBox.innerHTML =
                    "<b>Sub Levels:</b><br>" +
                    [...item.subLevels].map(x => "• " + x).join("<br>");

                drop.appendChild(subBox);
            }

        })();

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

    if (!Array.isArray(levels) || !levels.length) {
        alert("No levels found");
        return;
    }

    const grouped = group(levels);

    ui(grouped);

})();
})();
