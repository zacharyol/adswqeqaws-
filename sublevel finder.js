(() => {
  // =========================
  // CONFIG / STORAGE
  // =========================
  const rawData = window.levelsData || window.__LEVELS__ || null;

  if (!rawData) {
    alert("No levels data found. Assign to window.levelsData first.");
    return;
  }

  // =========================
  // HELPERS
  // =========================

  function getBaseId(level) {
    // identifier: "id:timestamp" OR "id:name"
    return level.identifier.split(":").slice(0, 2).join(":");
  }

  function getVersion(level) {
    const dk = level.data_key || "";
    const parts = dk.split(":");
    return parseInt(parts[parts.length - 1]) || 1;
  }

  function getVersionBaseKey(level) {
    // remove last :version
    const dk = level.data_key || "";
    return dk.split(":").slice(0, -1).join(":");
  }

  function groupLevels(levels) {
    const map = {};

    for (const lvl of levels) {
      const base = getBaseId(lvl);

      if (!map[base]) {
        map[base] = {
          title: lvl.title,
          levels: []
        };
      }

      map[base].levels.push(lvl);
    }

    // sort versions high → low
    for (const k in map) {
      map[k].levels.sort((a, b) => getVersion(b) - getVersion(a));
    }

    return map;
  }

  // =========================
  // VERSION BUILDER (GO DOWN TO 1)
  // =========================

  function buildAllVersions(levels) {
    const versionMap = {};

    for (const lvl of levels) {
      const baseKey = getVersionBaseKey(lvl);

      const match = lvl.data_key.match(/:(\d+)$/);
      let version = match ? parseInt(match[1]) : 1;

      if (!versionMap[baseKey]) versionMap[baseKey] = [];

      versionMap[baseKey].push({
        ...lvl,
        version
      });
    }

    // ensure FULL chain down to 1
    for (const key in versionMap) {
      const list = versionMap[key];
      const max = Math.max(...list.map(l => l.version));

      const full = [];
      for (let v = max; v >= 1; v--) {
        const found = list.find(x => x.version === v);
        if (found) full.push(found);
      }

      versionMap[key] = full;
    }

    return versionMap;
  }

  // =========================
  // TRIGGER TARGET SEARCH
  // =========================

  function findTriggerTargets(level) {
    const results = [];

    function scan(obj) {
      if (!obj || typeof obj !== "object") return;

      for (const k in obj) {
        const v = obj[k];

        if (k === "levelIdentifier" && typeof v === "string") {
          results.push(v);
        } else if (typeof v === "object") {
          scan(v);
        }
      }
    }

    scan(level);
    return results;
  }

  // =========================
  // UI
  // =========================

  function createUI(grouped, versionMap) {
    const container = document.createElement("div");
    container.style = `
      position:fixed;
      top:10px;
      right:10px;
      width:320px;
      max-height:80vh;
      overflow:auto;
      background:#111;
      color:#fff;
      padding:10px;
      z-index:999999;
      font-family:Arial;
      border:1px solid #444;
    `;

    container.innerHTML = `<h3>Level Version Downloader</h3>`;

    for (const base in grouped) {
      const group = grouped[base];

      const block = document.createElement("div");
      block.style = "margin-bottom:10px; border:1px solid #333; padding:5px;";

      const btn = document.createElement("button");
      btn.textContent = group.title;
      btn.style = "width:100%;";

      const dropdown = document.createElement("div");
      dropdown.style.display = "none";

      btn.onclick = () => {
        dropdown.style.display =
          dropdown.style.display === "none" ? "block" : "none";
      };

      for (const lvl of versionMap[getVersionBaseKey(group.levels[0])] || []) {
        const vbtn = document.createElement("button");
        vbtn.textContent = `Version ${lvl.data_key.split(":").pop()}`;
        vbtn.style = "display:block;width:100%;margin-top:3px;";

        vbtn.onclick = () => {
          console.log("Downloading:", lvl);

          const blob = new Blob([JSON.stringify(lvl, null, 2)], {
            type: "application/json"
          });

          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${lvl.title}_v${lvl.data_key.split(":").pop()}.json`;
          a.click();
        };

        dropdown.appendChild(vbtn);
      }

      block.appendChild(btn);
      block.appendChild(dropdown);
      container.appendChild(block);
    }

    document.body.appendChild(container);
  }

  // =========================
  // RUN
  // =========================

  const grouped = groupLevels(rawData);
  const versionMap = buildAllVersions(rawData);

  createUI(grouped, versionMap);

  console.log("Trigger targets found:", rawData.map(findTriggerTargets));
})();
