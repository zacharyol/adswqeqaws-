javascript:(() => {

const API = "https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";

/* =========================
   FETCH LEVELS
========================= */
async function getLevels(userId) {
    const res = await fetch(API + userId);
    const data = await res.json();
    return data.levels || data || [];
}

/* =========================
   GROUP LEVELS BY BASE ID
   (THIS FIXES YOUR VERSION ISSUE)
========================= */
function groupLevels(levels) {
    const map = {};

    for (const lvl of levels) {
        if (!lvl.data_key) continue;

        const parts = lvl.data_key.split(":");

        const uid = parts[1];
        const lid = parts[2];
        const version = parts[3];

        const baseKey = `${uid}:${lid}`;

        if (!map[baseKey]) {
            map[baseKey] = {
                title: lvl.title || lid,
                versions: []
            };
        }

        map[baseKey].versions.push({
            ...lvl,
            version
        });
    }

    // sort versions oldest → newest
    for (const key in map) {
        map[key].versions.sort((a, b) => Number(a.version) - Number(b.version));
    }

    return map;
}

/* =========================
   DOWNLOAD SINGLE VERSION
========================= */
async function downloadVersion(lvl) {

    const parts = lvl.data_key.split(":");
    const uid = parts[1];
    const lid = parts[2];
    const ver = parts[3];

    const res = await fetch(
        `https://api.slin.dev/grab/v1/download/${uid}/${lid}/${ver}`
    );

    if (!res.ok) {
        alert("Download failed");
        return;
    }

    const blob = await res.blob();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${lvl.title || lid}_v${ver}.level`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

/* =========================
   UI CREATION
========================= */
function createUI(groups) {

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
        borderRadius: "10px",
        boxShadow: "0 0 12px black"
    });

    panel.innerHTML = `<b>📦 Version Downloader</b><br><br>`;

    for (const key in groups) {

        const group = groups[key];

        const box = document.createElement("div");
        box.style.marginBottom = "10px";
        box.style.background = "#222";
        box.style.padding = "6px";
        box.style.borderRadius = "6px";

        const toggle = document.createElement("button");
        toggle.innerText = group.title + " ▼";
        toggle.style.width = "100%";

        const dropdown = document.createElement("div");
        dropdown.style.display = "none";
        dropdown.style.marginTop = "6px";

        toggle.onclick = () => {
            dropdown.style.display =
                dropdown.style.display === "none" ? "block" : "none";
        };

        /* =========================
           VERSION LIST
        ========================= */
        group.versions.forEach(v => {

            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            row.style.margin = "4px 0";
            row.style.padding = "4px";
            row.style.background = "#333";
            row.style.borderRadius = "4px";

            const ver = v.version;

            const label = document.createElement("span");
            label.innerText = "Version " + ver;

            const btn = document.createElement("button");
            btn.innerText = "Download";

            btn.onclick = () => downloadVersion(v);

            row.appendChild(label);
            row.appendChild(btn);

            dropdown.appendChild(row);
        });

        /* =========================
           DOWNLOAD ALL
        ========================= */
        const allBtn = document.createElement("button");
        allBtn.innerText = "⬇ Download All Versions";
        allBtn.style.width = "100%";
        allBtn.style.marginTop = "6px";

        allBtn.onclick = async () => {
            for (const v of group.versions) {
                await downloadVersion(v);
                await new Promise(r => setTimeout(r, 300));
            }
        };

        box.appendChild(toggle);
        box.appendChild(dropdown);
        box.appendChild(allBtn);

        panel.appendChild(box);
    }

    document.body.appendChild(panel);
}

/* =========================
   MAIN
========================= */
(async () => {

    const userId = prompt("Enter User ID:");
    if (!userId) return;

    const levels = await getLevels(userId);

    if (!levels.length) {
        alert("No levels found");
        return;
    }

    const grouped = groupLevels(levels);

    createUI(grouped);

})();

})();
