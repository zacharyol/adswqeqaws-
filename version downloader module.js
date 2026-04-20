javascript:(() => {

const LIST_API = "https://api.slin.dev/grab/v1/list?max_format_version=21&user_id=";
const DETAILS_API = (u, l) =>
  `https://api.slin.dev/grab/v1/details/${u}/${l}`;
const DOWNLOAD_API = (u, l, v) =>
  `https://api.slin.dev/grab/v1/download/${u}/${l}/${v}`;

/* =========================
   FETCH LEVELS
========================= */
async function getLevels(userId) {
  const res = await fetch(LIST_API + userId);
  const data = await res.json();
  return data.levels || [];
}

/* =========================
   GET REAL START VERSION
========================= */
async function getStartVersion(uid, lid) {
  const res = await fetch(DETAILS_API(uid, lid));
  const data = await res.json();

  const key = data.data_key;
  if (!key) return null;

  const parts = key.split(":");
  return {
    uid: parts[1],
    lid: parts[2],
    start: Number(parts[3]) || 1,
    title: data.title || lid
  };
}

/* =========================
   WALK DOWN VERSIONS
========================= */
async function collectVersions(uid, lid, start, title) {

  const versions = [];

  for (let v = start; v >= 1; v--) {
    try {
      const res = await fetch(DOWNLOAD_API(uid, lid, v));

      if (!res.ok) break;

      versions.push({ uid, lid, version: v, title });

    } catch {
      break;
    }
  }

  return versions;
}

/* =========================
   DOWNLOAD
========================= */
async function download(v) {
  const res = await fetch(DOWNLOAD_API(v.uid, v.lid, v.version));
  const blob = await res.blob();

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${v.title}_v${v.version}.level`;
  a.click();
}

/* =========================
   UI
========================= */
function UI(data) {

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

  panel.innerHTML = `<b>📦 Version Chain Downloader</b><br><br>`;

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

    const all = document.createElement("button");
    all.innerText = "Download All Versions";
    all.style.width = "100%";

    all.onclick = async () => {
      for (const v of item.versions) {
        await download(v);
        await new Promise(r => setTimeout(r, 250));
      }
    };

    drop.appendChild(all);

    item.versions.forEach(v => {

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.margin = "4px 0";

      const label = document.createElement("span");
      label.innerText = "Version " + v.version;

      const dl = document.createElement("button");
      dl.innerText = "DL";

      dl.onclick = () => download(v);

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

  const output = [];

  for (const lvl of levels) {

    const base = lvl.identifier.split(":");
    const uid = base[0];
    const lid = base[1];

    const startInfo = await getStartVersion(uid, lid);
    if (!startInfo) continue;

    const versions = await collectVersions(
      startInfo.uid,
      startInfo.lid,
      startInfo.start,
      startInfo.title
    );

    if (versions.length) {
      output.push({
        title: startInfo.title,
        versions
      });
    }
  }

  UI(output);

})();

})();
