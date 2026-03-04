// public/js/layout_v1.js
(async function () {
    const cfg = window.ORANICLE_PAGE || {};
    const canonId = cfg.canonId;
    if (!canonId) {
        console.error("Missing window.ORANICLE_PAGE.canonId");
        return;
    }

    // ---- LHS image ----
    const img = document.getElementById("oranicle-manifold-img");
    if (img) {
        img.src = `/canonicals/${canonId}/pca_web_points.png`;
        img.alt = `${canonId} manifold`;
    }

    // ---- RHS semantics ----
    const rhs = document.getElementById("oranicle-semantics");
    if (!rhs) return;

    const tryFetch = async (url) => {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`${r.status} ${url}`);
        return r.json();
    };

    let semantics = null;
    const authUrl = `/canonicals/${canonId}/pca_geometry_C1_C2.semantics.authoritative.json`;
    const draftUrl = `/canonicals/${canonId}/pca_geometry_C1_C2.semantics.json`;

    try {
        semantics = await tryFetch(authUrl);
    } catch (e1) {
        try {
            semantics = await tryFetch(draftUrl);
        } catch (e2) {
            rhs.innerHTML = `<div style="opacity:.8">Missing semantics JSON for ${canonId}.</div>`;
            return;
        }
    }

    // Expected shape (flexible):
    // semantics.anchors = { Constraint:{label,summary,bullets?}, ... }
    const anchors = semantics.anchors || semantics.anchors_data || semantics;
    const order = cfg.anchorOrder || ["Constraint", "Freedom", "VoidOrOutlier", "Core"];

    const titleMap = {
        Constraint: "Point #1 — Constraint",
        Freedom: "Point #2 — Freedom",
        VoidOrOutlier: "Point #3 — Void / Outlier",
        Core: "Point #4 — Core",
    };

    const dotClass = {
        Constraint: "dot-yellow",
        Freedom: "dot-blue",
        VoidOrOutlier: "dot-gray",
        Core: "dot-green",
    };

    const card = (k, v) => {
        const label = (v && (v.label || v.title)) ? (v.label || v.title) : (titleMap[k] || k);
        const summary = (v && (v.summary || v.description)) ? (v.summary || v.description) : "";
        const bullets = (v && v.bullets && Array.isArray(v.bullets)) ? v.bullets : null;

        const bulletHtml = bullets
            ? `<ul>${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
            : "";

        return `
      <div class="semantic-block">
        <div class="semantic-head">
          <span class="dot ${dotClass[k] || "dot-gray"}"></span>
          <div>
            <div class="semantic-title">${escapeHtml(label)}</div>
            ${summary ? `<div class="semantic-sub">${escapeHtml(summary)}</div>` : ""}
          </div>
        </div>
        ${bulletHtml}
      </div>
    `;
    };

    rhs.innerHTML = order
        .filter(k => anchors[k])
        .map(k => card(k, anchors[k]))
        .join("");

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }
})();