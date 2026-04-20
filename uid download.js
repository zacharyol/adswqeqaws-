(async () => {

if (!ctx) window.ctx = { log: console.log };

ctx.log("📦 User Level Scanner Loaded");

/* =========================
   INPUT USER ID
========================= */
const userId = prompt("Enter User ID:");
if (!userId) {
    ctx.log("No User ID provided");
    return;
}

/* =========================
   GET USER INFO (optional check)
========================= */
try {
    const userInfo = await fetch(
        `https://api.slin.dev/grab/v1/get_user_info?user_id=${userId}`
    ).then(r => r.json());

    ctx.log("User: " + (userInfo?.username || "Unknown"));
} catch {
    ctx.log("User info fetch failed (continuing anyway)");
}

/* =========================
   FETCH LEVEL LIST
========================= */
ctx.log("Fetching levels...");

let data;

try {
    const res = await fetch(
        `https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=${userId}`
    );

    data = await res.json();

} catch (e) {
    ctx.log("Fetch error: " + e.message);
    return;
}

if (!data || !data.levels || !data.levels.length) {
    ctx.log("No levels found");
    return;
}

ctx.log("Levels found: " + data.levels.length);

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

panel.innerHTML = `<b>📁 User Levels</b><br><br>`;
document.body.appendChild(panel);

/* =========================
   DOWNLOAD SINGLE LEVEL
========================= */
async function downloadLevel(lvl) {

    try {
        ctx.log("⬇ " + (lvl.name || "Unnamed"));

        const blob = await fetch(lvl.download_url).then(r => r.blob());

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (lvl.name || "level") + ".level";
        a.click();

    } catch (e) {
        ctx.log("❌ Failed: " + e.message);
    }
}

/* =========================
   RENDER LIST
========================= */
data.levels.forEach((lvl, i) => {

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
            ${lvl.name || "Unnamed"}
        </span>
        <button>Download</button>
    `;

    row.querySelector("button").onclick = () => {
        downloadLevel(lvl);
    };

    panel.appendChild(row);
});

/* =========================
   DOWNLOAD ALL
========================= */
const allBtn = document.createElement("button");
allBtn.innerText = "⬇ Download ALL";
allBtn.style = "width:100%;margin-top:10px;";
panel.appendChild(allBtn);

allBtn.onclick = async () => {

    ctx.log("Starting bulk download...");

    for (const lvl of data.levels) {
        await downloadLevel(lvl);
        await new Promise(r => setTimeout(r, 300)); // prevents rate spam
    }

    ctx.log("✅ All downloads complete");
};

})();
