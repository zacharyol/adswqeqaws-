javascript:(() => {

const API = "https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";

/* =========================
   LOG SYSTEM (SAFE)
========================= */
const log = (m) => {
    console.log("[LevelModule]", m);
};

/* =========================
   GET USER LEVELS
========================= */
async function getLevels(userId) {
    const res = await fetch(API + userId);
    if (!res.ok) throw new Error("Failed fetch");
    return await res.json();
}

/* =========================
   DOWNLOAD LEVEL
========================= */
async function downloadLevel(level) {

    const parts = level.data_key.split(":");
    const userId = parts[1];
    const levelId = parts[2];
    const number = parts[3];

    const url = `https://api.slin.dev/grab/v1/download/${userId}/${levelId}/${number}`;

    const blob = await fetch(url).then(r => r.blob());

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${level.title || levelId}.level`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    log("Downloaded: " + (level.title || levelId));
}

/* =========================
   UI PANEL
========================= */
function createUI(levels, userId) {

    const panel = document.createElement("div");

    Object.assign(panel.style, {
        position: "fixed",
        right: "20px",
        top: "80px",
        width: "320px",
        maxHeight: "500px",
        overflow: "auto",
        background: "#111",
        color: "#fff",
        fontFamily: "monospace",
        padding: "10px",
        borderRadius: "8px",
        zIndex: 999999999
    });

    panel.innerHTML = `<b>📦 User Levels</b><br><br>`;

    /* DOWNLOAD ALL BUTTON */
    const allBtn = document.createElement("button");
    allBtn.innerText = "⬇ Download ALL";
    allBtn.style.width = "100%";

    allBtn.onclick = async () => {
        for (const lvl of levels) {
            await downloadLevel(lvl);
            await new Promise(r => setTimeout(r, 300));
        }
        alert("Done downloading all!");
    };

    panel.appendChild(allBtn);

    /* LIST LEVELS */
    levels.forEach((lvl) => {

        const row = document.createElement("div");
        row.style = `
            margin-top:6px;
            padding:6px;
            background:#222;
            border-radius:6px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:6px;
        `;

        row.innerHTML = `
            <span style="font-size:12px;">${lvl.title}</span>
        `;

        const btn = document.createElement("button");
        btn.innerText = "DL";

        btn.onclick = () => downloadLevel(lvl);

        row.appendChild(btn);
        panel.appendChild(row);
    });

    document.body.appendChild(panel);
}

/* =========================
   MAIN
========================= */
(async () => {

    const userId = prompt("Enter User ID:");
    if (!userId) return alert("No user id");

    log("Fetching levels...");

    const data = await getLevels(userId);

    if (!data?.levels?.length) {
        return alert("No levels found");
    }

    log("Loaded " + data.levels.length + " levels");

    createUI(data.levels, userId);

})();

})();
