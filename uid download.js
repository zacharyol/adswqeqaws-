(async () => {

if (!ctx) window.ctx = { log: console.log };

ctx.log("📦 Level Scanner (data_key system)");

const userId = prompt("Enter User ID:");
if (!userId) return;

/* =========================
   FETCH LEVELS
========================= */
ctx.log("Fetching levels...");

const res = await fetch(
    `https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=${userId}`
);

const levels = await res.json();

if (!levels?.levels?.length) {
    ctx.log("No levels found");
    return;
}

ctx.log("Levels found: " + levels.levels.length);

/* =========================
   UI
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
`;

panel.innerHTML = `<b>📁 Levels</b><br><br>`;
document.body.appendChild(panel);

/* =========================
   GET DETAILS → EXTRACT NUMBER
========================= */
async function getDownloadNumber(level) {

    const data = await fetch(
        `https://api.slin.dev/grab/v1/details/${userId}/${level.identifier}`
    ).then(r => r.json());

    const key = data.data_key;

    if (!key) return null;

    const prefix = `level_data:${userId}:${level.identifier}:`;

    if (!key.startsWith(prefix)) return null;

    return key.slice(prefix.length);
}

/* =========================
   DOWNLOAD LEVEL
========================= */
async function downloadLevel(level) {

    try {
        ctx.log("⬇ " + level.title);

        const number = await getDownloadNumber(level);

        if (!number) {
            ctx.log("❌ Missing download number");
            return;
        }

        const blob = await fetch(
            `https://api.slin.dev/grab/v1/download/${userId}/${level.identifier}/${number}`
        ).then(r => r.blob());

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (level.title || "level") + ".level";
        a.click();

        ctx.log("✔ Done: " + level.title);

    } catch (e) {
        ctx.log("❌ Error: " + e.message);
    }
}

/* =========================
   RENDER LIST
========================= */
levels.levels.forEach(level => {

    const row = document.createElement("div");
    row.style = `
        margin:5px 0;
        padding:6px;
        background:#222;
        border-radius:6px;
        display:flex;
        justify-content:space-between;
    `;

    row.innerHTML = `
        <span style="font-size:12px;">${level.title}</span>
        <button>Download</button>
    `;

    row.querySelector("button").onclick = () => {
        downloadLevel(level);
    };

    panel.appendChild(row);
});

/* =========================
   DOWNLOAD ALL
========================= */
const all = document.createElement("button");
all.innerText = "⬇ Download ALL";
all.style = "width:100%;margin-top:10px;";
panel.appendChild(all);

all.onclick = async () => {

    ctx.log("Starting bulk download...");

    for (const lvl of levels.levels) {
        await downloadLevel(lvl);
        await new Promise(r => setTimeout(r, 300));
    }

    ctx.log("✅ All done");
};

})();
